import * as core from '@actions/core'
import * as github from '@actions/github'
import { createOrUpdateComment, deleteComment, renderMarkdown } from './comment'
import type { RenderResult } from './renderResult'
import { renderPlan } from './render'

async function run() {
  // 1) Setup
  const prNumberInput = core.getInput('pr-number', { required: false })
  const inputs = {
    token: core.getInput('token', { required: true }),
    planfile: core.getInput('planfile', { required: true }),
    terraformCmd: core.getInput('terraform-cmd', { required: true }),
    workingDirectory: core.getInput('working-directory', { required: true }),
    header: core.getInput('header', { required: true }),
    skipEmpty: core.getBooleanInput('skip-empty', { required: true }),
    skipComment: core.getBooleanInput('skip-comment', { required: true }),
    prNumber: prNumberInput && prNumberInput !== '' ? parseInt(prNumberInput, 10) : undefined,
    expandComment: core.getBooleanInput('expand-comment', { required: true })
  }
  const octokit = github.getOctokit(inputs.token)

  // 2) Render plan
  const renderResult: RenderResult = await core.group('Render plan', () =>
    renderPlan({
      planfile: inputs.planfile,
      terraformCommand: inputs.terraformCmd,
      workingDirectory: inputs.workingDirectory
    })
  )

  // 3) Render the plan diff markdown and set it as output
  const planMarkdown = await core.group('Render plan diff markdown', async () => {
    const markdown = renderMarkdown({
      renderResult: renderResult,
      header: inputs.header,
      expandDetails: inputs.expandComment
    })
    core.setOutput('markdown', markdown)
    core.setOutput('empty', renderResult.resourcesChanges.noChanges())
    return markdown
  })

  // 4) Set outputs for resource changes
  core.setOutput('summary', renderResult.resourcesChanges.summary())
  core.setOutput('create', renderResult.resourcesChanges.created)
  core.setOutput('update', renderResult.resourcesChanges.updated)
  core.setOutput('delete', renderResult.resourcesChanges.deleted)
  core.setOutput('recreate', renderResult.resourcesChanges.recreated)
  core.setOutput('ephemeral', renderResult.resourcesChanges.ephemeral)

  // 5) Add plan to GitHub step summary
  await core.group('Adding plan to step summary', async () => {
    await core.summary.addRaw(planMarkdown).write()
  })

  // Determine if we should post a comment
  const shouldPostComment =
    !inputs.skipComment &&
    (inputs.prNumber || ['pull_request', 'pull_request_target'].includes(github.context.eventName))
  if (shouldPostComment) {
    if (!inputs.skipEmpty || !renderResult.resourcesChanges.noChanges()) {
      // 5) Post comment with markdown (if applicable)
      await core.group('Render comment', () => {
        return createOrUpdateComment({ octokit, content: planMarkdown, prNumber: inputs.prNumber })
      })
    } else {
      // 6) Delete existing comment if plan is empty and skip-empty is enabled
      await core.group('Delete outdated comment', () => {
        return deleteComment({ octokit, header: `## ${inputs.header}` })
      })
    }
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
