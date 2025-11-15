terraform {
  backend "local" {
    path = "../.tfstate"
  }

  required_providers {
    random = {
      source = "hashicorp/random"
    }
    null = {
      source = "hashicorp/null"
    }
  }
}

ephemeral "random_password" "test" {
  length  = 16
  special = true
}

resource "null_resource" "run_command" {
  provisioner "local-exec" {
    command = "echo 'Test: ${ephemeral.random_password.test.result}'"
  }
}
