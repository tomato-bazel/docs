---
title: "Overview"
module: "rules_helm"
---

Chart-as-a-module: build, lint, and publish Helm charts in Bazel — the Helm
analog of how this org already does container images (`rules_oci`) and protos.

Helm itself is fetched hermetically (a pinned per-platform binary from
get.helm.sh), so `bazel build`-ing a chart needs nothing installed on the host.

## Rules

| Rule | Kind | What it does |
|------|------|--------------|
| `helm_chart` | build action | Packages a chart directory into `<name>.tgz`. |
| `helm_lint`  | build action | `helm lint` (fails the build); cacheable marker output. |
| `helm_push`  | `bazel run`  | `helm push <tgz> oci://<repository>`. |

## Use

`MODULE.bazel`:

```python
bazel_dep(name = "rules_helm", version = "0.1.0")
```

`BUILD.bazel` next to a chart:

```python
load("@rules_helm//helm:defs.bzl", "helm_chart", "helm_lint", "helm_push")

_SRCS = ["values.yaml"] + glob(["templates/**", ".helmignore"])

helm_chart(
    name = "chart",
    chart_yaml = "Chart.yaml",
    srcs = _SRCS,
    version = "1.2.3",        # optional; defaults to Chart.yaml
    app_version = "1.2.3",    # optional; defaults to Chart.yaml
)

helm_lint(name = "lint", chart_yaml = "Chart.yaml", srcs = _SRCS)

helm_push(name = "push", chart = ":chart", repository = "ghcr.io/fastverk/charts")
```

```sh
bazel build //path/to:chart        # -> bazel-bin/path/to/chart.tgz
bazel build //path/to:lint         # fails if the chart doesn't lint
helm registry login ghcr.io ...    # auth once (CI uses GITHUB_TOKEN)
bazel run   //path/to:push         # publishes the .tgz
```

`srcs` must list **every** file helm should package — the action runs in a
sandbox containing only the declared inputs. `helm_chart` is for **leaf** charts;
a chart with subchart dependencies must have its `charts/` vendored
(`helm dependency build`) and the vendored archives passed in `srcs`.

## Bumping helm

Two edits in [`helm/repositories.bzl`](https://github.com/tomato-bazel/rules_helm/blob/main/helm/repositories.bzl): `HELM_VERSION` and
the four `HELM_SHA256` lines. Refresh a checksum with:

```sh
curl -fsSL https://get.helm.sh/helm-v<ver>-<platform>.tar.gz.sha256sum
```

This v0.1.0 downloads only the host platform's binary (chart packaging always
runs host-native). A future revision can graduate this to a full multi-platform
Bazel toolchain for exec-platform selection (RBE).

## Publishing this module

Tag a release and run the registry tool (same flow as the other fastverk
`rules_*` modules):

```sh
git tag v0.1.0 && git push origin v0.1.0
# in repos/bazel-registry:
bazel run //tools/rels -- release --repo fastverk/rules_helm --version 0.1.0
```
