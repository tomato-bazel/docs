---
title: "Overview"
module: "rules_graphviz"
---

Bazel rules for rendering [Graphviz](https://graphviz.org) diagrams — **hermetically**.

The default toolchain runs [`@hpcc-js/wasm-graphviz`](https://github.com/hpcc-systems/hpcc-js-wasm)
(Graphviz compiled to WebAssembly, WASM inlined into one JS file) under a
hermetic [bun](https://bun.sh) runtime (via `rules_bun`). **No host `dot`
required**, cross-platform wherever bun runs.

## Install (`MODULE.bazel`)

```python
bazel_dep(name = "rules_graphviz", version = "0.2.0")
```

`.bazelrc` (fastverk registry):

```
common --registry=https://raw.githubusercontent.com/fastverk/bazel-registry/main/
common --registry=https://bcr.bazel.build/
```

## Use

```python
load("@rules_graphviz//graphviz:defs.bzl", "dot_diagram", "dot_corpus", "dot_pdf", "svg_pdf")

dot_diagram(name = "graph", src = "graph.dot")                       # dot -> svg
dot_diagram(name = "g2", src = "graph.dot", engine = "neato")        # any layout engine
dot_diagram(name = "g3", src = "graph.dot", output_format = "json")  # structured output
dot_corpus(name = "all", srcs = glob(["*.dot"]))                     # fan-out

dot_pdf(name = "graph_pdf", src = "graph.dot", engine = "twopi")     # dot -> vector PDF
svg_pdf(name = "logo_pdf", src = "logo.svg")                         # any SVG -> vector PDF
```

- **engines**: `dot neato fdp sfdp twopi circo osage patchwork`
- **formats**: `svg dot canon xdot json json0 plain plain-ext gv`

### Vector PDF (`dot_pdf` / `svg_pdf`)

`dot_pdf` and `svg_pdf` emit **vector** PDF — useful for LaTeX (`\includegraphics`
in tectonic/pdflatex), which embeds PDF but not SVG. They render to SVG with the
WASM engine, then convert SVG → PDF with a vendored, self-contained **bun** bundle
(`graphviz/svg2pdf.bundle.js`: pdfkit + svg-to-pdfkit, headless — no browser, no
cairo, no host `dot`). So PDF stays as hermetic as the rest of the toolchain. The
PDF page is sized to the SVG's `viewBox`. See `graphviz/NOTICE.svg2pdf` for the
bundled packages and how to regenerate the bundle.

## Scope

The WASM toolchain covers every layout engine + the structured output formats.
Vector **PDF** is available via `dot_pdf` / `svg_pdf` (SVG → PDF under bun, above).
The native standalone tools (`gvpr`, `gvpack`, `tred`, `unflatten`, …) and **raster**
output (`png`, which needs cairo) are **not** in the WASM build. Register an
alternate toolchain for `@rules_graphviz//graphviz:toolchain_type` if you need them.

## License

Apache-2.0. Vendors `@hpcc-js/wasm-graphviz` (Apache-2.0); see `graphviz/NOTICE`.
