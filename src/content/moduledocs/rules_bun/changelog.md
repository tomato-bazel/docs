---
title: "Changelog"
module: "rules_bun"
---

All notable changes to rules_bun. The format is loosely
[Keep a Changelog](https://keepachangelog.com/) — version headers
mirror the published bazel-registry entries.

### 0.4.0 — add bun_install (Bun-native node_modules; drop pnpm + aspect_rules_js)

- New `bun_deps` module extension with an `install` tag — a Bun-native
  replacement for aspect_rules_js's `npm_translate_lock` +
  `npm_link_all_packages`. `bun_deps.install(name, package_json, lock)`
  produces a repo `@<name>` whose `:node_modules` filegroup is an
  installed `node_modules` tree. The backing repo rule (`bun_install`)
  fetches a host-platform Bun (the same sha-pinned binary the toolchain
  extension uses, via `known_versions.bzl`), copies the consumer's
  `package.json` + `bun.lock` into the repo root, and runs `bun install
  --frozen-lockfile --no-progress` with a repo-pinned
  `BUN_INSTALL_CACHE_DIR` and `--ignore-scripts` (opt back in per package
  via `trusted_dependencies`). `package.json` + `bun.lock` are read as
  rule inputs so edits re-trigger the install; determinism comes from the
  lockfile (the only network I/O is the registry fetch the lock pins,
  exactly like aspect's npm extension + `http_archive`). So a pure-Bun
  repo needs ONLY `package.json` + `bun.lock` — no pnpm-lock, no
  aspect_rules_js.
- `bun_test` gains an optional `node_modules` attr (a
  `@<name>//:node_modules` label). When set, the closure is staged so
  `bun test` resolves dependency imports with no `bun install`. Because
  Bazel stages the test files as symlinks into the read-only source tree
  and Bun's resolver follows an entry's realpath, the runner copies the
  test files into a real staging dir and symlinks `node_modules` at its
  root so resolution stays inside the staged tree.
- `bun_bundle` + `bun_compile` gain a Bun-native path: pass `node_modules`
  (+ `srcs` for the entry + local modules) instead of a `driver`
  js_binary. On this path `bun build` runs directly via the toolchain Bun
  (no js_binary driver, no aspect_rules_js) — a small shell driver stages
  the entry into a real tree and symlinks the closure so Bun resolves the
  import graph. `driver` is now optional and mutually exclusive with
  `node_modules`; the legacy aspect path is unchanged for back-compat.
- `examples/install/`: a pure-Bun end-to-end smoke (one npm dep
  `is-number`, a local module) with `package.json` + `bun.lock`, a
  `bun_deps.install`, and a `bun_bundle` + two `bun_test`s consuming
  `@install_npm//:node_modules` — NO aspect_rules_js, NO pnpm-lock. Proves
  the flow: `bazel build //examples/install:bundle` +
  `bazel test //examples/install:resolve_test //examples/install:bundle_test`.

### 0.3.0 — add bun_bundle + bun_compile

- New `bun_bundle` rule: bundle a JS/TS entry point into one
  self-contained file via `bun build`. Takes a `driver` js_binary
  (entry point `@rules_bun//bun:bun-build-driver`) whose `data` stages
  the build entry plus its full linked `node_modules` closure;
  aspect_rules_js materializes that closure into the action's runfiles
  so Bun resolves the import graph natively (no `bun install`). Attrs:
  `format` (esm|cjs|iife, default `esm`), `target` (node|browser|bun,
  default `node`), and `external` (a repeatable `--external <name>` list
  for native addons / runtime requires like `pg-native`, `@aws-sdk/*`,
  `encoding`, `source-map-support`). Returns `BunBundleInfo`.
- New `bun_compile` rule: compile a JS/TS entry point into a standalone
  native executable (Bun runtime + bundled JS) via `bun build
  --compile`. Shares the driver with `bun_bundle` (via a `--compile`
  flag). The output is itself runnable, so `bazel run //pkg:target`
  works. Attrs: `target` (a Bun compile target triple such as
  `bun-linux-x64-modern` / `bun-darwin-arm64`; empty = host platform)
  and `external`. Returns `BunBinaryInfo`. Native `.node` addons are not
  embedded by `--compile` — keep them `external` and ship them at
  runtime alongside the binary.
- `bun-build-driver.mjs`: a single shared driver for both rules, wrapped
  in a public `js_library` at `@rules_bun//bun:bun-build-driver`. It
  re-anchors `--bun`/`--out` on `$JS_BINARY__EXECROOT`, chdirs into the
  `_main` runfiles root, and invokes the hermetic Bun toolchain.
- `aspect_rules_js` is now a (non-dev) `bazel_dep` — consumers already
  bring it to declare the driver js_binary.
- `examples/`: a `bun_bundle` smoke test (npm dep + local module + one
  `external`, asserts the bundle runs and the external is not inlined)
  and a host-target `bun_compile` smoke test (asserts the produced file
  is executable and runs). CI now runs `bazel test //...`.

### 0.2.1 — fix bun_test toolchain runfiles path under bzlmod

- `bun_test`'s generated runner failed to locate the hermetic Bun binary
  under bzlmod, exiting 127 (`exec: : not found`). Under bzlmod the
  toolchain Bun is an external repo file whose `short_path` is
  `../rules_bun++bun+bun/bun`; the runner built `BUN_BIN` as
  `${RUNFILES_DIR}/<short_path>`, so the leading `../` escaped the
  runfiles tree. Prefix with `_main/` (`${RUNFILES_DIR}/_main/<short_path>`)
  so the embedded `../` resolves back out to the sibling external repo.
- Make the `find` fallback follow symlinks (`find -L`) so it can reach
  the symlinked Bun binary in the runfiles tree.
- Resolve the `srcs` test-filter paths from the same `${RUNFILES_DIR}`
  base as `BUN_BIN` (was `$0.runfiles`). Under `bazel test` Bazel sets
  `RUNFILES_DIR` and `$0` is the already-staged in-runfiles script, so
  `$0.runfiles` double-appended `.runfiles/_main`, yielding a test
  filter with no matches.

### 0.2.0 — delegate release fetching to rules_github

- Replace the in-tree GitHub release download logic with a dependency
  on `rules_github`'s `github_binary_repository` so Bun binaries are
  fetched via the shared substrate alongside other fastverk rules.

### 0.1.0 — initial release

- First cut of Bazel rules for [Bun](https://bun.sh/): a `bun` module
  extension that auto-creates `@bun` with the host-platform binary, a
  `bun_toolchain` resolved via `@rules_bun//bun:toolchain_type`, plus
  `bun_test` (hermetic) and `bun_run` (sandbox-escaping) rules.
