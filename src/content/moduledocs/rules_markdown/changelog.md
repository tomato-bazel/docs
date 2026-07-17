---
title: "Changelog"
module: "rules_markdown"
---

All notable changes to `rules_markdown`.

### 0.0.3

Additive — no migration needed.

#### Added
- **Named template slots.** A `markdown_fragment(slot = "x")` routes to a
  `<!-- FRAGMENTS:x -->` placeholder, so generated content can be placed at
  specific spots in a template (e.g. two tables at two locations) instead of all
  concatenated at the single `<!-- FRAGMENTS -->`. The default (unnamed) slot is
  unchanged; a slot with fragments but no matching placeholder is a build error.

### 0.0.2

Additive — no migration needed.

#### Added
- Stardoc reference docs (`//docs`, `bazel run //docs:update`) + a `bzl_library`
  for the public API surface.

### 0.0.1

Initial release.

#### Added
- **`markdown_fragment`** — declare one composable markdown section (a body via
  `src` or inline `content`, an optional `title` heading injected at `level`, a
  deep-link `handle` via `anchor`, and `deps` on child fragments).
- **`markdown_document`** — aggregate fragments (ordered by `weight`) into one
  rendered document: heading injection, generated TOC, optional prose
  `template` (`<!-- FRAGMENTS -->` / `<!-- TOC -->`), and `mdref:<handle>`
  cross-fragment deep-link resolution with a dangling-link gate (`link_check`).
  `write_to` adds a `<name>.write` materialization target + `<name>.write_test`
  drift gate via `write_source_files`.
- **`markdown_link_aspect`** — collect fragments across the build graph from a
  `markdown_document`'s `roots`.
- Providers `MarkdownFragmentInfo` / `MarkdownDocInfo` (the latter exposes the
  rendered doc + an `anchor_index` of handle -> final slug).

#### Notes
- The v0.1 renderer (`markdown/private/md_gen.py`) is parse-free and runs via
  `run_shell` (host `python3`). A v0.2 will swap in a hermetic CommonMark
  renderer (comrak) for full GFM parity + body-heading verification, and add
  Bazel-checked deep-link edges + sub-heading (`export_anchors`) deep links.
