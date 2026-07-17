---
title: "Overview"
module: "vpn"
---

WireGuard **private-plane access** as a self-contained Bazel module: a public,
OIDC-authed gRPC **provisioner**, a hermetic **Rust client** (`wg-client`), an
**EC2 Image Builder AMI** + gateway data plane, and the CloudFormation to deploy
it all. Issues per-user WireGuard tunnels into a private VPC plane (e.g. an EKS
private API endpoint + in-VPC resources) for authenticated users — the client
generates its keypair locally, sends only the public key, and the provisioner
records the device as a `Peer` and returns the gateway `Tunnel` parameters.

Lifted from `infra/control-plane` and parameterized so any org/account can deploy
it (no hardcoded domains, accounts, or identity provider).

## Shape

```
proto/vpn/v1/wireguard.proto   the WireguardAccess gRPC contract (package vpn.v1, AIP-linted)
provisioner/                   Java/gRPC server → DynamoDB peer registry + SSM server key (Fargate)
wg-client/                     Rust client: keygen → provision (OAuth PKCE) → up (boringtun + smoltcp userspace tunnel)
deploy/                        CloudFormation: registry (DynamoDB) · ami (EC2 Image Builder) · gateway (ASG) · provisioner (Fargate/ALB) · vpn-auth (Cognito reference IdP)
```

## Build

```
bazel build //...                       # provisioner jar+image, wg-client binary, proto codegen
bazel test  //proto/...:aip_lint        # AIP compliance
bazel run   //provisioner:image.push -- --tag <sha>
bazel run   //deploy:wireguard-provisioner.up   # see deploy/ for the parameterized stacks
```

## Auth

The runtime is OIDC-generic: the provisioner validates a bearer JWT against an
`OIDC_ISSUER`'s JWKS, and `wg-client` runs an OAuth 2.0 Authorization-Code + PKCE
flow against any hosted UI. `deploy/vpn-auth.yaml` ships an AWS Cognito user pool
(Google federation + a public PKCE CLI client) as a **reference** identity
provider — bring your own by passing `OidcIssuer`/`HostedUiBaseUrl`/`CliClientId`
to the stacks instead.

See [docs/private-plane-access.md](https://github.com/fastverk/vpn/blob/main/docs/private-plane-access.md) for the
provision → up → kubectl-over-tunnel runbook.
