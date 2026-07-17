---
title: "consumer-setup"
module: "rules_agentic_ide"
---

## Consuming rules_agentic_ide (wiring `.agents/`)

A consumer repo keeps its agent-config knowledge graph in `.agents/graph/`
and lets the framework project it into per-IDE files. Three steps.

### 1. Depend on the framework

`MODULE.bazel`:
```python
bazel_dep(name = "rules_agentic_ide", version = "0.0.2")
```
Resolve it from the fastverk registry (pin the registry commit, or BCR once
published). `rules_rdf` + `rules_jena` come transitively; register the Jena
toolchains if you don't already.

### 2. `.agents/BUILD.bazel`

```python
load("@rules_rdf//rdf:dataset.bzl", "rdf_dataset")
load("@rules_agentic_ide//rules:defs.bzl", "agent_bundle", "agent_validate")

## The authored KG — the single source of truth.
rdf_dataset(name = "graph", srcs = glob(["graph/*.ttl"]), in_format = "turtle")

## Schema gate (SHACL): bazel test //.agents:validate
agent_validate(name = "validate", graph = ":graph")

## Project to every IDE you target. Adding an IDE = adding a query.
agent_bundle(
    name = "agents",
    graph = ":graph",
    projections = [
        "@rules_agentic_ide//rdf/projections:claude_code/mcp.rq",
        "@rules_agentic_ide//rdf/projections:claude_code/settings.rq",
        "@rules_agentic_ide//rdf/projections:claude_code/skills.rq",
        "@rules_agentic_ide//rdf/projections:claude_code/rulesets.rq",
        "@rules_agentic_ide//rdf/projections:cursor/skills.rq",
        "@rules_agentic_ide//rdf/projections:cursor/rulesets.rq",
        "@rules_agentic_ide//rdf/projections:copilot/skills.rq",
        "@rules_agentic_ide//rdf/projections:copilot/rulesets.rq",
    ],
)
```

Your `.agents/graph/*.ttl` author `aide:Skill` / `aide:Ruleset` /
`aide:McpServer` / `aide:Settings`; bodies live at the `aide:bodyPath`
targets (`.agents/skills/**`, rule `.md` files, `AGENTS.md`).

### 3. Generate / check / validate

```sh
## Schema gate
bazel test //.agents:validate

## Regenerate the per-IDE config files (writes the working tree; also adds
## them to .gitignore and rewrites .agents/generated.lock).
bazel build //.agents:agents
bazel run @rules_agentic_ide//crates/agentic_ide_generate:agentic-ide-generate -- \
    --filespec bazel-bin/.agents/agents.nt          # --out defaults to the workspace

## Drift gate (CI): exit 1 if generated files are stale vs .agents/generated.lock
bazel run @rules_agentic_ide//crates/agentic_ide_generate:agentic-ide-generate -- \
    --filespec bazel-bin/.agents/agents.nt --check
```

A one-line wrapper (`tools/agents.sh` building the bundle then running
generate) keeps the daily command short; the canonical targets above are
what CI runs.

### What's committed vs generated

| Committed (source) | Gitignored (generated) |
|---|---|
| `.agents/graph/*.ttl`, `.agents/skills/**`, `AGENTS.md`, rule bodies | `.claude/**`, `.cursor/rules/**`, `.mcp.json`, `CLAUDE.md`, `.github/agents/**`, `copilot-instructions.md` |
| `.agents/generated.lock` (the drift review surface) | |

Never hand-edit a generated file — change the graph/body and regenerate.
See [upgrading.md](#doc-upgrading) for the version-bump flow.
