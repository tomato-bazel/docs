---
title: Overview
description: tomato-bazel is a Bazel module registry and a set of reusable rules_* for a hermetic, bzlmod-first workflow.
editPath: overview.md
---

**tomato-bazel** is a [Bazel](https://bazel.build) module registry and a set of reusable `rules_*` for the modern, hermetic, bzlmod-first workflow — plus the source & build layer that sits beneath [tbzl.dev](https://tbzl.dev).

## What's here

- **`registry.tbzl.dev`** — a [bzlmod registry](https://bazel.build/external/registry) serving the tomato-bazel modules (`rules_*`, brand tooling, and more), fronted by a CDN over the public [`tomato-bazel/bazel-registry`](https://github.com/tomato-bazel/bazel-registry).
- **`static.tbzl.dev`** — the brand-assets CDN (marks, icons).
- **`docs.tbzl.dev`** — this site.

## Point Bazel at the registry

Add the registry to your `.bazelrc`, ahead of the BCR:

```bash
common --registry=https://registry.tbzl.dev/
common --registry=https://bcr.bazel.build/
```

Then depend on any module in your `MODULE.bazel`:

```python
bazel_dep(name = "rules_lean", version = "0.3.2")
```

See [Using the registry](/using-the-registry/) for the details, browse every published module in the [Modules reference](/reference/modules/), or read [Blast radius](/concepts/blast-radius/) — how a change's real reach is computed from the graph.
