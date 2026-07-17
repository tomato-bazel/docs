---
title: "TOPOLOGY"
module: "botnoc"
---

## fastverk topology — repos + services feeding the console

Status: **canonical map** (living doc). The one place that answers "what feeds
the botnoc/fastverk console, and where does a new thing go?"

### 1. The model

**The console (`botnoc`) is an aggregator, not a monolith.** Every external
system surfaces in the console through *exactly one* plugin BFF under
`services/<x>`. That plugin is the console's stable seam: the browser and the
gateway only ever talk to `services/<x>`, never to the upstream system directly.
Swap modgraph for something else and only `services/tbzl` changes.

```
 external system ──►  services/<x> (BFF, ClusterIP)  ──►  botnoc-web gateway  ──►  meridian panel
 (modgraph, RBE,       /healthz /describe                  /api/gw/<x>/*             (browser)
  truss, GitHub, …)    /panels.binpb + data plane          + injects user identity
```

The new **chat** host is the one plugin that inverts this: it is a *meta-consumer*
that reaches the **other** plugins' MCP surfaces (see §5).

### 2. The naming seam (convention — hold this invariant)

Adding a plugin means picking one id `<x>` and using it in all five places:

| # | Thing | Form | Example (`forge`) |
|---|---|---|---|
| 1 | Rust crate / dir | `services/<x>` → crate `botnoc-<x>` | `services/forge`, `botnoc-forge` |
| 2 | Proto (if any) | `proto/<x>/v1` → `<x>.v1.*` | `proto/forge/v1`, `forge.v1.ForgeDiscovery` |
| 3 | Deploy chart | `deploy/charts/botnoc-<x>` | `deploy/charts/botnoc-forge` |
| 4 | Gateway registration | `FASTVERK_BACKEND_<X>=<url>` | `FASTVERK_BACKEND_FORGE` |
| 5 | Browser route | `/api/gw/<x>/*` | `/api/gw/forge/repos` |

Every plugin BFF serves the same base surface: `GET /healthz` (unauthed, for the
probe), `GET /describe` (the `PluginManifest` as proto3-JSON), `GET /panels.binpb`
(its meridian `PanelBundle`), plus its own data routes. All routes except
`/healthz` require the shared **gateway token** (`FASTVERK_PLUGIN_TOKEN`, a bearer
the gateway injects to prove the call came from the trusted shell). Per-user
identity is forwarded, never a broad service credential: the gateway resolves the
signed-in user and injects `X-Fastverk-User-Sub` / `-Email` and, when the user
has connected GitHub, `X-Fastverk-Github-Token` — so the BFF acts *as that user*.

### 3. In-repo map (`fastverk/botnoc`)

```
web/                  botnoc-web — the gateway + shell (axum). Cognito auth,
                      /api/gw/<x> forwarder (gateway.rs), the chat proxy
                      (noc_agent_proxy.rs → /api/noc-agent/*), Stripe billing,
                      per-user connections (DynamoDB), the RBE-token mint
                      (federation.rs). Chart: web/chart.
services/<x>/         the plugin BFFs (§4).
proto/<x>/v1/         plugin contracts (botnoc, builds, depot, fastverk, forge).
deploy/charts/        deploy-owned Helm charts (one botnoc-<x> per backend).
deploy/cfn/           CloudFormation (Cognito human pool, etc.).
deploy/*.md           plan docs (FASTVERK-CHAT-PLAN.md, this migration work).
cli/tui/              the botnoc TUI (Bazel-only; depends on @meridian).
lean/Botnoc/          the Lean model (formalized invariants, e.g. TechDebt).
                      (the fastverk.com marketing site moved to fastverk/site.)
```

### 4. The console plugin catalog

| Plugin `<x>` | `services/<x>` does | Chart | Upstream / data source |
|---|---|---|---|
| **forge** | repos/issues/PRs across GitHub + GitLab (`forge.v1.ForgeDiscovery`) | botnoc-forge | GitHub/GitLab via the **per-user** `X-Fastverk-Github-Token` |
| **tbzl** | the Bazel module/target graph | botnoc-tbzl | `modgraph-mcp` (mcp.tbzl.dev) via tbzl's **own** Cognito service token |
| **builds** | RBE build health/history | botnoc-builds | Prometheus (buildbarn-rbe) |
| **depot** | artifacts / registry | botnoc-depot | truss (vendored) |
| **agent** | `botnoc.v1.AgentService` (gRPC :50052 + HTTP) | botnoc-agent | in-cluster agent dispatch |
| **controlplane** | imperative API over the declarative RBE control plane — run/inspect RBE smoke builds | botnoc-controlplane | the `RbeCluster` CR (kube) reconciled by the fastverk operator |
| **org** | read-only org-wide state (`OrgService`) | — (composed in-process by `web`) | internal |
| **planning** | waves + tech-debt reporting (Lean-backed invariant) | — (composed in-process by `web`) | internal |
| **chat** *(new)* | the MCP-host chat plane (§5) | botnoc-chat *(new)* | the other plugins' MCP surfaces + Bedrock |
| webhook_bridge | Lambda: GitHub App webhooks → `repository_dispatch` | (Lambda, not a chart) | GitHub App |

### 5. Where chat fits

`services/chat` (`botnoc-chat`) is a plugin by packaging — same crate/chart
convention — but its data plane is the **other plugins**. It discovers plugins,
opens an MCP client to each plugin's `/mcp`, aggregates their tools, runs a Claude
turn on **Bedrock** (IRSA, no static key), dispatches `tool_use` back through the
owning plugin's MCP server, and streams the answer over SSE. It reaches the
browser through the existing chat proxy (`/api/noc-agent/turn` + `/view`), so
Phase 3 wiring is just pointing `NOC_AGENT_URL` at the chat host.

Because each plugin's MCP server is *already* the authorization boundary, the
host stays a faithful deputy — Claude can only do what the signed-in user can. See
`deploy/FASTVERK-CHAT-PLAN.md` for the full design and phased build.

### 6. External constellation (the repos behind the plugins)

Layered as **hub / source+build / runtime / apps / intelligence** (per the
tbzl↔fv split). The console (hub) surfaces the others through the §4 plugins.

| Layer | Repo | What it is | Enters the console via |
|---|---|---|---|
| **hub** | `fastverk/botnoc` | the console — gateway + plugins (this repo) | — |
| hub | `fastverk-deploy` | Go/kubebuilder operator: CRDs `RbeCluster` / `ConsolePlugin` / `FastverkInstance` + chart (aion-dev control plane) | `controlplane` reads its CRDs |
| hub | `fastverk/spec` | the shared spine: Lean proof + RDF corpus + RFC vocab | feeds agora/crank |
| hub | `fastverk/catalog` | pricing product-as-code (deferred; not yet published) | `site/` fragment / billing |
| **source+build** | `tomato-bazel/tbzl` | the source+build CLI; **registry.tbzl.dev** (primary Bazel registry) | build tooling |
| source+build | `tomato-bazel/modgraph` (+ `-operator`, `-mcp`) | RO Bazel graph-query gRPC daemon; `GraphInstance`/`ModuleRegistry` CRDs; **mcp.tbzl.dev** | `tbzl` |
| source+build | `tomato-bazel/truss` | cloud-native SCM (git+Perforce blend, Bazel-integrated) | `depot` |
| source+build | buildbarn RBE (`buildbarn-rbe`) | the remote-build cluster | `builds` (Prometheus) + `controlplane` |
| **runtime** | `fvkit` (core + bazel) | core/runtime; consumed by git-dep (fv CLI, etc.) | build/runtime |
| **apps** | `aion` | the apps layer; aion-dev EKS hosts the console + plugins | — |
| **intelligence** *(optional)* | `fastverk/agora` (Rust) | proof-carrying capability auctions over MCP (`agora_crank` gRPC fleet + Claude bidder) | chat Phase 5 (tool selection) |
| intelligence *(optional)* | `fastverk/crank` (Java) | crystallization-crank engine: predict→project→gate→measure (`CrankPredictor` gRPC + Jena gate) | chat Phase 6 (refinement) |

**AWS accounts:** `aion-dev` (042825952740) — the shared EKS cluster + private
ECR the plugins run on today. `fastverk-prod` (491117466965) — the older
App-Runner console, being migrated to aion-dev.

### 7. Reconcile list (the "get organized" backlog)

Concrete drift to clean up as we go — small, mechanical, keeps the map honest:

- **`deploy/charts/botnoc-agent/Chart.yaml`** description is copy-pasted from tbzl
  ("botnoc tbzl plugin — surfaces the modgraph … graph"). Rewrite to describe the
  agent backend.
- **`deploy/charts/noc-agent`** is the *legacy* chat plane. Once `services/chat`
  ships (Phase 3) and `NOC_AGENT_URL` points at it, retire this chart (and rename
  the proxy arm `/api/noc-agent/*` → `/api/chat/*` for legibility).
- **org / planning** are both standalone crates *and* composed in-process by
  `web`. Decide per-service whether each stays in-process or becomes a deployed
  BFF; the catalog (§4) should have one answer per row.
- **image `repository`** fields in `BUILD.bazel` say `ghcr.io/fastverk/botnoc-*`,
  but CI (`push-images-ecr.yml`) pushes to the aion-dev **private ECR** by
  deriving the repo name. Harmless today; note it so nobody trusts the ghcr path.
- New plugins go through the §2 seam end-to-end — don't add a backend without its
  chart + gateway registration + `/api/gw/<x>` route, or it won't compose.
