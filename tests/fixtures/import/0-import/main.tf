terraform {
  backend "local" {
    path = "../.tfstate"
  }
}

resource "terraform_data" "test" {}

import {
  to = terraform_data.test
  id = "imported-id"
}
