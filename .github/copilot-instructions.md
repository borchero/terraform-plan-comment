# Copilot Instructions: terraform-plan-comment

## Project Overview

This is a GitHub Action that posts the output of a Terraform plan to a pull request comment. It generates a structured,
markdown-native representation of `terraform plan` changes while preserving all information from the plan output. The
action creates "sticky comments" (updates existing comments rather than creating new ones) and runs as a native
JavaScript action.

## Tech Stack

- **Language**: TypeScript (ES2020, strict mode)
- **Runtime**: Node.js 20 (GitHub Actions native runner)
- **Package Manager**: pnpm
- **Environment Manager**: pixi (for local development with Node.js, pnpm, Terraform, and pre-commit)
- **Build Tool**: tsup (bundles to CommonJS in `dist/index.js`)
- **Testing**: Jest with ts-jest
- **Linting**: ESLint 9 with TypeScript plugin, Standard config, Prettier integration
- **Formatting**: Prettier (single quotes for TS/JS, 99 char limit; double quotes for other files, 119 char limit)
- **Dependencies**:
  - `@actions/core`, `@actions/exec`, `@actions/github` (GitHub Actions SDK)
  - `zod` (schema validation for Terraform planfile JSON)
  - `semver` (version checking)

## Project Structure

```
src/
  index.ts        # Main entry point, orchestrates action workflow
  comment.ts      # GitHub API interaction, creates/updates PR comments
  planfile.ts     # Zod schema for Terraform JSON planfile validation
  render.ts       # Core logic: parses planfile and generates markdown
tests/
  e2e.test.ts           # End-to-end tests using fixture data
  planfile.test.ts      # Unit tests for planfile parsing
  fixtures/
    generate.sh         # Generates test fixtures by running Terraform
    basic/              # Test scenarios: create, modify, delete, remove, empty
  ci/                   # Terraform configs for E2E CI testing
```

**Output**: Bundled to `dist/index.js`

## Development Workflow

### Environment Setup

After the setup instructions have run, prefix all commands with `pixi run` to run them in the correct environment.

### Common Commands

- **Build**: `pixi run pnpm build` - Type checks with tsc, bundles with tsup to `dist/index.js`
- **Test**: `pixi run pnpm test` - Runs Jest unit tests
- **Test with Fixtures**: `pixi run pnpm test:fixtures` - Regenerates fixture data and runs E2E tests (requires
  Terraform)
- **Lint**: `pixi run pnpm lint` - Check TypeScript files
- **Lint Fix**: `pixi run pnpm lint:fix` - Auto-fix linting issues
- **Format**: `pixi run pnpm prettier` - Format all files

### Pre-commit Hooks

This project uses **pre-commit hooks** (.pre-commit-config.yaml). Before committing, simply run
`pixi run pre-commit run -a` to execute all pre-commit hooks. These take care of running all commands necessary for
merging.

## Coding Guidelines

### GitHub Actions Best Practices

- **Use `@actions/core` for logging**: `core.info()`, `core.warning()`, `core.error()`, `core.setFailed()`
- **Group output**: Wrap major operations in `core.group()` for better CI logs
- **Set outputs**: Use `core.setOutput()` for action outputs (e.g., `markdown`, `empty`)
- **Handle inputs**: Use `core.getInput()` and `core.getBooleanInput()` with `required` flag
- **Error handling**: Catch errors in main() and call `core.setFailed()` with error message

## Key Implementation Details

### Terraform Plan Processing

1. **Read planfile** using `terraform show -json <planfile>` (structured data)
2. **Validate schema** with Zod (only supports Terraform format version 1.x)
3. **Get human-readable plan** with `terraform show -no-color <planfile>` (for diff extraction)
4. **Extract changes**: Parse both JSON and text to categorize resources
5. **Format as markdown**: Generate collapsible sections with diff syntax highlighting

### Comment Management

- **Sticky comments**: Searches existing PR comments for matching header, updates if found
- **Header identification**: Uses first line of comment body (e.g., "## 📝 Terraform Plan")
- **Skip conditions**: Can skip empty plans (`skip-empty: true`) or all comments (`skip-comment: true`)

## Testing

### Unit Tests

- Run with `pixi run pnpm test`
- Test planfile parsing and markdown rendering
- Use fixtures in `tests/fixtures/basic/`

### E2E Tests

- `tests/e2e.test.ts` compares rendered output against golden files
- Fixtures include: create, modify, delete, remove (forget), empty scenarios
- **Regenerate fixtures**: `pixi run pnpm test:fixtures` (requires Terraform installed)
- Set `GENERATE_FIXTURE=1` to update golden files

### CI/CD

- **CI workflow**: Runs pre-commit checks and unit tests on all PRs
- **E2E workflow**: Tests action on real Terraform configs in `tests/ci/`
- All workflows use pixi for consistent environments

## Build Process

**Critical**: GitHub Actions requires the built bundle in `dist/index.js` to be committed. This can be achieved by
simply running the pre-commit hooks before committing.
