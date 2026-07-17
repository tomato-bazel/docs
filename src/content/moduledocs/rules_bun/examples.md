---
title: "Usage"
module: "rules_bun"
---

Real usage, taken from the module's `examples/`.

### examples/BUILD.bazel

```starlark
load("@examples_npm//:defs.bzl", "npm_link_all_packages")

package(default_visibility = ["//visibility:public"])

# Links the example pnpm workspace's node_modules at //examples, so Bun's
# resolver finds it by walking up from examples/bundle/ and examples/compile/.
npm_link_all_packages(name = "node_modules")

exports_files(["pnpm-lock.yaml"])
```

### examples/bundle/BUILD.bazel

```starlark
load("@aspect_rules_js//js:defs.bzl", "js_binary")
load("@rules_bun//bun:defs.bzl", "bun_bundle", "bun_test")

package(default_visibility = ["//visibility:public"])

# The driver js_binary stages the bundle entry (the .ts sources, transpiled by
# Bun directly) next to the linked node_modules closure in its runfiles, so when
# `bun_bundle` runs it the whole import graph resolves from the staged tree.
js_binary(
    name = "bundle_driver",
    data = [
        "greet.ts",
        "index.ts",
        "//examples:node_modules/is-number",
        "//examples:node_modules/source-map-support",
    ],
    entry_point = "@rules_bun//bun:bun-build-driver",
)

# Bundle examples/bundle/index.ts into one self-contained ESM file. is-number
# and ./greet are inlined; source-map-support stays external.
bun_bundle(
    name = "bundle",
    out = "app.mjs",
    driver = ":bundle_driver",
    entry = "examples/bundle/index.ts",
    external = ["source-map-support"],
    format = "esm",
    target = "node",
)

# Smoke test: the bundle exists, runs, inlines the dep + local module, and keeps
# the external un-inlined. Run from the `_main` runfiles root with the bundle
# staged as data.
bun_test(
    name = "bundle_test",
    srcs = ["bundle.test.ts"],
    data = [":bundle"],
)
```

### examples/compile/BUILD.bazel

```starlark
load("@aspect_rules_js//js:defs.bzl", "js_binary")
load("@rules_bun//bun:defs.bzl", "bun_compile")
load("@rules_shell//shell:sh_test.bzl", "sh_test")

package(default_visibility = ["//visibility:public"])

# Driver js_binary: stages the compile entry + its npm dep closure.
js_binary(
    name = "compile_driver",
    data = [
        "main.ts",
        "//examples:node_modules/is-number",
    ],
    entry_point = "@rules_bun//bun:bun-build-driver",
)

# Compile examples/compile/main.ts into a standalone native executable for the
# HOST platform (no `target`), so CI builds for its own OS/arch without cross
# toolchains. The output is itself runnable: `bazel run //examples/compile:app`.
bun_compile(
    name = "app",
    out = "app_host",
    driver = ":compile_driver",
    entry = "examples/compile/main.ts",
)

# Smoke test: the produced file is executable and runs.
sh_test(
    name = "app_test",
    srcs = ["run_test.sh"],
    args = ["$(rootpath :app)"],
    data = [":app"],
)
```

### examples/install/BUILD.bazel

```starlark
load("@rules_bun//bun:defs.bzl", "bun_bundle", "bun_test")

package(default_visibility = ["//visibility:public"])

# Pure-Bun flow: NO aspect_rules_js, NO pnpm-lock. The node_modules closure is
# staged by `bun_deps.install` (see //MODULE.bazel) from this directory's
# package.json + bun.lock via `bun install --frozen-lockfile`, and consumed
# below as `@install_npm//:node_modules`.

# Bundle examples/install/index.ts into one self-contained ESM file. `is-number`
# (from the staged node_modules) and `./greet` are inlined — Bun runs directly
# via the toolchain (no js_binary driver). This is the `node_modules`/native
# `bun_bundle` path.
bun_bundle(
    name = "bundle",
    srcs = [
        "greet.ts",
        "index.ts",
    ],
    out = "app.mjs",
    entry = "examples/install/index.ts",
    format = "esm",
    node_modules = "@install_npm//:node_modules",
    target = "node",
)

# Proof that `bun test` resolves a dep from the `bun_install` node_modules tree.
bun_test(
    name = "resolve_test",
    srcs = ["resolve.test.ts"],
    node_modules = "@install_npm//:node_modules",
)

# Smoke test that the produced bundle exists, runs, and inlined the dep.
bun_test(
    name = "bundle_test",
    srcs = ["bundle.test.ts"],
    data = [":bundle"],
)

exports_files([
    "package.json",
    "bun.lock",
])
```
