import { chunkComment } from '../src/comment'

describe('chunkComment', () => {
  const header = '## Terraform Plan'

  test('small content is not chunked', () => {
    const content = 'small plan content'
    const chunks = chunkComment(content, header, 100)
    expect(chunks).toEqual([content])
  })

  test('chunks content by </details> if possible', () => {
    const content = 'some intro\n\n<details><summary>Resource 1</summary>\n\nContent 1\n\n</details>\n\n<details><summary>Resource 2</summary>\n\nContent 2\n\n</details>'
    // Max chunk size chosen to force split after the first </details>
    const maxChunkSize = 100
    const chunks = chunkComment(content, header, maxChunkSize)

    expect(chunks).toHaveLength(2)
    expect(chunks[0]).toBe('some intro\n\n<details><summary>Resource 1</summary>\n\nContent 1\n\n</details>')
    expect(chunks[1]).toBe('## Terraform Plan (Part 2)\n\n<details><summary>Resource 2</summary>\n\nContent 2\n\n</details>')
  })

  test('chunks content by \\n\\n if no </details> is present', () => {
    const content = 'Line 1\n\nLine 2\n\nLine 3'
    const chunks = chunkComment(content, 'H', 20)

    expect(chunks).toHaveLength(2)
    expect(chunks[0]).toBe('Line 1\n\nLine 2')
    expect(chunks[1]).toBe('H (Part 2)\n\nLine 3')
  })

  test('hard splits if no suitable separator is found', () => {
    const content = 'a'.repeat(50)
    const chunks = chunkComment(content, 'H', 30)

    expect(chunks).toHaveLength(3)
    expect(chunks[0]).toBe('a'.repeat(30))
    expect(chunks[1]).toBe('H (Part 2)\n\n' + 'a'.repeat(18))
    expect(chunks[2]).toBe('H (Part 3)\n\n' + 'a'.repeat(2))
  })

  test('chunks real long body from 7-create-hundreds fixture', () => {
    const fs = require('fs')
    const path = require('path')
    const content = fs.readFileSync(path.join(__dirname, 'fixtures/basic/7-create-hundreds/rendered.md'), 'utf-8')
    const chunks = chunkComment(content, header, 65000)
    expect(chunks.length).toBeGreaterThan(1)
    console.log(chunks[0])
    for (const chunk of chunks) {
      expect(chunk.length).toBeLessThanOrEqual(65000)
    }
  })
})
