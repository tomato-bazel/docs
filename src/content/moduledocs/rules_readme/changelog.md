---
title: "Changelog"
module: "rules_readme"
---

All notable changes to `rules_readme`.

### 0.0.3

Additive — no migration needed.

#### Added
- Bumps `rules_markdown` to 0.0.3 — named template slots
  (`markdown_fragment(slot = "x")` → `<!-- FRAGMENTS:x -->`) now flow through
  `readme()` / `markdown_fragment`.

### 0.0.2

Additive — no migration needed.

#### Added
- Stardoc reference docs (`//docs`, `bazel run //docs:update`) + a `bzl_library`.
- Bumps `rules_markdown` to 0.0.2.

### 0.0.1

Initial release.

#### Added
- **`readme`** — a thin façade over `rules_markdown`'s `markdown_document` with
  README defaults: `write_to` defaults to `"README.md"`, so `readme(...)` creates
  `<name>.write` (materialize) + `<name>.write_test` (drift gate) out of the box
  via `write_source_files`. Pass `write_to = None` to opt out.
- Re-exports `markdown_fragment` + `markdown_document` so a consumer can load the
  whole README surface from one place.
