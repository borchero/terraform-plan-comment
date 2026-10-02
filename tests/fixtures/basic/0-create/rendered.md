## 📝 Terraform Plan

**→ Resource Changes: 3 to create, 0 to update, 0 to re-create, 0 to delete, 0 ephemeral.**

### ✨ Create

<details><summary><code>local_file.test</code></summary>

```diff
+ content              = (sensitive value)
+ content_base64sha256 = (known after apply)
+ content_base64sha512 = (known after apply)
+ content_md5          = (known after apply)
+ content_sha1         = (known after apply)
+ content_sha256       = (known after apply)
+ content_sha512       = (known after apply)
+ directory_permission = "0777"
+ file_permission      = "0777"
+ filename             = "../test.txt"
+ id                   = (known after apply)
```

</details>

<details><summary><code>local_file.test2</code></summary>

```diff
+ content              = "foobar"
+ content_base64sha256 = (known after apply)
+ content_base64sha512 = (known after apply)
+ content_md5          = (known after apply)
+ content_sha1         = (known after apply)
+ content_sha256       = (known after apply)
+ content_sha512       = (known after apply)
+ directory_permission = "0777"
+ file_permission      = "0777"
+ filename             = "../test2.txt"
+ id                   = (known after apply)
```

</details>

<details><summary><code>local_file.test3</code></summary>

```diff
+ content              = <<-EOT
      normal line
        - line with hyphen
          + line with plus sign
      normal line
        - line with hyphen
          + line with plus sign
  EOT
+ content_base64sha256 = (known after apply)
+ content_base64sha512 = (known after apply)
+ content_md5          = (known after apply)
+ content_sha1         = (known after apply)
+ content_sha256       = (known after apply)
+ content_sha512       = (known after apply)
+ directory_permission = "0777"
+ file_permission      = "0777"
+ filename             = "../test3.txt"
+ id                   = (known after apply)
```

</details>