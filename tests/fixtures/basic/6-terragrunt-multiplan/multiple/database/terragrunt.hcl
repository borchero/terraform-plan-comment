
include "root" {
  path = find_in_parent_folders("root.hcl")
}

dependency "cache" {
  config_path = "../cache"

  mock_outputs = {
    cache_output = "mock-cache"
  }
}


terraform {
  source = "${path_relative_from_include("root")}//modules/database"
}
