import * as core from '@actions/core'
import * as github from '@actions/github'
import { createOrUpdateComment, renderComment, isValidComment } from './comment'
import { renderPlan } from './render'

async function run() {
  // 1) Setup
  const inputs = {
    token: core.getInput('token', { required: true }),
    planfile: core.getInput('planfile', { required: true }),
    terraformCmd: core.getInput('terraform-cmd', { required: true }),
    workingDirectory: core.getInput('working-directory', { required: true }),
    header: core.getInput('header', { required: true })
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
    const commentFull = renderComment({ plan, header: inputs.header })

    // Check comment size
    if (isValidComment(commentFull)) {
      return createOrUpdateComment({ octokit, content: commentFull })
    }
    else {
      // Truncate comment and provide link to download plan file
      const bodyOverride = `Terraform plan too large. Download plan file directly: [here](${getTerraformPlanLink()})`
      const commentTruncated = renderComment({ plan, header: inputs.header, includeFooter: true, bodyOverride: bodyOverride })

    return createOrUpdateComment({ octokit, content: commentTruncated })
    }
  }
)}

// Generate link to terraform plan file artifact
function getTerraformPlanLink() {
  const repo = github.context.repo
  const runId = github.context.runId
  return `https://github.com/${repo}/actions/runs/${runId}/artifacts`
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