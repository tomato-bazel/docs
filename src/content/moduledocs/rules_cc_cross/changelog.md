---
title: "Changelog"
module: "rules_cc_cross"
---

All notable changes to rules_cc_cross. The format is loosely
[Keep a Changelog](https://keepachangelog.com/) — version headers
mirror the published bazel-registry entries.

### 0.1.0 — pinned checksums

- All four (host, target) ARM GNU Toolchain tarballs now verified
  against arm.com's published sha256s (no more unsigned downloads).

### 0.0.1 — first cut

- `cc_cross` module extension with one tag class: `toolchain(target, version)`.
- `arm_gnu_toolchain` repo rule fetching the ARM GNU Toolchain
  (`aarch64-none-elf`) from developer.arm.com, multi-host
  (macOS arm64/x86_64, Linux x86_64/aarch64).
- `cross_cc_toolchain_config` cc_toolchain_config with
  `-ffreestanding`, `-fno-builtin`, `-nostdlib`, `-Wl,--build-id=none`
  defaults.
- Smoke example: `//examples/aarch64_hello:hello`.
- Known limitations: tarballs unsigned (sha256s empty); only
  aarch64-none-elf wired up; no riscv / x86 yet.
