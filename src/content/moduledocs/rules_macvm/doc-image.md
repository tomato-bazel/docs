---
title: "image"
module: "rules_macvm"
---

<!-- Generated with Stardoc: http://skydoc.bazel.build -->

Guest-image helpers for rules_macvm.

Provider-agnostic: the artifacts here boot under vfkit, krunkit, qemu, or
bare metal. v0.0.1 ships `ignition_config` — generate an Ignition
(Fedora CoreOS-style) provisioning file from typed attrs, entirely with
Starlark `json.encode` (hermetic, golden-testable). Feed it to a VM via
`vm(ignition = ":provision")`.

Roadmap (documented, not yet built): rootfs assembly from OCI layers /
mkosi, kernel+initrd extraction, inline-file Ignition stanzas (need an
encoder tool), and butane → Ignition transpilation.

<a id="ignition_config"></a>

## ignition_config

<pre>
load("@rules_macvm//image:defs.bzl", "ignition_config")

ignition_config(<a href="#ignition_config-name">name</a>, <a href="#ignition_config-enable_units">enable_units</a>, <a href="#ignition_config-ssh_authorized_keys">ssh_authorized_keys</a>, <a href="#ignition_config-username">username</a>)
</pre>

Render an Ignition provisioning JSON from typed attrs. Output: `<name>.ign`.

**ATTRIBUTES**


| Name  | Description | Type | Mandatory | Default |
| :------------- | :------------- | :------------- | :------------- | :------------- |
| <a id="ignition_config-name"></a>name |  A unique name for this target.   | <a href="https://bazel.build/concepts/labels#target-names">Name</a> | required |  |
| <a id="ignition_config-enable_units"></a>enable_units |  systemd unit names to enable (e.g. `podman.socket`).   | List of strings | optional |  `[]`  |
| <a id="ignition_config-ssh_authorized_keys"></a>ssh_authorized_keys |  SSH public keys authorized for `username`.   | List of strings | optional |  `[]`  |
| <a id="ignition_config-username"></a>username |  User to attach `ssh_authorized_keys` to.   | String | optional |  `"core"`  |


<a id="VmIgnitionInfo"></a>

## VmIgnitionInfo

<pre>
load("@rules_macvm//image:defs.bzl", "VmIgnitionInfo")

VmIgnitionInfo(<a href="#VmIgnitionInfo-file">file</a>)
</pre>

A generated Ignition provisioning file.

**FIELDS**

| Name  | Description |
| :------------- | :------------- |
| <a id="VmIgnitionInfo-file"></a>file |  File: the rendered Ignition JSON.    |
