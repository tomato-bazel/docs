---
title: "mcp-gateway"
module: "rules_agentic_ide"
---

# MCP gateway daemon (Phase 2) — warm, multiplexed, hermetic

A long-lived daemon that fronts all of a repo's MCP servers behind **one**
warm endpoint. The IDE connects once; backends are launched lazily from
their lock-pinned Bazel targets and kept warm. This is the responsive,
cross-session counterpart to the per-server direct launchers in
[`mcp-hosts.md`](https://github.com/tomato-bazel/rules_agentic_ide/blob/main/mcp-hosts.md) — and it's the existing **mcp-gateway**
(today KG-only) extended from "serve the knowledge graph" to "serve the KG
*plus* multiplex external backends." It is the hermetic, bazel-native,
KG-aware analogue of `docker mcp gateway run` (which savvi already uses).

## Why a daemon

MCP stdio clients spawn each server once per session and hold the pipe — so
per-call latency isn't the issue; **session-start** and **cross-session
warmth** are. A daemon:

- the IDE connects **once** (no N-spawn at session start),
- keeps backends **warm across IDE restarts** (survives the session),
- pays each backend's cold start **once, lazily** (first use),
- centralizes **secret/env injection** (AWS creds in one place, not 17
  `.mcp.json` env blocks) and **observability**,
- unifies the **KG** resources/tools with the external servers behind one
  endpoint.

## Architecture

```
   IDE (Claude/Cursor/Copilot)
        │  one MCP connection over streamable-HTTP, loopback
        ▼
   ┌─────────────────────────────────────────────┐
   │  mcp-gateway  (long-lived; bazel run or OCI) │
   │   • MCP server  (http://127.0.0.1:PORT/mcp)  │
   │   • backend manager: lazy-spawn + pool + reap│
   │   • aggregator: namespaced tools/resources   │
   │   • KG tools/resources (the original role)   │
   └───────┬───────────────┬───────────────┬──────┘
           │ stdio         │ stdio         │ http
           ▼               ▼               ▼
   bazel run //…:postgres  …:git      grafana (remote, proxied)
   (pre-built launcher)  (uv launcher)
```

- **To the IDE it is a `NetworkHost`** — `.mcp.json` collapses to one entry
  (`{"type":"http","url":"http://127.0.0.1:PORT/mcp"}`). Projection picks
  this when "gateway mode" is selected.
- **Backends** are the same lock-pinned launcher targets from the host
  rules. The gateway holds their stdio pipes in a connection pool.

## Lifecycle

| Concern | Design |
|---|---|
| **Gateway start** | `bazel run //.agents/mcp:gateway` once, the OCI image via the compose stack, or a launchd/devcontainer unit. Stateless re: backends → restart-on-failure is safe. |
| **Backend spawn** | Lazy: on the first `tools/call` or `resources/read` routed to a backend, spawn its pre-built launcher (no `bazel run` roundtrip — uses the `--script_path` launcher). |
| **Warmth** | Keep the stdio pipe open in a pool; reuse across calls and across IDE reconnects. |
| **Idle reap** | Close backends idle > T (configurable) to bound resource use; re-spawn on next use. |
| **Build freshness** | Launchers rebuilt on lockfile change (git hook / `mcp_sync`); the gateway can refuse-stale + trigger a rebuild with a "building…" response. |

## Aggregation (the MCP-proxy part)

- **Namespacing**: backend `postgres` tool `query` → `postgres__query`;
  resource URIs prefixed (`mcp://postgres/…`) to avoid collisions. The KG's
  own tools/resources keep their native names.
- **Capability merge**: `tools/list` / `resources/list` / `prompts/list`
  union the backends (lazily probed once, cached).
- **Passthrough**: `tools/call` routes to the owning backend; notifications
  (resource updates, progress) forwarded both ways.
- **Secrets/env** injected per-backend from a central config (the graph),
  not the projected file.

## Config = the same graph

The gateway reads the **same `aide:McpServer` manifest** the projection
emits — host, launcher label, args, env per server. So there is one source
of truth: the graph defines the servers; the projection renders either N
direct entries (no daemon) or one gateway entry; the gateway, given the
manifest, launches the same pinned targets. **Mixed mode** is fine (gateway
for the chatty/cross-session ones, direct for the rare ones).

## Trade-offs (honest)

- The gateway must implement MCP proxying correctly (namespacing, capability
  negotiation, notification passthrough) — real work, but well-trodden (it's
  what `docker mcp gateway` does).
- A background service to supervise (start/stop/health) — fits the existing
  compose stack / launchd.
- Single process — mitigated by statelessness + restart-on-failure; a
  crashed backend is re-spawned, not fatal to the gateway.

## Build order

1. **Direct launchers** (Phase 1, `mcp-hosts.md`) — the foundation; both
   modes need the lock-pinned launcher targets.
2. **Gateway multiplex** (this doc) — extend the existing mcp-gateway:
   backend manager + pool + aggregator, reading the graph manifest. Pure
   addition; no rework, since it launches the same targets.
