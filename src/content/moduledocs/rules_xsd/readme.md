---
title: "Overview"
module: "rules_xsd"
---

Bazel rules for XSD: offline schema validation + XSD→RDF/OWL vocabulary generation (the rules_xsd seed lifted from uslm).

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
bazel_dep(name = "rules_xsd", version = "0.0.1")
```
