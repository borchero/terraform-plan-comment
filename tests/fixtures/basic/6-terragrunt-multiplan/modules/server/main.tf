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

resource "local_file" "server" {
  filename = "../test.txt"
  content  = "server-${var.test}"
}
