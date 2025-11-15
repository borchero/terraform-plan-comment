import { renderMarkdown } from '../src/comment'
import type { RenderedPlan } from '../src/render'

describe('renderMarkdown', () => {
  it('should render markdown for empty plan', () => {
    const plan: RenderedPlan = {}
    const markdown = renderMarkdown({
      plan,
      header: '📝 Terraform Plan',
      includeFooter: false
    })

    expect(markdown).toContain('## 📝 Terraform Plan')
    expect(markdown).toContain('**→ No Resource Changes!**')
  })

  it('should render markdown for plan with changes', () => {
    const plan: RenderedPlan = {
      createdResources: {
        'aws_instance.example': '```diff\n+ resource\n```'
      },
      deletedResources: {
        'aws_s3_bucket.old': '```diff\n- resource\n```'
      }
    }
    const markdown = renderMarkdown({
      plan,
      header: '📝 Terraform Plan',
      includeFooter: false
    })

    expect(markdown).toContain('## 📝 Terraform Plan')
    expect(markdown).toContain('**→ Resource Changes: 1 to create, 0 to update, 0 to re-create, 1 to delete.**')
    expect(markdown).toContain('### ✨ Create')
    expect(markdown).toContain('### 🗑️ Delete')
    expect(markdown).toContain('aws_instance.example')
    expect(markdown).toContain('aws_s3_bucket.old')
  })
})
