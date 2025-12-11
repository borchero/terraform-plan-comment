
include "root" {
  path = find_in_parent_folders("root.hcl")
}

dependency "subnet" {
  config_path = "../database"

  mock_outputs = {
    database_output = "mock-database"
  }
}

terraform {
  source = "${path_relative_from_include("root")}//modules/server"
}
