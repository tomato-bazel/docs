---
title: "toolchains"
module: "rules_bun"
---

<!-- Generated with Stardoc: http://skydoc.bazel.build -->

Toolchain rule for rules_bun.

`bun_toolchain` wraps a single Bun binary as a Bazel toolchain.
Consumers (the `bun_test` and `bun_run` rules) resolve Bun through
`@rules_bun//bun:toolchain_type`, so users can register custom Bun
binaries (locally-built fork, alternate version, baseline-CPU
variant) via `register_toolchains(...)` without modifying rule
attrs.

The module extension at `@rules_bun//bun:extensions.bzl` generates a
default toolchain (`@bun//:bun_toolchain_def`) wrapping the prebuilt
binary. Users register it from `MODULE.bazel`:

    register_toolchains("@bun//:bun_toolchain_def")

<a id="bun_toolchain"></a>

## bun_toolchain

<pre>
load("@rules_bun//bun:toolchains.bzl", "bun_toolchain")

bun_toolchain(<a href="#bun_toolchain-name">name</a>, <a href="#bun_toolchain-bun">bun</a>)
</pre>

Declare a Bun binary as a Bazel toolchain.

**ATTRIBUTES**


| Name  | Description | Type | Mandatory | Default |
| :------------- | :------------- | :------------- | :------------- | :------------- |
| <a id="bun_toolchain-name"></a>name |  A unique name for this target.   | <a href="https://bazel.build/concepts/labels#target-names">Name</a> | required |  |
| <a id="bun_toolchain-bun"></a>bun |  Path to the Bun executable.   | <a href="https://bazel.build/concepts/labels">Label</a> | required |  |


<a id="BunToolchainInfo"></a>

## BunToolchainInfo

<pre>
load("@rules_bun//bun:toolchains.bzl", "BunToolchainInfo")

BunToolchainInfo(<a href="#BunToolchainInfo-bun">bun</a>)
</pre>

The Bun binary, resolved via a toolchain.

**FIELDS**

| Name  | Description |
| :------------- | :------------- |
| <a id="BunToolchainInfo-bun"></a>bun |  File: the bun executable.    |
