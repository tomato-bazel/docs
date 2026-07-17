---
title: "ROADMAP"
module: "rules_jena"
---

# rules_jena roadmap

Three releases get from "scaffold" to a full Jena-backed implementation
of every `rules_rdf` toolchain type, plus a small set of user-facing
convenience rules. Each row points at the production pattern in
`~/Documents/rfcs/kg/java/` that gets ported; see
[`SOURCES.md`](https://github.com/tomato-bazel/rules_jena/blob/main/SOURCES.md) for the full catalog.

## v0.1 (next)

Stand up the shared library and the first toolchain. Goal: prove
`rules_rdf`'s contract works for a Jena backend end-to-end.

- Port `Loader.java` (corpus-loading) and `Writer.java` (deterministic
  Turtle) plus their tests (`WriterTest.java`) into a public
  `:rdf_io` `java_library` at the rules_jena root.
- Implement **one** toolchain — the SPARQL engine — as a
  `java_binary` registered under
  `rules_rdf`'s `sparql_engine_toolchain_type`:
  - Read the SPARQL query path from argv (`--query=...`).
  - Read the data graph as Turtle from stdin.
  - Emit results (TSV or JSON) on stdout, diagnostics on stderr,
    non-zero exit on parse / execution failure.
  - Same shape as the `gate_query_smoke` target in
    `kg/java/BUILD.bazel`.
- Gate the toolchain binary with `rules_rdf`'s plugin-contract
  conformance test (the analog of
  `jsonschema_plugin_contract_test`).
- Register the default toolchain in `MODULE.bazel`.
- Maven coordinates for `jena-arq` / `jena-core` / `jena-base` /
  `jena-iri` / `slf4j-simple` declared inline (no `rules_jvm_external`
  pin yet — defer to v0.2 once the full set of binaries is in scope).

## v0.2

Round out the toolchain implementations. Goal: every `rules_rdf`
toolchain type has a Jena-backed default.

- Port `GateHarness.java`, `Gates.java`, `GateZeroRows.java`,
  `GateShacl.java`, `GateQuerySmoke.java` as additional
  toolchain-backing binaries — one per gate shape.
- Implement the SHACL validator toolchain on top of
  `org.apache.jena.shacl.ShaclValidator` (mirroring `GateShacl`).
- Implement the RDF serializer toolchain on top of `RDFDataMgr`
  plus the `Writer.java` invariants.
- Implement the OWL reasoner toolchain via
  `ReasonerRegistry.getOWLMicroReasoner()` (the same call
  `KgReasoner` makes in production).
- **Pin Maven artifacts via `rules_jvm_external`.** Single
  `maven.install` block in `MODULE.bazel`; a locked
  `maven_install.json` checked in. Removes the hand-rolled
  `@maven//:org_apache_jena_*` references that consumers maintain
  today.
- Smoke fixture using a tiny pinned ontology
  (a few classes, a few SHACL shapes, a handful of `.rq` files) so
  every toolchain gets an end-to-end test under `//examples/smoke`.

## v0.3

Expose the higher-level patterns the corpus uses every day. Goal: a
downstream consumer can replace `kg/java/` with a thin BUILD file
that loads from `rules_jena`.

- Extract `kg/lint/` patterns into a reusable `jena_lint` rule —
  orphan / consistency checks driven by a user-supplied query set.
- Extract `kg/rules/` patterns into a `jena_reason` rule — runs a
  pinned set of Jena rule files over a `Dataset` and emits a
  deterministic inferred Turtle output (mirroring
  `kg_reasoner --check`).
- Provide a `jena_corpus` macro that takes an ontology dir, a TTL
  glob, a queries dir and stitches together the gate `test_suite`
  the corpus uses today.
