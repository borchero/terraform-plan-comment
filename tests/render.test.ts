import * as fs from 'fs'
import { internalRenderPlan, planIsEmpty, plansAreEmpty, renderPlan } from '../src/render'
import { parsePlanfileJSON } from '../src/planfile'
import { getExecOutput } from '@actions/exec'

jest.mock('@actions/exec')

const mockedgetExecOutput = jest.mocked(getExecOutput, { shallow: true })

afterEach(() => {
  mockedgetExecOutput?.mockReset()
})

test.each([
  'basic/0-create',
  'basic/1-modify',
  'basic/2-delete',
  'basic/5-terragrunt',
  'basic/7-create-hundreds'
])('render terraform successful', async (arg) => {
    const json = fs.readFileSync(`tests/fixtures/${arg}/plan.json`, 'utf-8')
    const plan = fs.readFileSync(`tests/fixtures/${arg}/plan.txt`, 'utf-8')
    mockedgetExecOutput.mockImplementationOnce(() =>
      Promise.resolve({ exitCode: 0, stdout: plan, stderr: '' })
    )
    mockedgetExecOutput.mockImplementationOnce(() =>
      Promise.resolve({ exitCode: 0, stdout: json, stderr: '' })
    )
    const plans = await renderPlan({
      planfile: `tests/fixtures/${arg}/plan.json`,
      terraformCommand: 'terraform',
      workingDirectory: '/'
    })
    expect(getExecOutput).toHaveBeenCalledTimes(2)
    // expects 1 plan after execution
    expect(plans).toHaveLength(1)
  }
)

test.each(['basic/6-terragrunt-multiplan'])('render terragrunt successful', async (arg) => {
  const json = fs.readFileSync(`tests/fixtures/${arg}/plan.json`, 'utf-8')
  const plan = fs.readFileSync(`tests/fixtures/${arg}/plan.txt`, 'utf-8')
  mockedgetExecOutput.mockImplementationOnce(() =>
    Promise.resolve({ exitCode: 0, stdout: plan, stderr: '' })
  )
  mockedgetExecOutput.mockImplementation(() =>
    Promise.resolve({ exitCode: 0, stdout: json, stderr: '' })
  )
  const plans = await renderPlan({
    planfile: `tests/fixtures/${arg}/plan.json`,
    terraformCommand: 'terragrunt',
    workingDirectory: '/'
  })
  expect(getExecOutput).toHaveBeenCalledTimes(3)
  // expects 1 plans after execution
  expect(plans).toHaveLength(3)
})

describe('planIsEmpty', () => {
  test('a plan without any changes is empty', () => {
    expect(planIsEmpty({})).toBe(true)
  })

  test.each([
    ['imports', { importedResources: ['terraform_data.a'] }],
    ['moves', { movedResources: { 'local_file.b': 'local_file.a' } }],
    ['removes from state', { forgottenResources: ['local_file.a'] }]
  ])('a plan that only %s is not empty', (_name, plan) => {
    expect(planIsEmpty(plan)).toBe(false)
  })

  test('plans are not empty if any of them only changes state', () => {
    expect(plansAreEmpty([{}, { movedResources: { 'local_file.b': 'local_file.a' } }])).toBe(false)
  })
})

describe('internalRenderPlan state changes', () => {
  // A resource can be imported, moved or forgotten *and* changed. These plans are awkward to
  // produce with the fixture generator, so they are asserted against hand-built planfiles.
  function render(resourceChanges: object[], humanReadablePlan = '') {
    const planJson = JSON.parse(
      JSON.stringify({ format_version: '1.2', resource_changes: resourceChanges })
    )
    return internalRenderPlan(parsePlanfileJSON(planJson), humanReadablePlan)
  }

  test('an import that also updates counts as both', () => {
    const plan = render(
      [
        {
          address: 'local_file.a',
          change: { actions: ['update'], importing: { id: 'abc' } }
        }
      ],
      '  # local_file.a will be updated in-place\n  ~ resource "local_file" "a" {\n      x = 1\n    }\n'
    )
    expect(plan.importedResources).toEqual(['local_file.a'])
    expect(Object.keys(plan.updatedResources ?? {})).toEqual(['local_file.a'])
  })

  test('a move that also deletes counts as both', () => {
    const plan = render(
      [
        {
          address: 'local_file.b',
          previous_address: 'local_file.a',
          change: { actions: ['delete'] }
        }
      ],
      '  # local_file.b will be destroyed\n  - resource "local_file" "b" {\n      x = 1\n    }\n'
    )
    expect(plan.movedResources).toEqual({ 'local_file.b': 'local_file.a' })
    expect(Object.keys(plan.deletedResources ?? {})).toEqual(['local_file.b'])
  })

  test('a create-then-forget resource counts as both created and removed from state', () => {
    const plan = render(
      [{ address: 'local_file.a', change: { actions: ['create', 'forget'] } }],
      '  # local_file.a will be created\n  + resource "local_file" "a" {\n      x = 1\n    }\n'
    )
    expect(plan.forgottenResources).toEqual(['local_file.a'])
    expect(Object.keys(plan.createdResources ?? {})).toEqual(['local_file.a'])
  })

  test('a plan with no state changes leaves the state fields undefined', () => {
    const plan = render([{ address: 'local_file.a', change: { actions: ['no-op'] } }])
    expect(plan.importedResources).toBeUndefined()
    expect(plan.movedResources).toBeUndefined()
    expect(plan.forgottenResources).toBeUndefined()
  })
})
