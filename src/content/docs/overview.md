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

See [Using the registry](/using-the-registry/) for the details, or browse every published module in the [Modules reference](/reference/modules/).

## Nothing is admitted unproved

Every version in the registry is checked against machine-readable invariants
derived from its own module graph — that a published module carries no
`*_override`, that it does not register a toolchain onto its consumers, that the
registry resolves one coherent version of each third-party dependency.

- **[Gating](/concepts/gating/)** — what a zero-row gate is, and why convergence
  became the compatibility mechanism when Bazel made `compatibility_level` a
  no-op.
- **[Registry conformance](/conformance/)** — how the registry is doing against
  every invariant right now, per gate and per module.
- **[Blast radius](/concepts/blast-radius/)** — how a change's real reach is
  computed from the graph.
