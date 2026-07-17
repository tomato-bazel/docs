---
title: "rbe"
module: "buildbarn"
---

# Buildbarn RBE — deploy runbook

A self-hosted Bazel **remote-build-execution + cache** cluster. Architecture: a gRPC **frontend**
(CAS/AC entrypoint + execution dispatch) in front of a **scheduler** and a sharded **storage**
StatefulSet (CAS/AC/FSAC on EBS), with a pool of **workers** that execute actions inside a
configurable container image, plus a **browser** UI. Clients point Bazel at the frontend with
`--config=rbe`.

```
bazel client ──grpcs──▶ frontend ──▶ scheduler ──▶ worker (runner: your action image)
                           │                          │
                           └────────▶ storage (sharded CAS/AC/FSAC) ◀┘
```

## A. Bring-your-own EKS cluster

Prerequisites in the cluster: the EBS CSI driver (storage PVCs), and — only for the hardened
internet-facing profile — the AWS Load Balancer Controller, cert-manager, and external-dns
(`tools/bootstrap-cluster.sh` installs them).

1. **AWS resources** — S3 CAS bucket + `bb-storage` IRSA role + the worker-image ECR repo:
   ```sh
   bazel run //deploy:buildbarn-resources.up -- --capabilities CAPABILITY_NAMED_IAM \
     --parameter-overrides OidcProviderArn=<arn> OidcIssuerUrl=https://oidc.eks.<region>.amazonaws.com/id/<id>
   ```
2. **Node group** — the dedicated, tainted rbe-worker pool:
   ```sh
   bazel run //deploy:buildbarn-nodegroup.up -- \
     --parameter-overrides ClusterName=<name> NodeRoleArn=<arn> SubnetIds=<subnet,subnet>
   ```
3. **Push your action image** to the ECR repo from step 1 (`BuildbarnBuildImageEcrUri`). It must
   carry the toolchains your actions need.
4. **Install the chart**:
   ```sh
   helm install buildbarn oci://ghcr.io/fastverk/charts/buildbarn -n buildbarn --create-namespace \
     --set worker.runner.image=<ecr>@sha256:<digest> \
     --set worker.platform.containerImage=docker://<ecr>@sha256:<digest>
   ```
   For the internet-facing NLB + gRPC-TLS profile, use `chart/values-example-eks-nlb.yaml`.

## B. Turnkey (bare AWS account)

```sh
bazel run //deploy:cluster.up -- --capabilities CAPABILITY_NAMED_IAM \
  --parameter-overrides ClusterName=buildbarn-rbe VpcId=<vpc> \
    PublicSubnetIds=<subnet,subnet> PrivateSubnetIds=<subnet,subnet> \
    ClusterAdminPrincipalArn=<your-iam-arn>

CLUSTER_NAME=buildbarn-rbe REGION=us-east-1 EBS_CSI_ROLE_ARN=<cluster EbsCsiRoleArn output> \
  tools/bootstrap-cluster.sh          # add INSTALL_NLB_STACK=true VPC_ID=<vpc> for the NLB path
```
The turnkey `cluster` stack already creates the rbe-worker node group, so skip
`buildbarn-nodegroup`; still run `buildbarn-resources` (pass the cluster stack's `OidcProviderArn`
+ `OidcIssuerUrl` outputs) for the ECR repo + IRSA, then install the chart as in A.4.

## The one coupling you must respect

The worker advertises a `container-image` platform property; the scheduler routes an action to a
worker only if the action's exec `container-image` matches **exactly**. So three values must be the
same `docker://<repo>@<digest>`:

| where | value |
|---|---|
| chart `worker.runner.image` | the action image (without `docker://`) |
| chart `worker.platform.containerImage` | `docker://` + the action image |
| consumer `//platforms:rbe` `container-image` exec-property | `docker://` + the action image |

Bump all three together when you republish the action image (a digest pin makes the coupling honest).

## Storage backend

The chart defaults to the **EBS-local** block-device blobstore (per-replica `gp3` PVCs) — the
proven, live configuration. `buildbarn-resources` also provisions an **S3 CAS bucket + IRSA role**
for an S3-backed blobstore; wiring the chart's `storage.jsonnet` to S3 is a follow-up increment
(set `storage.serviceAccount.create=true` + the role ARN to stage the IRSA today).

## Productionization roadmap

The defaults are a single-region sandbox. To harden:
- **HA**: ≥2 scheduler/frontend replicas; spread storage across AZs; cluster-autoscaler on the
  rbe-worker pool.
- **Storage**: grow the CAS PVCs + the matching `storage.jsonnet` block sizes; consider the S3 CAS
  backend for durability beyond a single node's disk.
- **Reachability**: prefer PrivateLink / VPC peering over an internet-facing NLB; if public, keep
  the `loadBalancerSourceRanges` allowlist tight.
- **AuthN/Z**: the upstream config allows all; add mTLS / token auth at the frontend for multi-tenant
  use.
- **Observability**: the pods already expose Prometheus metrics (`:9980/metrics`); wire a scraper.
