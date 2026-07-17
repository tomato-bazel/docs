---
title: "Changelog"
module: "rules_puml"
---

All notable changes to rules_puml. The format is loosely
[Keep a Changelog](https://keepachangelog.com/) — version headers
mirror the published bazel-registry entries.

### 0.0.2 — PDF rendering via PlantUML + Batik/FOP

- `puml_diagram(output_format = "pdf")` now ships. PlantUML's
  `-tpdf` mode delegates to Apache Batik's `SVGConverter` and
  Apache FOP for the SVG→PDF step; both Maven artifacts are added
  to the renderer `java_binary`'s classpath, so PDF mode requires
  no external toolchain (no Inkscape, no rsvg-convert, no headless
  browser). Output is vector PDF, LaTeX-embeddable via
  `\includegraphics{foo.pdf}` directly.
- Maven additions: `org.apache.xmlgraphics:batik-rasterizer:1.18`,
  `org.apache.xmlgraphics:fop:2.10`. Both bring their transitive
  Batik / xmlgraphics-commons / avalon-framework modules with them.
- This satisfies the "LaTeX papers embed diagram PDFs" path the
  paper integration roadmap was waiting on. A follow-up will emit
  a shared `PdfDocumentInfo` provider once its home (rules_texlive
  vs. a new tiny rules_pdf module) is settled with the other
  agents.

### 0.0.1 — V0 macros (file-level render + library composition)

- Initial release. `puml_diagram(name, src | libs, output_format)`
  + `puml_library(name, srcs)` macros, SVG/PNG output, providers
  (`PumlSourceInfo`, `PumlDiagramInfo`), Java-binary renderer
  wrapping PlantUML 1.2024.7.
