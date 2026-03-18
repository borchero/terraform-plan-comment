/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  transformIgnorePatterns: ['node_modules/semver-parser'],
  moduleNameMapper: {
    '^@actions/core$': '<rootDir>/tests/__mocks__/@actions/core.cjs',
    '^@actions/exec$': '<rootDir>/tests/__mocks__/@actions/exec.cjs',
    '^@actions/github$': '<rootDir>/tests/__mocks__/@actions/github.cjs',
    '^@actions/github/lib/utils$': '<rootDir>/tests/__mocks__/@actions/github-utils.cjs'
  }
}
