import * as exec from '@actions/exec'
import type { StructuredPlanfile, StructuredPlanChange } from './planfile'
import { parsePlanfileJSON } from './planfile'

export type RenderedPlan = {
  createdResources?: Record<string, string>
  updatedResources?: Record<string, string>
  recreatedResources?: Record<string, string>
  deletedResources?: Record<string, string>
}

export function planIsEmpty(plan: RenderedPlan): boolean {
  return (
    !plan.createdResources &&
    !plan.recreatedResources &&
    !plan.updatedResources &&
    !plan.deletedResources
  )
}

type ResourceContent = {
  reason?: string
  lines: string[]
}

function extractResourceContent(name: string, humanReadablePlan: string): ResourceContent {
  const lines = humanReadablePlan.split('\n')

  // In the plan, find the resource with the appropriate name
  const resourceHeaderIndex = lines.findIndex((line) => line.startsWith(`  # ${name}`))
  if (resourceHeaderIndex < 0) {
    throw Error(`Resource '${name}' is modified but cannot be found in human-readable plan.`)
  }
  let resourceLineIndex = lines
    .slice(resourceHeaderIndex)
    .findIndex((line) => line.match(/.*[+-~] resource/))
  if (resourceLineIndex < 0) {
    throw Error(`Resource block cannot be found for resource '${name}'.`)
  }
  resourceLineIndex += resourceHeaderIndex

  // Then, we can find the end of the resource block by search for the line with the closing
  // bracket
  const closingLineIndex = lines.slice(resourceLineIndex).findIndex((line) => line === '    }')
  if (closingLineIndex < 0) {
    throw Error(`Resource '${name}' cannot be properly extracted from the human-readable plan.`)
  }

  // Eventually, we return the *contents* of the resource block along with a reason (if available)
  let reason: string | undefined
  if (resourceLineIndex - resourceHeaderIndex > 1) {
    const match = lines[resourceLineIndex - 1].match(/\((.*)\)/)
    if (match) {
      reason = match[1]
    }
  }
  const result = lines.slice(resourceLineIndex + 1, resourceLineIndex + closingLineIndex)
  return { reason, lines: result }
}

function formatResourceContent(content: ResourceContent): string {
  // Indentation should be 6 spaces so we can get rid of this in all lines.
  const aligned = content.lines.map((line) => line.slice(6))

  // If there are now any lines where we find a `+`, `-`, or `~` only after spaces, we move it to
  // the front.
  const diffSuitable = aligned.map((line) => {
    const matches = line.match(/^( +)([+-~])( .*)$/)
    if (matches?.length === 4) {
      return matches[2] + matches[1] + matches[3]
    }
    return line
  })

  // Finally, we need to replace all `~` with `!` if they are the first character
  const diffFinal = diffSuitable.map((line) => (line.startsWith('~') ? '!' + line.slice(1) : line))
  const formatted = '```diff\n' + diffFinal.join('\n') + '\n```'

  let result = formatted
  if (content.reason) {
    result = formatted + `\n\n_→ ${content.reason}_`
  }
  return result
}

function extractResources(
  names: string[],
  humanReadablePlan: string
): Record<string, string> | undefined {
  if (names.length === 0) {
    return undefined
  }
  return names.reduce(
    (acc, name) => {
      const content = extractResourceContent(name, humanReadablePlan)
      acc[name] = formatResourceContent(content)
      return acc
    },
    {} as Record<string, string>
  )
}

function queryChanges(changes: StructuredPlanChange[], changeKind: string): string[] {
  return changes
    .filter((r) => r.change.actions.toString() === [changeKind].toString())
    .map((r) => r.address)
}

function getRecreatedChanges(changes: StructuredPlanChange[]): string[] {
  return changes
    .filter(
      (r) =>
        r.change.actions.toString() === ['delete', 'create'].toString() ||
        r.change.actions.toString() === ['create', 'delete'].toString()
    )
    .map((r) => r.address)
}

export function internalRenderPlan(
  structuredPlan: StructuredPlanfile,
  humanReadablePlan: string
): RenderedPlan {
  // If there are no changes, we do not need to build any sections
  if (
    (
      structuredPlan.resource_changes === undefined ||
      structuredPlan.resource_changes.length === 0
    ) && (
      structuredPlan.resource_drift === undefined ||
      structuredPlan.resource_drift.length === 0
    )
  ) {
    return {}
  }

  // Partition changes for output formatting and extract resources
  const createdResources = queryChanges(
    structuredPlan.resource_changes || [],
    'create'
  ).concat(queryChanges(
    structuredPlan.resource_drift || [],
    'create',
  ))
  const updatedResources = queryChanges(
    structuredPlan.resource_changes || [],
    'update'
  ).concat(queryChanges(
    structuredPlan.resource_drift || [],
    'update',
  ))
  const deletedResources = queryChanges(
    structuredPlan.resource_changes || [],
    'delete'
  ).concat(queryChanges(
    structuredPlan.resource_drift || [],
    'delete')
  )
  const recreatedResources = getRecreatedChanges(
    structuredPlan.resource_changes || []
  ).concat(getRecreatedChanges(structuredPlan.resource_drift || []))

  return {
    createdResources: extractResources(createdResources, humanReadablePlan),
    updatedResources: extractResources(updatedResources, humanReadablePlan),
    recreatedResources: extractResources(recreatedResources, humanReadablePlan),
    deletedResources: extractResources(deletedResources, humanReadablePlan)
  }
}

export async function renderPlan({
  planfile,
  terraformCommand,
  workingDirectory
}: {
  planfile: string
  terraformCommand: string
  workingDirectory: string
}): Promise<RenderedPlan> {
  const options = {
    cwd: workingDirectory,
    silent: true
  }
  const structuredPlanfile = await exec
    .getExecOutput(terraformCommand, ['show', '-json', planfile], options)
    .then((output) => JSON.parse(output.stdout))
    .then((json) => parsePlanfileJSON(json))
  const humanReadablePlanfile = await exec
    .getExecOutput(terraformCommand, ['show', '-no-color', planfile], options)
    .then((output) => output.stdout)
  return internalRenderPlan(structuredPlanfile, humanReadablePlanfile)
}
