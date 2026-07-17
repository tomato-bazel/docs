---
title: "Usage"
module: "rules_tla"
---

Real usage, taken from the module's `examples/`.

### examples/BUILD.bazel

```starlark
load("@rules_tla//tla:defs.bzl", "tla_check")

# End-to-end smoke: fetches the pinned tla2tools.jar and model-checks a finite
# spec (safety invariant + liveness property). `bazel test //examples:counter_check`.
tla_check(
    name = "counter_check",
    module = "Counter.tla",
    config = "Counter.cfg",
)
```
