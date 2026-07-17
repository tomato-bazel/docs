---
title: "Overview"
module: "buildbarn"
---

Buildbarn RBE-in-a-box for EKS — a self-hosted Bazel **remote-build-execution + cache**
cluster, packaged so a consumer only has to **own an EKS cluster, apply a CloudFormation
stack, and `helm install` a chart**.

It is the upstream [Buildbarn](https://github.com/buildbarn) topology (frontend / scheduler /
storage / worker / browser) plus a production hardening delta — gRPC-TLS frontend behind an
NLB, a `wait-for-scheduler` startup gate, right-sized workers, a bumped action timeout, and a
dedicated node group — all turned into Helm values and CloudFormation parameters.

```
buildbarn/
├── chart/    Helm chart  → ghcr.io/fastverk/charts/buildbarn   (tools/publish-chart.sh)
├── deploy/   CloudFormation stacks (rules_cloudformation)
│   ├── buildbarn-resources   S3 CAS bucket + bb-storage IRSA role + ECR repo
│   ├── buildbarn-nodegroup   the dedicated rbe-worker EKS managed node group
│   └── cluster               TURNKEY: a minimal EKS cluster + ebs-csi addon + controller IRSA
├── rbe/      Bazel client wiring: rbe.bazelrc (--config=rbe) + a //platforms:rbe example
└── tools/    publish-chart.sh, bootstrap-cluster.sh (turnkey controllers)
```

## Deploy (bring-your-own EKS cluster)

You provide an EKS cluster with the usual controllers (EBS CSI, AWS Load Balancer Controller,
cert-manager, external-dns — see `tools/bootstrap-cluster.sh` if you need them). Then:

```sh
# 1. AWS resources: S3 CAS bucket + bb-storage IRSA role + the worker-image ECR repo.
bazel run //deploy:buildbarn-resources.up -- \
  --parameter-overrides OidcProviderArn=<arn> OidcIssuerUrl=<https url>

# 2. A dedicated, tainted rbe-worker node group (Buildbarn pods land here).
bazel run //deploy:buildbarn-nodegroup.up -- \
  --parameter-overrides ClusterName=<name> NodeRoleArn=<arn> SubnetIds=<id,id>

# 3. The Buildbarn cluster itself.
helm install buildbarn oci://ghcr.io/fastverk/charts/buildbarn \
  --namespace buildbarn --create-namespace \
  --set worker.runner.image=<your-action-image> \
  --set worker.platform.containerImage=docker://<your-action-image>
```

See `chart/values.yaml` for every knob and `chart/values-example-eks-nlb.yaml` for the hardened
internet-facing-NLB + gRPC-TLS profile. `docs/rbe.md` is the full runbook + productionization notes.

## Turnkey (bare AWS account)

```sh
bazel run //deploy:cluster.up -- --parameter-overrides ClusterName=rbe Vpc...   # minimal EKS
tools/bootstrap-cluster.sh                                                       # LB ctrl + cert-manager + external-dns
# then deploy steps 1–3 above
```

## Use it from a Bazel repo

Add `rbe/rbe.bazelrc` and a `//platforms:rbe` (see `rbe/platforms.BUILD.example`), then:

```sh
bazel build //... --config=rbe
```

The `//platforms:rbe` `container-image` exec-property **must** match the worker's action image
(`worker.platform.containerImage`) or the RBE action cache key is dishonest. Keep them in lockstep.

## Install (Bazel module)

`.bazelrc`:

```
common --registry=https://registry.fastverk.com/
common --registry=https://bcr.bazel.build/
```

`MODULE.bazel`:

```python
bazel_dep(name = "buildbarn", version = "0.0.1")
```
