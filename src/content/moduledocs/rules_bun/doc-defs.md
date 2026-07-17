---
title: "defs"
module: "rules_bun"
---

<!-- Generated with Stardoc: http://skydoc.bazel.build -->

User-facing rules for rules_bun.

Four pieces:

  * `bun_test` — runs `bun test` as a hermetic Bazel test action with
    explicit srcs + deps. Returns a `BunTestInfo` provider wrapping
    the test result file (for downstream consumers; the main consumer
    is the test framework, which only cares about exit codes).

  * `bun_run` — sh_binary macro: `bazel run //path:NAME` invokes
    `bun run <script>` against the live workspace source. Intentionally
    non-hermetic (escapes the runfiles sandbox) for the dev loop.
    Counterpart to `bun_test`'s hermetic execution.

  * `bun_bundle` — bundle a JS/TS entry point into one self-contained
    file with `bun build`. Returns `BunBundleInfo`.

  * `bun_compile` — compile a JS/TS entry point into a standalone native
    executable with `bun build --compile` (Bun runtime + bundled JS).
    Returns `BunBinaryInfo` and is `bazel run`-nable.

All resolve the Bun binary via `@rules_bun//bun:toolchain_type` (set
up by `register_toolchains("@bun//:bun_toolchain_def")` in your
MODULE.bazel).

`bun_bundle` / `bun_compile` have two ways to provision node_modules:

  * Bun-native (recommended; no aspect_rules_js, no pnpm-lock): pass a
    `node_modules` label (a `@<name>//:node_modules` from a
    `bun_deps.install` tag — see `extensions.bzl`) plus `srcs` (the entry
    + local modules). `bun build` runs directly via the toolchain Bun; a
    small shell driver stages the entry into a real tree and symlinks the
    closure so Bun resolves the import graph natively.

  * Legacy aspect_rules_js: pass a `driver` js_binary whose entry point
    is `@rules_bun//bun:bun-build-driver` and whose `data` stages the
    build entry plus its full linked node_modules closure; aspect
    materializes that closure into the action runfiles.

`driver` and `node_modules` are mutually exclusive — set exactly one.
`bun_test` likewise takes an optional `node_modules` for dep resolution.

<a id="bun_bundle"></a>

### bun_bundle

<pre>
load("@rules_bun//bun:defs.bzl", "bun_bundle")

bun_bundle(<a href="#bun_bundle-name">name</a>, <a href="#bun_bundle-srcs">srcs</a>, <a href="#bun_bundle-out">out</a>, <a href="#bun_bundle-driver">driver</a>, <a href="#bun_bundle-entry">entry</a>, <a href="#bun_bundle-external">external</a>, <a href="#bun_bundle-format">format</a>, <a href="#bun_bundle-node_modules">node_modules</a>, <a href="#bun_bundle-target">target</a>)
</pre>

Bundle a JS/TS entry into one file via the hermetic Bun toolchain. Either Bun-native (`node_modules` from `bun_deps.install`, no aspect_rules_js) or the legacy aspect `driver` js_binary path.

**ATTRIBUTES**


| Name  | Description | Type | Mandatory | Default |
| :------------- | :------------- | :------------- | :------------- | :------------- |
| <a id="bun_bundle-name"></a>name |  A unique name for this target.   | <a href="https://bazel.build/concepts/labels#target-names">Name</a> | required |  |
| <a id="bun_bundle-srcs"></a>srcs |  Bun-native path. The entry file + any local modules it imports, declared as action inputs. Ignored on the legacy `driver` path (that stages sources via the js_binary's `data`).   | <a href="https://bazel.build/concepts/labels">List of labels</a> | optional |  `[]`  |
| <a id="bun_bundle-out"></a>out |  The single bundled output file (conventionally `*.mjs`).   | <a href="https://bazel.build/concepts/labels">Label</a> | required |  |
| <a id="bun_bundle-driver"></a>driver |  LEGACY aspect_rules_js path. A `js_binary` whose entry point is `@rules_bun//bun:bun-build-driver` and whose `data` stages the bundle entry + its full linked node_modules closure. Mutually exclusive with `node_modules`; set exactly one.   | <a href="https://bazel.build/concepts/labels">Label</a> | optional |  `None`  |
| <a id="bun_bundle-entry"></a>entry |  Path of the entry point relative to the workspace root (e.g. `packages/aion-cli/index.js`). On the native path this is the execroot-relative path; on the legacy path it is relative to the driver's `_main` runfiles root (same string in practice).   | String | required |  |
| <a id="bun_bundle-external"></a>external |  Module names to exclude from the bundle (passed as `--external <name>`, repeatable). Use for native addons and runtime `require`s that must stay external, e.g. `pg-native`, `@aws-sdk/*`, `encoding`, `source-map-support`.   | List of strings | optional |  `[]`  |
| <a id="bun_bundle-format"></a>format |  Bun `--format`. Defaults to `esm` so `import.meta` in deps stays valid under Node.   | String | optional |  `"esm"`  |
| <a id="bun_bundle-node_modules"></a>node_modules |  Bun-native path. A `node_modules` closure (typically `@<name>//:node_modules` from a `bun_deps.install` tag). When set, `bun build` runs directly via the toolchain Bun (no js_binary driver, no aspect_rules_js): the closure is symlinked to the execroot root so Bun resolves the import graph by walking up from `entry`. Mutually exclusive with `driver`. Pair with `srcs` (the entry + local modules).   | <a href="https://bazel.build/concepts/labels">Label</a> | optional |  `None`  |
| <a id="bun_bundle-target"></a>target |  Bun `--target`: the intended execution environment for the bundle. Defaults to `node`.   | String | optional |  `"node"`  |


<a id="bun_compile"></a>

### bun_compile

<pre>
load("@rules_bun//bun:defs.bzl", "bun_compile")

bun_compile(<a href="#bun_compile-name">name</a>, <a href="#bun_compile-srcs">srcs</a>, <a href="#bun_compile-out">out</a>, <a href="#bun_compile-driver">driver</a>, <a href="#bun_compile-entry">entry</a>, <a href="#bun_compile-external">external</a>, <a href="#bun_compile-node_modules">node_modules</a>, <a href="#bun_compile-target">target</a>)
</pre>

Compile a JS/TS entry into a standalone native executable (Bun runtime + bundled JS) via `bun build --compile`. Either Bun-native (`node_modules`) or the legacy aspect `driver` path.

**ATTRIBUTES**


| Name  | Description | Type | Mandatory | Default |
| :------------- | :------------- | :------------- | :------------- | :------------- |
| <a id="bun_compile-name"></a>name |  A unique name for this target.   | <a href="https://bazel.build/concepts/labels#target-names">Name</a> | required |  |
| <a id="bun_compile-srcs"></a>srcs |  Bun-native path. The entry file + any local modules it imports, declared as action inputs. Ignored on the legacy `driver` path.   | <a href="https://bazel.build/concepts/labels">List of labels</a> | optional |  `[]`  |
| <a id="bun_compile-out"></a>out |  The standalone executable output. On `--target bun-windows-*` give it a `.exe` suffix.   | <a href="https://bazel.build/concepts/labels">Label</a> | required |  |
| <a id="bun_compile-driver"></a>driver |  LEGACY aspect_rules_js path. A `js_binary` whose entry point is `@rules_bun//bun:bun-build-driver` and whose `data` stages the build entry + its full linked node_modules closure. Mutually exclusive with `node_modules`; set exactly one.   | <a href="https://bazel.build/concepts/labels">Label</a> | optional |  `None`  |
| <a id="bun_compile-entry"></a>entry |  Path of the entry point relative to the workspace root (e.g. `apps/studio-cli/index.js`).   | String | required |  |
| <a id="bun_compile-external"></a>external |  Module names to keep external (`--external <name>`, repeatable). NOTE: native `.node` addons are NOT embedded by `--compile` — list them here and provide the `.node` files at runtime alongside the produced binary.   | List of strings | optional |  `[]`  |
| <a id="bun_compile-node_modules"></a>node_modules |  Bun-native path. A `node_modules` closure (typically `@<name>//:node_modules` from a `bun_deps.install` tag). When set, `bun build --compile` runs directly via the toolchain Bun (no js_binary driver, no aspect_rules_js). Mutually exclusive with `driver`. Pair with `srcs`.   | <a href="https://bazel.build/concepts/labels">Label</a> | optional |  `None`  |
| <a id="bun_compile-target"></a>target |  Bun compile target triple. Empty (the default) compiles for the host platform. Cross-compile values: `bun-linux-x64`, `bun-linux-x64-modern`, `bun-linux-x64-baseline`, `bun-linux-arm64`, `bun-darwin-x64`, `bun-darwin-arm64`, `bun-windows-x64`, and the `*-musl` libc variants (e.g. `bun-linux-x64-musl`). A future enhancement could derive this from the Bazel `--platforms` via a transition; for v1 pass the string.   | String | optional |  `""`  |


<a id="bun_test"></a>

### bun_test

<pre>
load("@rules_bun//bun:defs.bzl", "bun_test")

bun_test(<a href="#bun_test-name">name</a>, <a href="#bun_test-srcs">srcs</a>, <a href="#bun_test-data">data</a>, <a href="#bun_test-node_modules">node_modules</a>)
</pre>

Run `bun test` over the listed source files as a Bazel test target.

**ATTRIBUTES**


| Name  | Description | Type | Mandatory | Default |
| :------------- | :------------- | :------------- | :------------- | :------------- |
| <a id="bun_test-name"></a>name |  A unique name for this target.   | <a href="https://bazel.build/concepts/labels#target-names">Name</a> | required |  |
| <a id="bun_test-srcs"></a>srcs |  Test files (typically `*.test.ts`, `*.test.js`). Each is passed to `bun test` explicitly so Bazel tracks them as inputs.   | <a href="https://bazel.build/concepts/labels">List of labels</a> | required |  |
| <a id="bun_test-data"></a>data |  Additional runtime inputs (fixtures, bunfig.toml, etc.).   | <a href="https://bazel.build/concepts/labels">List of labels</a> | optional |  `[]`  |
| <a id="bun_test-node_modules"></a>node_modules |  Optional `node_modules` closure (typically `@<name>//:node_modules` from a `bun_deps.install` tag). Staged at the workspace runfiles root as `node_modules/` so `bun test` resolves dependency imports without `bun install`. The Bun-native replacement for aspect_rules_js's `npm_link_all_packages`.   | <a href="https://bazel.build/concepts/labels">Label</a> | optional |  `None`  |


<a id="BunBinaryInfo"></a>

### BunBinaryInfo

<pre>
load("@rules_bun//bun:defs.bzl", "BunBinaryInfo")

BunBinaryInfo(<a href="#BunBinaryInfo-binary">binary</a>, <a href="#BunBinaryInfo-target">target</a>)
</pre>

A standalone native executable produced by `bun build --compile`.

**FIELDS**

| Name  | Description |
| :------------- | :------------- |
| <a id="BunBinaryInfo-binary"></a>binary |  File: the standalone executable.    |
| <a id="BunBinaryInfo-target"></a>target |  string: the Bun compile target triple (empty = host).    |


<a id="BunBundleInfo"></a>

### BunBundleInfo

<pre>
load("@rules_bun//bun:defs.bzl", "BunBundleInfo")

BunBundleInfo(<a href="#BunBundleInfo-bundle">bundle</a>, <a href="#BunBundleInfo-format">format</a>)
</pre>

A single-file bundle produced by `bun build`.

**FIELDS**

| Name  | Description |
| :------------- | :------------- |
| <a id="BunBundleInfo-bundle"></a>bundle |  File: the bundled output.    |
| <a id="BunBundleInfo-format"></a>format |  string: the Bun output format (esm/cjs/iife).    |


<a id="BunTestInfo"></a>

### BunTestInfo

<pre>
load("@rules_bun//bun:defs.bzl", "BunTestInfo")

BunTestInfo(<a href="#BunTestInfo-result">result</a>)
</pre>

Result metadata for a `bun test` run.

**FIELDS**

| Name  | Description |
| :------------- | :------------- |
| <a id="BunTestInfo-result"></a>result |  File: the captured test output (stdout + stderr concatenated).    |


<a id="bun_run"></a>

### bun_run

<pre>
load("@rules_bun//bun:defs.bzl", "bun_run")

bun_run(<a href="#bun_run-name">name</a>, <a href="#bun_run-script">script</a>, <a href="#bun_run-args">args</a>, <a href="#bun_run-kwargs">**kwargs</a>)
</pre>

Invoke `bun run <script>` against the live workspace source.

Escapes the runfiles sandbox via BUILD_WORKSPACE_DIRECTORY so Bun
resolves modules + reads files from the user's actual source tree.
Intentionally NOT hermetic — that's `bun_test`'s job.


**PARAMETERS**


| Name  | Description | Default Value |
| :------------- | :------------- | :------------- |
| <a id="bun_run-name"></a>name |  target name.   |  none |
| <a id="bun_run-script"></a>script |  package-relative path to the Bun script entry point.   |  none |
| <a id="bun_run-args"></a>args |  extra args passed to `bun run` after the script name.   |  `None` |
| <a id="bun_run-kwargs"></a>kwargs |  forwarded to the underlying `sh_binary`.   |  none |
