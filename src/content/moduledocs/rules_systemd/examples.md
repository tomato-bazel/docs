---
title: "Usage"
module: "rules_systemd"
---

Real usage, taken from the module's `examples/`.

### examples/smoke/BUILD.bazel

```starlark
load("@bazel_skylib//rules:diff_test.bzl", "diff_test")
load(
    "//systemd:defs.bzl",
    "systemd_layer",
    "systemd_oneshot",
    "systemd_service",
    "systemd_target",
    "systemd_tmpfiles",
)

package(default_visibility = ["//visibility:private"])

# A one-shot first-boot init that the daemon orders After=.
systemd_oneshot(
    name = "demo-init",
    before = ["demo.service"],
    description = "Demo first-boot init",
    exec_start = "/usr/local/bin/demo-init",
)

# tmpfiles establishing ownership of the state dir before the daemon runs.
systemd_tmpfiles(
    name = "demo-tmpfiles",
    lines = ["d /var/lib/demo 0750 demo demo -"],
    unit_name = "demo.conf",
)

# The long-running daemon, enabled into multi-user.target.
systemd_service(
    name = "demo",
    after = [
        "network.target",
        "demo-init.service",
    ],
    description = "Demo daemon",
    environment = [
        "DEMO_ENV=local",
        "DEMO_PORT=8080",
    ],
    exec_start = "/usr/local/bin/demo --config /etc/demo/config.yaml",
    requires = ["demo-init.service"],
    restart = "on-failure",
    restart_sec = "2s",
    user = "demo",
    wanted_by = ["multi-user.target"],
)

# A synchronization target with no [Install] (not enabled itself).
systemd_target(
    name = "demo-stack",
    description = "Demo stack target",
    wants = ["demo.service"],
)

# Collect everything into one /etc/systemd/system tar layer. The
# demo.service enable-symlink under multi-user.target.wants/ is computed
# automatically from its wanted_by.
systemd_layer(
    name = "units",
    deps = [
        ":demo",
        ":demo-init",
        ":demo-stack",
        ":demo-tmpfiles",
    ],
)

filegroup(
    name = "units_listing",
    srcs = [":units"],
    output_group = "listing",
)

# Golden tests: the rendered daemon unit + the layer's path/symlink listing.
diff_test(
    name = "demo_service_golden",
    file1 = "demo.service.golden",
    file2 = ":demo",
)

diff_test(
    name = "units_listing_golden",
    file1 = "units.listing.golden",
    file2 = ":units_listing",
)
```
