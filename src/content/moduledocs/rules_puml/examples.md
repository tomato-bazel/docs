---
title: "Usage"
module: "rules_puml"
---

Real usage, taken from the module's `examples/`.

### examples/pipeline/BUILD.bazel

```starlark
load("@rules_puml//puml:defs.bzl", "puml_diagram", "puml_library")

# Single-source example: one architecture diagram, one .puml file.
puml_diagram(
    name = "architecture_svg",
    src = "architecture.puml",
    output_format = "svg",
)

puml_diagram(
    name = "architecture_png",
    src = "architecture.puml",
    output_format = "png",
)

# PDF rendering (0.0.2+) — vector PDF directly embeddable in LaTeX
# papers via `\includegraphics{architecture_pdf.pdf}`. No external
# toolchain needed; the renderer's classpath includes Apache Batik
# + FOP for the SVG→PDF step inside the same JVM invocation.
puml_diagram(
    name = "architecture_pdf",
    src = "architecture.puml",
    output_format = "pdf",
)

# Composed example: same diagram, split into typed fragments to
# demonstrate the V1-shape composition. Preamble first, components
# next, interactions last — declaration order is compose order.
puml_library(
    name = "preamble_lib",
    srcs = ["fragments/preamble.puml"],
)

puml_library(
    name = "actors_lib",
    srcs = ["fragments/actors.puml"],
)

puml_library(
    name = "components_lib",
    srcs = ["fragments/components.puml"],
)

puml_library(
    name = "interactions_lib",
    srcs = ["fragments/interactions.puml"],
)

puml_library(
    name = "closer_lib",
    srcs = ["fragments/closer.puml"],
)

puml_diagram(
    name = "architecture_composed",
    libs = [
        ":preamble_lib",
        ":actors_lib",
        ":components_lib",
        ":interactions_lib",
        ":closer_lib",
    ],
    output_format = "svg",
)
```
