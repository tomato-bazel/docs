---
title: "Overview"
module: "rules_github"
---

Bazel repository rules for fetching content from GitHub releases — the
common substrate underneath fastverk's `rules_mdbook`, `rules_bun`,
`rules_postgres`, and anything else that pulls a sha-pinned prebuilt
binary or source tarball from a GitHub release.

Two repository rules:

- **`github_binary_repository`** — fetch a per-platform binary release asset (`releases/download/<tag>/<asset>` URL shape; mdbook, bun, ripgrep, jq, …).
- **`github_source_repository`** — fetch a source tarball from a tag (`archive/refs/tags/<tag>.tar.gz` URL shape; libpg_query and anything else that doesn't ship prebuilt assets but you want to build from source under Bazel).

See [docs/repositories.md](https://github.com/tomato-bazel/rules_github/blob/main/docs/repositories.md) for the full attribute reference.

## Install

Add the registry to your `.bazelrc`:

```
common --registry=https://registry.fastverk.com/
common --registry=https://bcr.bazel.build/
```

In your `MODULE.bazel`:

```python
bazel_dep(name = "rules_github", version = "0.1.0")
```

## Quick start

### Per-platform binary (mdbook-style)

```python
load("@rules_github//github:repositories.bzl", "github_binary_repository")

def _bun_ext_impl(_ctx):
    github_binary_repository(
        name = "bun",
        repo = "oven-sh/bun",
        version = "1.3.14",
        tag_format = "bun-v{version}",
        asset_template = "bun-{platform}.zip",
        strip_prefix_template = "bun-{platform}",
        platform_aliases = {
            "darwin_aarch64": "darwin-aarch64",
            "darwin_x86_64":  "darwin-x64",
            "linux_aarch64":  "linux-aarch64",
            "linux_x86_64":   "linux-x64",
        },
        platform_shas = {
            "darwin_aarch64": "d8b96221828ad6f97ac7ac0ab7e95872341af763001e8803e8267652c2652620",
            "linux_x86_64":   "951ee2aee855f08595aeec6225226a298d3fea83a3dcd6465c09cbccdf7e848f",
            # …
        },
        build_file_content = """
package(default_visibility = ["//visibility:public"])
exports_files(["bun"])
""",
    )

bun_ext = module_extension(implementation = _bun_ext_impl)
```

Canonical platform identifiers are `darwin_aarch64`, `darwin_x86_64`, `linux_x86_64`, `linux_aarch64`, `windows_x86_64`. `platform_aliases` maps these to whatever the upstream release naming uses (`aarch64-apple-darwin` for Rust-target convention, `darwin-aarch64` for Bun, …).

### Source tarball (libpg_query-style)

```python
load("@rules_github//github:repositories.bzl", "github_source_repository")

github_source_repository(
    name = "libpg_query",
    repo = "pganalyze/libpg_query",
    version = "17-6.2.2",
    tag_format = "{version}",         # libpg_query tags don't have a `v` prefix
    sha256 = "e68962c18dbf5890821511be6c5c42261170bf8bfd51a82ea9176069f3d0df8b",
    build_file_content = """
load("@rules_cc//cc:defs.bzl", "cc_library")
# … cc_library wiring …
""",
)
```

`strip_prefix_template` defaults to `<repo-basename>-<version>`, matching GitHub's auto-generated source tarball layout. Override only if upstream's tag-to-tarball-prefix mapping is non-standard.

## What's deliberately NOT here

- **Toolchain rules.** Each downstream `rules_*` (rules_mdbook, rules_bun, …) defines its own `ToolchainInfo` provider with project-specific fields. Wrapping the binary as a toolchain stays in the consumer's BUILD overlay.
- **Generic-HTTP fetching.** Non-GitHub URLs (e.g., `ftp.postgresql.org/pub/source/postgresql-17.6.tar.bz2` for the full PG source) need a different URL template. A sibling `http_archive_repository` could be added later; today, use Bazel's built-in `http_archive` directly.

## Compatibility

- **Bazel**: 7.4+, bzlmod required.
- **Platforms**: detection covers darwin × {aarch64, x86_64}, linux × {x86_64, aarch64}, windows × x86_64. Other platforms surface as an explicit `fail()` — extend `github/private/platforms.bzl` if needed.

## Contributing

Reference docs are stardoc-generated. After editing rule docstrings:

```sh
bazel run //docs:update
```

CI gates this via `bazel test //docs/...` + buildifier lint.

## License

MIT.
