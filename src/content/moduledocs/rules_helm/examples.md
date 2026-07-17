---
title: "Usage"
module: "rules_helm"
---

Real usage, taken from the module's `examples/`.

### examples/smoke/BUILD.bazel

```starlark
load("@rules_helm//helm:defs.bzl", "helm_chart", "helm_lint", "helm_push")

# All chart files the action needs (the sandbox sees only declared inputs).
_SRCS = [
    "chart/values.yaml",
    "chart/templates/deployment.yaml",
]

helm_chart(
    name = "smoke",
    chart_yaml = "chart/Chart.yaml",
    srcs = _SRCS,
    version = "0.1.0",
    app_version = "0.0.0",
)

helm_lint(
    name = "lint",
    chart_yaml = "chart/Chart.yaml",
    srcs = _SRCS,
)

helm_push(
    name = "push",
    chart = ":smoke",
    repository = "ghcr.io/fastverk/charts",
)
```
