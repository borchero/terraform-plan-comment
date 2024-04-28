import { defineConfig } from 'tsup'

export default defineConfig({
  entry: {
    index: 'src/index.ts'
  },
  dts: false,
  clean: true,
  target: 'es2020',
  format: ['cjs'],
  sourcemap: true,
  minify: false,
  noExternal: ['@actions/core', '@actions/exec', '@actions/github', 'semver', 'zod']
})
