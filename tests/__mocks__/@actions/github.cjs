'use strict'

module.exports = {
  context: {
    actor: '',
    eventName: '',
    payload: {},
    repo: { owner: '', repo: '' },
    ref: '',
    sha: ''
  },
  getOctokit: jest.fn()
}
