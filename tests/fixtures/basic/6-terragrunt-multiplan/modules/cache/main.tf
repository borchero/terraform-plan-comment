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

resource "local_file" "cache" {
  filename = "../test.txt"
  content  = "cache-${var.test}"
}

output "cache_name" {
  value = local_file.cache.filename
}
