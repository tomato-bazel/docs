---
title: "Changelog"
module: "rules_macvm"
---

All notable changes to rules_macvm. The format is loosely
[Keep a Changelog](https://keepachangelog.com/) — version headers
mirror the published bazel-registry entries.

### 0.0.1

- Initial scaffold via `rels scaffold`.
- `vm` rule (`//vm:defs.bzl`): declarative, `bazel run`-able VM targets
  with typed attrs (cpus, memory, Linux-kernel/EFI boot, virtio-blk
  disks, rosetta, ignition, cloud_init, nested, gui, restful_uri) plus a
  raw `devices`/`extra_args` escape hatch. Emits `VmInfo` and a
  deterministic `<name>.argv` manifest.
- Provider seam: `//vm:toolchain_type`, the `vm_provider` rule (returns
  both `VmProviderInfo` and `ToolchainInfo` — usable per-target via
  `provider = …` or as a registered toolchain), and `VmProviderInfo` /
  `VmInfo` providers. Spec→argv translation isolated in
  `//vm/private:argv.bzl` with a documented per-kind extension point.
- vfkit provider (`//providers/vfkit:extensions.bzl%vfkit`): hermetic
  fetch of the pinned signed universal vfkit binary (v0.6.3), preserving
  the `com.apple.security.virtualization` entitlement; exposed as
  `@vfkit//:vfkit` + a macOS-exec-constrained `@vfkit//:vfkit_toolchain_def`.
- mock provider (`//providers/mock`): in-repo vfkit-CLI-compatible fake
  VMM for hermetic, VZ-free testing of the rule pipeline.
- `image/`: `ignition_config` renders an Ignition (FCOS-style)
  provisioning file from typed attrs via `json.encode`.
- `tools/refresh_versions.py` re-pins vfkit from the GitHub API;
  stardoc reference under `docs/`; `//examples/smoke` coverage —
  golden argv + golden Ignition tests, a mock-backed boot test,
  `build_test`, and a macOS-gated vfkit signature/entitlement test.
