---
title: "Overview"
module: "rules_tomato"
---

The tomato-bazel **foundation** module — conventions + coordination on the
"how to build one target / one repo" axis. (Its sibling, `rules_ci`, owns the
project-orchestration axis: `tomato_project` + release/versioning.)

Three things:

## 1. Convention macros — [`//tomato:defs.bzl`](https://github.com/tomato-bazel/rules_tomato/blob/main/tomato/defs.bzl)

- **`tomato_mdbook`** — a brand-themed mdBook in one call: wraps
  `rules_mdbook`'s `mdbook_book` and stages `@brand//mdbook:theme` at the book's
  `theme/`, so every docs site is branded by construction.

  ```python
  load("@rules_tomato//tomato:defs.bzl", "tomato_mdbook")
  tomato_mdbook(name = "site")   # globs src/**/*.md, themes with @brand, -> site.tar.gz
  ```

  (More to follow: `tomato_rust_library`, etc.)

## 2. The dependency BOM — [`//bom/versions.json`](https://github.com/tomato-bazel/rules_tomato/blob/main/bom/versions.json)

The canonical third-party + constellation versions. It's a **manifest** (data),
not transitive `bazel_dep`s — so consuming `rules_tomato` doesn't drag the
whole constellation into your graph. The **`rels deps` ratchet** (implemented in `bazel-registry//tools/rels`) audits
every repo's `MODULE.bazel` against it and, with `--write`, bumps drifting pins up
(forward-only — repos ahead of the BOM are reported, never downgraded). `rels
deps` exits non-zero on behind-drift (the CI gate). This is how ~60 repos stay in
sync without a monorepo (first run: 38 pins behind across 20 repos — `bazel_skylib`
1.7.1→1.8.2, `platforms` 0.0.10→1.0.0, `rules_shell` 0.4.1→0.6.1, …).

## 3. The shared `.bazelrc` — [`//bazelrc:common.bazelrc`](https://github.com/tomato-bazel/rules_tomato/blob/main/bazelrc/common.bazelrc)

The registry chain + flags, in one place, so they stop drifting. Repos
`try-import` it (the ratchet syncs a vendored copy).

## Status

v0.0.1 — macros + BOM + shared bazelrc scaffolded; `//tomato:defs` builds. The
`rels deps` ratchet against the BOM is implemented (`bazel-registry//tools/rels`).
Next: dogfood `tomato_mdbook` in `fastverk/docs`, add `tomato_rust_library`.
