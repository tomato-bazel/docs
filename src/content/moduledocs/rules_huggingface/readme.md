---
title: "Overview"
module: "rules_huggingface"
---

Bazel-native HuggingFace Hub model + dataset push/pull (hf_model, hf_upload)

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
bazel_dep(name = "rules_huggingface", version = "0.0.1")
```
