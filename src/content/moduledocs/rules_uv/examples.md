---
title: "Usage"
module: "rules_uv"
---

Real usage, taken from the module's `examples/`.

### examples/multiplatform/BUILD.bazel

```starlark
load("@multipip//:requirements.bzl", "requirement")
load("@rules_python//python:defs.bzl", "py_test")

py_test(
    name = "multiplatform_test",
    srcs = ["multiplatform_test.py"],
    deps = [
        requirement("idna"),         # pure wheel: single repo, no select
        requirement("markupsafe"),   # native wheel: per-platform select
        requirement("six"),          # pure-python sdist-only: single repo via host install (v0.6)
    ],
)
```

### examples/smoke/BUILD.bazel

```starlark
load("@pip//:requirements.bzl", "group", "requirement")
load("@rules_python//python:defs.bzl", "py_test")
load("@rules_uv//uv:defs.bzl", "uv_run")

py_test(
    name = "smoke_test",
    srcs = ["smoke_test.py"],
    deps = [
        # Base targets.
        requirement("idna"),
        requirement("markupsafe"),
        # Per-extra target: certifi's synthetic `bundle` extra
        # re-exports `:pkg` and adds a dep on idna. We pull this
        # instead of plain `requirement("certifi")` to exercise
        # the `pkg[extra]` resolution path.
        requirement("certifi[bundle]"),
    # PEP 735 dependency-group expansion (v0.7). The smoke lockfile's
    # editable root carries `[package.dev-dependencies] dev = [{name = "iniconfig"}]`
    # — `group("dev")` returns `[Label("@pip//:iniconfig")]`.
    ] + group("dev"),
)

# Smoke target for `uv_run` — `bazel run //examples/smoke:uv_version`
# prints the uv version (via the sandbox-escaping wrapper).
uv_run(
    name = "uv_version",
    subcommand = "--version",
)
```
