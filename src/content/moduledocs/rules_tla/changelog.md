---
title: "Changelog"
module: "rules_tla"
---

### 0.1.0

- Initial release. `tla_library` + `tla_check` running TLC from a pinned,
  hermetic `tla2tools.jar` (v1.7.4). Checks run as build actions gated by
  `build_test`, so `bazel test //...` model-checks specs with no runfiles wiring.
- Transitive `tla_library` source directories are placed on TLC's `TLA-Library`
  search path.
