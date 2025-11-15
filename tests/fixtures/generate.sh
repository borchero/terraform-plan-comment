#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )

function run_plan {
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
    run_plan
    popd
}

function run_step {
    pushd $1
    run_plan
    run_apply
    popd
}

find $SCRIPT_DIR -name '*.json' -exec rm -f {} \+
find $SCRIPT_DIR -name '*.txt' -exec rm -f {} \+

run_step "$SCRIPT_DIR/basic/0-create"
run_step "$SCRIPT_DIR/basic/1-modify"
run_step "$SCRIPT_DIR/basic/2-delete"
run_step "$SCRIPT_DIR/basic/3-remove"
run_step "$SCRIPT_DIR/basic/4-empty"

run_step_without_apply "$SCRIPT_DIR/ephemeral/0-create"

find $SCRIPT_DIR -name '.tfstate*' -exec rm -f {} \+
