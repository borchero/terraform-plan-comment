import * as fs from 'fs'
import { jest, afterEach, test, expect, beforeEach } from '@jest/globals'

// Mock the module before importing
const mockGetExecOutput = jest.fn()
jest.unstable_mockModule('@actions/exec', () => ({
  getExecOutput: mockGetExecOutput
}))

// Import after mocking
const { renderPlan } = await import('../src/render.js')

afterEach(() => {
  mockGetExecOutput.mockReset()
})

test.each(['basic/0-create', 'basic/1-modify', 'basic/2-delete', 'basic/5-terragrunt'])(
  'render terraform successful',
  async (arg: string) => {
    const json = fs.readFileSync(`tests/fixtures/${arg}/plan.json`, 'utf-8')
    const plan = fs.readFileSync(`tests/fixtures/${arg}/plan.txt`, 'utf-8')
    mockGetExecOutput.mockImplementationOnce(() =>
      Promise.resolve({ exitCode: 0, stdout: plan, stderr: '' })
    )
    mockGetExecOutput.mockImplementationOnce(() =>
      Promise.resolve({ exitCode: 0, stdout: json, stderr: '' })
    )
    const plans = await renderPlan({
      planfile: `tests/fixtures/${arg}/plan.json`,
      terraformCommand: 'terraform',
      workingDirectory: '/'
    })
    expect(mockGetExecOutput).toHaveBeenCalledTimes(2)
    // expects 1 plan after execution
    expect(plans).toHaveLength(1)
  }
)

test.each(['basic/6-terragrunt-multiplan'])('render terragrunt successful', async (arg: string) => {
  const json = fs.readFileSync(`tests/fixtures/${arg}/plan.json`, 'utf-8')
  const plan = fs.readFileSync(`tests/fixtures/${arg}/plan.txt`, 'utf-8')
  mockGetExecOutput.mockImplementationOnce(() =>
    Promise.resolve({ exitCode: 0, stdout: plan, stderr: '' })
  )
  mockGetExecOutput.mockImplementation(() =>
    Promise.resolve({ exitCode: 0, stdout: json, stderr: '' })
  )
  const plans = await renderPlan({
    planfile: `tests/fixtures/${arg}/plan.json`,
    terraformCommand: 'terragrunt',
    workingDirectory: '/'
  })
  expect(mockGetExecOutput).toHaveBeenCalledTimes(3)
  // expects 1 plans after execution
  expect(plans).toHaveLength(3)
})
