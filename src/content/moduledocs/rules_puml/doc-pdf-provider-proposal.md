---
title: "pdf-provider-proposal"
module: "rules_puml"
---

## `PdfDocumentInfo` — shared provider design proposal

**Status:** Draft. **Coordinators:** rules_puml (producer), rules_texlive
(producer + canonical consumer), rules_firefox (future producer).

### Why

Three Bazel modules in the fastverk ecosystem produce PDFs from
different inputs:

| Module | Input | Output | Implementation |
|---|---|---|---|
| `rules_puml` | `.puml` source | vector PDF (one diagram) | PlantUML + Batik + FOP, in-JVM |
| `rules_texlive` (in flight) | LaTeX source tree | vector PDF (paper) | pdfTeX / tectonic |
| `rules_firefox` (long horizon) | HTML / CSS | rasterized + vector PDF | headless Gecko |

The canonical consumer is a LaTeX paper that embeds many diagram
PDFs alongside its own content. Today the integration is ad-hoc:
the paper depends on diagram file labels by path. A shared provider
collapses that to a typed contract — the paper rule consumes any
target speaking `PdfDocumentInfo`, the producer doesn't care which
paper consumes it.

This is the rules_rdf pattern: `RdfDatasetInfo` is the abstract
provider; `rules_jena` emits it from a Jena Model, `rules_jsonschema`
emits it from a SHACL shape; rules_rdf itself is the home of the
contract — no `rules_jena` ↔ `rules_jsonschema` dep at all. The
canonical RDF-consumer rules (`sparql_query_test`, etc.) live in
rules_rdf and accept any target with the provider.

### Proposed shape

```python
PdfDocumentInfo = provider(
    doc = "A PDF document produced by any source — LaTeX, SVG render, " +
          "HTML render. Consumed by document-assembly rules " +
          "(tex_paper, presentation builds, archive bundles) that " +
          "stitch many PDFs into one.",
    fields = {
        "pdf": "File: the rendered PDF document.",
        "source_kind": "str: provenance only — 'tex' | 'svg' | 'html' | " +
                       "'png-to-pdf' | 'other'. Useful for diagnostics " +
                       "and per-source caching; never branched on by " +
                       "consumers.",
        "page_count": "int | None: total pages when the producer can " +
                      "determine it cheaply (LaTeX knows; an SVG " +
                      "render is always 1; HTML to PDF only after the " +
                      "fact). None when not known.",
        "logical_name": "str: stable handle used in includes, e.g. " +
                        "the label name. LaTeX consumers embed via " +
                        "\\includegraphics{<logical_name>} where the " +
                        "asset is symlinked into the paper's working " +
                        "tree at <logical_name>.pdf.",
    },
)
```

Optional companion types (V1, not v0):

```python
PdfTocInfo = provider(
    doc = "Table-of-contents fragments contributed by a document " +
          "(LaTeX produces these; SVG renders contribute none). " +
          "Used by aggregator rules that build a combined TOC.",
    fields = {
        "entries": "depset[struct(title=str, page=int, level=int)]",
    },
)
```

### Toolchain types (V1)

When multiple SVG-to-PDF implementations matter (Batik in-JVM today;
Inkscape if a consumer needs better gradient handling; rsvg-convert
for batch speed), select via a toolchain:

```python
svg_to_pdf_toolchain_type = "@rules_pdf//pdf:svg_to_pdf_toolchain_type"
html_to_pdf_toolchain_type = "@rules_pdf//pdf:html_to_pdf_toolchain_type"
```

Concrete impls:
- `rules_puml//puml/private/plantuml:plantuml` already satisfies an
  in-JVM `svg_to_pdf_toolchain` contract (Batik + FOP).
- `rules_firefox` future `firefox_headless` would satisfy
  `html_to_pdf_toolchain`.

V0 of this proposal does **not** require toolchain types — direct
producer to consumer via the provider is enough. Toolchains land
when a second SVG-to-PDF impl appears.

### Where the provider lives

Three options ranked by cost:

#### A. Tiny new `rules_pdf` module (RECOMMENDED)

- Pure provider definitions, no rules, no Maven, no toolchains in
  V0. Ten lines of Starlark.
- Both `rules_puml` and `rules_texlive` depend on `rules_pdf` for
  the contract type; neither depends on the other.
- Mirrors `rules_rdf` exactly — the abstract spec lives alone, the
  concrete impls live in named modules that emit the abstract type.
- Cost: one new repo + registry entry. Maintenance is near-zero
  because the provider shape is small and stable.

#### B. `rules_texlive` owns the provider

- LaTeX-paper-build is the canonical consumer; semantically it's
  the right home.
- `rules_puml` would `bazel_dep(name = "rules_texlive")` solely
  for the provider type. That's a heavy dep — rules_texlive pulls
  in pdftex source, CWEB tooling, Lean, the works.
- Pragmatic only if the rules_texlive author wants to own it AND a
  way exists to expose just the provider without pulling the full
  build graph.

#### C. `rules_lang`

- Considered, rejected. rules_lang scopes source-language ASTs
  and translators; PDF is an artifact format. Putting an artifact
  provider there stretches the term and creates the same "heavy
  dep for a small provider" problem as (B), only worse.

**Recommendation: (A).** Three-line registry entry, clean
ownership, future-proof.

### Coordination ask

For the rules_texlive author:

1. Does (A) work for you — a tiny `rules_pdf` you depend on for the
   provider type alongside your existing build?
2. Are the fields right? `source_kind` / `page_count` /
   `logical_name` are best-guess minimum-viable; do you need
   `bookmarks` / `creation_metadata` / anything else for the LaTeX
   include path?
3. Naming — is `PdfDocumentInfo` the right name vs.
   `PdfArtifactInfo`, `PdfInfo` etc.?

### Concrete next steps if (A) is approved

1. Create `fastverk/rules_pdf` repo (~10 lines of Starlark).
2. Register `rules_pdf 0.0.1` in the bazel-registry.
3. `rules_puml 0.0.3`: `puml_diagram` emits `PdfDocumentInfo` when
   `output_format = "pdf"`.
4. `rules_texlive`: `tex_paper` emits `PdfDocumentInfo`; `tex_paper`
   accepts `diagrams = [...]` where each is a label producing
   `PdfDocumentInfo`. LaTeX includes resolve by `logical_name`.
5. `agora/papers/grounding`: convert the TikZ pipeline figure to a
   `puml_diagram(output_format = "pdf")` and depend on it from the
   paper target. Demonstration of end-to-end integration.

Steps 3-5 are independent — rules_puml 0.0.3 ships as soon as
rules_pdf 0.0.1 lands; agora's paper consumes when both are in.
