#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )

function run_plan_terraform {
    mkdir -p .terraform
    terraform init
    terraform plan -out .terraform/planfile
    terraform show -json .terraform/planfile | jq 'del(.timestamp)' > plan.json
    terraform show -no-color .terraform/planfile > plan.txt
}

function run_apply {
    terraform apply .terraform/planfile
}

function run_step_without_apply {
    pushd $1
    run_plan_terraform
    popd
}

function run_step_terraform {
    pushd $1
    run_plan_terraform
    run_apply
    popd
}

function run_step_terragrunt {
    pushd $1
    mkdir -p .terraform
    terragrunt init --all -reconfigure
    terragrunt plan --all -out .terraform/planfile --summary-disable
    # we need to replace "timestamp": "2025-01-01T00:00:00Z" for a repeatable value.
    # Since timestamp is not a relevant field, we replace with empty value using sed command
    terragrunt show --all -json .terraform/planfile --summary-disable | sed -E 's/"timestamp": *"[^"]*"/"timestamp": ""/' > plan.json
    terragrunt show --all -no-color .terraform/planfile --log-custom-format '%msg(path=relative)' --summary-disable > plan.txt
    terragrunt apply --all --non-interactive --summary-disable .terraform/planfile
    terragrunt destroy --all --non-interactive # make sure nothing is left over after test execution
    popd
}

find $SCRIPT_DIR -name '*.json' -exec rm -f {} \+
find $SCRIPT_DIR -name '*.txt' -exec rm -f {} \+

run_step_terraform "$SCRIPT_DIR/basic/0-create"
run_step_terraform "$SCRIPT_DIR/basic/1-modify"
run_step_terraform "$SCRIPT_DIR/basic/2-delete"
run_step_terraform "$SCRIPT_DIR/basic/3-remove"
run_step_terraform "$SCRIPT_DIR/basic/4-empty"
run_step_terragrunt "$SCRIPT_DIR/basic/5-terragrunt"
run_step_terragrunt "$SCRIPT_DIR/basic/6-terragrunt-multiplan"

run_step_without_apply "$SCRIPT_DIR/ephemeral/0-create"

find $SCRIPT_DIR -name '.tfstate*' -exec rm -f {} \+
find $SCRIPT_DIR -name '.terraform.lock.hcl' -exec rm -f {} \+
find $SCRIPT_DIR -name '.terragrunt-cache' -exec rm -rf {} \+
find $SCRIPT_DIR -name '.terraform' -exec rm -rf {} \+
find $SCRIPT_DIR -name '.terraformrc' -exec rm -rf {} \+
