---
title: "Usage"
module: "rules_eslint"
---

Real usage, taken from the module's `examples/`.

### examples/smoke/BUILD.bazel

```starlark
load("@rules_eslint//eslint:defs.bzl", "eslint_test")
load("@smoke_npm//:defs.bzl", "npm_link_all_packages")
load("@smoke_npm//examples/smoke:eslint/package_json.bzl", eslint_bin = "bin")

package(default_visibility = ["//visibility:public"])

npm_link_all_packages(name = "node_modules")

exports_files(["pnpm-lock.yaml"])

# The consumer's own @npm eslint binary — what a real workspace passes to
# `eslint_test`. Here it comes from the pinned smoke npm workspace.
eslint_bin.eslint_binary(name = "eslint_cli")

# Release gate: a real `eslint_test` over a clean source, exercising the
# macro (binary + config + srcs → runfiles → eslint) end-to-end. Runs in
# `bazel test //...` on every CI OS.
eslint_test(
    name = "smoke_test",
    srcs = ["clean.js"],
    config = "eslint.config.mjs",
    eslint_bin = ":eslint_cli",
)
```
