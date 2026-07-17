---
title: "Usage"
module: "rules_macvm"
---

Real usage, taken from the module's `examples/`.

### examples/smoke/BUILD.bazel

```starlark
load("@bazel_skylib//rules:build_test.bzl", "build_test")
load("@bazel_skylib//rules:diff_test.bzl", "diff_test")
load("@rules_macvm//image:defs.bzl", "ignition_config")
load("@rules_macvm//vm:defs.bzl", "vm")
load("@rules_shell//shell:sh_test.bzl", "sh_test")

# A representative Linux VM built against the mock backend — hermetic, no
# Virtualization.framework. `bazel run //examples/smoke:linux_vm` "boots"
# it (the mock prints the resolved argv).
vm(
    name = "linux_vm",
    cpus = 2,
    devices = [
        "virtio-net,nat",
        "virtio-rng",
    ],
    disks = ["rootfs.img"],
    ignition = ":provision",
    initrd = "initrd.img",
    kernel = "vmlinuz",
    kernel_cmdline = "console=hvc0 root=/dev/vda",
    memory = "2GiB",
    nested = True,
    provider = "@rules_macvm//providers/mock:mock_provider",
    rosetta = True,
)

# Ignition provisioning rendered purely from attrs (hermetic JSON).
ignition_config(
    name = "provision",
    enable_units = ["podman.socket"],
    ssh_authorized_keys = ["ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAID demo@rules_macvm"],
)

# Golden: the resolved vfkit-style command line is stable and correct.
# Regenerate with: bazel run //examples/smoke:update_argv_golden
diff_test(
    name = "argv_golden_test",
    file1 = "linux_vm.argv.golden",
    file2 = "linux_vm.argv",
)

# Golden for the generated Ignition JSON.
diff_test(
    name = "ignition_golden_test",
    file1 = "provision.ign.golden",
    file2 = "provision.ign",
)

# Hermetic boot smoke: launcher resolves the backend + runfiles and the
# (mock) VMM completes.
sh_test(
    name = "boot_smoke_test",
    srcs = ["boot_smoke.sh"],
    args = ["$(rootpath :linux_vm)"],
    data = [":linux_vm"],
)

# An EFI-boot VM (disk with its own bootloader) — analysis coverage of
# the other boot path.
vm(
    name = "efi_vm",
    disks = ["rootfs.img"],
    efi = True,
    memory = "1GiB",
    provider = "@rules_macvm//providers/mock:mock_provider",
)

build_test(
    name = "analysis_test",
    targets = [
        ":linux_vm",
        ":efi_vm",
        ":provision",
    ],
)

# macOS-only: the fetched vfkit is signed, entitled, and runs. Skipped on
# Linux CI (exec-incompatible).
sh_test(
    name = "vfkit_signature_test",
    srcs = ["vfkit_signature.sh"],
    args = ["$(rootpath @vfkit//:vfkit)"],
    data = ["@vfkit"],
    target_compatible_with = ["@platforms//os:macos"],
)
```
