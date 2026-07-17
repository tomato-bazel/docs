---
title: "Usage"
module: "rules_cc_cross"
---

Real usage, taken from the module's `examples/`.

### examples/aarch64_hello/BUILD.bazel

```starlark
"""Smoke test: cross-compile a bare-metal aarch64 hello.

`bazel build //examples/aarch64_hello:hello --platforms=:aarch64_none_elf`
should produce an ELF that:

    file bazel-bin/examples/aarch64_hello/hello

reports as `ELF 64-bit LSB executable, ARM aarch64`.
"""

load("@platforms//host:constraints.bzl", "HOST_CONSTRAINTS")

package(default_visibility = ["//visibility:public"])

platform(
    name = "aarch64_none_elf",
    constraint_values = [
        "@platforms//cpu:aarch64",
        "@platforms//os:none",
    ],
)

cc_binary(
    name = "hello",
    srcs = ["hello.c"],
    # seL4-style: leave allocation, entry point, and the linker
    # script to the caller. This binary won't run on a real OS;
    # it's the cross-compile smoke test.
    linkopts = [
        "-Wl,--entry=_start",
        "-Wl,--no-warn-rwx-segments",
    ],
    target_compatible_with = [
        "@platforms//cpu:aarch64",
        "@platforms//os:none",
    ],
)
```
