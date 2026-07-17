---
title: "Overview"
module: "rules_macvm"
---

Bazel-idiomatic, hermetic Linux VMs on macOS via Apple
Virtualization.framework — declarative VM targets, a pinned VMM
toolchain, and a pluggable provider seam (vfkit first).

## Status: v0.0.1

- A `vm` rule: declare a VM (cpus, memory, Linux-kernel or EFI boot,
  virtio-blk disks, Rosetta, Ignition, nested, raw `--device` escape
  hatch) → a `bazel run`-able target that boots it, plus a `VmInfo`
  provider and a deterministic `<name>.argv` manifest.
- A **provider seam**: `//vm:toolchain_type` + the `vm_provider` rule.
  Backends are swappable per-target (`provider = …`) or by registered
  toolchain. Adding one is a translator function + a registration.
- The **vfkit** provider: hermetically fetches the pinned, *signed*
  universal vfkit binary (entitlement-carrying) and exposes it as a
  toolchain (macOS-exec-constrained).
- A **mock** provider: an in-repo, vfkit-CLI-compatible fake VMM so the
  whole rule pipeline is tested in CI with no Virtualization.framework.
- `image/`: `ignition_config` — render an Ignition provisioning file
  from typed attrs (pure `json.encode`, golden-tested).

See [CHANGELOG.md](https://github.com/tomato-bazel/rules_macvm/blob/main/CHANGELOG.md) and generated reference in [docs/](https://github.com/tomato-bazel/rules_macvm/blob/main/docs/).

## Why this exists

macOS has no Linux kernel, so containers and Linux toolchains need a VM.
Apple's Virtualization.framework lets a userspace process boot one with
no kernel extension; `vfkit` is a thin, scriptable frontend to it. This
ruleset makes a VM a **declarative, pinned, hermetic** Bazel target —
the substrate for hermetic Linux build/test on a Mac, reproducible VM
images, Rosetta-accelerated x86-64, and microVM sandboxing. (Podman's
`podman machine` is one such consumer; rules_podman can depend on this.)

## Install

`.bazelrc`:

```
common --registry=https://registry.fastverk.com/
common --registry=https://bcr.bazel.build/
```

`MODULE.bazel`:

```python
bazel_dep(name = "rules_macvm", version = "0.0.1")

vfkit = use_extension("@rules_macvm//providers/vfkit:extensions.bzl", "vfkit")
use_repo(vfkit, "vfkit")
register_toolchains("@vfkit//:vfkit_toolchain_def")
```

## Usage

```python
load("@rules_macvm//vm:defs.bzl", "vm")
load("@rules_macvm//image:defs.bzl", "ignition_config")

ignition_config(
    name = "provision",
    ssh_authorized_keys = ["ssh-ed25519 AAAA… you@host"],
    enable_units = ["podman.socket"],
)

# `bazel run //:dev` boots it via the registered vfkit toolchain.
vm(
    name = "dev",
    cpus = 4,
    memory = "4GiB",
    kernel = "//path:vmlinuz",          # or efi = True to boot a disk
    initrd = "//path:initrd.img",
    kernel_cmdline = "console=hvc0 root=/dev/vda",
    disks = ["//path:rootfs.img"],
    ignition = ":provision",
    rosetta = True,                      # x86-64 translation on Apple Silicon
    nested = True,                       # M3+
    devices = ["virtio-net,nat", "virtio-vsock,port=1024,socketURL=unix:///tmp/v.sock"],
)
```

`bazel build //:dev` also emits `dev.argv` — the exact VMM command line
(host-independent short_paths) for review and golden tests.

## Providers

| kind | status | notes |
|---|---|---|
| `vfkit` | supported | Apple Virtualization.framework, signed binary pinned |
| `mock` | test-only | in-repo fake VMM; vfkit-CLI-compatible, for hermetic tests |
| `krunkit` | extension point | libkrun/GPU microVMs — add a translator + fetch |
| `qemu` | extension point | qemu-hvf — add a translator + fetch |

Adding a provider: implement `_<kind>_tokens(spec)` in
[vm/private/argv.bzl](https://github.com/tomato-bazel/rules_macvm/blob/main/vm/private/argv.bzl), add a branch in
`build_tokens`, and register a `vm_provider` + `toolchain`.

## The hard constraint: testing

Virtualization.framework needs a **real Mac host with the entitlement**,
and (pre-M3) couldn't nest in cloud CI. So CI coverage is:
golden argv + generated-Ignition tests, the **mock-backed boot test**
(full pipeline, no VZ), `build_test` analysis, and a **macOS-gated vfkit
signature/entitlement test** (skipped on Linux). Actual VM boots run on
self-hosted/local Macs; `--nested` on M3+ may open up more. Bring your
own guest artifacts (kernel/initrd or a bootable disk) — rootfs assembly
is roadmap, not v0.0.1.

## Maintenance

```
tools/refresh_versions.py            # re-pin vfkit to latest stable
tools/refresh_versions.py --version 0.6.3
bazel run //docs:update              # regenerate committed rule docs
```
