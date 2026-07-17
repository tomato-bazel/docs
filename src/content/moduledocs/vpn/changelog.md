---
title: "Changelog"
module: "vpn"
---

All notable changes to this module are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/); this module adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

### [0.0.1] - 2026-06-24

#### Added

- Initial extraction of the WireGuard private-plane-access VPN from
  `infra/control-plane`, parameterized as a standalone module:
  - `proto/vpn/v1/wireguard.proto` — the `WireguardAccess` gRPC contract
    (package `vpn.v1`, AIP-linted), with Java + Rust (descriptor-set) codegen.
  - `provisioner/` — the Java/gRPC provisioner (DynamoDB peer registry + SSM
    server key), OCI-imaged on distroless/java21.
  - `wg-client/` — the hermetic Rust client (keygen / OAuth-PKCE provision /
    userspace `up` over boringtun + smoltcp).
  - `deploy/` — the five CloudFormation stacks (registry, ami, gateway,
    provisioner, vpn-auth), with every cross-stack `ImportValue` replaced by a
    portable stack `Parameter`.
