---
title: "ROADMAP"
module: "rules_rdf"
---

## rules_rdf roadmap

Two waypoints between today's scaffold and a usable abstract RDF
toolchain layer. Each waypoint is one published bazel-registry
release.

### v0.1 — toolchain types + plugin contract + placeholder rules

The goal is for a consumer to be able to declare every planned target
type (`rdf_dataset`, `sparql_query_test`, `rdf_validate_test`,
`rdf_transform`, `rdf_reason`) **today**, against a no-op default
toolchain, then swap in a real implementation (e.g.
[`rules_jena`](https://github.com/fastverk/rules_jena)) without
touching their BUILD files. This makes rules_rdf adoptable
incrementally — consumers can wire their build graph before any
engine is integrated.

Deliverables:

- **Plugin contract document** at `rdf/plugin_contract.md`
  ([draft already in tree](https://github.com/tomato-bazel/rules_rdf/blob/main/rdf/plugin_contract.md)). Same shape as
  rules_jsonschema's [`plugin_contract.md`](https://github.com/fastverk/rules_jsonschema/blob/main/jsonschema/plugin_contract.md),
  adjusted for RDF semantics:
  - **stdin** = the RDF document bytes (the dataset; format declared
    via `--in-format`), not a JSON schema.
  - **argv** = `--key=value` pairs (same as jsonschema). Standard
    flags: `--rule-name`, `--in-format`. Per-toolchain flags:
    `--query`, `--shapes`, `--out-format`, `--profile`.
  - **stdout** = generated output (query results / validation report
    / converted graph / inferred triples). Same single-file-per-
    invocation discipline.
  - **stderr** = diagnostics.
  - **exit** = 0 / non-zero.
- **All four toolchain types defined** in `//rdf:BUILD.bazel`:
  `sparql_engine_toolchain_type`, `rdf_validator_toolchain_type`,
  `rdf_serializer_toolchain_type`, `rdf_reasoner_toolchain_type`.
- **Providers**: `RdfDatasetInfo`, `RdfEngineToolchainInfo`,
  `RdfValidatorToolchainInfo`, `RdfSerializerToolchainInfo`,
  `RdfReasonerToolchainInfo`. Each toolchain info wraps a single
  `binary` File, matching the jsonschema pattern.
- **Default user-facing rules** implemented as `_no_op` placeholders:
  - `rdf_dataset` — real (returns `RdfDatasetInfo`; no toolchain
    needed).
  - `sparql_query_test`, `sparql_query_run`, `rdf_validate_test`,
    `rdf_transform`, `rdf_reason` — declare their toolchain
    dependency and accept all their final attrs, but the in-repo
    default toolchain points at a `_no_op` binary that writes an
    empty stdout and exits 0. Consumers can declare targets and they
    build; swapping in `rules_jena` makes them actually run.
- **Conformance test driver** `rdf_plugin_contract_test` covering
  the same scenarios as the jsonschema driver — `valid_minimal`
  (small dataset round-trips), `malformed_input` (garbage on stdin
  → exit non-zero, empty stdout), `unknown_flag` (rejects unknown
  argv), `determinism` (byte-identical stdout on identical
  invocations). One driver, parameterised by toolchain type.
- **stardoc** for the public surface, with `diff_test` freshness.

Out of scope for v0.1: chained pipelines, real-engine examples,
result-set diff helpers.

### v0.2 — cross-toolchain wiring + real-engine examples

Once `rules_jena` is published and registered, rules_rdf grows the
glue that ties multiple toolchains together in one pipeline.

Deliverables:

- **Chained pipelines** — `rdf_validate_test` and `sparql_query_test`
  accept the output of `rdf_reason` as their dataset, so a consumer
  can express "materialise inferences, then run shape validation on
  the closure" as a typed build graph. The intermediate inferred
  graph is a real `RdfDatasetInfo`-bearing target, not a hidden side
  effect.
- **Result-set helpers** — a small Starlark helper for the common
  zero-row-CSV gate pattern, plus an `rdf_results_diff_test` for
  golden SPARQL result sets (SRX/JSON normalisation).
- **Examples directory** using a real RDF corpus:
  - [W3C example datasets](https://www.w3.org/2001/sw/wiki/Datasets)
    fetched via `http_file` with a pinned sha256 (the same
    fetch-and-pin discipline rules_docker_compose uses for the
    compose-spec schema).
  - One end-to-end smoke target per toolchain type, registered
    against `rules_jena`.
- **CI matrix** running the conformance test driver against every
  registered concrete implementation we know about, gating
  rules_rdf releases on at least one concrete backend passing.

After v0.2 the abstract layer is feature-complete; further work moves
into the concrete-implementation repos.
