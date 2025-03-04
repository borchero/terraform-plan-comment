import type { GitHub } from '@actions/github/lib/utils'
import * as github from '@actions/github'
import type { PullRequestEvent } from '@octokit/webhooks-types'
import { planIsEmpty, type RenderedPlan } from './render'

function renderResources(resources: Record<string, string>): string {
  let result = ''
  for (const key of Object.keys(resources).sort()) {
    const content = resources[key]
    result += `\n\n<details><summary><code>${key}</code></summary>\n\n${content}\n\n</details>`
  }
  return result
}

function renderBody(plan: RenderedPlan): string {
  if (planIsEmpty(plan)) {
    return '**→ No Resource Changes!**'
  }

  let body =
    '**→ Resource Changes: ' +
    `${Object.keys(plan.createdResources ?? {}).length} to create, ` +
    `${Object.keys(plan.updatedResources ?? {}).length} to update, ` +
    `${Object.keys(plan.recreatedResources ?? {}).length} to re-create, ` +
    `${Object.keys(plan.deletedResources ?? {}).length} to delete.**`

  if (plan.createdResources) {
    body += '\n\n### ✨ Create'
    body += renderResources(plan.createdResources)
  }
  if (plan.updatedResources) {
    body += '\n\n### ♻️ Update'
    body += renderResources(plan.updatedResources)
  }
  if (plan.recreatedResources) {
    body += '\n\n### ⚙️ Re-Create'
    body += renderResources(plan.recreatedResources)
  }
  if (plan.deletedResources) {
    body += '\n\n### 🗑️ Delete'
    body += renderResources(plan.deletedResources)
  }

  return body
}

export function renderMarkdown({
  plan,
  header,
  includeFooter
}: {
  plan: RenderedPlan
  header: string
  includeFooter?: boolean
}): string {
  // Build body
  const body = renderBody(plan)

  // Build footer
  let footer = ''
  if (includeFooter === undefined || includeFooter === true) {
    footer = `\n\n---\n\n_Triggered by @${github.context.actor}_`
    if (github.context.eventName === 'pull_request') {
      footer += `, Commit: \`${(github.context.payload as PullRequestEvent).pull_request.head.sha}\`_`
    }
  }

  return `## ${header}\n\n${body}${footer}`
}

export async function createOrUpdateComment({
  octokit,
  content
}: {
  octokit: InstanceType<typeof GitHub>
  content: string
}): Promise<void> {
  // Get all PR comments
  const comments = await octokit.rest.issues.listComments({
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    issue_number: github.context.issue.number
  })

  // Check if any comment already starts with the header that we expect. If so,
  // let's update the comment with the new content.
  const header = content.split('\n')[0]
  for (const comment of comments.data) {
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
    issue_number: github.context.issue.number,
    body: content
  })
}
