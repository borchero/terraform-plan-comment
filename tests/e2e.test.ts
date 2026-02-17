import * as fs from 'fs'
import { internalRenderPlan } from '../src/render'
import { parsePlanfileJSON } from '../src/planfile'
import { renderMarkdown } from '../src/comment'
import * as github from '@actions/github'

jest.mock('@actions/github', () => ({
  context: {
    actor: 'testuser',
    eventName: 'pull_request',
    payload: {
      pull_request: {
        head: {
          sha: 'abc123def456'
        }
      }
    }
  }
}))

test.each([
  'basic/0-create',
  'basic/1-modify',
  'basic/2-delete',
  'basic/3-remove',
  'basic/4-empty',
  'ephemeral/0-create'
])('parse-successful', (arg) => {
  const planJson = JSON.parse(fs.readFileSync(`tests/fixtures/${arg}/plan.json`, 'utf-8'))
  const planTxt = fs.readFileSync(`tests/fixtures/${arg}/plan.txt`, 'utf-8')
  const planfile = parsePlanfileJSON(planJson)
  const renderedPlan = internalRenderPlan(planfile, planTxt)
  const renderedMarkdown = renderMarkdown({
    plans: [renderedPlan],
    header: '📝 Terraform Plan',
    includeFooter: false,
    expandDetails: false
  })

  if (process.env.GENERATE_FIXTURE === '1') {
    fs.writeFileSync(`tests/fixtures/${arg}/rendered.md`, renderedMarkdown)
  } else {
    const expected = fs.readFileSync(`tests/fixtures/${arg}/rendered.md`, 'utf-8')
    expect(renderedMarkdown).toBe(expected)
  }
})

test.each(['basic/6-terragrunt-multiplan', 'basic/5-terragrunt'])(
  'parse-successful-terragrunt',
  (arg) => {
    const planJson = fs.readFileSync(`tests/fixtures/${arg}/plan.json`, 'utf-8')
    const planTxt = fs.readFileSync(`tests/fixtures/${arg}/plan.txt`, 'utf-8')
    const jsonPlans = planJson.split('\n').filter((line) => line !== '')
    const renderedPlans = jsonPlans
      .map((plan) => JSON.parse(plan))
      .map((json) => parsePlanfileJSON(json))
      .map((structuredPlanfile) => internalRenderPlan(structuredPlanfile, planTxt))
    const renderedMarkdown = renderMarkdown({
      plans: renderedPlans,
      header: '📝 Terragrunt Plan',
      includeFooter: false,
      expandDetails: false,
    })

    if (process.env.GENERATE_FIXTURE === '1') {
      fs.writeFileSync(`tests/fixtures/${arg}/rendered.md`, renderedMarkdown)
    } else {
      const expected = fs.readFileSync(`tests/fixtures/${arg}/rendered.md`, 'utf-8')
      expect(renderedMarkdown).toBe(expected)
    }
  }
)

test('footer does not mention users', () => {
  const planJson = JSON.parse(fs.readFileSync('tests/fixtures/basic/0-create/plan.json', 'utf-8'))
  const planTxt = fs.readFileSync('tests/fixtures/basic/0-create/plan.txt', 'utf-8')
  const planfile = parsePlanfileJSON(planJson)
  const renderedPlan = internalRenderPlan(planfile, planTxt)
  const renderedMarkdown = renderMarkdown({
    plans: [renderedPlan],
    header: '📝 Terraform Plan',
    includeFooter: true,
    expandDetails: false
  })

  // Verify the footer is present
  expect(renderedMarkdown).toContain('---')
  expect(renderedMarkdown).toContain('Triggered by')

  // Verify username is wrapped in backticks, not mentioned with @
  expect(renderedMarkdown).toContain('Triggered by `testuser`')
  expect(renderedMarkdown).not.toContain('Triggered by @testuser')

  // Verify commit SHA is also in backticks
  expect(renderedMarkdown).toContain('Commit: `abc123def456`')
})
