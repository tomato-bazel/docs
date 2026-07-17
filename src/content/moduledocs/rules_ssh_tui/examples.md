---
title: "Usage"
module: "rules_ssh_tui"
---

Real usage, taken from the module's `examples/`.

### examples/hello-tui/BUILD.bazel

```starlark
"""Smoke for `ssh_tui_image`: wraps `hello-tui` as the login binary.

Build with `bazel build //examples/hello-tui:hello-image`. The image
contains both ssh-tui-server + hello-tui; SSH into it with the
authorized_keys provided at runtime.
"""

load("@rules_rust//rust:defs.bzl", "rust_binary")
load("@rules_ssh_tui//ssh_tui:defs.bzl", "ssh_tui_image")

package(default_visibility = ["//visibility:public"])

rust_binary(
    name = "hello-tui",
    srcs = ["src/main.rs"],
    edition = "2021",
)

ssh_tui_image(
    name = "hello-image",
    login_binary = ":hello-tui",
    login_args = [
        "--example-flag",
        "demonstration",
    ],
    listen_port = 2222,
    repository = "ghcr.io/fastverk/rules_ssh_tui-hello",
)
```
