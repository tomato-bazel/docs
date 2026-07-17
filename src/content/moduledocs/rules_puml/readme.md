---
title: "Overview"
module: "rules_puml"
---

PlantUML diagram rendering + composition (Java toolchain, SVG/PNG/PDF output, LaTeX-embeddable)

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
bazel_dep(name = "rules_puml", version = "0.0.1")
```
