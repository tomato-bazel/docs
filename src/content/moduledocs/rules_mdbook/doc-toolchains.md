---
title: "toolchains"
module: "rules_mdbook"
---

<!-- Generated with Stardoc: http://skydoc.bazel.build -->

Toolchain rule for rules_mdbook.

`mdbook_toolchain` wraps a single mdbook binary as a Bazel toolchain.
Consumers (the `mdbook_book` and `mdbook_serve` rules) resolve mdbook
through `@rules_mdbook//mdbook:toolchain_type`, so users can register
custom mdbook binaries (locally-built fork, alternate version, …) via
`register_toolchains(...)` without modifying rule attributes.

The module extension at `@rules_mdbook//mdbook:extensions.bzl` generates
a default toolchain (`@mdbook//:mdbook_toolchain_def`) wrapping the
prebuilt binary. Users register it from their `MODULE.bazel`:

    register_toolchains("@mdbook//:mdbook_toolchain_def")

<a id="mdbook_toolchain"></a>

### mdbook_toolchain

<pre>
load("@rules_mdbook//mdbook:toolchains.bzl", "mdbook_toolchain")

mdbook_toolchain(<a href="#mdbook_toolchain-name">name</a>, <a href="#mdbook_toolchain-mdbook">mdbook</a>)
</pre>

Declare an mdbook binary as a Bazel toolchain.

**ATTRIBUTES**


| Name  | Description | Type | Mandatory | Default |
| :------------- | :------------- | :------------- | :------------- | :------------- |
| <a id="mdbook_toolchain-name"></a>name |  A unique name for this target.   | <a href="https://bazel.build/concepts/labels#target-names">Name</a> | required |  |
| <a id="mdbook_toolchain-mdbook"></a>mdbook |  Path to the mdbook executable.   | <a href="https://bazel.build/concepts/labels">Label</a> | required |  |


<a id="MdbookToolchainInfo"></a>

### MdbookToolchainInfo

<pre>
load("@rules_mdbook//mdbook:toolchains.bzl", "MdbookToolchainInfo")

MdbookToolchainInfo(<a href="#MdbookToolchainInfo-mdbook">mdbook</a>)
</pre>

The mdbook binary, resolved via a toolchain.

**FIELDS**

| Name  | Description |
| :------------- | :------------- |
| <a id="MdbookToolchainInfo-mdbook"></a>mdbook |  File: the mdbook executable.    |
