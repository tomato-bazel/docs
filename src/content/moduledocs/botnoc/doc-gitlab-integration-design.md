---
title: "gitlab-integration-design"
module: "botnoc"
---

# GitLab (self-hosted) integration — design

Status: draft · Owner: platform · Mirrors the existing GitHub integration for
self-hosted GitLab, so an **administrator installs it once per instance** and
fastverk then enumerates and reacts to webhooks exactly as it does for GitHub.

## Context & goal

fastverk integrates with GitHub across five planes (read/discovery, write/cascade,
per-user connect, a service-wide "app" identity, and webhooks). We want the same
capability for **self-hosted GitLab** (e.g. `gitlab.savvifi.com` today, the
in-cluster `gitlab` namespace after migration, and — eventually — customer-owned
GitLab instances). The network path from aion-dev to `gitlab.savvifi.com` is already
open (see OPS-880 / `savvi-ops!199`).

The blocker is conceptual, not mechanical: **GitLab has no equivalent of a GitHub
App** — no single installable object that mints per-installation tokens. For
self-hosted we compose the "app" from three admin-created primitives, **per
instance** (each GitLab has its own base URL, registration, and secrets).

## Decisions (locked)

1. **Install UX:** auto-provision from a one-time admin token, with a manual guided
   fallback.
2. **Auth model:** both planes — a per-instance **service account + group token** for
   unattended work (forge/wave enumeration, agent writes) and **per-user OAuth** for
   interactive web/MCP actions. This mirrors GitHub (App installation token +
   user-to-server OAuth).
3. **Webhook dispatch:** introduce a provider-agnostic normalized event; both GitHub
   and GitLab converge on an internal gRPC `AgentService.Dispatch` to botnoc-agent,
   retiring the GitHub-specific `repository_dispatch`.

## What already exists (do not rebuild)

| Plane | Reference (GitHub) | GitLab status |
|---|---|---|
| Read/discovery plugin | `services/forge/src/backend.rs` (octocrab) | **Done:** `gitlab_repos/_issues/_merge_requests` REST v4 legs, `Authorization: Bearer`; proto `Repository/Issue/PullRequest` already carry `forge` + `host` (`proto/forge/v1/discovery.proto`) |
| Write/cascade trait | `repos/forge/src/github.rs` | **Done:** `repos/forge/src/gitlab.rs` `GitLabForge` (self-hosted-aware; branches/commits/MRs/merge/pipelines), selected in `repos/wave/wave/src/forge_factory.rs` |
| OAuth preset | fvkit `connections.rs` | **Done:** GitLab arm with `https://{host}/oauth/authorize|token`, scopes `[api, read_repository]`, `connection_id` for multiple instances |
| Per-user connect | `web/src/connections.rs` (GitHub live) | **Stub:** `gitlab` is a `CATALOG` entry (`KIND_OAUTH`) that falls through to "coming soon"; DynamoDB SK already accommodates `"gitlab"` |
| Webhooks | `services/webhook_bridge/src/main.rs` | **Absent** for GitLab |

## The GitLab "app" = three per-instance primitives

Created once per GitLab instance (the admin-install artifact):

1. **Instance OAuth application** — `POST /api/v4/applications` (admin). Yields
   `client_id`/`client_secret`. Scopes `api`, `read_repository`; `confidential: true`,
   `trusted: true` (skip the per-user consent screen). `redirect_uri =
   {PUBLIC_BASE_URL}/api/connect/gitlab/callback`. Powers the **per-user OAuth** plane.
2. **Service account + group access token** — `POST /api/v4/service_accounts` then a
   group access token (scope `api`, rotating). This is the **unattended app identity**
   that replaces the GitHub App installation token for forge/wave enumeration and
   agent writes.
3. **Group webhook** — `POST /api/v4/groups/:id/hooks` on each top-level in-scope group,
   `url = {WEBHOOK_BRIDGE_URL}`, `token = <generated per-instance secret>`, subscribing
   to `issues_events`, `merge_requests_events`, `note_events`, `push_events`. Group
   webhooks (not **system hooks**) are required — system hooks omit issue/label events.

## Install flow

### Primary: auto-provision from a one-time admin token

1. New admin route `GET/POST /api/connect/gitlab/admin` (behind `require_auth`, gated to
   fastverk admins). Admin submits `{ base_url, admin_pat }` where `admin_pat` is an
   `api`-scoped token on their GitLab instance.
2. Backend uses the PAT **once** to:
   - `POST /api/v4/applications` → OAuth app (client_id/secret).
   - `POST /api/v4/service_accounts` (+ group access token) → service-account token.
   - `POST /api/v4/groups/:id/hooks` → group webhook(s) with a freshly generated
     `webhook_secret`.
3. Persist the **installation record** (below); store `client_secret`,
   `service_account_token`, `webhook_secret` in Secrets Manager. **Discard the admin
   PAT** — never persisted.
4. Verify by calling `GET /api/v4/version` with the service-account token and pinging
   the webhook (`POST /api/v4/groups/:id/hooks/:hook_id` test) → mark installation
   `active`.

### Fallback: manual guided setup

If the admin will not grant a bootstrap PAT, the same page renders the exact steps
(OAuth app redirect URI + scopes, the group webhook URL + generated secret, the
service-account token) and accepts pasted `client_id`/`client_secret` + token. Both
paths converge on the same installation record.

## Data model

**New — per-instance installations** (`fastverk-forge-installations`, DynamoDB;
PK `provider` = `"gitlab"`, SK `host`):

```
host                 e.g. "gitlab.savvifi.com"      (instance identity / base URL)
oauth_client_id
oauth_client_secret_ref   -> Secrets Manager arn
service_account_token_ref -> Secrets Manager arn
webhook_secret_ref        -> Secrets Manager arn
group_ids            [..]  top-level groups in scope
scopes               ["api","read_repository"]
status               active | pending | error
created_by, created_at
```

**Extend — per-user connections** (`fastverk-connections`, existing PK `user_sub`).
Change the SK from `provider` to `provider#host` so a user can connect to more than
one GitLab instance (fvkit already models this via `connection_id`). Add
`PROVIDER_GITLAB`, `put_gitlab_token`, `resolve_gitlab_token` mirroring the GitHub
functions; store `{ access_token, refresh_token, expires_at, host }`.

Secrets naming (mirror `fastverk/github-*`): `fastverk/gitlab/{host}/oauth-client-secret`,
`.../service-account-token`, `.../webhook-token`.

## Auth planes & header plumbing

- **Unattended (service account):** forge/wave read `FASTVERK_TOKEN_GITLAB_<HOST>` (the
  service-account token). Already supported by `ForgeBackend`; only the deploy wiring is
  missing (see Config). `wave` reads `FORGE_TOKEN` via `forge_factory.rs` — unchanged.
- **Per-user (OAuth):** add a `gitlab` arm to `connect_provider` (`web/src/connections.rs`)
  — authorize `https://{host}/oauth/authorize?client_id&redirect_uri&response_type=code&
  state&scope=api` (GitLab **requires** `scope`, unlike GitHub Apps), exchange at
  `https://{host}/oauth/token`, store per-user token. Then forward
  `X-Fastverk-Gitlab-Token` **and** `X-Fastverk-Gitlab-Host` in `web/src/gateway.rs`
  (today it forwards only `X-Fastverk-Github-Token`), and consume them in
  `services/forge/src/http.rs` + `mcp.rs` to build a per-request GitLab client (today the
  GitLab leg uses only the static env token — this is the main enumeration gap).

## Enumeration parity — remaining work

1. **Per-user GitLab client** in forge (header plumbing above).
2. **Write path:** add GitLab `open_issue` to the forge plugin (`POST
   /api/v4/projects/:id/issues`) so the MCP `open_issue` tool works for GitLab (currently
   GitHub-only). The `forge` crate already has the richer write ops if we later want them.
3. **Deploy wiring:** add `FASTVERK_GITLAB_HOSTS` + `FASTVERK_TOKEN_GITLAB_<HOST>` to the
   **Helm** chart (`deploy/charts/botnoc-forge`) — today they exist only on the App
   Runner CFN path, and the per-host token secret isn't provisioned anywhere.
4. Flip the `gitlab` `CATALOG` entry from placeholder to live.

## Webhooks — "same as GitHub"

Extend `services/webhook_bridge` (or add a sibling handler) to accept GitLab:

1. **Route branch:** detect GitLab by `X-Gitlab-Event` + `X-Gitlab-Token` vs GitHub's
   `X-GitHub-Event` + `X-Hub-Signature-256`.
2. **Verify (per-instance secret):** derive the instance host from the payload
   (`project.web_url`/`git_http_url` → host), look up that instance's `webhook_secret`
   from the installations table / Secrets Manager, and constant-time compare against
   `X-Gitlab-Token` (`subtle::ConstantTimeEq`, already imported). No HMAC. This differs
   from GitHub's single global secret — GitLab is **per tenant**.
3. **Normalize:** introduce a provider-agnostic internal event
   `AgentStart { forge, host, project, issue_iid, actor, .. }` (mirroring the `forge`
   field the read model already uses). Map GitHub `issues.labeled` + `label.name ==
   agent/start` and GitLab `Issue Hook` where `agent/start` is newly present in
   `object_attributes.labels[]` (use `changes.labels.current`/`.previous` to fire only on
   add). Both providers produce the same `AgentStart`.
4. **Dispatch:** call the internal gRPC `AgentService.Dispatch` on `BOTNOC_ENDPOINT`
   (already injected into the Lambda) with the normalized event; retire the GitHub-specific
   `repository_dispatch`. This resolves the "no normalized model" gap and makes both
   providers identical downstream.

Idempotency: optionally record `X-Gitlab-Event-UUID` / GitHub `X-GitHub-Delivery` for
dedup — today the bridge 202-acks everything and relies on the downstream workflow state
machine; keep that contract.

## Config / deploy surfaces

- **Helm** `deploy/charts/botnoc-forge`: add `gitlab.hosts` → `FASTVERK_GITLAB_HOSTS` and
  a per-host `gitlab.tokenSecret` → `FASTVERK_TOKEN_GITLAB_<HOST>`.
- **Helm** `web/chart`: add `gitlab.*` (client id, `PUBLIC_BASE_URL` already present) and
  the installations-table name + IRSA grants (mirror `connections-table` /
  `botnoc-web-irsa.yaml`).
- **CFN:** new `deploy/cfn/forge-installations-table.yaml` (mirror
  `connections-table.yaml`); extend `app-runner/plugin-backend.yaml` to provision the
  `FASTVERK_TOKEN_GITLAB_<HOST>` secret; add a `fastverk/gitlab/*` secret convention.
- **webhook_bridge:** grant the Lambda read on `fastverk/gitlab/*` secrets + the
  installations table; add the GitLab route branch.

## Security notes

- Admin bootstrap PAT is used in-request and **never stored**; only minted secrets persist.
- OAuth app marked `confidential` + `trusted`; scopes minimized (`api` is required for
  writes; use `read_api`/`read_repository` where write isn't needed).
- Per-instance webhook secret prevents cross-instance spoofing; verify constant-time.
- Service-account token is per-instance and rotatable; scope it to the in-scope groups.
- Self-hosted TLS: honor the instance CA; do not disable verification.

## Rollout / phasing

1. **M1 — enumeration:** Helm wiring + per-user token plumbing + flip catalog + GitLab
   `open_issue`. Target `gitlab.savvifi.com` first (live + bridged). *Delivers the
   token-authenticated `200` we couldn't run earlier.*
2. **M2 — per-user connect:** `connect/gitlab` OAuth arm + connections SK migration.
3. **M3 — admin install:** installations table + auto-provision bootstrap + manual
   fallback.
4. **M4 — webhooks:** normalized `AgentStart` + gRPC dispatch + GitLab bridge branch;
   migrate GitHub off `repository_dispatch` onto the same path.

## Open questions

- First webhook target: legacy `gitlab.savvifi.com` vs in-cluster `gitlab` namespace
  (post-migration canonical). Both can reach the public Lambda Function URL.
- Whether to also expose the `forge` crate's richer GitLab **write** ops (auto-merge,
  cascade) through the plugin, or keep those confined to wave.
- Multi-instance UX in the web connect UI (choosing which GitLab instance to connect to).
