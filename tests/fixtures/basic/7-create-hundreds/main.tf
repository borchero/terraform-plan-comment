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

resource "local_file" "test" {
  for_each = toset([for i in range(200) : tostring(i)])
  filename = "../test-${each.key}.txt"
  content  = "content-${each.key}"
}
