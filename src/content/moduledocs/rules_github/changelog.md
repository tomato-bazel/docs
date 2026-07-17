---
title: "Changelog"
module: "rules_github"
---

All notable changes to rules_github. The format is loosely
[Keep a Changelog](https://keepachangelog.com/) — version headers
mirror the published bazel-registry entries.

### 0.1.2 — commit-pinned sources + bzlmod extension

- `github_source_repository` gains a `commit` attr: fetch
  `archive/<sha>.tar.gz` for repos without release tags (e.g. research
  repos like `HowieHwong/MetaTool`). `version` and `commit` are mutually
  exclusive; exactly one is required. `strip_prefix_template` now also
  substitutes `{commit}`.
- New `//github:extensions.bzl` module extension (`github`) with
  `github.source` / `github.binary` tag classes, so the repository rules
  are usable directly from `MODULE.bazel` under bzlmod without a
  hand-rolled consumer extension.

### 0.1.1 — public bzl_library targets

- Mark `bzl_library` targets as public so downstream stardoc builds in
  consumer repos (rules_bun, rules_postgres, …) can depend on them.

### 0.1.0 — initial release

- First cut of shared Bazel repository rules for fetching content from
  GitHub releases: `github_binary_repository` (per-platform release
  asset URLs) and `github_source_repository` (tag tarball URLs). Acts
  as the common substrate beneath fastverk's other `rules_*` modules.
