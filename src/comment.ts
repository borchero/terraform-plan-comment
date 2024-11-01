import type { GitHub } from '@actions/github/lib/utils'
import * as github from '@actions/github'
import type { PullRequestEvent } from '@octokit/webhooks-types'
import type { RenderedPlan } from './render'

function renderResources(resources: Record<string, string>): string {
  let result = ''
  for (const key of Object.keys(resources).sort()) {
    const content = resources[key]
    result += `\n\n<details><summary><code>${key}</code></summary>\n\n${content}\n\n</details>`
  }
  return result
}

function renderBody(plan: RenderedPlan): string {
  if (
    !plan.createdResources &&
    !plan.recreatedResources &&
    !plan.updatedResources &&
    !plan.deletedResources &&
    !plan.importedResources
  ) {
    return '**→ No Resource Changes!**'
  }

  let body =
    '**→ Resource Changes: ' +
    `${Object.keys(plan.createdResources ?? {}).length} to create, ` +
    `${Object.keys(plan.updatedResources ?? {}).length} to update, ` +
    `${Object.keys(plan.recreatedResources ?? {}).length} to re-create, ` +
    `${Object.keys(plan.deletedResources ?? {}).length} to delete, ` +
    `${Object.keys(plan.importedResources ?? {}).length} to import.**`

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
  if (plan.importedResources) {
    body += '\n\n### 📥 Import'
    body += renderResources(plan.importedResources)
  }

  return body
}

export function renderComment({
  plan,
  header,
  includeFooter,
  bodyOverride
}: {
  plan: RenderedPlan
  header: string
  includeFooter?: boolean
  bodyOverride?: string
}): string {
  // Build body if bodyOverride is null
  const body = bodyOverride ?? renderBody(plan)

  // Build footer
  let footer = ''
  if (includeFooter === undefined || includeFooter === true) {
    footer =
      `\n\n---\n\n_Triggered by @${github.context.actor},` +
      ` Commit: \`${(github.context.payload as PullRequestEvent).pull_request.head.sha}\`_`
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
