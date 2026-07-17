---
title: "Overview"
module: "rules_cc_cross"
---

Hermetic ARM/RISC-V/x86 cross-compiler toolchains for embedded Bazel
builds (seL4, microkit, bare-metal).

## Status: v0.1.0

Implemented:

- `aarch64-none-elf` via the ARM GNU Toolchain (release `14.2.rel1`).
- Hosts: macOS arm64, macOS x86_64, Linux x86_64, Linux aarch64.
- All tarballs verified against arm.com's published sha256s.
- `cc_toolchain_config` with `-ffreestanding -nostdlib` defaults
  suitable for seL4 / microkit protection domains.
- One smoke example: `examples/aarch64_hello`.

Roadmap:

- 0.2.0 — `riscv64-elf` target (riscv-gnu-toolchain).
- 0.3.0 — `x86_64-elf` target.
- 0.4.0 — newlib-nano / picolibc selectors as feature toggles.

## Install

`.bazelrc`:

```
common --registry=https://registry.fastverk.com/
common --registry=https://bcr.bazel.build/
```

`MODULE.bazel`:

```python
bazel_dep(name = "rules_cc_cross", version = "0.1.0")

cc_cross = use_extension("@rules_cc_cross//cc_cross:extensions.bzl", "cc_cross")
cc_cross.toolchain(target = "aarch64-none-elf", version = "14.2.rel1")
use_repo(cc_cross, "arm_gnu_aarch64_none_elf")

register_toolchains("@arm_gnu_aarch64_none_elf//:all")
```

## Use

Cross-compile any `cc_binary` for bare-metal aarch64:

```python
platform(
    name = "aarch64_none_elf",
    constraint_values = [
        "@platforms//cpu:aarch64",
        "@platforms//os:none",
    ],
)

cc_binary(
    name = "my_pd",
    srcs = ["pd.c"],
    target_compatible_with = [
        "@platforms//cpu:aarch64",
        "@platforms//os:none",
    ],
)
```

```
bazel build //:my_pd --platforms=//:aarch64_none_elf
```

## Layout

```
cc_cross/
├── extensions.bzl              # `cc_cross` module extension
├── defs.bzl                    # public rule re-exports
└── private/
    ├── arm_gnu_toolchain.bzl   # repo rule (download + materialize)
    ├── cc_toolchain_config.bzl # cc_toolchain_config rule
    ├── known_versions.bzl      # (version, host) -> sha256 map
    └── arm_gnu.BUILD.tpl       # BUILD.bazel template
```
