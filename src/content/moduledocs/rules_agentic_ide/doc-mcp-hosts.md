---
title: "mcp-hosts"
module: "rules_agentic_ide"
---

# MCP hosts — hermetic, lock-pinned MCP servers as Bazel targets

The doctrine: **an MCP server is either a *remote endpoint* or a *runnable
target*. A "host" is the pluggable mechanism that produces (and pins) the
runnable target.** The projection then renders every runnable uniformly as
`bazel run <label>`; only a `NetworkHost` stays a URL. This replaces
non-hermetic `pnpx`/`uvx` launches (which resolve + fetch on every spawn)
with launchers pinned by the repo's existing lockfiles.

## Host taxonomy

| `aide:` host | Backed by | Pin source | Projected command |
|---|---|---|---|
| `BazelHost` | native | source | `bazel run <target> [-- args]` |
| `NpmHost` | `aspect_rules_js` | `pnpm-lock.yaml` | `bazel run <js_binary launcher>` |
| `PypiHost` | `rules_uv` | `uv.lock` | `bazel run <uv launcher>` |
| `OciHost` | digest pin / `rules_oci` | image digest | `docker run -i --rm <image>@<digest>` |
| `NetworkHost` | — | — | `{type, url}` (no launch) |
| `SystemHost` | — | — | raw command (**non-hermetic, flagged**) |

## Core rules (package-manager-agnostic) — `@rules_agentic_ide//rules:defs.bzl`

These are proven and need no third-party rules:

```python
# Any runnable bazel target → an MCP server. THIS is the keystone: every
# host reduces to "a launcher target wrapped by mcp_bazel_server".
mcp_bazel_server(name = "studio", target = "//packages/studio-dev-mcp:mcp",
                 args = ["${workspaceFolder}"])      # → bazel run //…:mcp -- ${workspaceFolder}

mcp_network_server(name = "grafana", url = "http://localhost:8000/mcp")

mcp_oci_server(name = "docker-gw", image = "docker/mcp-gateway",
               digest = "sha256:…")                  # → docker run -i --rm …@sha256:…

mcp_system_server(name = "serena", command = "serena",
                  args = ["start-mcp-server"])        # escape hatch (non-hermetic)
```

Each emits the resolved `aide:McpServer` TTL (`McpServerInfo` +
`RdfDatasetInfo`), so it composes straight into the projection graph.

## Package-manager hosts (npm / pypi)

The launcher itself is built with the **native** rules the consumer already
has (rules_js / rules_uv) — pinned by the existing lockfile — then wrapped
with `mcp_bazel_server`. The framework deliberately does *not* re-wrap every
package manager; the bridge is `mcp_bazel_server`.

### NpmHost (aspect_rules_js + pnpm-lock.yaml)

```python
# .agents/BUILD.bazel — savvi already has aspect_rules_js + pnpm-lock.yaml.
# 1. add the server packages to package.json, re-lock (pnpm install).
# 2. run the package's bin via the generated bin loader (hermetic, pinned):
load("@npm//:@modelcontextprotocol/server-postgres/package_json.bzl", postgres = "bin")
postgres.mcp_server_postgres_binary(name = "postgres_launcher")
# 3. bridge it to an MCP server:
mcp_bazel_server(name = "postgres", target = ":postgres_launcher")
#    → bazel run //.agents:postgres_launcher
```
The per-package `bin` loader path is package-specific, so this stays an
explicit two-liner rather than a magic macro. (A thin `mcp_npm_server`
convenience can be added once the bin-loader pattern is uniform across
savvi's servers.)

### PypiHost (rules_uv + uv.lock)

```python
# savvi already has pyproject.toml + uv.lock. Add the server to the deps,
# re-lock, expose its console-script as a runnable target, then:
mcp_bazel_server(name = "git", target = "//.agents:mcp_server_git")
#    → bazel run //.agents:mcp_server_git
```

## savvi's 17 servers → hosts

| Host | Servers |
|---|---|
| NpmHost (pnpm-lock) | linear, postgres, playwright, chrome-devtools, filesystem, aws-sso |
| PypiHost (uv.lock) | git, arxiv-mcp-server, awslabs.aws-api-mcp-server |
| BazelHost (first-party) | studio (`//packages/studio-dev-mcp`) |
| OciHost (digest) | docker (the docker MCP gateway) |
| NetworkHost | grafana, tempo, neon, studio-http, Vercel |
| SystemHost (flag) | serena (until packaged) |

→ **10 of 17** move from non-hermetic `pnpx`/`uvx` to pinned `bazel run`,
reusing savvi's existing `pnpm-lock.yaml` + `uv.lock`. The lockfile is the
pin (same pattern as the image digest lock): bumping a server = a reviewable
lockfile change, reproducible across the team.

## Performance: spawn cost + the daemon

MCP stdio clients spawn each server **once per session** and hold the pipe
open — they do not respawn per call. So the hot cost is session-start.

1. **Pinned launchers already beat `pnpx`** — no per-spawn package
   resolution/fetch (the slow, flaky part).
2. **Keep `bazel run` out of the hot path**: pre-build launchers with
   `bazel run --script_path=.agents/mcp/bin/<name> //…:<name>_launcher`
   (a standalone runfiles launch script, no bazel-server roundtrip).
   `.mcp.json` points at the script; a `mcp_sync` target / git hook
   rebuilds on lockfile change. Direct exec → fast session start.
3. **Gateway daemon (Phase 2)** for cross-session warmth + one connection —
   see `mcp-gateway.md`.

Both modes ride the **same** lock-pinned launcher targets — the projection
just chooses N direct entries vs one gateway entry.
