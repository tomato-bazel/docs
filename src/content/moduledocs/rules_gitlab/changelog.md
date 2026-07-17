---
title: "Changelog"
module: "rules_gitlab"
---

All notable changes to rules_gitlab. The format is loosely
[Keep a Changelog](https://keepachangelog.com/) — version headers
mirror the published bazel-registry entries.

### 0.2.0 — `gitlab_ci` generation rule

Adds `gitlab_ci` — generate a `.gitlab-ci.yml` from a typed Starlark
spec (the D14 CI-generation prereq), mirroring the
rules_jsonschema / rules_vscode "schema-is-the-source, emit
canonically" pattern.

- `gitlab_ci(name, stages, variables, default, image, include,
  workflow, jobs, extra, out, write_to, validate)` assembles the
  spec and emits a deterministic `.gitlab-ci.yml` via a new
  ruamel.yaml emitter (`//gitlab/private:emit`). Auto-chains
  `gitlab_ci_validate` (build-time schema gate) and, when
  `write_to` is set, aspect_bazel_lib `write_source_files`
  (`bazel run :<name>.update` writes the file back; `bazel test`
  checks it is current).
- `gitlab_job(...)` builds one job (drops unset fields); `jobs`
  also accepts a raw dict. `gitlab_reference("job","key")` emits a
  GitLab `!reference [job, key]` tag (round-trips through the
  emitter + validator).
- Key order is canonical + deterministic (the emitter applies a
  fixed priority, then sorts the rest), so generated files diff
  cleanly.
- New dep: `aspect_bazel_lib` 2.22.5 (write_source_files).

### 0.1.3 — ruamel.yaml multi-constructor signature fix

v0.1.2 registered an `add_multi_constructor` on `!`-prefixed tags
but used a `(self, node)` signature when ruamel calls
`(loader, tag_suffix, node)`. Real builds failed at runtime with
`_absorb_unknown_tag() takes 2 positional arguments but 3 were
given`. v0.1.3 fixes the signature + dispatches explicitly on
node type via `ruamel.yaml.nodes`.

### 0.1.2 — actually parse GitLab custom YAML tags via ruamel.yaml

v0.1.1 attempted to absorb GitLab's `!reference` / `!file` /
`!base64` tags by registering PyYAML constructors. That didn't
work in practice because `check-jsonschema` uses `ruamel.yaml`
(not PyYAML) for YAML loading — the PyYAML monkey-patch never
fired and the parse still failed with `ConstructorError`.

v0.1.2 restructures the validator: load the YAML ourselves with
`ruamel.yaml` + a generic constructor that absorbs `!`-prefixed
tags, dump to a temp JSON file, and pass that JSON to
`check-jsonschema` — sidestepping its YAML parser entirely.

- Dropped the PyYAML dep added in 0.1.1.
- Direct dep on `ruamel.yaml` (already a transitive dep of
  check-jsonschema; pinned explicitly so rules_python sees it).
- Verified end-to-end against selectsmart-employers'
  `.gitlab-ci.yml` (uses `!reference [.aws_environment, before_script]`).

### 0.1.1 — GitLab custom YAML tags

Real-world `.gitlab-ci.yml` files use non-standard YAML tags
(`!reference [.aws_environment, before_script]`, `!file`,
`!base64` …) that GitLab's server-side parser handles but
PyYAML's default loader rejects with `ConstructorError`.

v0.1.1: the validator wrapper now registers a multi-constructor
on `!`-prefixed tags that absorbs them as their underlying
Python value (scalar / sequence / mapping). The JSON Schema
validator sees the structural shape and validates it as usual —
the trade-off for being able to lint real GitLab configs at all.

- New direct dep on PyYAML (already a transitive dep of
  check-jsonschema; pinning it explicitly so the py_binary
  resolves it cleanly).
- Bumped rules_uv pin to 0.7.3 (registry-markers handling
  surfaced when validating savvi-aggregator member lockfiles).

### 0.1.0 — initial release

Lifted from `savvi/gitlab/` after the rules stabilized against
real-world `.gitlab-ci.yml` files (selectsmart-engine, savvi-ops).

- **`gitlab_ci_validate(name, src)`** — build-action rule. Pins
  the official GitLab CI JSON Schema (the file
  `gitlab-org/gitlab-foss/.../editor/schema/ci.json` that
  GitLab's web editor uses) via the `gitlab_schemas` module
  extension and validates `.gitlab-ci.yml` files against it
  using `check-jsonschema` (brought in via the internal
  `@rules_gitlab_tooling` pip hub backed by `rules_uv`).
  Hermetic; no network or auth at build time. Skips the
  `format: regex` check because GitLab accepts slash-delimited
  regex literals (e.g. `/^TOTAL.../`) the schema doesn't.
- **`gitlab_ci_lint(name, src, host, repo)`** — `bazel run`-able
  target wrapping `glab ci lint <src>`. Hits the GitLab API for
  full pipeline validation including `include:` resolution and
  semantic checks. Indirected via a `glab` toolchain
  (`//gitlab/glab:toolchain_type`); the default toolchain
  shells out to system `glab` on PATH.
- Smoke test under `examples/smoke/` with a minimal valid
  fixture validated on every CI run.
