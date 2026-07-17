---
title: "Overview"
module: "rules_aip"
---

Bazel rules for [Google AIP](https://aip.dev) proto linting — a shared toolkit
so repos stop recreating the `api-linter` setup by hand.

Published to [`fastverk/bazel-registry`](https://github.com/fastverk/bazel-registry);
consume via `bazel_dep(name = "rules_aip", version = "0.2.0")`.

## What it replaces

Three repos (hrcrawl, pinax, agora) each carried:
- a copy of `tools/api-linter/` (`go.mod` + `go.sum` + a `BUILD` alias to the Go binary), and
- a hand-rolled `aip_lint` `genrule` inlined per `BUILD`, re-doing the googleapis
  `--proto-path` plumbing and `--disable-rule` flags every time, plus
- repeated `@googleapis//google/api:*` dep lists on every `proto_library`.

`rules_aip` lifts all three into one versioned module.

## API

```python
load("@rules_aip//aip:defs.bzl", "aip_proto_library", "aip_proto_lint", "AIP_LRO_DEPS")

# proto_library + the standard AIP googleapis deps (field_behavior, resource,
# annotations, client). Add the rest via deps / the AIP_* groups.
aip_proto_library(
    name = "library_proto",
    srcs = ["library/v1/library.proto"],
    deps = AIP_LRO_DEPS,                       # long-running operations, when needed
    strip_import_prefix = "/proto",            # make the import path match the package (AIP-191)
)

# A `bazel test` target that AIP-lints it.
aip_proto_lint(
    name = "library_aip_lint",
    proto = ":library_proto",
    disable_rules = ["core::0191::proto-package"],   # only if your layout needs it
)
```

- **`aip_proto_library`** — `proto_library` wrapper bundling `AIP_COMMON_DEPS`.
  Dep-group constants exported: `AIP_COMMON_DEPS`, `AIP_LRO_DEPS`, `AIP_WKT_DEPS`.
- **`aip_proto_lint`** — runs api-linter as a `build_test`. **Hermetic**: it lints
  off the proto_library's transitive `FileDescriptorSet` (`--descriptor-set-in`),
  so you never pass `--proto-path` or pull googleapis sources in by hand. Target
  files are named by their import path, so AIP-191 passes when the layout is
  idiomatic (see the `strip_import_prefix` note).

## Toolchain

The linter is the upstream **prebuilt** api-linter release binary (v2.3.1),
fetched per-platform as a sha256-pinned `http_archive` (no Go toolchain /
build-from-source) and re-exposed as `@rules_aip//tools/api-linter:api-linter`.
It lands in Bazel's downloads cache, so lint runs are offline after the first
fetch. Platforms: darwin/{amd64,arm64}, linux/amd64, windows/amd64.

## Example

`//examples:bookstore_aip_lint` lints the canonical AIP bookstore service
(`examples/proto/bookstore/v1/bookstore.proto`) — a clean copy-paste template for
new services. `bazel test //examples/...`.

## Scope

v0.1 is the AIP toolkit: linter toolchain + lint rule + deps macro. The name is
deliberately broad — protovalidate, buf breaking-change detection, and
AIP→OpenAPI/gateway generation can join later without a rename. Multi-language
stub generation is intentionally out of scope (use `rules_proto_grpc`).

> Verify with `bazel test //examples/...` to confirm api-linter flag behavior in
> your Bazel/toolchain combo. The linter binary itself is a pinned prebuilt, so
> no toolchain/source build is involved.
