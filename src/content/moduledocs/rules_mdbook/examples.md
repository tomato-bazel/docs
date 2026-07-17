---
title: "Usage"
module: "rules_mdbook"
---

Real usage, taken from the module's `examples/`.

### examples/smoke/BUILD.bazel

```starlark
load("@rules_mdbook//mdbook:defs.bzl", "mdbook_book", "mdbook_serve")

mdbook_book(
    name = "site",
    srcs = glob(["src/**/*.md"]),
    out = "site.tar.gz",
    book_toml = "book.toml",
    plugins = ["@mdbook_mermaid//:mdbook-mermaid"],
)

# `bazel run //examples/smoke:serve` -> mdbook serve at localhost:3000
# with watch + live reload over the live source tree.
mdbook_serve(
    name = "serve",
    plugins = ["@mdbook_mermaid//:mdbook-mermaid"],
)
```

### examples/treesrc/BUILD.bazel

```starlark
load("@rules_mdbook//mdbook:defs.bzl", "mdbook_book")
load(":gen_tree.bzl", "gen_tree")

# Upstream generator: emits a directory of chapters whose filenames aren't
# known statically. The dir is named "chapters" so it stages at $STAGE/chapters,
# matching book.toml's `src = "chapters"`.
gen_tree(
    name = "chapters",
)

# mdbook_book consumes the directory directly (recursive copy) alongside the
# committed book.toml.
mdbook_book(
    name = "site",
    srcs = [":chapters"],
    out = "site.tar.gz",
    book_toml = "book.toml",
)
```
