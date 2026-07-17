---
title: "Changelog"
module: "rules_walkthrough"
---

### 0.1.0 — initial lift

Extracted from `prime-transformer/tools/walkthrough/` per its own
design-intent note ("Design intent — lift-and-shift to a future
`rules_walkthrough`", `defs.bzl:38`).

Surface unchanged from the prime-transformer version:

* `walkthrough_html` macro at `@rules_walkthrough//walkthrough:defs.bzl`.
* Proto schema at `@rules_walkthrough//proto:walkthrough.proto`
  (package renamed `prime_transformer.walkthrough.v1` → `walkthrough.v1`).
* Renderer at `@rules_walkthrough//walkthrough/renderer:all_files`
  (12 block renderers: text/equation/svg/plot/code/image/canvas/
  viz_scene/heightmap/vega_lite/polar_trace/prime_lattice/zeta_density/
  zeta_domain_coloring).
* Resolver at `@rules_walkthrough//walkthrough/resolver:resolve` —
  npy/npz/csv/parquet/json → JSON sidecar. numpy/pyarrow lazy-imported
  so JSON/CSV-only consumers don't need them in their pip hub.
* Vendored KaTeX + marked + Vega-Lite under `walkthrough/renderer/vendor/`.
