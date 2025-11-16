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

variable "test" {
  default   = 42
  sensitive = true
}

resource "local_file" "test" {
  filename = "../test.txt"
  content  = "foo-${var.test}"
}

resource "local_file" "test2" {
  filename = "../test2.txt"
  content  = "foobar"
}
