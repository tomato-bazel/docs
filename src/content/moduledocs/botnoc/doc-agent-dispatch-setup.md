---
title: "agent-dispatch-setup"
module: "botnoc"
---

## `agent-dispatch.yml` setup

The per-repo `.github/workflows/agent-dispatch.yml` that
`botnoc-agent-server.Dispatch` triggers uses **workload-identity
federation** to authenticate to the Anthropic API — no static
`ANTHROPIC_API_KEY` is stored anywhere in GitHub. At runtime the
workflow mints a GitHub OIDC token, exchanges it for a short-lived
Anthropic token via the federation rule, and uses that for the API
call.

Setup is two one-time steps + a per-repo file copy. Once done, the
state-machine safety properties **W1-W5** (proved in
`lean/Botnoc/Workflow/AgentDispatchTheorems.lean`) hold for every
agent run in the fastverk constellation.

### 0. Install the Claude Code GitHub App (org-wide)

The action's runtime preflight checks for the [Claude Code GitHub
App](https://github.com/apps/claude) on the target repo. Without
it, the action fails with `Claude Code is not installed on this
repository. Please install the Claude Code GitHub App at
https://github.com/apps/claude` BEFORE any Claude API call is
made. This is independent of the federation rule below — the App
grants the per-repo identity the agent commits/PRs under; the
federation rule is the API-call auth.

Install it at **org level** with access to all repos in `fastverk`
so the fan-out is one click:

```
https://github.com/apps/claude
→ Configure
→ Install on @fastverk
→ "All repositories"
```

Verify with:

```bash
gh api orgs/fastverk/installations | python3 -c \
    'import json,sys;print([i["app_slug"] for i in json.load(sys.stdin)["installations"]])'
## expect: ['claude', ...]
```

### 1. Create the federation rule in Anthropic's console

Anthropic console → **Workload identity federation** →
**New rule**. Fill in:

| Field | Value |
|---|---|
| Provider | GitHub Actions OIDC |
| Issuer URL | `https://token.actions.githubusercontent.com` |
| Audience | `https://api.anthropic.com` (default) |
| Subject claim filter | `repo:fastverk/*` (all sibling repos) — or per-repo if you want to scope tighter |
| Workspace / service account | the project that gets billed for these runs |

The console emits a `fdrl_…` rule ID and the workspace's `wrkspc_…`
ID. Note both.

If you want per-repo scoping (defense-in-depth: a compromised repo
can't impersonate another), create one rule per repo with
`subject = repo:fastverk/<name>:*`. The cost is one rule per repo
to manage.

### 2. Set the org-level GitHub variables

These are **not secrets** — they're public IDs that only matter in
combination with a GitHub OIDC token signed by GitHub Actions:

```bash
gh variable set ANTHROPIC_FEDERATION_RULE_ID \
    --org fastverk --visibility all \
    --body 'fdrl_xxxxxxxxxxxxxxxxxxxxxxxx'

gh variable set ANTHROPIC_ORGANIZATION_ID \
    --org fastverk --visibility all \
    --body 'org_xxxxxxxxxxxxxxxxxxxxxxxx'
```

Both are inherited by every repo in the org; no per-repo wiring.

The optional `vars.ANTHROPIC_WORKSPACE_ID` and
`vars.ANTHROPIC_SERVICE_ACCOUNT_ID` can be added the same way if
your federation rule targets multiple workspaces or service
accounts. The default rule typically pins them, so most setups
don't need to set these.

### 2.5. AWS credentials for the deploy commands

Before running any `bazel run //deploy/cloudformation:…` (or
`…:_image_push`) target, populate `.env` at the repo root from
`.env.example` and source it in your shell:

```bash
cp .env.example .env
$EDITOR .env       # set AWS_PROFILE, double-check AWS_REGION

set -a; source .env; set +a
```

`set -a` exports every var assignment that follows, so `bazel run`
inherits them when it launches `cfn_console` / the OCI push
script. `set +a` restores normal scoping after. The AWS SDK (Rust,
used by `cfn_console`) and the aws-cli (image push auth) both
read `AWS_PROFILE` automatically.

`.env` is gitignored — it stays per-machine. Do not commit it.

The IAM identity referenced by the profile needs:
- `cloudformation:*` on stack names matching `fastverk-agent-*`
- ECR push perms on the `botnoc-agent` + `fastverk-webhook-bridge`
  repos
- `secretsmanager:PutSecretValue` on `fastverk/github-webhook-hmac`
  and `fastverk/github-app-private-key`
- `iam:PassRole` on the App Runner instance + access roles

### 3. Roll out the workflow per repo

Copy `.github/workflows/agent-dispatch.yml` into each consumer
repo (today: the 10 sibling `rules_*` modules under
`fastverk/`). Workflow safety properties W1-W5 are gated in
`botnoc` (the YAML is identical in every consumer); to evolve
the state machine, edit `botnoc`'s copy + the Lean theorems +
re-fan-out.

A one-shot helper (TODO, not yet implemented):

```bash
bazel run //deploy:install-agent-dispatch -- \
    --target-repos fastverk/rules_oci,fastverk/rules_uv,...
```

Until that lands, manual `gh api ... contents/.github/workflows/agent-dispatch.yml`
PUTs are the way.

### Upstream action bug — and why we use the CLI instead

`anthropics/claude-code-action@v1` (all recent `v1.0.x` pins: .90,
.91, .133) crash on every run on GitHub-hosted runners with:

```
Internal error: directory mismatch for directory
"/home/runner/work/_actions/anthropics/claude-code-action/v1/tsconfig.json",
fd 4. You don't need to do anything, but this indicates a bug.
```

It's a Bun-runtime issue inside the action's own load step;
nothing user-side can be configured to avoid it. Tracked
upstream in `anthropics/claude-code-action` issues
[#1205](https://github.com/anthropics/claude-code-action/issues/1205),
[#1234](https://github.com/anthropics/claude-code-action/issues/1234),
[#1266](https://github.com/anthropics/claude-code-action/issues/1266),
[#1295](https://github.com/anthropics/claude-code-action/issues/1295),
[#1322](https://github.com/anthropics/claude-code-action/issues/1322)
— open for ~1 month with no fix as of 2026-05-26.

**Mitigation (in place):** the workflow uses the official
`@anthropic-ai/claude-code` CLI from npm instead of the action.
The CLI runs under plain Node and ships the same agent loop,
so it sidesteps the Bun-loader bug entirely. The CLI itself
only reads `ANTHROPIC_API_KEY`, but the workflow keeps the
no-static-secret property by doing the federation exchange
[manually in a shell step](https://platform.claude.com/docs/en/manage-claude/workload-identity-federation):
mint the GitHub OIDC token, POST it to
`https://api.anthropic.com/v1/oauth/token` with the federation
rule ID, export the short-lived (`≤1h`) `access_token` as
`ANTHROPIC_API_KEY` for the next step. Identical security
posture to the action's federation path; just a few extra
lines of bash.

The infrastructure on OUR side stays verified end-to-end:
  - The label state machine (W1, W2, W3, W5) is mechanically
    correct against real GH Actions execution (smoke run
    [26471721662](https://github.com/fastverk/botnoc/actions/runs/26471721662)).
  - The Claude Code GH App is installed (`gh api orgs/fastverk/installations`
    shows `claude` with `repository_selection: all`).

**Hold the YAML fan-out** to the 10 sibling rules_* repos until
a green CLI smoke against issue #1 confirms the agent commits,
pushes, and opens a PR cleanly.

### 4. Smoke against a benign issue

In one consumer repo, open an issue with a trivial ask (e.g.
"Add a sentence about $X to the README"), then:

```bash
## from the botnoc workspace:
bazel run //cli:botnoc -- ...
## Navigate to the Backlog panel; press d (or whatever the dispatch
## binding is) on the issue.

## OR via the AgentService directly:
grpcurl -plaintext -d '{
  "issue_ref": "fastverk/rules_<repo>#<n>",
  "backend": "CLAUDE_CODE"
}' 127.0.0.1:50052 botnoc.v1.AgentService/Dispatch
```

Watch the workflow:
- `agent/start` appears on the issue (Dispatch's mutation).
- `agent/active` swaps in (W1, W5: `route` job runs).
- Claude runs, opens a PR.
- `agent/active` is removed (W2: `cleanup` job).
- On failure: `agent/cancelled` + a comment with the run URL (W3).

### Auth: no static `ANTHROPIC_API_KEY` required

The workflow mints a short-lived API token per run via the
manual federation exchange (see the previous section). If you
previously had `secrets.ANTHROPIC_API_KEY` set at the org or
repo level, delete it once the smoke is green:

```bash
gh secret delete ANTHROPIC_API_KEY --org fastverk
```

A leftover static key is a strict downgrade: it widens the
blast radius of any compromised repo (a leaked OIDC token is
scoped to that repo's claims and expires; a leaked static key
is full-org access until rotated).

### Why federation instead of a static key

| Concern | Static API key | Federation |
|---|---|---|
| Where the credential lives | GitHub org secret (encrypted at rest) | nowhere — minted per run |
| Rotation cadence | manual, easy to forget | automatic (each run mints fresh) |
| Compromised repo's blast radius | reads `ANTHROPIC_API_KEY`, full org access until rotated | reads OIDC token, scoped to that repo's claims; lifetime ≤1 hour |
| Audit trail | "secret was used" | full OIDC claim chain in Anthropic logs |
| Setup cost | one `gh secret set` | one console rule + one `gh variable set` per ID |

The setup cost is similar; the security gain is real. For botnoc's
single-org fan-out the federation path wins clearly.
