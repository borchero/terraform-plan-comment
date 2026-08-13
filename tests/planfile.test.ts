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

test('parse import without id', () => {
  const data = JSON.parse(
    JSON.stringify({
      format_version: '1.2',
      resource_changes: [
        {
          address: 'test_resource.example',
          change: {
            actions: ['update'],
            importing: {}
          }
        }
      ]
    })
  )
  parsePlanfileJSON(data)
})
