terraform {
  required_providers {
    random = {
      source = "hashicorp/random"
    }
  }
}

ephemeral "random_password" "test" {
  length  = 16
  special = true
}
