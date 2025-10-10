
include "root" {
  path = find_in_parent_folders()
}

terraform {
  source = "${path_relative_from_include("root")}//modules/cache"
}
