---
title: "Overview"
module: "rules_readme"
---

README-shaped sugar over [`rules_markdown`](https://github.com/tomato-bazel/rules_readme/blob/main/rules_markdown). Compose a
templated README from per-section `markdown_fragment` targets and materialize it
into the source tree, with a drift gate — the dominant docs use case in one rule.

## Install

```starlark
bazel_dep(name = "rules_readme", version = "0.0.1")
```

## Usage

```starlark
load("@rules_readme//readme:defs.bzl", "readme", "markdown_fragment")

markdown_fragment(name = "overview", src = "overview.md", title = "Overview", weight = 0)
markdown_fragment(name = "repos",    src = "repos.md",    title = "Repositories", weight = 10)

readme(
    name = "readme",
    template = "README.md.tmpl",        # has <!-- TOC --> and <!-- FRAGMENTS -->
    fragments = [":overview", ":repos"],
    # write_to defaults to "README.md" -> creates readme.write + readme.write_test
)
```

```sh
bazel run  //:readme.write        # regenerate README.md in the tree
bazel test //:readme.write_test   # CI drift gate
```

`readme()` is the dominant-case macro; reach for `markdown_document`
(re-exported here, and in `rules_markdown`) when you want a non-README doc or to
opt out of materialization (`write_to = None`). Deep links, TOC, and the
fragment model are all `rules_markdown` — see its
[README](https://github.com/tomato-bazel/rules_readme/blob/main/rules_markdown/README.md).

## Status

`0.0.1`. See the [CHANGELOG](https://github.com/tomato-bazel/rules_readme/blob/main/CHANGELOG.md).
