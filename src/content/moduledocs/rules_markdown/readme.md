---
title: "Overview"
module: "rules_markdown"
---

Bazel rules to compose markdown **fragments** into **documents**, with a
deep-linking aspect that resolves cross-target anchors at build time.

Each section of a doc is a `markdown_fragment` target; a `markdown_document`
aggregates them (ordered by weight) into one rendered file — with a generated
table of contents, an optional prose template, and `mdref:<handle>` deep links
that resolve to the right in-document anchor (and fail the build if they
dangle). Docs assemble from the build graph the same way code does.

`rules_readme` is a thin façade on top for the dominant case (a templated
README materialized into the source tree).

## Install

```starlark
bazel_dep(name = "rules_markdown", version = "0.0.1")
```

## Usage

```starlark
load("@rules_markdown//markdown:defs.bzl", "markdown_fragment", "markdown_document")

markdown_fragment(name = "intro", src = "intro.md", title = "Introduction", weight = 0)
markdown_fragment(name = "usage", src = "usage.md", title = "Usage", weight = 10)

markdown_document(
    name = "guide",
    out = "GUIDE.md",
    template = "GUIDE.md.tmpl",   # has <!-- TOC --> and <!-- FRAGMENTS -->
    fragments = [":intro", ":usage"],
    write_to = "GUIDE.md",        # bazel run //:guide.write ; bazel test //:guide.write_test
)
```

A fragment deep-links to another by writing `mdref:<handle>` in its body, where
`<handle>` is the target fragment's `anchor` (default: its target name):

```markdown
See [the introduction](https://github.com/tomato-bazel/rules_markdown/blob/main/mdref:intro) for the idea.
```

`md_gen` rewrites that to the Introduction section's final anchor; with
`link_check = True` (the default) a `mdref:` to an unknown handle fails the
build.

See [`examples/basic`](https://github.com/tomato-bazel/rules_markdown/blob/main/examples/basic) for a complete, building example.

## Status

`0.0.1` — composition, ordering, TOC, template splice, deep-link resolution +
dangling-link gate, `write_source_files` materialization. The renderer is a
parse-free Python tool (host `python3`); a v0.2 will move to a hermetic
CommonMark renderer (comrak) + Bazel-checked deep-link edges. See the
[CHANGELOG](https://github.com/tomato-bazel/rules_markdown/blob/main/CHANGELOG.md).
