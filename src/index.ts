import * as core from '@actions/core'
import * as github from '@actions/github'
import { createOrUpdateComment, renderMarkdown } from './comment'
import { planIsEmpty, renderPlan } from './render'

async function run() {
  // 1) Setup
  const inputs = {
    token: core.getInput('token', { required: true }),
    planfile: core.getInput('planfile', { required: true }),
    terraformCmd: core.getInput('terraform-cmd', { required: true }),
    workingDirectory: core.getInput('working-directory', { required: true }),
    header: core.getInput('header', { required: true }),
    skipEmpty: core.getBooleanInput('skip-empty', { required: true }),
    shouldComment: core.getInput('should-comment', { required: false })
  }
  const octokit = github.getOctokit(inputs.token)

  // 2) Render plan
  const plan = await core.group('Render plan', () =>
    renderPlan({
      planfile: inputs.planfile,
      terraformCommand: inputs.terraformCmd,
      workingDirectory: inputs.workingDirectory
    })
  )

  if (!inputs.skipEmpty || !planIsEmpty(plan)) {
    // 3) Render the plan diff markdown and set it as output
    const planMarkdown = await core.group('Render plan diff markdown', () => {
      const markdown = renderMarkdown({ plan, header: inputs.header })
      core.setOutput('plan-markdown', markdown)
      return Promise.resolve(markdown)
    })

    // 4) Post comment with markdown (if applicable)
    if (inputs.shouldComment === 'true') {
      await core.group('Render comment', () => {
        return createOrUpdateComment({ octokit, content: planMarkdown })
      })
    }

    // 5) Add plan to GitHub step summary
    await core.group('Adding plan to step summary', async () => {
      await core.summary.addRaw(planMarkdown).write()
    })
  }
}

async function main() {
  try {
    await run()
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message)
    }
  }
}

main() // eslint-disable-line
