import * as fs from 'fs'
import { parsePlanfileJSON } from '../src/planfile'

test.each([
  'basic/0-create',
  'basic/1-modify',
  'basic/2-delete',
  'basic/3-remove',
  'basic/4-empty',
  'ephemeral/0-create'
])('parse-successful', (arg) => {
  const data = JSON.parse(fs.readFileSync(`tests/fixtures/${arg}/plan.json`, 'utf-8'))
  parsePlanfileJSON(data)
})
