---
title: "Changelog"
module: "rules_mdbook"
---

All notable changes to rules_mdbook. The format is loosely
[Keep a Changelog](https://keepachangelog.com/) — version headers
mirror the published bazel-registry entries.

### 0.3.0 — Delegate release fetching to rules_github

- Delegate mdbook + mdbook-mermaid release fetching to `rules_github`
  instead of hand-rolling the GitHub release download logic in-tree.
- Update the install snippet to point at `fastverk/bazel-registry`.

### 0.2.0 — Toolchain-driven resolution + mdbook_serve

- Switch mdbook resolution to a proper Bazel toolchain
  (`mdbook_toolchain` / `@rules_mdbook//mdbook:toolchain_type`) so consumers
  can override the binary cleanly.
- Add the `mdbook_serve` rule: `bazel run //path:serve` runs
  `mdbook serve` with watch + live-reload against the live source tree.

### 0.1.0 — Initial release

- First public cut of `rules_mdbook`: `mdbook` module extension that
  auto-creates `@mdbook` + `@mdbook_mermaid` external repos, and the
  `mdbook_book` rule that runs a hermetic `mdbook build` over a staged
  source tree and packages the HTML output as a `.tar.gz`.
