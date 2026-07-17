---
title: "Overview"
module: "rules_eslint"
---

Hermetic eslint runner — lint a workspace's `@npm` eslint binary under Bazel.

eslint is a Node tool whose binary + plugin/config closure live in your
`pnpm-lock.yaml`. So `rules_eslint` does **not** fetch eslint. It gives you a
small `eslint_test` macro that runs *your own* aspect_rules_js-linked eslint
binary over a set of sources as a Bazel test — the same "consumer supplies the
binary" shape as [`rules_storybook`](https://github.com/fastverk/rules_storybook)
and [`rules_nextjs`](https://github.com/fastverk/rules_nextjs).

## Status: v0.1.0

- `eslint_test(name, srcs, eslint_bin, config, ...)` — a `lint`-tagged
  `sh_test` that runs `eslint_bin --config <config> <srcs>`.

## Install

`.bazelrc`:

```
common --registry=https://registry.fastverk.com/
common --registry=https://bcr.bazel.build/
```

`MODULE.bazel`:

```python
bazel_dep(name = "rules_eslint", version = "0.1.0")
```

## Use

You already have eslint in your `pnpm-lock.yaml` and an `@npm` repo from
`aspect_rules_js`'s `npm_translate_lock`. Materialize the eslint binary with the
`bin` factory, then point `eslint_test` at it:

```python
load("@npm//:eslint/package_json.bzl", eslint_bin = "bin")
load("@rules_eslint//eslint:defs.bzl", "eslint_test")

eslint_bin.eslint_binary(name = "eslint")

eslint_test(
    name = "lint",
    srcs = glob(["**/*.ts", "**/*.tsx"]),
    eslint_bin = ":eslint",
    config = "//:eslint.config.mjs",
)
```

Run one target, or fan out across the repo:

```
bazel test //:lint
bazel test //... --test_tag_filters=lint
```

Because eslint, its plugins, and the flat config all come from your own
`@npm` closure + sources, the test is hermetic and reproducible — no reliance
on a `node_modules/.bin/eslint` on the CI runner.

See [`examples/smoke`](https://github.com/tomato-bazel/rules_eslint/blob/main/examples/smoke) for a complete, self-contained workspace.
