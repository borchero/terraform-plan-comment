## 📝 Terraform Plan

**→ Resource Changes: 0 to create, 0 to update, 0 to re-create, 2 to delete, 0 ephemeral.**

### 🗑️ Delete

<details><summary><code>local_file.test</code></summary>

```diff
- content              = (sensitive value) -> null
- content_base64sha256 = "y2eIXVRNQ6JeLI7uUlBafe2nthM8VW31OY9EcMW2Tdc=" -> null
- content_base64sha512 = "b6MH8eFrO8x1mqwnv0uG9aa8ss+QndkUgyVvwDL/m440fY5w0PTYhNwzMeOZerMNQqKRu9FdEEcWhvuk+i+r0Q==" -> null
- content_md5          = "8a22bbb35f6d4bae9a525439ff73404e" -> null
- content_sha1         = "ec95e23aec3f635e195cb68d3b8b212ed0ff0da7" -> null
- content_sha256       = "cb67885d544d43a25e2c8eee52505a7deda7b6133c556df5398f4470c5b64dd7" -> null
- content_sha512       = "6fa307f1e16b3bcc759aac27bf4b86f5a6bcb2cf909dd91483256fc032ff9b8e347d8e70d0f4d884dc3331e3997ab30d42a291bbd15d10471686fba4fa2fabd1" -> null
- directory_permission = "0777" -> null
- file_permission      = "0777" -> null
- filename             = "../test.txt" -> null
- id                   = "ec95e23aec3f635e195cb68d3b8b212ed0ff0da7" -> null
```

_→ because local_file.test is not in configuration_

</details>

<details><summary><code>local_file.test3</code></summary>

```diff
- content              = <<-EOT
      just a line
        - just a line with hyphen
          + just a line with plus sign
      normal line
        - line with hyphen
          + line with plus sign
  EOT -> null
- content_base64sha256 = "Mx+Gs6TW3lHl/Y5VDJIkiIJJjN7p/iXCEs45c31OeJs=" -> null
- content_base64sha512 = "OuDyldj6HM5ALb8y0Rj70nAhHTeGsznjS+TT3HGbnH9fA/RCYqbkg4BhjM+n7t/Y98/lR0DXx9AQGzYRQCRgTQ==" -> null
- content_md5          = "180a7f466b6b98c92160513b2341fe67" -> null
- content_sha1         = "5baa9964c6c3c6230ee43fd4c2067c94da04f7c9" -> null
- content_sha256       = "331f86b3a4d6de51e5fd8e550c92248882498cdee9fe25c212ce39737d4e789b" -> null
- content_sha512       = "3ae0f295d8fa1cce402dbf32d118fbd270211d3786b339e34be4d3dc719b9c7f5f03f44262a6e48380618ccfa7eedfd8f7cfe54740d7c7d0101b36114024604d" -> null
- directory_permission = "0777" -> null
- file_permission      = "0777" -> null
- filename             = "../test3.txt" -> null
- id                   = "5baa9964c6c3c6230ee43fd4c2067c94da04f7c9" -> null
```

_→ because local_file.test3 is not in configuration_

</details>