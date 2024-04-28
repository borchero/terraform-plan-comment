terraform {
  required_providers {
    null = {
      source = "hashicorp/null"
    }
  }
}

variable "test" {
  default   = 42
  sensitive = true
}

resource "local_file" "test" {
  filename = "../test.txt"
  content  = "foobar-${var.test}"
}
