import * as core from '@actions/core'
import * as github from '@actions/github'
import { createOrUpdateComment, renderBody, renderComment } from './comment'
import { renderPlan } from './render'

async function run() {
  // 1) Setup
  const inputs = {
    token: core.getInput('token', { required: true }),
    planfile: core.getInput('planfile', { required: true }),
    terraformCmd: core.getInput('terraform-cmd', { required: true }),
    workingDirectory: core.getInput('working-directory', { required: true }),
    header: core.getInput('header', { required: true }),
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

  // 3) Render the plan diff markdown and set it as output
  const planMarkdown = await core.group('Rendering plan diff markdown', () => {
    const markdown = renderBody(plan)
    core.debug(`Outputting plan as markdown: ${markdown}`)
    core.setOutput('plan-markdown', markdown)
    return Promise.resolve(markdown)
  })

  // 4) Post comment with markdown (if applicable)
  if (inputs.shouldComment === 'true') {
    await core.group('Render comment', () => {
      const comment = renderComment({ body: planMarkdown, header: inputs.header })
      return createOrUpdateComment({ octokit, content: comment })
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
