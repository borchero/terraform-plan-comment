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

resource "local_file" "database" {
  filename = "../test.txt"
  content  = "database-${var.test}"
}

output "database_name" {
  value = local_file.database.filename
}
