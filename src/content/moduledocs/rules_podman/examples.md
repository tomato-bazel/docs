---
title: "Usage"
module: "rules_podman"
---

Real usage, taken from the module's `examples/`.

### examples/machine/BUILD.bazel

```starlark
load("@bazel_skylib//rules:build_test.bzl", "build_test")
load("@bazel_skylib//rules:diff_test.bzl", "diff_test")
load("@rules_macvm//vm:toolchains.bzl", "vm_provider")
load("@rules_podman//podman/machine:machine.bzl", "podman_machine")
load("@rules_shell//shell:sh_binary.bzl", "sh_binary")

# Our own mock VMM (rules_macvm's is dev-only and invisible to consumers).
sh_binary(
    name = "mock_vmm",
    srcs = ["mock_vmm.sh"],
)

vm_provider(
    name = "mock_provider",
    efi_boot = True,
    kind = "mock",
    linux_boot = True,
    nested = True,
    rosetta = True,
    virtiofs = True,
    vmm = ":mock_vmm",
    vsock = True,
)

# A Podman service VM built against the mock backend, so the provisioning
# + VM spec are tested hermetically (no Apple Virtualization.framework).
# For a real machine, drop `provider` (uses the registered @vfkit
# toolchain) and point `image` at a bootable Podman/FCOS disk, on a Mac.
podman_machine(
    name = "machine",
    image = "fcos.raw",
    provider = ":mock_provider",
    ssh_authorized_keys = ["ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAID demo@rules_podman"],
)

# Golden: the rendered Ignition (ssh key + enable podman.socket).
diff_test(
    name = "machine_ignition_test",
    file1 = "machine.ignition.ign.golden",
    file2 = "machine.ignition.ign",
)

# Golden: the resolved vfkit-style VM command line (EFI boot + vsock +
# nat + rosetta + the ignition).
diff_test(
    name = "machine_argv_test",
    file1 = "machine.argv.golden",
    file2 = "machine.argv",
)

build_test(
    name = "machine_build_test",
    targets = [
        ":machine",
        ":machine.ignition",
    ],
)
```

### examples/smoke/BUILD.bazel

```starlark
load("@bazel_skylib//rules:build_test.bzl", "build_test")
load("@rules_podman//podman:defs.bzl", "podman_build", "podman_image_load", "podman_run")
load("@rules_shell//shell:sh_test.bzl", "sh_test")

# `bazel run //examples/smoke:podman -- ps -a` — drive Podman. Daemonless
# on Linux; on macOS/Windows it talks to your `podman machine`.
podman_run(
    name = "podman",
)

# `bazel run //examples/smoke:daemonless` — proves the Linux engine runs
# with no service: `podman info` against a throwaway vfs store. Run-only
# (needs the Linux engine toolchain + host userns); not wired as a test
# because nested user namespaces under the Bazel sandbox are environment-
# dependent.
podman_run(
    name = "daemonless",
    extra_args = ["info"],
    storage = "ephemeral",
)

# Hermetic smoke: `podman --version` exits 0 and reports the pinned
# version, offline — no service required. Verifies the toolchain resolves
# and the fetched binary (daemonless launcher on Linux, client elsewhere)
# executes on the host.
sh_test(
    name = "podman_version_test",
    srcs = ["version_smoke.sh"],
    args = [
        "$(rootpath @podman//:podman)",
        "5.8.2",
    ],
    data = ["@podman"],
)

# `bazel run //examples/smoke:image` — builds `rules_podman/smoke:latest`
# from the local Containerfile in a throwaway vfs store (daemonless on Linux).
podman_build(
    name = "image",
    srcs = [
        "Containerfile",
        "app.txt",
    ],
    image_tags = ["rules_podman/smoke:latest"],
    storage = "ephemeral",
)

# Tar the context into a stand-in archive so the load rule has a real
# file input to wire up. (A `FROM scratch` tarball isn't a loadable OCI
# image — running this needs a genuine archive; the build_test below only
# covers analysis + launcher generation.)
genrule(
    name = "sample_tar",
    srcs = ["app.txt"],
    outs = ["sample.tar"],
    cmd = "tar -cf $@ -C $$(dirname $(location app.txt)) app.txt",
)

# `bazel run //examples/smoke:load` — `podman load -i sample.tar`.
podman_image_load(
    name = "load",
    image = ":sample.tar",
)

# Daemon-free coverage for podman_build / podman_image_load: analyze the
# rules and build their launcher scripts without executing them.
build_test(
    name = "rules_build_test",
    targets = [
        ":image",
        ":load",
    ],
)
```
