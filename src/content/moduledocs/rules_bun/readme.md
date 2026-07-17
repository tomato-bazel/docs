---
title: "Overview"
module: "rules_bun"
---

Bazel rules for [Bun](https://bun.sh/). Fetches the prebuilt Bun binary,
wraps it as a Bazel toolchain, and provides hermetic `bun test` +
sandbox-escaping `bun run` runners, plus `bun build` bundling and
`bun build --compile` standalone-executable rules.

- **module extensions** (see [docs/extensions.md](#doc-extensions)):
  - `bun` — auto-creates `@bun` with the host-platform binary.
  - `bun_deps` — Bun-native `node_modules` staging. `bun_deps.install(...)`
    runs `bun install --frozen-lockfile` from a `package.json` + `bun.lock`
    and exposes the result as `@<name>//:node_modules`. The pure-Bun
    replacement for aspect_rules_js's `npm_translate_lock` +
    `npm_link_all_packages` — **no pnpm-lock, no aspect_rules_js**.
- **toolchain**: `bun_toolchain` — wraps the binary; resolved via `@rules_bun//bun:toolchain_type`. See [docs/toolchains.md](#doc-toolchains).
- **rules**:
  - `bun_test` — runs `bun test` over listed source files as a Bazel test target (optional `node_modules` for dep resolution).
  - `bun_run` — `bazel run //path:target` macro: invokes `bun run <script>` against the live workspace source.
  - `bun_bundle` — bundle a JS/TS entry point into one self-contained file via `bun build` (Bun-native `node_modules` path or legacy aspect `driver` path).
  - `bun_compile` — compile a JS/TS entry point into a standalone native executable via `bun build --compile`.

  See [docs/defs.md](#doc-defs).

## Install

Add the registry to your `.bazelrc`:

```
common --registry=https://registry.fastverk.com/
common --registry=https://bcr.bazel.build/
```

In your `MODULE.bazel`:

```python
bazel_dep(name = "rules_bun", version = "0.4.0")

bun = use_extension("@rules_bun//bun:extensions.bzl", "bun")
use_repo(bun, "bun")
register_toolchains("@bun//:bun_toolchain_def")
```

For the **Bun-native** dependency flow (recommended — no pnpm, no
aspect_rules_js) you only need a `package.json` + `bun.lock`:

```python
bun_deps = use_extension("@rules_bun//bun:extensions.bzl", "bun_deps")
bun_deps.install(
    name = "npm",
    package_json = "//:package.json",
    lock = "//:bun.lock",
)
use_repo(bun_deps, "npm")
```

`bun_bundle` / `bun_compile` then consume `@npm//:node_modules` directly
(see below). The **legacy** path instead drives `bun build` through an
aspect_rules_js `js_binary`, which needs `aspect_rules_js` (and a node
toolchain) plus a pnpm-lock:

```python
bazel_dep(name = "aspect_rules_js", version = "3.1.2")
```

Pin a specific version:

```python
bun.toolchain(version = "1.3.14")
```

## Quick start

Hermetic tests:

```python
load("@rules_bun//bun:defs.bzl", "bun_test")

bun_test(
    name = "math_tests",
    srcs = glob(["*.test.ts"]),
    data = ["bunfig.toml"],
)
```

`bazel test //:math_tests` runs `bun test <each src>` with `NO_COLOR=1` + `DO_NOT_TRACK=1` set.

Dev runner:

```python
load("@rules_bun//bun:defs.bzl", "bun_run")

bun_run(
    name = "build",
    script = "scripts/build.ts",
)
```

`bazel run //:build -- --watch` invokes `bun run scripts/build.ts --watch` against your live workspace source (not the Bazel sandbox). Useful for the dev loop where you want HMR / on-demand module resolution / filesystem watch outside the runfiles tree.

### Bun-native flow (no aspect_rules_js, no pnpm-lock)

Stage `node_modules` with Bun and consume it from `bun_test` /
`bun_bundle`. Your repo needs only `package.json` + `bun.lock` (generate
the lock with `bun install`):

```python
# MODULE.bazel
bun_deps = use_extension("@rules_bun//bun:extensions.bzl", "bun_deps")
bun_deps.install(
    name = "npm",
    package_json = "//:package.json",
    lock = "//:bun.lock",
)
use_repo(bun_deps, "npm")
```

```python
# BUILD.bazel
load("@rules_bun//bun:defs.bzl", "bun_bundle", "bun_test")

# bun test resolves deps from the staged closure (no bun install).
bun_test(
    name = "unit",
    srcs = glob(["*.test.ts"]),
    node_modules = "@npm//:node_modules",
)

# bun build runs directly via the toolchain Bun — no js_binary driver.
bun_bundle(
    name = "bundle",
    srcs = ["index.ts"],          # entry + local modules
    entry = "pkg/index.ts",       # workspace-relative entry path
    out = "app.mjs",
    node_modules = "@npm//:node_modules",
    external = ["pg-native"],
)
```

`bun_install` fetches the sha-pinned host-platform Bun and runs `bun
install --frozen-lockfile`; determinism comes from `bun.lock`. The build
rules symlink the staged `node_modules` next to a real copy of the entry
so Bun's resolver walks up into it. See
[`examples/install/`](https://github.com/tomato-bazel/rules_bun/blob/main/examples/install) for the runnable end-to-end smoke.

### Legacy aspect_rules_js flow

Bundle a JS/TS entry into one file:

```python
load("@aspect_rules_js//js:defs.bzl", "js_binary")
load("@rules_bun//bun:defs.bzl", "bun_bundle")

# The driver js_binary stages the bundle entry + its full linked
# node_modules closure into runfiles; bun_bundle runs it as a build
# action so that closure materializes, then shells out to the hermetic
# Bun toolchain. `data` must list the entry's :lib + every npm-link dep.
js_binary(
    name = "bundle_driver",
    entry_point = "@rules_bun//bun:bun-build-driver",
    data = [":lib", ":node_modules/pg", ":node_modules/source-map-support"],
)

bun_bundle(
    name = "bundle",
    driver = ":bundle_driver",
    entry = "packages/api/index.js",
    out = "api.mjs",
    format = "esm",
    # Keep native addons / runtime requires out of the bundle.
    external = ["pg-native", "@aws-sdk/client-ssm", "encoding", "source-map-support"],
)
```

`bazel build //:bundle` emits a single self-contained `api.mjs`. Bun
resolves the import graph from the staged `node_modules` natively (no
`bun install`). The `external` modules are left as runtime `require`s
rather than inlined — provide them alongside the bundle.

Compile a JS/TS entry into a standalone native executable:

```python
load("@aspect_rules_js//js:defs.bzl", "js_binary")
load("@rules_bun//bun:defs.bzl", "bun_compile")

js_binary(
    name = "cli_driver",
    entry_point = "@rules_bun//bun:bun-build-driver",
    data = [":lib", ":node_modules/pg"],
)

bun_compile(
    name = "cli",
    driver = ":cli_driver",
    entry = "apps/cli/index.js",
    out = "cli",
    # Omit `target` to compile for the host; set it to cross-compile,
    # e.g. "bun-linux-x64-modern" for a linux OCI image.
    target = "bun-linux-x64-modern",
    external = ["pg-native"],
)
```

The output is a runnable executable (`bazel run //:cli`, or drop it into
an OCI image). `--compile` bundles the Bun runtime + your JS into one
file. Native `.node` addons are NOT embedded — keep them `external` and
ship the `.node` files at runtime next to the binary.

> Cross-target note: on a macOS dev host, `target = ""` compiles a
> Mach-O binary; CI on linux compiles an ELF. For a linux OCI image,
> set `target = "bun-linux-x64-modern"` (or the `arm64` / `musl`
> variant) explicitly so the binary matches the image regardless of
> which host built it. A future enhancement could derive `target` from
> the Bazel `--platforms` via a transition; for now pass the string.

See [`examples/`](https://github.com/tomato-bazel/rules_bun/blob/main/examples) for runnable `bun_bundle` + `bun_compile` smoke tests.

## How it works

The module extension fetches a sha-pinned Bun binary for the host platform from [oven-sh/bun GitHub releases](https://github.com/oven-sh/bun/releases). The release zip extracts to `bun-<platform>/bun`; the repository rule strips the outer dir so the binary lands at `@bun//:bun`.

`bun_toolchain` wraps that binary as a Bazel toolchain. `bun_test` resolves the toolchain via `@rules_bun//bun:toolchain_type` and runs `bun test` over each src in a runfiles-staged sandbox. `bun_run` is a macro that emits a `sh_binary` escaping the sandbox to run against `BUILD_WORKSPACE_DIRECTORY` directly.

The `bun_deps` extension's `bun_install` repo rule fetches the same sha-pinned host-platform Bun, copies your `package.json` + `bun.lock`, and runs `bun install --frozen-lockfile` to materialize `node_modules`. Like aspect's npm extension (and `http_archive`), a repo rule is allowed network I/O — `--frozen-lockfile` makes the result a pure function of the committed `bun.lock`, so the only fetch is what the lock pins. Lifecycle scripts are skipped (`--ignore-scripts`) unless you `--trust` a package via `trusted_dependencies`.

### Hermeticity + determinism

| Layer              | Pinned by                                                     |
| ------------------ | ------------------------------------------------------------- |
| Bun binary         | `sha256` in [`bun/private/known_versions.bzl`](https://github.com/tomato-bazel/rules_bun/blob/main/bun/private/known_versions.bzl) per `(version, platform)` |
| `node_modules`     | `bun.lock` (consumed under `bun install --frozen-lockfile`; scripts off by default) |
| Test env           | `bun_test` sets `NO_COLOR=1`, `DO_NOT_TRACK=1`, `BUN_INSTALL_NO_TRACK=1` |
| `bun_run` env      | same, with `NO_COLOR` overridable for callers that want colored output |

`bun_run` is **intentionally non-hermetic** — Bun's dev mode (HMR, watch, on-demand module resolution) needs filesystem access outside the runfiles tree. Counterpart to `bun_test`'s hermetic execution.

## Compatibility

- **Bazel**: 7.4+, bzlmod required.
- **Bun**: 1.3.14 pinned by default. Bump via `known_versions.bzl`.
- **Platforms**: `darwin-aarch64`, `darwin-x64`, `linux-aarch64`, `linux-x64`. Baseline + musl + Windows variants doable — add an entry to the table when needed.

## Contributing

Reference docs (`docs/{defs,extensions,toolchains}.md`) are stardoc-generated. After editing rule docstrings:

```sh
bazel run //docs:update
```

CI gates this via `bazel test //docs/...`.

## License

MIT.
