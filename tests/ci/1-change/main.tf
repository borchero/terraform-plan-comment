terraform {
  required_providers {
    local = {
      source = "hashicorp/local"
    }
  }
}

variable "test" {
  default   = 40
  sensitive = true
}

resource "local_file" "test" {
  count    = 1
  filename = "../test.txt"
  content  = "test-${var.test}"
}

resource "local_file" "another" {
  filename = "../another.txt"
  content  = "Hello terraform-plan-comment!"
}
