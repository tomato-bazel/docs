---
title: "Usage"
module: "rules_markdown"
---

Real usage, taken from the module's `examples/`.

### examples/basic/BUILD.bazel

```starlark
load("//markdown:defs.bzl", "markdown_document", "markdown_fragment")

# Two composable sections. `usage` deep-links into `intro` via mdref:intro.
markdown_fragment(
    name = "intro",
    src = "intro.md",
    title = "Introduction",
    weight = 0,
)

markdown_fragment(
    name = "usage",
    src = "usage.md",
    title = "Usage",
    weight = 10,
)

# Aggregate into GUIDE.md with a TOC + a prose template; resolve + check the
# deep link; materialize into the tree (GUIDE.md) with a drift gate.
markdown_document(
    name = "guide",
    out = "GUIDE.md",
    template = "README.md.tmpl",
    fragments = [
        ":intro",
        ":usage",
    ],
    link_check = True,
    toc = True,
    write_to = "GUIDE.md",
)
```

### examples/slots/BUILD.bazel

```starlark
load("//markdown:defs.bzl", "markdown_document", "markdown_fragment")

# Two fragments targeting two named template slots — generated content placed at
# specific spots (the gitlab-profile two-tables-at-two-locations pattern).
markdown_fragment(
    name = "a",
    content = "Content routed to the **alpha** slot.",
    slot = "alpha",
)

markdown_fragment(
    name = "b",
    content = "Content routed to the **beta** slot.",
    slot = "beta",
)

markdown_document(
    name = "doc",
    out = "SLOTS.md",
    template = "tmpl.md",
    fragments = [
        ":a",
        ":b",
    ],
    link_check = False,
    toc = False,
    write_to = "SLOTS.md",
)
```
