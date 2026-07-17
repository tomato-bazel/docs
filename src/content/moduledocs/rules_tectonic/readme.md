---
title: "Overview"
module: "rules_tectonic"
---

Bazel rules to compile LaTeX → PDF using
[tectonic](https://tectonic-typesetting.github.io/), the modern,
self-bootstrapping TeX engine. Prebuilt release binaries are fetched
per host platform via
[rules_github](https://github.com/fastverk/rules_github); no system
LaTeX install required.

## Install

Add the fastverk registry to your `.bazelrc`:

```
common --registry=https://registry.fastverk.com/
common --registry=https://bcr.bazel.build/
```

In your `MODULE.bazel`:

```python
bazel_dep(name = "rules_tectonic", version = "0.1.0")

tectonic = use_extension("@rules_tectonic//tectonic:extensions.bzl", "tectonic")
use_repo(tectonic, "tectonic")
register_toolchains("@tectonic//:tectonic_toolchain_def")
```

## Quick start

```python
load("@rules_tectonic//tectonic:defs.bzl", "tectonic_pdf")

tectonic_pdf(
    name = "paper",
    main = "main.tex",
    srcs = [
        "arxiv.sty",
        "figs/loss_curve.png",
        "refs.bib",
    ],
)
```

`bazel build //paper:paper` writes `paper.pdf` into `bazel-bin`.

## Pinning a non-default version

```python
tectonic = use_extension("@rules_tectonic//tectonic:extensions.bzl", "tectonic")
tectonic.toolchain(version = "0.15.0")
use_repo(tectonic, "tectonic")
```

The pinned version must have its per-platform sha256s recorded in
`tectonic/private/known_versions.bzl`. PRs welcome to add newer
releases.

## Supported platforms

| Canonical id | Upstream target triple |
|---|---|
| `darwin_aarch64` | `aarch64-apple-darwin` |
| `darwin_x86_64` | `x86_64-apple-darwin` |
| `linux_aarch64` | `aarch64-unknown-linux-musl` |
| `linux_x86_64` | `x86_64-unknown-linux-musl` |

Windows is not currently supported by this module; PRs welcome.

## Notes on hermeticity

Tectonic's first build per Bazel `output_base` fetches font + class
files from the tectonic bundle CDN
(`note: downloading cmr10.pfb`...). These are cached at
`~/.cache/Tectonic/`; subsequent builds are fully offline. The action
runs with `use_default_shell_env = True` so the cache is reused across
invocations.

For strict-hermetic builds, pre-fetch the bundle as a `http_archive`
and pass `--web-bundle=file://...` to tectonic. Not currently
exposed; file an issue if needed.

## License

Apache-2.0.
