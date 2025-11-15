import * as fs from 'fs'
import { parsePlanfileJSON } from '../src/planfile'

test.each([
  'basic/0-create',
  'basic/1-modify',
  'basic/2-delete',
  'basic/5-ephemeral'
])('parse-successful', (arg) => {
  const data = JSON.parse(fs.readFileSync(`tests/fixtures/${arg}/plan.json`, 'utf-8'))
  parsePlanfileJSON(data)
})
