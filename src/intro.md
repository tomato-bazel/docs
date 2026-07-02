# tbzl.dev

**tomato-bazel** is a [Bazel](https://bazel.build) module registry and a set of
reusable `rules_*` for the modern, hermetic, bzlmod-first workflow.

- **`registry.tbzl.dev`** — a [bzlmod registry](https://bazel.build/external/registry)
  serving the tomato-bazel modules (`rules_*`, brand tooling, and more), fronted
  by a CDN over the public [`tomato-bazel/bazel-registry`](https://github.com/tomato-bazel/bazel-registry).
- **`static.tbzl.dev`** — the brand-assets CDN (marks, icons).
- **`tbzl.dev`** — this site.

## Quick start

Point Bazel at the registry in your `.bazelrc`:

```
common --registry=https://registry.tbzl.dev/
common --registry=https://bcr.bazel.build/
```

Then depend on any module in your `MODULE.bazel`:

```python
bazel_dep(name = "rules_tomato", version = "0.1.0")
```

See [Using the registry](quickstart.md) for more, or browse all
[Modules](modules.md).
