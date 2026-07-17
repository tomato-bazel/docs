---
title: "vm_defs"
module: "rules_macvm"
---

<!-- Generated with Stardoc: http://skydoc.bazel.build -->

The `vm` rule — declare and boot a virtual machine.

`vm` is both a launchable target (`bazel run //:dev` boots it via the
resolved VMM backend) and a `VmInfo` provider other rules can consume.
It emits a deterministic `<name>.argv` manifest of the VMM command line
for golden testing and `bazel build`-time inspection.

The backend is resolved from the `provider` attribute if set, else from
a registered `//vm:toolchain_type` toolchain. Common devices are typed
attributes; `devices` / `extra_args` are raw passthroughs for the long
tail (virtio-net, virtio-vsock, virtio-gpu, …).

<a id="vm"></a>

### vm

<pre>
load("@rules_macvm//vm:defs.bzl", "vm")

vm(<a href="#vm-name">name</a>, <a href="#vm-cloud_init">cloud_init</a>, <a href="#vm-cpus">cpus</a>, <a href="#vm-devices">devices</a>, <a href="#vm-disks">disks</a>, <a href="#vm-efi">efi</a>, <a href="#vm-extra_args">extra_args</a>, <a href="#vm-gui">gui</a>, <a href="#vm-ignition">ignition</a>, <a href="#vm-initrd">initrd</a>, <a href="#vm-kernel">kernel</a>,
   <a href="#vm-kernel_cmdline">kernel_cmdline</a>, <a href="#vm-memory">memory</a>, <a href="#vm-nested">nested</a>, <a href="#vm-provider">provider</a>, <a href="#vm-restful_uri">restful_uri</a>, <a href="#vm-rosetta">rosetta</a>)
</pre>

Declare and boot a VM via a resolved VMM backend. Emits VmInfo + a `<name>.argv` manifest.

**ATTRIBUTES**


| Name  | Description | Type | Mandatory | Default |
| :------------- | :------------- | :------------- | :------------- | :------------- |
| <a id="vm-name"></a>name |  A unique name for this target.   | <a href="https://bazel.build/concepts/labels#target-names">Name</a> | required |  |
| <a id="vm-cloud_init"></a>cloud_init |  cloud-init files: user-data and (optionally) meta-data.   | <a href="https://bazel.build/concepts/labels">List of labels</a> | optional |  `[]`  |
| <a id="vm-cpus"></a>cpus |  Number of virtual CPUs.   | Integer | optional |  `1`  |
| <a id="vm-devices"></a>devices |  Raw `--device` specs (virtio-net, virtio-vsock, virtio-gpu, …).   | List of strings | optional |  `[]`  |
| <a id="vm-disks"></a>disks |  Disk images attached as virtio-blk devices.   | <a href="https://bazel.build/concepts/labels">List of labels</a> | optional |  `[]`  |
| <a id="vm-efi"></a>efi |  EFI-boot a disk image (instead of a direct kernel).   | Boolean | optional |  `False`  |
| <a id="vm-extra_args"></a>extra_args |  Raw flags appended to the VMM invocation.   | List of strings | optional |  `[]`  |
| <a id="vm-gui"></a>gui |  Open a graphical window for the VM.   | Boolean | optional |  `False`  |
| <a id="vm-ignition"></a>ignition |  Ignition provisioning file (FCOS-style).   | <a href="https://bazel.build/concepts/labels">Label</a> | optional |  `None`  |
| <a id="vm-initrd"></a>initrd |  initrd/initramfs for direct boot.   | <a href="https://bazel.build/concepts/labels">Label</a> | optional |  `None`  |
| <a id="vm-kernel"></a>kernel |  Linux kernel image for direct boot.   | <a href="https://bazel.build/concepts/labels">Label</a> | optional |  `None`  |
| <a id="vm-kernel_cmdline"></a>kernel_cmdline |  Linux kernel command line.   | String | optional |  `""`  |
| <a id="vm-memory"></a>memory |  RAM, e.g. "2GiB" / "512MiB" / a MiB integer.   | String | optional |  `"512MiB"`  |
| <a id="vm-nested"></a>nested |  Enable nested virtualization (M3+).   | Boolean | optional |  `False`  |
| <a id="vm-provider"></a>provider |  VMM backend override. If unset, the registered //vm:toolchain_type toolchain is used.   | <a href="https://bazel.build/concepts/labels">Label</a> | optional |  `None`  |
| <a id="vm-restful_uri"></a>restful_uri |  URI for the VMM's RESTful lifecycle control plane.   | String | optional |  `""`  |
| <a id="vm-rosetta"></a>rosetta |  Expose Rosetta x86-64 translation (virtio share `rosetta`).   | Boolean | optional |  `False`  |
