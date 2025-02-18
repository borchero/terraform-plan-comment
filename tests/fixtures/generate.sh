#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )

function run_step {
    pushd $1
    mkdir -p .terraform
    terraform init
    terraform plan -out .terraform/planfile -state ../.tfstate
    terraform show -json .terraform/planfile | jq 'del(.timestamp)' > plan.json
    terraform show -no-color .terraform/planfile > plan.txt
    terraform apply -state ../.tfstate .terraform/planfile
    popd
}

find $SCRIPT_DIR -name '*.json' -exec rm -f {} \+
find $SCRIPT_DIR -name '*.txt' -exec rm -f {} \+

run_step "$SCRIPT_DIR/basic/0-create"
run_step "$SCRIPT_DIR/basic/1-modify"
run_step "$SCRIPT_DIR/basic/2-delete"
run_step "$SCRIPT_DIR/basic/3-remove"
run_step "$SCRIPT_DIR/basic/4-empty"

find $SCRIPT_DIR -name '.tfstate*' -exec rm -f {} \+
