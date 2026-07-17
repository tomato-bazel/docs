---
title: "Overview"
module: "rules_fastverk_plugin"
---

The portable Bazel macro for building a **fastverk console plugin** backend.

`fastverk_plugin` (in [`//plugin:defs.bzl`](https://github.com/tomato-bazel/rules_fastverk_plugin/blob/main/plugin/defs.bzl)) emits a plugin's full
target set from one call — a `rust_library` + `rust_binary` + `rust_test`, an
optional proto `cargo_build_script`, and an OCI service image — the same shape
botnoc's `services/*` plugins use, but callable from **any standalone module**.

## Why this module exists

The macro was botnoc-internal and not portable: it loaded botnoc's `@crates`
universe and hardcoded `//crates/fastverk-plugin-server` / `//crates/fastverk-layout`
labels (bare labels resolve in the *caller's* repo), and those two runtime crates
can't be shared as Bazel `rust_library` labels across an isolated `crate_universe`
boundary without duplicate tonic/tokio symbols.

The fix: the macro takes the caller's crate deps as **arguments** (`deps` /
`build_deps` = the caller's own `all_crate_deps`), and the shared HTTP facade
(`fastverk-plugin-server`) is consumed as a **cargo dep** in the caller's
`Cargo.toml` — so it resolves in the caller's single crate universe.

## Usage

```python
# MODULE.bazel
bazel_dep(name = "rules_fastverk_plugin", version = "0.0.1")

# services/<name>/BUILD.bazel
load("@rules_fastverk_plugin//plugin:defs.bzl", "fastverk_plugin")
load("@crates//:defs.bzl", "all_crate_deps")

fastverk_plugin(
    name = "spec",
    deps = all_crate_deps(normal = True),   # must include the fastverk-plugin-server cargo dep
    build_deps = all_crate_deps(build = True),
    proto_data = ["//proto/spec/v1:spec.proto"],
    panels = "//services/spec/ui:panels",
    exposed_ports = ["8080/tcp"],
    image_repository = "ghcr.io/fastverk/spec-server",   # required
)
```

botnoc's `//tools/plugin:defs.bzl` is a thin shim over this macro
(`crate_prefix = "botnoc"`) so its six existing plugins build unchanged.

Also exports [`rust_service_image`](https://github.com/tomato-bazel/rules_fastverk_plugin/blob/main/oci/defs.bzl) (`//oci:defs.bzl`) + a
distroless/cc base (`//oci:base_image`).
