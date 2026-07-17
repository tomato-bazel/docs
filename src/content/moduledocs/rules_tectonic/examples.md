---
title: "Usage"
module: "rules_tectonic"
---

Real usage, taken from the module's `examples/`.

### examples/BUILD.bazel

```starlark
load("@rules_tectonic//tectonic:defs.bzl", "tectonic_pdf")

# `bazel build //examples:smoke` from this repo's checkout proves the
# rule wires up end-to-end. Consumers don't need this target.
tectonic_pdf(
    name = "smoke",
    main = "smoke.tex",
)
```

### examples/sectioned/BUILD.bazel

```starlark
load(
    "@rules_tectonic//tectonic:defs.bzl",
    "tex_paper",
    "tex_section",
)

# Smoke test for the v0.0.2 `tex_section` + `tex_paper` rules.
# Two sections in their own files, composed into a single PDF.
#
#   bazel build //examples/sectioned:sectioned_paper
#
# produces `sectioned_paper.pdf`.

tex_section(
    name = "intro",
    src = "intro.tex",
    section_label = "sec:intro",
)

tex_section(
    name = "body",
    src = "body.tex",
    section_label = "sec:body",
)

tex_paper(
    name = "sectioned_paper",
    preamble = "preamble.tex",
    sections = [
        ":intro",
        ":body",
    ],
)
```
