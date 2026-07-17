---
title: "Changelog"
module: "rules_cc_host"
---

All notable changes to rules_cc_host. The format is loosely
[Keep a Changelog](https://keepachangelog.com/) — version headers
mirror the published bazel-registry entries.

### 0.1.0 — initial

- Pins the hermetic host LLVM/clang toolchain
  (`toolchains_llvm 1.7.0`, `llvm_version = "18.1.8"`) and registers
  `@llvm_toolchain//:all`.
- Any consumer that `bazel_dep`s this module inherits clang 18.1.8 as
  its host C++ toolchain, so every fastverk/aion repo shares ONE clang
  version (no AST/codegen drift).
- Extracted from polyglot's inline `MODULE.bazel` LLVM setup.
