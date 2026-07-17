---
title: "Usage"
module: "rules_graphviz"
---

Real usage, taken from the module's `examples/`.

### examples/BUILD.bazel

```starlark
load("@rules_graphviz//graphviz:defs.bzl", "dot_corpus", "dot_diagram", "dot_pdf", "svg_pdf")

package(default_visibility = ["//visibility:public"])

# Default engine (dot) -> svg.
dot_diagram(
    name = "sample_svg",
    src = "sample.dot",
)

# A different layout engine, hermetically (no host graphviz).
dot_diagram(
    name = "sample_neato",
    src = "sample.dot",
    engine = "neato",
)

# Structured output.
dot_diagram(
    name = "sample_json",
    src = "sample.dot",
    output_format = "json",
)

dot_corpus(
    name = "all",
    srcs = ["sample.dot"],
)

# Vector PDF straight from .dot (dot -> svg -> pdf), hermetic — no host tools.
dot_pdf(
    name = "sample_pdf",
    src = "sample.dot",
)

# Or convert an existing SVG (here, the dot_diagram output above) to PDF.
svg_pdf(
    name = "sample_svg_pdf",
    src = ":sample_svg",
)
```
