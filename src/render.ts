import * as exec from '@actions/exec'
import type { StructuredPlanfile } from './planfile'
import { parsePlanfileJSON } from './planfile'
import { RenderedPlan } from './renderedPlan'
import { RenderResult } from './renderResult'

type ResourceContent = {
  reason?: string
  lines: string[]
}

const TERRAFORM_DIFF_INDENTATION = 4

function extractResourceContent(name: string, humanReadablePlan: string): ResourceContent {
  const lines = humanReadablePlan.split('\n')

  // In the plan, find the resource with the appropriate name
  const resourceHeaderIndex = lines.findIndex((line) => line.startsWith(`  # ${name}`))
  if (resourceHeaderIndex < 0) {
    throw Error(`Resource '${name}' is modified but cannot be found in human-readable plan.`)
  }
  let resourceLineIndex = lines
    .slice(resourceHeaderIndex)
    .findIndex((line) => line.match(/.*[+-~⇄] (resource|ephemeral)/))
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
    if (matches?.length === 4 && matches[1].length === TERRAFORM_DIFF_INDENTATION) {
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

export function internalRenderPlan(
  structuredPlan: StructuredPlanfile,
  humanReadablePlan: string
): RenderedPlan {
  // If there are no changes, we do not need to build any sections
  if (
    structuredPlan.resource_changes === undefined ||
    structuredPlan.resource_changes.length === 0
  ) {
    return new RenderedPlan({}, {}, {}, {}, {})
  }

  // Partition changes for output formatting and extract resources
  const createdResources = structuredPlan.resource_changes
    .filter((r) => r.change.actions.toString() === ['create'].toString())
    .map((r) => r.address)
  const updatedResources = structuredPlan.resource_changes
    .filter((r) => r.change.actions.toString() === ['update'].toString())
    .map((r) => r.address)
  const recreatedResources = structuredPlan.resource_changes
    .filter(
      (r) =>
        r.change.actions.toString() === ['delete', 'create'].toString() ||
        r.change.actions.toString() === ['create', 'delete'].toString()
    )
    .map((r) => r.address)
  const deletedResources = structuredPlan.resource_changes
    .filter((r) => r.change.actions.toString() === ['delete'].toString())
    .map((r) => r.address)
  const ephemeralResources = structuredPlan.resource_changes
    .filter((r) => r.change.actions.toString() === ['open'].toString())
    .map((r) => r.address)

  return new RenderedPlan(
    extractResources(createdResources, humanReadablePlan),
    extractResources(updatedResources, humanReadablePlan),
    extractResources(recreatedResources, humanReadablePlan),
    extractResources(deletedResources, humanReadablePlan),
    extractResources(ephemeralResources, humanReadablePlan)
  )
}

async function renderTerraformPlan({
  planfile,
  terraformCommand,
  options,
  humanReadablePlanfile
}: {
  planfile: string
  terraformCommand: string
  options: object
  humanReadablePlanfile: string
}): Promise<RenderedPlan> {
  const structuredPlanfile = await exec
    .getExecOutput(terraformCommand, ['show', '-json', planfile], options)
    .then((output) => {
      const jsonStart = output.stdout.indexOf('{')
      if (jsonStart === -1) throw new Error('No JSON found in planfile output')
      const jsonText = output.stdout.slice(jsonStart)
      return JSON.parse(jsonText)
    })
    .then((json) => parsePlanfileJSON(json))
  return internalRenderPlan(structuredPlanfile, humanReadablePlanfile)
}

async function renderTerragruntPlan({
  planfile,
  terraformCommand,
  options,
  humanReadablePlanfile
}: {
  planfile: string
  terraformCommand: string
  options: object
  humanReadablePlanfile: string
}): Promise<RenderResult> {
  const jsonPlans = await exec
    .getExecOutput(terraformCommand, ['show', '-json', planfile], options)
    .then((output) => output.stdout.split('\n'))
    .then((plans) => plans.filter((plan) => plan !== ''))
  const renderedPlans = jsonPlans
    .map((plan) => JSON.parse(plan))
    .map((json) => parsePlanfileJSON(json))
    .map((structuredPlanfile) => internalRenderPlan(structuredPlanfile, humanReadablePlanfile))
  return new RenderResult(renderedPlans)
}

export async function renderPlan({
  planfile,
  terraformCommand,
  workingDirectory
}: {
  planfile: string
  terraformCommand: string
  workingDirectory: string
}): Promise<RenderResult> {
  const options = {
    cwd: workingDirectory,
    silent: true
  }
  const humanReadablePlanfile = await exec
    .getExecOutput(terraformCommand, ['show', '-no-color', planfile], options)
    .then((output) => output.stdout)
  try {
    const renderedPlan = await renderTerraformPlan({
      planfile,
      terraformCommand,
      options,
      humanReadablePlanfile
    })
    return new RenderResult([renderedPlan])
  } catch (error) {
    if (error instanceof SyntaxError) {
      // if there is a SyntaxError while parsing JSON, there is a high chance that
      // we are dealing with an ndjson generated by terragrunt --all command
      return await renderTerragruntPlan({
        planfile,
        terraformCommand,
        options,
        humanReadablePlanfile
      })
    }
  }
  return new RenderResult([])
}
