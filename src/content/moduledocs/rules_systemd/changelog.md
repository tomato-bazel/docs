---
title: "Changelog"
module: "rules_systemd"
---

All notable changes to rules_systemd. The format is loosely
[Keep a Changelog](https://keepachangelog.com/) — version headers
mirror the published bazel-registry entries.

### 0.0.1

- Initial scaffold via `rels scaffold`.
- Typed unit rules: `systemd_service`, `systemd_oneshot`,
  `systemd_target`, `systemd_socket`, `systemd_timer`,
  `systemd_tmpfiles`, `systemd_dropin` — pure-Starlark INI rendering.
- Providers: `SystemdUnitInfo`, `SystemdTransitiveInfo`,
  `SystemdLayerInfo`; a `_systemd_units` aspect over `deps`.
- `systemd_layer`: packs transitive units into a reproducible
  `/etc/systemd/system` (+ `/etc/tmpfiles.d`, drop-ins) tar for
  `oci_image(tars = [...])`, auto-writing `*.target.wants/` enable
  symlinks from each unit's `wanted_by`.
- `examples/smoke` with golden tests over a rendered unit + the layer
  listing.
