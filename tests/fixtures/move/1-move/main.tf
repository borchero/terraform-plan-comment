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

resource "local_file" "after" {
  filename = "../test-move.txt"
  content  = "foobar"
}

moved {
  from = local_file.before
  to   = local_file.after
}
