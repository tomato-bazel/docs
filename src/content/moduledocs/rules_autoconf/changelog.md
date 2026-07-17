---
title: "Changelog"
module: "rules_autoconf"
---

All notable changes to rules_autoconf. The format is loosely
[Keep a Changelog](https://keepachangelog.com/) — version headers
mirror the published bazel-registry entries.

### 0.1.0 — initial release

- Initial scaffold of Bazel-native autoconf replacement: probes run as
  Bazel actions, composing into the build graph and the action cache
  instead of an out-of-band `configure` shell pipeline.
- Ships the core autoconf primitives: `cc_check_header`,
  `cc_check_function`, `cc_check_symbol`, and `config_header` (renders
  `config.h` from a `defines` dict + probe results).
- No `autoconf` / `m4` runtime dependency — probes use the host C
  compiler (`$CC`, default `cc`).
