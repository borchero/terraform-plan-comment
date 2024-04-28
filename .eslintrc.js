module.exports = {
  ignorePatterns: ['dist/**'],
  extends: ['standard', 'plugin:@typescript-eslint/recommended', 'plugin:prettier/recommended'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: '2020',
    project: './tsconfig.json'
  },
  plugins: ['@typescript-eslint', 'prettier'],
  rules: {
    'import/order': 'error',
    'no-use-before-define': 'off',
    'n/no-callback-literal': 'off',
    '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/no-use-before-define': 'error',
    '@typescript-eslint/no-floating-promises': [
      'error',
      {
        ignoreVoid: false
      }
    ],
    'prettier/prettier': 'error'
  }
}
