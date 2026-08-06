import type { GitHub } from '@actions/github/lib/utils'
import * as github from '@actions/github'
import type { PullRequestEvent } from '@octokit/webhooks-types'
import { planIsEmpty, summarize, summaryText, type RenderedPlan } from './render'

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

function renderAddresses(addresses: string[]): string {
  let result = ''
  for (const address of [...addresses].sort()) {
    result += `\n\n- \`${address}\``
  }
  return result
}

function renderMovedAddresses(moved: Record<string, string>): string {
  let result = ''
  for (const address of Object.keys(moved).sort()) {
    result += `\n\n- \`${moved[address]}\` → \`${address}\``
  }
  return result
}

function renderBody(plan: RenderedPlan, options: { expandDetails: boolean }): string {
  if (planIsEmpty(plan)) {
    return ''
  }

  let body = '**→ ' + summaryText(summarize([plan])) + '**'

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

  // State changes carry no diff to show, so they are listed by address instead of as <details>.
  if (plan.importedResources) {
    body += '\n\n### 📥 Import'
    body += renderAddresses(plan.importedResources)
  }
  if (plan.movedResources) {
    body += '\n\n### 🧭 Move'
    body += renderMovedAddresses(plan.movedResources)
  }
  if (plan.forgottenResources) {
    body += '\n\n### 📤 Remove From State'
    body += renderAddresses(plan.forgottenResources)
  }

  return body
}

export function renderMarkdown({
  plans,
  header,
  includeFooter,
  expandDetails
}: {
  plans: RenderedPlan[]
  header: string
  includeFooter?: boolean
  expandDetails: boolean
}): string {
  // Build body
  let body = plans.map((plan) => renderBody(plan, { expandDetails })).filter((item) => item !== '')
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

export function chunkComment(content: string, header: string, maxChunkSize = 65000): string[] {
  const chunks: string[] = []
  let remaining = content
  let part = 1
  const continuationNote = '\n\n*(continued in next comment)*'
  const part1Suffix = ' (Part 1)'

  while (true) {
    if (remaining.length === 0) {
      break
    }

    const prependedHeader = part > 1 ? `${header} (Part ${part})\n\n` : ''
    let currentMax = maxChunkSize - prependedHeader.length

    if (remaining.length > currentMax) {
      currentMax -= continuationNote.length
      if (part === 1) {
        currentMax -= part1Suffix.length
      }
    }

    if (remaining.length <= currentMax) {
      chunks.push(prependedHeader + remaining)
      break
    }

    let splitIndex = remaining.lastIndexOf('</details>', currentMax - '</details>'.length)
    if (splitIndex !== -1) {
      splitIndex += '</details>'.length
    } else {
      splitIndex = remaining.lastIndexOf('\n\n', currentMax - 2)
      if (splitIndex === -1) {
        splitIndex = currentMax
      }
    }

    if (splitIndex <= 0) {
      splitIndex = Math.max(1, currentMax)
    }

    let chunk = prependedHeader + remaining.substring(0, splitIndex)
    chunk += continuationNote
    if (part === 1) {
      if (chunk.startsWith(header)) {
        chunk = header + part1Suffix + chunk.substring(header.length)
      }
    }
    chunks.push(chunk)
    remaining = remaining.substring(splitIndex).trimStart()
    part++
  }

  return chunks
}

export async function createOrUpdateComment({
  octokit,
  header,
  content,
  prNumber
}: {
  octokit: InstanceType<typeof GitHub>
  header: string
  content: string
  prNumber?: number
}): Promise<void> {
  // Use provided PR number or fall back to context
  const issueNumber = prNumber ?? github.context.issue.number

  // Chunk the content
  const chunks = chunkComment(content, header, 65000)

  // Get all PR comments
  const comments = await octokit.paginate(octokit.rest.issues.listComments, {
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    issue_number: issueNumber
  })

  // Find all comments that start with the header
  const existingComments = comments.filter((comment) => comment.body?.startsWith(header))

  // Update or create comments for each chunk
  for (let i = 0; i < chunks.length; i++) {
    const chunkContent = chunks[i]
    if (i < existingComments.length) {
      await octokit.rest.issues.updateComment({
        owner: github.context.repo.owner,
        repo: github.context.repo.repo,
        comment_id: existingComments[i].id,
        body: chunkContent
      })
    } else {
      await octokit.rest.issues.createComment({
        owner: github.context.repo.owner,
        repo: github.context.repo.repo,
        issue_number: issueNumber,
        body: chunkContent
      })
    }
  }

  // Delete any extra comments
  for (let i = chunks.length; i < existingComments.length; i++) {
    await octokit.rest.issues.deleteComment({
      owner: github.context.repo.owner,
      repo: github.context.repo.repo,
      comment_id: existingComments[i].id
    })
  }
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

  let deletedAny = false
  // Find and delete any comment that starts with the expected header
  for (const comment of comments) {
    if (comment.body?.startsWith(header)) {
      await octokit.rest.issues.deleteComment({
        owner: github.context.repo.owner,
        repo: github.context.repo.repo,
        comment_id: comment.id
      })
      deletedAny = true
    }
  }

  return deletedAny
}
