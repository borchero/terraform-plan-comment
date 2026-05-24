import * as fs from 'fs'
import { renderPlan } from '../src/render'
import { getExecOutput } from '@actions/exec'

jest.mock('@actions/exec')

const mockedgetExecOutput = jest.mocked(getExecOutput, { shallow: true })

afterEach(() => {
  mockedgetExecOutput?.mockReset()
})

test.each(['basic/0-create', 'basic/1-modify', 'basic/2-delete', 'basic/5-terragrunt'])(
  'render terraform successful',
  async (arg) => {
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
