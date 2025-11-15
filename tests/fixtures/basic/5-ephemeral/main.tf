terraform {
  required_providers {
    random = {
      source = "hashicorp/random"
    }
  }
}

ephemeral "random_password" "db" {
  length  = 16
  special = true
}
