---
title: "Usage"
module: "rules_aip"
---

Real usage, taken from the module's `examples/`.

### examples/BUILD.bazel

```starlark
load("//aip:defs.bzl", "aip_proto_library", "aip_proto_lint")

# Idiomatic AIP service: proto_library + the standard googleapis AIP deps.
aip_proto_library(
    name = "bookstore_proto",
    srcs = ["proto/bookstore/v1/bookstore.proto"],
    # Make the import path `bookstore/v1/bookstore.proto` match `package bookstore.v1`.
    strip_import_prefix = "/examples/proto",
    visibility = ["//visibility:public"],
)

# `bazel test //examples:bookstore_aip_lint` runs the AIP linter over it.
aip_proto_lint(
    name = "bookstore_aip_lint",
    proto = ":bookstore_proto",
)
```
