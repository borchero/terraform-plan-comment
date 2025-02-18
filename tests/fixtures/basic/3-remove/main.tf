terraform {
  required_providers {
    local = {
      source = "hashicorp/local"
    }
  }
}

removed {
  from = local_file.test2

  lifecycle {
    destroy = false
  }
}
