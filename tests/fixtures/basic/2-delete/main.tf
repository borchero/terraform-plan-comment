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

resource "local_file" "test2" {
  filename = "../test2.txt"
  content  = "foobar"
}
