---
title: "Changelog"
module: "rules_eslint"
---

All notable changes to rules_eslint. The format is loosely
[Keep a Changelog](https://keepachangelog.com/) — version headers
mirror the published bazel-registry entries.

### 0.1.0

- `eslint_test(name, srcs, eslint_bin, config, tags = None, **kwargs)` in
  `//eslint:defs.bzl` — a `lint`-tagged `sh_test` that runs a
  consumer-supplied `@npm` eslint binary (`eslint_bin`) over `srcs` against a
  flat `config`. eslint + plugins + config all come from the consumer's own
  `pnpm-lock.yaml`/`@npm` closure; the ruleset fetches nothing. The launcher
  (`//eslint/private:run_eslint.sh`) resolves the binary + config via the
  bazel runfiles library and forwards the sources to
  `eslint --config <config>`.
- `//examples/smoke` — a self-contained workspace pinning a real `@npm`
  eslint, used as the release gate.

### 0.0.1 — scaffold

- Initial scaffold via `rels scaffold`. No public API yet.
