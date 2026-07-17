---
title: "upgrading"
module: "rules_agentic_ide"
---

# Upgrading & evolving a consumer (the graceful path)

Every generated file is a pure, deterministic, idempotent function:

```
output = f(rules_agentic_ide version, .agents/graph + bodies)
```

So drift has exactly two axes — **you edit the graph/bodies**, or **you bump
the framework version** — and graceful evolution means making each axis's
effect *reviewable* and *non-breaking*. The toolkit below does that.

## Source vs generated (the discipline)

| Committed **source** (hand-edited) | Gitignored **generated** (never hand-edited) |
|---|---|
| `.agents/graph/*.ttl` (the KG) | `.claude/**`, `.cursor/rules/**`, `.mcp.json`, `CLAUDE.md`, `.github/agents/**`, `copilot-instructions.md` |
| `.agents/skills/**`, `AGENTS.md`, rule bodies (`bodyPath` targets) | `.agents/generated.lock` is committed (the review surface) |

All changes flow through the source; you never edit a generated file (it's
overwritten on the next `generate`, which surfaces the mistake). `generate`
adds the generated paths to `.gitignore` automatically (`git check-ignore`).

## 1. `generated.lock` + `--check` — reviewable drift

The generated files are gitignored, so a version bump would otherwise change
them with no PR diff. The fix is a committed content-hash snapshot
(`agentic_ide.v1.GeneratedManifest`, on-disk as textproto):

```
bazel run //.agents:generate                 # writes files + rewrites .agents/generated.lock
bazel run //.agents:generate -- --check       # CI gate: exit 1 if the tree is stale
```

- A **graph edit** or a **version bump** changes hashes → the
  `.agents/generated.lock` diff in the PR shows *exactly which files drifted*,
  even though the files themselves stay ignored.
- `--check` re-renders and diffs against the lock without writing — the CI
  gate that catches "edited the graph but didn't regenerate" and "bumped the
  version but didn't regenerate." (Like `gofmt -l` / `terraform plan`.)

## 2. `validate` — no silent breakage

SHACL shapes (`@rules_agentic_ide//rdf/shapes:aide_shapes.ttl`) check the
consumer's graph against the floor every projection relies on, with fix-it
messages:

```
bazel run @rules_jena//jena/shacl:jena_shacl -- \
    --shapes=$(location @rules_agentic_ide//rdf/shapes:aide_shapes.ttl) \
    --in-format=turtle < .agents/graph/*.ttl     # conforms → 0, violations → 1
```

So a bump incompatible with the current graph (a renamed/removed property, a
missing required field) fails loudly, not silently. (`generate` also errors
on a dangling `bodyPath`; lockfile-coverage for MCP hosts is a planned check.)

## 3. Version policy — pin, semver, deprecate, migrate

- The consumer **pins** `rules_agentic_ide` (registry/MODULE) and bumps
  deliberately, reading the CHANGELOG.
- **Ontology semver**: additive (new property/host) = minor; rename/remove =
  **major**. Deprecate within a major (`owl:deprecated`; `validate` warns but
  still works), so a minor bump never breaks a consumer's `.ttl`.
- **`migrate`** (major bumps): ship a codemod (a SPARQL `UPDATE` or transform)
  that rewrites the old graph shape to the new — a reviewable mechanical PR.

## The upgrade flow, end to end

1. Consumer pins `0.0.1`; `.agents/graph/*` + `.agents/generated.lock` committed.
2. Framework releases `0.0.2` (CHANGELOG entry).
3. Consumer opens a **bump-only PR**: MODULE/registry pin → `0.0.2`.
4. CI: `validate` (graph still valid) → `generate` → `--check` updates the lock.
5. The **lock diff in the PR** is *purely the framework's effect* (no graph
   change in this PR). Reviewer inspects, adopts.
6. Merge; devs `generate` locally — deterministic, identical output everywhere.

Keep version bumps and graph edits in **separate PRs** so each diff is
attributable to one axis.

## Evolving the graph alongside the framework's library

The framework can ship a library graph (`rdf/defs/` — well-known skills /
standard MCP servers/hosts). The consumer's graph **composes** with it via
named graphs and **wins on conflict** (Forge override), so a library
improvement is inherited without clobbering customizations — and the
`generated.lock` diff shows exactly what it changed.
