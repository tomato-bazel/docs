---
title: "Overview"
module: "rules_beam"
---

Apache Beam pipeline build + cross-runner deployment (DirectRunner, Dataflow, Flink, Spark)

## Status: v0.0.1 — scaffold

No public surface yet. See `CHANGELOG.md` for what has shipped.

## Install

`.bazelrc`:

```
common --registry=https://registry.fastverk.com/
common --registry=https://bcr.bazel.build/
```

`MODULE.bazel`:

```python
bazel_dep(name = "rules_beam", version = "0.0.1")
```
