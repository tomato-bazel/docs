---
title: "SOURCES"
module: "rules_jena"
---

## Source-of-truth patterns to port

The Jena patterns `rules_jena` packages as toolchains all exist in
production today, in the Aion RFC knowledge-graph tree at
`~/Documents/rfcs/kg/java/`. This file catalogs which files we extract
and what each one teaches.

Reference BUILD files (read-only sources of the wiring):

- `~/Documents/rfcs/kg/java/BUILD.bazel` — the `JENA_DEPS` list,
  the `:loader`, `:writer`, `:gate_harness` `java_library`
  declarations, plus the `gate_*` `java_test`s.
- `~/Documents/rfcs/kg/java/reasoner/BUILD.bazel` — the
  `kg_reasoner` `java_binary` (OWL-MICRO inference).

### Files

| File (under `~/Documents/rfcs/kg/java/`) | What it teaches |
|---|---|
| `Loader.java` | Single shared library that loads every TTL under a corpus root into one in-memory Jena `Dataset`. Every downstream binary depends on this — port becomes the public `:rdf_io` library at the rules_jena root. |
| `Writer.java` | Deterministic Turtle serializer. Stable prefix ordering, stable blank-node labels, byte-stable round-trip. The invariants documented in the file header become the rules_jena serializer toolchain's contract. |
| `WriterTest.java` | Round-trip + parse-equivalence test: `write(load(write(model)))` byte-equals `write(model)` and the result is isomorphic to the input. Ports as the rules_jena serializer-toolchain conformance test. |
| `GateHarness.java` | Orchestrates a set of SPARQL zero-row checks plus a SHACL conformance check against one `Dataset`. The "compose multiple gates into one suite" pattern. |
| `Gates.java` | Shared query-plumbing helpers (load a `.rq` from disk, execute against a `Dataset`, collect results). Used by every `Gate*` binary; ports as a private helper for the SPARQL + SHACL toolchain binaries. |
| `GateZeroRows.java` | The "run one `.rq` and fail if it returns >0 rows" gate shape. Generalizes to the rules_jena SPARQL toolchain's zero-row mode. |
| `GateQuerySmoke.java` | The "every `.rq` under a dir parses + executes" gate shape. The conformance-test analog for SPARQL toolchains. |
| `GateShacl.java` | The "load shapes.ttl + data, run `ShaclValidator`, fail on non-conforming" gate shape. Becomes the rules_jena SHACL validator toolchain core. |
| `reasoner/KgReasoner.java` | OWL-MICRO inference via `ReasonerRegistry.getOWLMicroReasoner()`, plus a Jena rule-file driver. Deterministic, idempotent output. Becomes the rules_jena OWL reasoner toolchain. |

### What we do not port (yet)

These exist in the kg/java/ tree but are corpus-specific, not generic
Jena tooling — they belong in a downstream consumer, not in
`rules_jena`:

- `KgReport.java`, `CrossCutting.java` — Aion-specific reporting.
- `AionPaths.java` — XDG/macOS/Windows config paths (not Jena).
- `BuildSummary.java` — `SUMMARY.md` drift gate (not Jena).
- Anything under `kg/java/edit/`, `kg/java/lint/`, `kg/java/metrics/`,
  `kg/java/research/` — corpus-specific CLIs. The reusable shapes
  inside them (lint rules, metric formulas) land as
  `jena_lint` / `jena_reason` in v0.3.
