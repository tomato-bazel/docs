---
title: "vm_providers"
module: "rules_macvm"
---

<!-- Generated with Stardoc: http://skydoc.bazel.build -->

Core providers for rules_macvm.

Two providers carry the data the rules pass around:

- `VmProviderInfo` — a VMM backend (vfkit, mock, …): the hypervisor
  binary plus its identity (`kind`) and capability flags. Produced by
  the `vm_provider` rule; resolved by `vm` either through the
  `//vm:toolchain_type` toolchain or an explicit `provider` attribute.

- `VmInfo` — a declared virtual machine: the resolved spec scalars, the
  launcher, and the deterministic argv manifest. Lets other rules
  introspect / depend on a VM without re-deriving its definition.

<a id="VmInfo"></a>

### VmInfo

<pre>
load("@rules_macvm//vm:providers.bzl", "VmInfo")

VmInfo(<a href="#VmInfo-kind">kind</a>, <a href="#VmInfo-cpus">cpus</a>, <a href="#VmInfo-memory_mib">memory_mib</a>, <a href="#VmInfo-launcher">launcher</a>, <a href="#VmInfo-argv_manifest">argv_manifest</a>)
</pre>

A declared virtual machine.

**FIELDS**

| Name  | Description |
| :------------- | :------------- |
| <a id="VmInfo-kind"></a>kind |  String: the provider kind this VM was built for.    |
| <a id="VmInfo-cpus"></a>cpus |  Int: virtual CPU count.    |
| <a id="VmInfo-memory_mib"></a>memory_mib |  Int: RAM in MiB.    |
| <a id="VmInfo-launcher"></a>launcher |  File: the executable that boots the VM (also the rule's DefaultInfo executable).    |
| <a id="VmInfo-argv_manifest"></a>argv_manifest |  File: deterministic, host-independent record of the VMM command line (short_paths, not resolved absolutes). For golden tests and `bazel build`-time inspection.    |


<a id="VmProviderInfo"></a>

### VmProviderInfo

<pre>
load("@rules_macvm//vm:providers.bzl", "VmProviderInfo")

VmProviderInfo(<a href="#VmProviderInfo-kind">kind</a>, <a href="#VmProviderInfo-vmm">vmm</a>, <a href="#VmProviderInfo-supports">supports</a>)
</pre>

A VMM backend that can launch a `vm`.

**FIELDS**

| Name  | Description |
| :------------- | :------------- |
| <a id="VmProviderInfo-kind"></a>kind |  String: backend identity (e.g. "vfkit", "mock"). Selects the argv translator in //vm/private:argv.bzl.    |
| <a id="VmProviderInfo-vmm"></a>vmm |  Target: the hypervisor executable (its runfiles ride along).    |
| <a id="VmProviderInfo-supports"></a>supports |  struct: capability flags — rosetta, virtiofs, vsock, nested, efi_boot, linux_boot. Used for early, clear validation errors.    |


<a id="provider_supports"></a>

### provider_supports

<pre>
load("@rules_macvm//vm:providers.bzl", "provider_supports")

provider_supports(*, <a href="#provider_supports-rosetta">rosetta</a>, <a href="#provider_supports-virtiofs">virtiofs</a>, <a href="#provider_supports-vsock">vsock</a>, <a href="#provider_supports-nested">nested</a>, <a href="#provider_supports-efi_boot">efi_boot</a>, <a href="#provider_supports-linux_boot">linux_boot</a>)
</pre>

Construct the `supports` capability struct for a VmProviderInfo.

**PARAMETERS**


| Name  | Description | Default Value |
| :------------- | :------------- | :------------- |
| <a id="provider_supports-rosetta"></a>rosetta |  <p align="center"> - </p>   |  `False` |
| <a id="provider_supports-virtiofs"></a>virtiofs |  <p align="center"> - </p>   |  `False` |
| <a id="provider_supports-vsock"></a>vsock |  <p align="center"> - </p>   |  `False` |
| <a id="provider_supports-nested"></a>nested |  <p align="center"> - </p>   |  `False` |
| <a id="provider_supports-efi_boot"></a>efi_boot |  <p align="center"> - </p>   |  `False` |
| <a id="provider_supports-linux_boot"></a>linux_boot |  <p align="center"> - </p>   |  `False` |
