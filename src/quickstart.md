# Using the registry

Add the tomato-bazel registry to your `.bazelrc`, ahead of the BCR:

```
common --registry=https://registry.tbzl.dev/
common --registry=https://bcr.bazel.build/
```

Bazel consults registries left-to-right, so a module present in both resolves
from `registry.tbzl.dev` first, falling back to the BCR.

## Depending on a module

In `MODULE.bazel`:

```python
bazel_dep(name = "rules_tomato", version = "0.1.0")
```

Pins resolve to an immutable module version — `registry.tbzl.dev/modules/<name>/<version>/`
(`MODULE.bazel` + `source.json`). Version files are cached hard by the CDN; the
mutable index (`metadata.json`) is served with a short TTL, so a freshly-published
version is visible within about a minute.

## What's here

The [Modules](modules.md) page lists every module and its versions. Sources live
in the public [`tomato-bazel/bazel-registry`](https://github.com/tomato-bazel/bazel-registry)
repo.
