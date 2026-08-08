import { chunkComment, renderMarkdown } from '../src/comment'
import type { RenderedPlan } from '../src/render'

describe('chunkComment', () => {
  const header = '## Terraform Plan'

  test('small content is not chunked', () => {
    const content = 'small plan content'
    const chunks = chunkComment(content, header, 100)
    expect(chunks).toEqual([content])
  })

  test('chunks content by </details> if possible', () => {
    const content = `${header}\n\nsome intro\n\n<details><summary>Resource 1</summary>\n\nContent 1\n\n</details>\n\n<details><summary>Resource 2</summary>\n\nContent 2\n\n</details>`
    // Max chunk size chosen to force split after the first </details>
    const maxChunkSize = 150
    const chunks = chunkComment(content, header, maxChunkSize)

    expect(chunks).toHaveLength(2)
    expect(chunks[0]).toBe('## Terraform Plan (Part 1)\n\nsome intro\n\n<details><summary>Resource 1</summary>\n\nContent 1\n\n</details>\n\n*(continued in next comment)*')
    expect(chunks[1]).toBe('## Terraform Plan (Part 2)\n\n<details><summary>Resource 2</summary>\n\nContent 2\n\n</details>')
  })

  test('chunks content by \\n\\n if no </details> is present', () => {
    const content = 'H\n\nLine 1\n\nLine 2\n\nLine 3\n\nLine 4\n\nLine 5\n\nLine 6\n\nLine 7'
    const chunks = chunkComment(content, 'H', 53)

    expect(chunks).toHaveLength(3)
    expect(chunks[0]).toBe('H (Part 1)\n\nLine 1\n\n*(continued in next comment)*')
    expect(chunks[1]).toBe('H (Part 2)\n\nLine 2\n\n*(continued in next comment)*')
    expect(chunks[2]).toBe('H (Part 3)\n\nLine 3\n\nLine 4\n\nLine 5\n\nLine 6\n\nLine 7')
  })

  test('hard splits if no suitable separator is found', () => {
    const content = 'H' + 'a'.repeat(80)
    const chunks = chunkComment(content, 'H', 58)

    expect(chunks).toHaveLength(4)
    expect(chunks[0]).toBe('H (Part 1)' + 'a'.repeat(17) + '\n\n*(continued in next comment)*')
    expect(chunks[1]).toBe('H (Part 2)\n\n' + 'a'.repeat(15) + '\n\n*(continued in next comment)*')
    expect(chunks[2]).toBe('H (Part 3)\n\n' + 'a'.repeat(15) + '\n\n*(continued in next comment)*')
    expect(chunks[3]).toBe('H (Part 4)\n\n' + 'a'.repeat(33))
  })

  test('chunks real long body from 7-create-hundreds fixture', () => {
    const fs = require('fs')
    const path = require('path')
    const content = fs.readFileSync(path.join(__dirname, 'fixtures/basic/7-create-hundreds/rendered.md'), 'utf-8')
    const chunks = chunkComment(content, header, 65000)
    expect(chunks.length).toBe(3)
    console.log(chunks[0])
    for (const chunk of chunks) {
      expect(chunk.length).toBeLessThanOrEqual(65000)
    }
  })
})

describe('renderMarkdown state changes', () => {
  function render(plan: RenderedPlan): string {
    return renderMarkdown({
      plans: [plan],
      header: '📝 Terraform Plan',
      includeFooter: false,
      expandDetails: false
    })
  }

  test('moves are listed in order of the address they moved from', () => {
    const body = render({
      movedResources: {
        'module.z.local_file.x': 'module.old_b.local_file.x',
        'module.a.local_file.y': 'module.old_a.local_file.y'
      }
    })
    expect(body).toContain(
      '- `module.old_a.local_file.y` → `module.a.local_file.y`\n\n' +
        '- `module.old_b.local_file.x` → `module.z.local_file.x`'
    )
  })

  test('the summary omits state changes when there are none', () => {
    expect(render({ forgottenResources: ['local_file.a'] })).toContain('State Changes:')
    expect(render({ createdResources: { 'local_file.a': 'diff' } })).not.toContain('State Changes:')
  })
})
