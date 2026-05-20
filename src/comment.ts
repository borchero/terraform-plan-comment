import type { GitHub } from '@actions/github/lib/utils'
import * as github from '@actions/github'
import type { PullRequestEvent } from '@octokit/webhooks-types'
import type { RenderedPlan } from './renderedPlan'
import type { RenderResult } from './renderResult'

function renderResources(
  resources: Record<string, string>,
  options: { expandDetails: boolean }
): string {
  let result = ''
  for (const key of Object.keys(resources).sort()) {
    const content = resources[key]
    const openAttr = options.expandDetails ? ' open' : ''
    result += `\n\n<details${openAttr}><summary><code>${key}</code></summary>\n\n${content}\n\n</details>`
  }
  return result
}

function renderBody(plan: RenderedPlan, options: { expandDetails: boolean }): string {
  if (plan.resourcesChanges.noChanges()) {
    return ''
  }

  let body = '**→ ' + plan.resourcesChanges.summary() + '**'

  if (plan.createdResources) {
    body += '\n\n### ✨ Create'
    body += renderResources(plan.createdResources, options)
  }
  if (plan.updatedResources) {
    body += '\n\n### ♻️ Update'
    body += renderResources(plan.updatedResources, options)
  }
  if (plan.recreatedResources) {
    body += '\n\n### ⚙️ Re-Create'
    body += renderResources(plan.recreatedResources, options)
  }
  if (plan.deletedResources) {
    body += '\n\n### 🗑️ Delete'
    body += renderResources(plan.deletedResources, options)
  }
  if (plan.ephemeralResources) {
    body += '\n\n### 👻 Ephemeral'
    body += renderResources(plan.ephemeralResources, options)
  }

  return body
}

export function renderMarkdown({
  renderResult,
  header,
  includeFooter,
  expandDetails
}: {
  renderResult: RenderResult
  header: string
  includeFooter?: boolean
  expandDetails: boolean
}): string {
  // Build body
  let body = renderResult.renderedPlans
    .map((plan) => renderBody(plan, { expandDetails }))
    .filter((item) => item !== '')
  if (body.length === 0) {
    body = ['**→ No Resource Changes!**']
  }

  // Build footer
  let footer = ''
  if (includeFooter === undefined || includeFooter === true) {
    footer = `\n\n---\n\n_Triggered by \`@${github.context.actor}\``
    if (github.context.eventName === 'pull_request') {
      footer += `, Commit: \`${(github.context.payload as PullRequestEvent).pull_request.head.sha}\``
    }
    footer += '_'
  }

  return `## ${header}\n\n${body.join('\n\n')}${footer}`
}

export async function createOrUpdateComment({
  octokit,
  content,
  prNumber
}: {
  octokit: InstanceType<typeof GitHub>
  content: string
  prNumber?: number
}): Promise<void> {
  // Use provided PR number or fall back to context
  const issueNumber = prNumber ?? github.context.issue.number

  // Get all PR comments
  const comments = await octokit.paginate(octokit.rest.issues.listComments, {
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    issue_number: issueNumber
  })

  // Check if any comment already starts with the header that we expect. If so,
  // let's update the comment with the new content.
  const header = content.split('\n')[0]
  for (const comment of comments) {
    if (comment.body?.startsWith(header)) {
      await octokit.rest.issues.updateComment({
        owner: github.context.repo.owner,
        repo: github.context.repo.repo,
        comment_id: comment.id,
        body: content
      })
      return
    }
  }

  // Otherwise, post a new comment.
  await octokit.rest.issues.createComment({
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    issue_number: issueNumber,
    body: content
  })
}

export async function deleteComment({
  octokit,
  header
}: {
  octokit: InstanceType<typeof GitHub>
  header: string
}): Promise<boolean> {
  // Get all PR comments
  const comments = await octokit.paginate(octokit.rest.issues.listComments, {
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    issue_number: github.context.issue.number
  })

  // Find and delete any comment that starts with the expected header
  for (const comment of comments) {
    if (comment.body?.startsWith(header)) {
      await octokit.rest.issues.deleteComment({
        owner: github.context.repo.owner,
        repo: github.context.repo.repo,
        comment_id: comment.id
      })
      return true
    }
  }

  return false
}
