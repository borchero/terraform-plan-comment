terraform {
  backend "local" {
    path = "../.tfstate"
  }

  required_providers {
    local = {
      source = "hashicorp/local"
    }
  }
}

resource "local_file" "before" {
  filename = "../test-move.txt"
  content  = "foobar"
}
