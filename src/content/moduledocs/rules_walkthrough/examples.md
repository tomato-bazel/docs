---
title: "Usage"
module: "rules_walkthrough"
---

Real usage, taken from the module's `examples/`.

### examples/hello_world/BUILD.bazel

```starlark
load("@rules_walkthrough//walkthrough:defs.bzl", "walkthrough_html")

# `bazel build //examples/hello_world:hello` exercises the
# resolver + renderer staging end-to-end.
# `bazel run //examples/hello_world:hello_serve` opens it.
walkthrough_html(
    name = "hello",
    src = "hello.json",
)
```
