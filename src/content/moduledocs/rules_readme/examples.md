---
title: "Usage"
module: "rules_readme"
---

Real usage, taken from the module's `examples/`.

### examples/profile/BUILD.bazel

```starlark
load("//readme:defs.bzl", "markdown_fragment", "readme")

markdown_fragment(
    name = "overview",
    src = "overview.md",
    title = "Overview",
    weight = 0,
)

markdown_fragment(
    name = "repos",
    src = "repos.md",
    title = "Repositories",
    weight = 10,
)

# readme() defaults write_to = "README.md", so this auto-creates:
#   bazel run  //examples/profile:readme.write        (materialize README.md)
#   bazel test //examples/profile:readme.write_test   (drift gate)
readme(
    name = "readme",
    template = "README.md.tmpl",
    fragments = [
        ":overview",
        ":repos",
    ],
)
```
