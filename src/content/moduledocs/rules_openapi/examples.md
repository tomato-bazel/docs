---
title: "Usage"
module: "rules_openapi"
---

Real usage, taken from the module's `examples/`.

### examples/smoke/BUILD.bazel

```starlark
load("@rules_openapi//rust:defs.bzl", "openapi_rust_client")
load("@rules_rust//rust:defs.bzl", "rust_test")

# A small real OpenAPI 3 spec (Oxide's "keeper" service from
# progenitor's own test suite), fetched via http_file. See
# //openapi/private:extensions.bzl for why we use this instead of
# a canonical petstore.
openapi_rust_client(
    name = "keeper_client",
    spec = "@openapi_keeper_example//file:keeper.json",
)

# Compile-and-import test: pull in the generated `Client` + types,
# verify the public surface exists. No real HTTP — that would need a
# test server — but constructing a Client and referencing the
# generated types fails at build time if the codegen pipeline broke.
rust_test(
    name = "keeper_client_test",
    srcs = ["client_test.rs"],
    edition = "2021",
    deps = [
        ":keeper_client",
        "@openapi_crates//:serde_json",
    ],
)
```

### examples/smoke_go/BUILD.bazel

```starlark
# gazelle:ignore
load("@rules_go//go:def.bzl", "go_test")
load("@rules_openapi//go:defs.bzl", "openapi_go_client")

# Generate a Go client from a small real OpenAPI 3 spec (Oxide's "keeper"
# service from progenitor's test suite — the same fixture the Rust smoke example
# uses). See //openapi/private:extensions.bzl for why we use this over a petstore.
openapi_go_client(
    name = "keeper_client",
    package = "keeper",
    spec = "@openapi_keeper_example//file:keeper.json",
)

# Compile-and-import test: construct the generated Client + reference its public
# surface. No real HTTP (that needs a server), but the whole codegen → go_library
# pipeline fails at build time if anything broke.
go_test(
    name = "keeper_client_test",
    srcs = ["client_test.go"],
    embed = [":keeper_client"],
)
```
