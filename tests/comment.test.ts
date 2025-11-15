import { deleteComment } from '../src/comment'

describe('deleteComment', () => {
  it('should be exported and have correct signature', () => {
    expect(typeof deleteComment).toBe('function')
    expect(deleteComment.length).toBe(1) // Should accept one parameter object
  })
})
