---
title: "Overview"
module: "botnoc"
---

The bot-driven NOC for the fastverk constellation — a Rust + tonic gRPC
service suite, an axum web UI, a meridian-rendered TUI, Lean specs, and
the deploy stacks that ship them as containers and a Helm chart.

Carved out of [`fastverk/fastverk`](https://github.com/fastverk/fastverk)
into a standalone Bazel module.

## Layout

| Path | What |
|------|------|
| `proto/botnoc/{v1,ui/v1}/` | gRPC service contracts + the meridian UI panel bundle |
| `services/org/` | OrgService — read-only org state (repos, issues, PRs, CI) · `:50051` |
| `services/agent/` | AgentService — dispatch + monitor coding agents · `:50052` |
| `services/planning/` | PlanningService — tech-debt + release waves · `:50053` |
| `services/webhook_bridge/` | GitHub-App webhook → `repository_dispatch` Lambda |
| `web/` | axum web UI (composes org+agent in-process) · `:8080` |
| `cli/tui/` | meridian-rendered TUI (+ SSH front-end) |
| `lean/Botnoc/` | formal specs (Lean 4) |
| `tests/contracts_cited/` | Lean ↔ Rust citation linter |
| `tools/oci/`, `tools/proto/` | image macro + proto codegen stub |
| `deploy/` | CloudFormation stacks (+ local docker-compose, deferred) |
| `charts/botnoc/` | Helm chart |

## Build

The build is Bazel (`rules_rust` + `crate_universe`); `cargo build
--workspace` also works for the pure-Rust members.

```sh
bazel test //services/... //web/... //cli/...
bazel build //web:botnoc-web-image          # → OCI image (host arch)
bazel run   //web:botnoc-web-image_tarball  # → load into local docker
```

### Dependency resolution

Modules resolve from the **fastverk private bazel-registry** (see
`.bazelrc`): `@meridian`, `@rules_ssh_tui`, `@rules_lean`,
`@rules_cloudformation` all come from the registry — no sibling working
copies needed. Authenticated fetches go through fastverk's credential
helper, which botnoc does **not** own. Install it before the first
build:

```sh
tbzl install-cred-helper         # local (symlinks the real binary)
tools/ci/install-cred-helper.sh  # CI (writes a $GITHUB_TOKEN shim)
```

A token with read access to the `fastverk` org is required to fetch the
private registry + module archives. CI mints a `fastverk-ci-bot` GitHub
App installation token — set `FASTVERK_CI_BOT_APP_ID` and
`FASTVERK_CI_BOT_PRIVATE_KEY` repo secrets.

### Opt-in pieces

- **Lean specs** — `bazel test //lean:all_green` needs the `lake`
  extension wired (three root Lake files + `lake update`). See the
  commented block in `MODULE.bazel`.
- **Local compose stack** — `bazel run //deploy:up` needs the
  `rules_docker_compose` submodule; see `deploy/BUILD.bazel.deferred`
  and the note in `MODULE.bazel`.

## Containers

Each service / web / TUI builds an OCI image via
`//tools/oci:rust_service_image`, pushed to `ghcr.io/fastverk/botnoc-*`:

| Target | Image |
|--------|-------|
| `//services/org:botnoc-org-image` | `ghcr.io/fastverk/botnoc-org` |
| `//services/agent:botnoc-agent-image` | `ghcr.io/fastverk/botnoc-agent` |
| `//services/planning:botnoc-planning-image` | `ghcr.io/fastverk/botnoc-planning` |
| `//web:botnoc-web-image` | `ghcr.io/fastverk/botnoc-web` |
| `//cli/tui:botnoc-image` | `ghcr.io/fastverk/botnoc` |
| `//cli/tui:botnoc-ssh-image` | `ghcr.io/fastverk/botnoc-ssh-tui` |

Tagging `vX.Y.Z` runs `.github/workflows/release.yml`, which pushes
every image and publishes the chart to `oci://ghcr.io/fastverk/charts`.

## Deploy

```sh
helm install botnoc oci://ghcr.io/fastverk/charts/botnoc --version X.Y.Z
```

The chart (`charts/botnoc/`) deploys the gRPC trio + web (+ optional
SSH TUI). CloudFormation/ECS templates under `deploy/cfn/built/` remain
the production path; the chart is the Kubernetes-native alternative.
