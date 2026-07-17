---
title: "Overview"
module: "rules_bibtex"
---

Bazel-idiomatic BibTeX citations (arxiv/DOI/manual) + cite-lint aspect + research-graph aspect; collects (paper, cites, paper) edges as RDF

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
bazel_dep(name = "rules_bibtex", version = "0.0.1")
```
