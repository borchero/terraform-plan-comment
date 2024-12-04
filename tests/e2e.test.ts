import * as fs from 'fs'
import { internalRenderPlan } from '../src/render'
import { parsePlanfileJSON } from '../src/planfile'
import { renderBody, renderComment } from '../src/comment'

test.each(['basic/0-create', 'basic/1-modify', 'basic/2-delete', 'basic/3-empty'])(
  'parse-successful',
  (arg) => {
    const planJson = JSON.parse(fs.readFileSync(`tests/fixtures/${arg}/plan.json`, 'utf-8'))
    const planTxt = fs.readFileSync(`tests/fixtures/${arg}/plan.txt`, 'utf-8')
    const planfile = parsePlanfileJSON(planJson)
    const renderedPlan = internalRenderPlan(planfile, planTxt)
    const renderedMarkdown = renderBody(renderedPlan)
    const renderedComment = renderComment({
      body: renderedMarkdown,
      header: '📝 Terraform Plan',
      includeFooter: false
    })

    if (process.env.GENERATE_FIXTURE === '1') {
      fs.writeFileSync(`tests/fixtures/${arg}/rendered.md`, renderedComment)
    } else {
      const expected = fs.readFileSync(`tests/fixtures/${arg}/rendered.md`, 'utf-8')
      expect(renderedComment).toBe(expected)
    }
  }
)
