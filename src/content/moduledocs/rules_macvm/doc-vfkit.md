---
title: "vfkit"
module: "rules_macvm"
---

<!-- Generated with Stardoc: http://skydoc.bazel.build -->

Module extension for the vfkit VMM backend.

Hermetically fetches the pinned, signed universal vfkit binary and emits
`@vfkit//:vfkit` (the binary), `@vfkit//:vfkit_provider` (a
`vm_provider` usable via `vm(provider = ...)`), and
`@vfkit//:vfkit_toolchain_def` (the same provider registered for
`//vm:toolchain_type`, constrained to a macOS exec platform since
Virtualization.framework is macOS-only).

    vfkit = use_extension("@rules_macvm//providers/vfkit:extensions.bzl", "vfkit")
    use_repo(vfkit, "vfkit")
    register_toolchains("@vfkit//:vfkit_toolchain_def")

<a id="vfkit"></a>

## vfkit

<pre>
vfkit = use_extension("@rules_macvm//providers/vfkit:extensions.bzl", "vfkit")
vfkit.toolchain(<a href="#vfkit.toolchain-version">version</a>)
</pre>

Sets up @vfkit: the pinned signed vfkit binary + a vm_provider + a macOS toolchain.


**TAG CLASSES**

<a id="vfkit.toolchain"></a>

### toolchain

**Attributes**

| Name  | Description | Type | Mandatory | Default |
| :------------- | :------------- | :------------- | :------------- | :------------- |
| <a id="vfkit.toolchain-version"></a>version |  Override the vfkit version.   | String | optional |  `""`  |
