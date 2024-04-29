# terraform-plan-comment

GitHub Action to post the output of `terraform plan` to a PR comment.

## Features

- Generate a "markdown-native" representation of the plan including foldable sections and coloring
- Post the plan to pull requests as a "sticky comment"
- Use with or without the Terraform wrapper script provided by
  [hashicorp/setup-terraform](https://github.com/hashicorp/setup-terraform)

## Usage

```yaml
- name: Setup terraform
  uses: hashicorp/setup-terraform@v3
- name: Initialize
  run: terraform init
- name: Plan
  run: terraform plan -out .planfile
- name: Post PR comment
  uses: borchero/terraform-plan-comment@v1
  with:
    token: ${{ github.token }}
    planfile: .planfile
```

### Example Comments

<details><summary><b>Collapsed</b></summary>

<img width="916" alt="Screenshot 2024-04-30 at 00 07 36" src="https://github.com/borchero/terraform-plan-comment/assets/22455425/b6d0e64c-1c9c-42b8-8060-c096922baa0a">

</details>

<details><summary><b>Expanded</b></summary>

<img width="699" alt="Screenshot 2024-04-30 at 00 08 22" src="https://github.com/borchero/terraform-plan-comment/assets/22455425/c91c319a-276d-4d2d-98a7-52bd24b64d4c">

</details>

## Parameters

This action provides a few input parameters that allow for customization:

### `token` (required)

Required input parameter to access the GitHub API for posting a pull request comment. Can be provided as
`${{ github.token }}`, `${{ env.GITHUB_TOKEN }}` or some personal access token with appropriate permissions.

If using the workflow-provided token, make sure that your workflow/job has write-permissions to pull requests.

### `planfile` (required)

The path to the planfile generated by `terraform plan` which holds the information about which changes ought to be
applied.

### `terraform-cmd`

The command to execute to call the Terraform binary. Defaults to `terraform`. You likely don't need to augment this
unless `terraform` cannot be found in the `PATH`.

### `working-directory`

The directory where the Terraform binary ought to be called. Defaults to `$GITHUB_WORKSPACE` and _must_ be specified if
`terraform init` has been run in a different directory. Should be specified relative to `$GITHUB_WORKSPACE`.

> [!IMPORTANT] > `planfile` must be specified relative to the working directory.

### `id`

A custom identifier for the Terraform execution. This allows to distinguish multiple Terraform runs: each sticky pull
request comment is tied to an ID.
