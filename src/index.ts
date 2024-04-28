import * as core from '@actions/core'
import * as github from '@actions/github'
import { createOrUpdateComment, renderComment } from './comment'
import { renderPlan } from './render'

async function run() {
  // 1) Setup
  const inputs = {
    token: core.getInput('token', { required: true }),
    planfile: core.getInput('planfile', { required: true }),
    terraformCmd: core.getInput('terraform-cmd', { required: true }),
    workingDirectory: core.getInput('working-directory', { required: true }),
    id: core.getInput('id')
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

  // 3) Post comment
  await core.group('Render comment', () => {
    const comment = renderComment({ plan, id: inputs.id })
    return createOrUpdateComment({ octokit, content: comment })
  })
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
