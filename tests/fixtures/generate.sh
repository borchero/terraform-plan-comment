#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )

function run_step_terraform {
    pushd $1
    mkdir -p .terraform
    terraform init
    terraform plan -out .terraform/planfile -state ../.tfstate
    terraform show -json .terraform/planfile | jq 'del(.timestamp)' > plan.json
    terraform show -no-color .terraform/planfile > plan.txt
    terraform apply -state ../.tfstate .terraform/planfile
    popd
}

function run_step_terragrunt {
    pushd $1
    mkdir -p .terraform
    terragrunt init --all
    terragrunt plan --all -out .terraform/planfile -state .tfstate
    terragrunt show --all -json .terraform/planfile > plan.json
    terragrunt show --all -no-color .terraform/planfile --log-custom-format '%msg(path=relative)' > plan.txt
    terragrunt apply --all -state .tfstate .terraform/planfile
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

find $SCRIPT_DIR -name '.tfstate*' -exec rm -f {} \+
find $SCRIPT_DIR -name '.terraform.lock.hcl' -exec rm -f {} \+
find $SCRIPT_DIR -name '.terragrunt-cache' -exec rm -rf {} \+
find $SCRIPT_DIR -name '.terraform' -exec rm -rf {} \+
