---
title: "Overview"
module: "rules_cc_host"
---

Hermetic host LLVM/clang toolchain — one pinned clang for every
fastverk/aion repo (no AST/codegen drift).

## Status: v0.1.0

A tiny module whose `MODULE.bazel` pins `toolchains_llvm 1.7.0` +
`llvm_version = "18.1.8"` and registers `@llvm_toolchain//:all`. A
`register_toolchains` call in a dependency module IS honored by the
root build, so any consumer that `bazel_dep`s this module gets
hermetic clang 18.1.8 as its host C++ toolchain. Extracted from
polyglot's inline LLVM setup so the pin lives in exactly one place.

## Install

`.bazelrc`:

```
common --registry=https://registry.fastverk.com/
common --registry=https://bcr.bazel.build/

# Make bazel's gcc-autodetect (`local_config_cc`) a no-op stub instead
# of failing in no-gcc environments (e.g. CI images). This is a
# repo_env and therefore CANNOT be carried by a dependency module — each
# consumer must add it to its own .bazelrc.
common --repo_env=BAZEL_DO_NOT_DETECT_CPP_TOOLCHAIN=1
```

`MODULE.bazel`:

```python
bazel_dep(name = "rules_cc_host", version = "0.1.0")
```

That's it. No extension wiring, no `use_repo` — this module already
calls `register_toolchains("@llvm_toolchain//:all")` internally, so the
pinned clang becomes your host C++ toolchain automatically.

## Why the repo_env note matters

`BAZEL_DO_NOT_DETECT_CPP_TOOLCHAIN=1` turns bazel's built-in
`local_config_cc` C++ autodetection into a no-op stub. Without it, a
build in a no-gcc/no-Xcode environment (typical CI images) fails during
toolchain autodetection *before* the hermetic LLVM toolchain is even
selected. Because it is a `repo_env` (it controls how the
`local_config_cc` repository rule runs), it cannot be set from a
dependency module's `MODULE.bazel`; it must live in the consuming
repo's `.bazelrc`.
