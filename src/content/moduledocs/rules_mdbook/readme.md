---
title: "Overview"
module: "rules_mdbook"
---

Bazel rules for [mdbook](https://rust-lang.github.io/mdBook/). Fetches the
prebuilt mdbook binary (plus mdbook-mermaid) and orchestrates a hermetic
`mdbook build` from a Bazel-managed sandbox.

- **module extension**: `mdbook` — auto-creates `@mdbook` + `@mdbook_mermaid` external repos. See [docs/extensions.md](#doc-extensions).
- **toolchain**: `mdbook_toolchain` — wraps the mdbook binary; resolved via `@rules_mdbook//mdbook:toolchain_type`. See [docs/toolchains.md](#doc-toolchains).
- **rules**:
  - `mdbook_book` — runs `mdbook build` over a staged source tree, packages HTML as `.tar.gz`.
  - `mdbook_serve` — `bazel run //path:serve` → `mdbook serve` with watch + live reload over the live source tree.

  See [docs/defs.md](#doc-defs).

## Install

Add the registry to your `.bazelrc`:

```
common --registry=https://registry.fastverk.com/
common --registry=https://bcr.bazel.build/
```

In your `MODULE.bazel`:

```python
bazel_dep(name = "rules_mdbook", version = "0.2.0")

mdbook = use_extension("@rules_mdbook//mdbook:extensions.bzl", "mdbook")
use_repo(mdbook, "mdbook", "mdbook_mermaid")
register_toolchains("@mdbook//:mdbook_toolchain_def")
```

Override versions if needed:

```python
mdbook.toolchain(
    mdbook_version  = "0.5.2",
    mermaid_version = "0.17.0",
)
```

## Quick start

Standard mdbook layout in your repo:

```
docs/
├── BUILD.bazel
├── book.toml
└── src/
    ├── SUMMARY.md
    ├── intro.md
    └── ...
```

In `docs/BUILD.bazel`:

```python
load("@rules_mdbook//mdbook:defs.bzl", "mdbook_book")

mdbook_book(
    name      = "site",
    book_toml = "book.toml",
    srcs      = glob(["src/**/*.md"]),
    plugins   = ["@mdbook_mermaid//:mdbook-mermaid"],
    out       = "site.tar.gz",
)
```

`bazel build //docs:site` produces `bazel-bin/docs/site.tar.gz` containing
the rendered HTML.

## How it works

`mdbook_book`:

1. Stages `book.toml` + every src file into a sandbox dir at their
   package-relative paths (minus `src_strip_prefix`).
2. Copies the mdbook binary and each plugin into the sandbox's `bin/`
   under their bare filenames (so mdbook can resolve plugins by name on
   `PATH`).
3. Runs `mdbook build` from the sandbox root.
4. Tars `book/html/` (or `book/`, whichever the mdbook backend wrote)
   into the declared `out`.

The `MdbookSiteInfo` provider also returned by the rule wraps the
tarball file — downstream rules (a `mdbook_serve` wrapper, a deploy
target, link-check gates) can consume sites programmatically without
re-running mdbook.

### Hermeticity

| Layer            | Pinned by                                                       |
| ---------------- | --------------------------------------------------------------- |
| mdbook binary    | `sha256` in [`mdbook/private/known_versions.bzl`](https://github.com/tomato-bazel/rules_mdbook/blob/main/mdbook/private/known_versions.bzl) per `(version, platform)` |
| mermaid plugin   | same table                                                      |
| Source tree      | Bazel's normal file-tracking (srcs label_list)                  |

Unpinned versions download unverified (warning emitted). Add an entry
to `known_versions.bzl` to lock a new version — compute with
`curl -fsSL <url> | shasum -a 256`.

## Scope and non-goals

This module intentionally stays small. It provides the **generally
reusable** piece — fetching mdbook + plugins + running `mdbook build`
hermetically. Project-specific bits stay in your repo:

- Custom mdbook preprocessors (RFC autolinking, frontmatter stripping, …)
  — keep them as your own `cc_binary` / `rust_binary` / `sh_binary` and
  pass them via the `plugins` attr.
- Source-tree staging that reorganizes a non-standard layout into what
  `book.toml` expects — keep as a project-local script invoked before
  `mdbook_book`.
- Linkcheck — pass `mdbook-linkcheck` (or `mdbook-linkcheck2`) via
  `plugins` like any other plugin.

## Compatibility

- **Bazel**: 7.4+, bzlmod required.
- **mdbook**: 0.5.2 pinned by default. Bump via `known_versions.bzl`.
- **Platforms**: `darwin_aarch64`, `darwin_x86_64`, `linux_x86_64`,
  `windows_x86_64` (per upstream release coverage).

## Contributing

Reference docs (`docs/defs.md`, `docs/extensions.md`) are stardoc-generated
from the `.bzl` docstrings and committed to source. After editing a rule
docstring:

```sh
bazel run //docs:update
```

CI gates this via `bazel test //docs/...` (diff_test against the
committed output) and the smoke build in `examples/smoke/`.

## License

MIT.
