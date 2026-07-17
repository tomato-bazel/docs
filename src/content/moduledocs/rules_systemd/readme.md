---
title: "Overview"
module: "rules_systemd"
---

Bazel-idiomatic systemd unit provisioning: typed rules that render unit
files from attrs, providers carrying unit metadata, an aspect that
collects units across a `deps` graph, and a `systemd_layer` rule that
packs them into an `/etc/systemd/system` tar — computing the
`*.target.wants/` enable-symlinks itself, since a build action never
runs `systemctl enable`.

The tar drops straight into `oci_image(tars = [...])`, so you can build a
systemd-PID-1 image entirely from Bazel without hand-writing `.service`
text into a `pkg_tar`.

## Status: v0.0.1

Public rules: `systemd_service`, `systemd_oneshot`, `systemd_target`,
`systemd_socket`, `systemd_timer`, `systemd_tmpfiles`, `systemd_dropin`,
`systemd_layer`. Rendering is pure Starlark (`ctx.actions.write`); the
layer tar is built by a small deterministic tool (sorted entries,
`mtime=0`, `uid/gid=0`) so it is reproducible and golden-testable.

## Install

`.bazelrc`:

```
common --registry=https://registry.fastverk.com/
common --registry=https://bcr.bazel.build/
```

`MODULE.bazel`:

```python
bazel_dep(name = "rules_systemd", version = "0.0.1")
```

## Usage

```python
load("@rules_systemd//systemd:defs.bzl",
     "systemd_service", "systemd_oneshot", "systemd_tmpfiles", "systemd_layer")

systemd_oneshot(
    name = "app-init",
    description = "First-boot init",
    exec_start = "/usr/local/bin/app-init",
    before = ["app.service"],
)

systemd_tmpfiles(
    name = "app-tmpfiles",
    unit_name = "app.conf",
    lines = ["d /var/lib/app 0750 app app -"],
)

systemd_service(
    name = "app",
    description = "App daemon",
    requires = ["app-init.service"],
    after = ["network.target", "app-init.service"],
    exec_start = "/usr/local/bin/app --config /etc/app/config.yaml",
    user = "app",
    restart = "on-failure",
    wanted_by = ["multi-user.target"],   # systemd_layer writes the enable-symlink
)

systemd_layer(
    name = "units",
    deps = [":app", ":app-init", ":app-tmpfiles"],
)
```

Then, in an image:

```python
load("@rules_oci//oci:defs.bzl", "oci_image")

oci_image(
    name = "app_image",
    base = "//images/systemd-base",   # a base whose ENTRYPOINT is /sbin/init
    entrypoint = ["/sbin/init"],
    tars = [":units", "//toolkits/app:layer"],
)
```

`bazel build //…:units` emits the tar; its deterministic path/symlink
listing is in output group `listing` (used for golden tests — see
`examples/smoke`). Run it under podman with `--systemd=always`.

## Layout

- `systemd/defs.bzl` — the public rules + the `_systemd_units` aspect.
- `systemd/providers.bzl` — `SystemdUnitInfo`, `SystemdTransitiveInfo`,
  `SystemdLayerInfo`.
- `systemd/private/render.bzl` — INI rendering helpers.
- `systemd/private/mklayer.py` — the deterministic tar builder.
- `examples/smoke` — a worked example with golden tests.
