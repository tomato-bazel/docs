---
title: "Overview"
module: "rules_web"
---

Bazel toolchain types and rules for W3C / WHATWG web-standards specs —
WebIDL, HTML, CSS, JS. Consumers depend on this module for the *interface*
(rule names, toolchain types, providers); the implementation comes from a
separate module that registers the toolchain.

## Toolchain types

| Path                  | Toolchain type                | Status    | First implementation                |
|-----------------------|-------------------------------|-----------|-------------------------------------|
| `//web/webidl/...`    | `webidl_toolchain_type`       | v0        | `firefox_webidl_parser` (WebIDL.py) |
| `//web/html/...`      | `html_parser_toolchain_type`  | stub      | (planned: `firefox_html_parser`)    |
| `//web/css/...`       | `css_toolchain_type`          | stub      | (planned: `firefox_css_specs`)      |
| `//web/js/...`        | `js_engine_toolchain_type`    | stub      | (planned: `firefox_spidermonkey`)   |

Multiple implementations of the same toolchain type can coexist — Bazel's
toolchain resolution picks whichever is registered. This mirrors how
`rules_cc` lets you swap between LLVM, Xcode clang, MSVC, etc., without
touching the consumer.

## Consumer usage (WebIDL — v0 shape)

```python
# MODULE.bazel
bazel_dep(name = "rules_web", version = "0.0.1")
bazel_dep(name = "firefox_webidl_parser", version = "0.0.1")
register_toolchains("@firefox_webidl_parser//:webidl_toolchain")

# BUILD.bazel
load("@rules_web//web/webidl:rules.bzl", "webidl_library", "webidl_parse")

webidl_library(
    name = "html_details",
    srcs = ["HTMLDetailsElement.webidl"],
)

webidl_parse(
    name = "html_details_ast",
    src = ":html_details",
)
```

`webidl_parse` invokes the registered parser toolchain via
`ctx.actions.run`. The output is a JSON AST consumable by downstream
codegen (the polyglot AST HTML emitter is the v0 consumer).

## Why split rules from impl

- Consumers only pull in the narrowest closure (`rules_web` + the
  registered toolchain — not the whole Firefox source).
- Implementations can be swapped without changing consumer BUILD files
  (Mozilla's parser today, a Rust port tomorrow).
- The same pattern scales to html / css / js — `rules_web` owns the
  vocabulary; implementations live elsewhere.

## Status

v0 scaffold. WebIDL toolchain type + minimal `webidl_library` /
`webidl_parse` rules; html / css / js subdirs are stubs awaiting first
real consumer.

PRIVATE / NDA. Published in fastverk/bazel-registry-premium.
