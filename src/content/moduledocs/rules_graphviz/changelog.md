---
title: "Changelog"
module: "rules_graphviz"
---

### 0.2.0 (unreleased)

#### Added
- **Vector PDF output** via `dot_pdf` (dot → svg → pdf) and `svg_pdf`
  (any svg → pdf), for embedding graphviz output in LaTeX (tectonic/pdflatex),
  which takes PDF but not SVG. Conversion is hermetic: a vendored, self-contained
  **bun** bundle (`graphviz/svg2pdf.bundle.js`, built from `graphviz/svg2pdf.mjs`
  — pdfkit + svg-to-pdfkit, headless, no browser/cairo/host `dot`). The bundle
  rides on the toolchain via the new `svg2pdf` field on `graphviz_toolchain`.
  See `graphviz/NOTICE.svg2pdf` for the bundled packages and the rebundle command.

#### Notes
- The WASM graphviz toolchain still emits SVG/structured formats; PDF goes
  through the bun converter. Raster PNG remains out of scope (needs cairo).

#### Publishing this version (registry entry)
`bazel_dep(name = "rules_graphviz", version = "0.2.0")` resolves from the fastverk
registry once tagged + published. Consumers can build against a local checkout in
the meantime with a `local_path_override` (see e.g. the `spec` repo). To publish:

```sh
## 1. commit the 0.2.0 changes, then tag + push
git tag v0.2.0 && git push origin v0.2.0

## 2. compute the archive integrity from the published tag tarball
URL=https://github.com/fastverk/rules_graphviz/archive/refs/tags/v0.2.0.tar.gz
curl -sL "$URL" | openssl dgst -sha256 -binary | openssl base64 -A   # -> sha256-...

## 3. add the registry entry under bazel-registry/modules/rules_graphviz/0.2.0/
##    - MODULE.bazel : copy of this repo's MODULE.bazel
##    - source.json  : { "url": "$URL", "integrity": "sha256-...",
##                       "strip_prefix": "rules_graphviz-0.2.0" }
##    and append "0.2.0" to modules/rules_graphviz/metadata.json versions,
##    then drop the local_path_override in consuming repos.
```

### 0.1.0

- Initial release: `dot_diagram` / `dot_corpus` rendering `.dot`/`.gv` to SVG and
  structured formats via a hermetic WASM graphviz toolchain (bun runtime).
