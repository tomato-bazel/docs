---
title: "Overview"
module: "rules_ssh_tui"
---

SSH-fronted TUI launcher: russh server + login-shell oci_image. Drop in any rust_binary as the login shell.

## Status: v0.0.1 — scaffold

No public surface yet. See `CHANGELOG.md` for what has shipped.

## Install

`.bazelrc`:

```
common --registry=https://registry.fastverk.com/
common --registry=https://bcr.bazel.build/
```

`MODULE.bazel`:

```python
bazel_dep(name = "rules_ssh_tui", version = "0.0.1")
```
