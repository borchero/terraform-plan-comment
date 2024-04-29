terraform {
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
  count    = 2
  filename = "../test.txt"
  content  = "test-${var.test}"
}
