---
title: "Changelog"
module: "buildbarn"
---

All notable changes to `buildbarn`. The format is loosely
[Keep a Changelog](https://keepachangelog.com/); version headers mirror the published
bazel-registry entries (CloudFormation side) and the chart's own `Chart.yaml` version.

### 0.0.2 — cost-allocation tags

- **deploy/** every cost-driving resource (S3 CAS bucket, bb-storage IRSA role, ECR repo, both EKS
  node groups, the EKS control plane) now carries `Project` / `Component` / `CostCenter` tags.
  `Project` (default `buildbarn-rbe`) and `CostCenter` (default `unset`) are stack parameters;
  `Component` is fixed per resource (`rbe-storage` / `rbe-compute` / `general-compute` / `rbe-cluster`).
  EKS managed-nodegroup tags propagate to the EC2 instances, so the compute spend is attributable —
  once these are activated as cost allocation tags in the management (payer) account.

### 0.0.1 — initial extraction

Extracted from `infra/control-plane` (savvi) and parameterized for reuse.

- **chart/** `buildbarn` Helm chart 0.1.0 — the full RBE topology (frontend / scheduler /
  storage / worker / browser) as first-class Helm templates (was a kustomize overlay over
  upstream `bb-deployments`). Values cover the savvi hardening delta: gRPC-TLS frontend +
  internet-facing NLB, `wait-for-scheduler` init container, worker right-sizing + concurrency,
  scheduler execution-timeout, action-image + platform `container-image`, rbe-worker placement.
- **deploy/** CloudFormation: `buildbarn-resources` (S3 CAS + bb-storage IRSA + ECR),
  `buildbarn-nodegroup` (the dedicated rbe-worker managed node group), `cluster` (turnkey EKS).
  Every cross-stack `ImportValue` is now a stack `Parameter`.
- **rbe/** `rbe.bazelrc` (`--config=rbe`) + `platforms.BUILD.example` (`//platforms:rbe`).
- **tools/** `publish-chart.sh` (helm push → ghcr) and `bootstrap-cluster.sh` (turnkey controllers).
