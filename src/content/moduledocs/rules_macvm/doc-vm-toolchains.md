---
title: "vm_toolchains"
module: "rules_macvm"
---

<!-- Generated with Stardoc: http://skydoc.bazel.build -->

The `vm_provider` rule — declares a VMM backend.

A `vm_provider` target does double duty: it returns `VmProviderInfo`
(so a `vm` can reference it directly via its `provider` attribute) *and*
`platform_common.ToolchainInfo` (so it can be registered for
`//vm:toolchain_type` and resolved automatically by platform). One
target, both wiring styles.

Each fetched/built backend declares one:

    vm_provider(
        name = "vfkit_provider",
        kind = "vfkit",
        vmm = ":vfkit",
        rosetta = True,
        virtiofs = True,
        vsock = True,
        nested = True,
        efi_boot = True,
        linux_boot = True,
    )

    toolchain(
        name = "vfkit_toolchain_def",
        toolchain = ":vfkit_provider",
        toolchain_type = "@rules_macvm//vm:toolchain_type",
    )

<a id="vm_provider"></a>

## vm_provider

<pre>
load("@rules_macvm//vm:toolchains.bzl", "vm_provider")

vm_provider(<a href="#vm_provider-name">name</a>, <a href="#vm_provider-efi_boot">efi_boot</a>, <a href="#vm_provider-kind">kind</a>, <a href="#vm_provider-linux_boot">linux_boot</a>, <a href="#vm_provider-nested">nested</a>, <a href="#vm_provider-rosetta">rosetta</a>, <a href="#vm_provider-virtiofs">virtiofs</a>, <a href="#vm_provider-vmm">vmm</a>, <a href="#vm_provider-vsock">vsock</a>)
</pre>

Declare a VMM backend usable as both a `vm` provider and a registered toolchain.

**ATTRIBUTES**


| Name  | Description | Type | Mandatory | Default |
| :------------- | :------------- | :------------- | :------------- | :------------- |
| <a id="vm_provider-name"></a>name |  A unique name for this target.   | <a href="https://bazel.build/concepts/labels#target-names">Name</a> | required |  |
| <a id="vm_provider-efi_boot"></a>efi_boot |  Backend can EFI-boot a disk image.   | Boolean | optional |  `False`  |
| <a id="vm_provider-kind"></a>kind |  Backend identity; selects the argv translator ("vfkit", "mock", …).   | String | required |  |
| <a id="vm_provider-linux_boot"></a>linux_boot |  Backend can direct-boot a Linux kernel + initrd.   | Boolean | optional |  `False`  |
| <a id="vm_provider-nested"></a>nested |  Backend supports nested virtualization.   | Boolean | optional |  `False`  |
| <a id="vm_provider-rosetta"></a>rosetta |  Backend can expose Rosetta x86-64 translation.   | Boolean | optional |  `False`  |
| <a id="vm_provider-virtiofs"></a>virtiofs |  Backend supports virtio-fs directory shares.   | Boolean | optional |  `False`  |
| <a id="vm_provider-vmm"></a>vmm |  The hypervisor executable target.   | <a href="https://bazel.build/concepts/labels">Label</a> | required |  |
| <a id="vm_provider-vsock"></a>vsock |  Backend supports virtio-vsock.   | Boolean | optional |  `False`  |
