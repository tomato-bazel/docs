---
title: "Overview"
module: "rules_rdf"
---

Bazel rules for RDF. Defines abstract toolchain types for the four
operations that show up in every production RDF/knowledge-graph
pipeline — SPARQL query execution, SHACL validation, format
conversion, and reasoning — and leaves the engine choice to a
concrete toolchain registered by the consumer. The host repo only
registers toolchains; the rules themselves are engine-agnostic.

rules_rdf also hosts the **canonical RDF statement substrate** —
`//rdf:statement_proto` (`fastverk.rdf.v1`): Jena-protobuf-shaped
`Term` / `Triple` / `Quad` / `Literal` / `PrefixDecl` / `RdfStatement`, the
L1 wire format graph data reduces to (keyed on stable IRIs). Schema-only;
consumers generate their own language bindings.

## Status: v0.2.0

What v0.2 adds on top of v0.1.0:

- **`rdf_reason`** (`//reason:defs.bzl`) — build-action rule that
  runs the registered `rdf_reasoner` toolchain over a base dataset
  and emits the derived-triples graph (Turtle) as a file artifact.
  Provides a fresh `RdfDatasetInfo` so consumers can chain
  reason → validate → query. Supports built-in profiles
  (`rdfs`, `owl-rl`, `owl-mini`, `owl-micro`) + `custom` with a
  Jena rule file.
- **`rdf_transform`** (`//transform:defs.bzl`) — converts a dataset
  between serializations via the registered `rdf_serializer`
  toolchain. Output extension follows the target format.
- **Binary RDF support** — `rdfthrift` and `rdfprotobuf` added to
  `RDF_FORMATS` (Apache Jena's binary serializations). Useful as
  cached intermediate forms; significantly faster to parse than
  Turtle for large datasets. Consumed by `rdf_transform`'s
  `out_format` + accepted by `rdf_dataset`'s `srcs` via `.rt` /
  `.rpb` / `.bin` extensions.
- **Four no-op smoke plugins** (bash) covering every toolchain
  type. `bazel test //...` runs 14/14 — every public rule
  exercised end-to-end without needing rules_jena.

---

## v0.1.0 status (still shipped):

What ships:

- Four `toolchain_type` declarations in `//rdf:` (`sparql_engine`,
  `rdf_validator`, `rdf_serializer`, `rdf_reasoner`).
- One `rdf_*_toolchain` rule per type for plugin registration
  (`//rdf:toolchains.bzl`), each carrying the binary + its runfiles
  so py_binary / java_binary plugins resolve cleanly inside the
  Bazel sandbox.
- Five providers (`SparqlEngineToolchainInfo`,
  `RdfValidatorToolchainInfo`, `RdfSerializerToolchainInfo`,
  `RdfReasonerToolchainInfo`, `RdfDatasetInfo`).
- `rdf_dataset(name, srcs, in_format)` — bundle RDF files into a
  format-tagged provider for downstream rules.
- `sparql_query_test(name, dataset, query)` — zero-row SPARQL gate.
  The workhorse rule; resolves `sparql_engine_toolchain_type`.
- `rdf_validate_test(name, dataset, shapes, severity)` — SHACL gate
  via `rdf_validator_toolchain_type`.
- `rdf_plugin_contract_test(name, plugin, toolchain_type)` — runs
  the conformance driver (Python) against any plugin executable.
  Four scenarios: `valid_minimal`, `malformed_input`, `unknown_flag`,
  `determinism`.
- Plugin contract finalized at
  [`rdf/plugin_contract.md`](https://github.com/tomato-bazel/rules_rdf/blob/main/rdf/plugin_contract.md) (v1).
- Stardoc-generated reference in `docs/` for every public-API file.
- End-to-end smoke test in `examples/smoke/` — a no-op Python SPARQL
  engine registered as a toolchain, exercised through both
  `sparql_query_test` and `rdf_plugin_contract_test`. Both pass.

Deferred to v0.2:

- `sparql_query_run`, `rdf_transform`, `rdf_reason` (need wider
  toolchain coverage; rules_jena unblocks them).
- ShEx support in `rdf_validate_test` (the toolchain contract leaves
  room via a future `--shapes-language` flag).
- Cross-format dataset support (mixed `in_format` in one dataset).

## Architecture

Plugins implement a minimal stdin/argv/stdout contract; per-operation
Bazel rules wrap them. Concrete RDF engines (Apache Jena, RDF4J,
Oxigraph, …) live in sibling repos and register toolchains against
the abstract types defined here.

```
//rdf:                        operation-neutral core
  - toolchain_type definitions per RDF operation
  - provider definitions (RdfDatasetInfo, …)
  - rdf_*_toolchain rules (register a plugin)
  - rdf_plugin_contract_test rule (verify a plugin conforms)
  - plugin_contract.md (authoritative spec)

//sparql:                     SPARQL query rules
  - sparql_query_test, sparql_query_run

//shacl:                      SHACL validation rules
  - rdf_validate_test

//convert:                    format conversion rules
  - rdf_transform

//reason:                     inference rules
  - rdf_reason
```

Adding a new RDF engine is:

1. Write four plugin binaries (one per toolchain type) — or a single
   multi-tool binary dispatched on a subcommand flag. Each conforms
   to the plugin contract.
2. Register one `rdf_*_toolchain` per operation pointing at the
   appropriate plugin.
3. Gate registration with `rdf_plugin_contract_test`.

## Planned toolchain types

| Type | Operation | Inputs | Output |
|---|---|---|---|
| `sparql_engine_toolchain_type` | Run a SPARQL query against an RDF dataset | dataset (one or more graph files) + `.rq` query file | query results (SRX / JSON / TSV / CSV / Turtle for CONSTRUCT) |
| `rdf_validator_toolchain_type` | Validate a dataset against a SHACL shapes graph | dataset + `shapes.ttl` | validation report (Turtle, `sh:ValidationReport`) |
| `rdf_serializer_toolchain_type` | Convert RDF between serializations | dataset in format A | same graph in format B (Turtle ↔ N-Triples ↔ JSON-LD ↔ RDF/XML ↔ TriG ↔ N-Quads) |
| `rdf_reasoner_toolchain_type` | Materialise inferred triples | dataset + reasoning profile (`rdfs`, `owl-rl`, custom rules) | derived-triples graph (Turtle) |

Each type resolves a single plugin executable per consumer; an engine
ships up to four plugins (or one binary with four subcommands) and
registers each independently so a consumer can mix-and-match — e.g.
Jena for SPARQL and Oxigraph for reasoning — without rebuilding the
toolchain.

## Planned user-facing rules

| Rule | Toolchain | Purpose |
|---|---|---|
| `rdf_dataset` | (none) | Bundle one or more graph files + format hints into an `RdfDatasetInfo` provider consumed by every downstream rule. |
| `sparql_query_test` | `sparql_engine_toolchain_type` | Zero-row gate — run a `.rq` query and fail the build if the result set is non-empty. The canonical SPARQL gate idiom. |
| `sparql_query_run` | `sparql_engine_toolchain_type` | Run a query and emit the result set as a build artifact. |
| `rdf_validate_test` | `rdf_validator_toolchain_type` | Run SHACL validation; fail the build on any `sh:Violation`. |
| `rdf_transform` | `rdf_serializer_toolchain_type` | Convert a dataset between serializations. Idempotent on the same format. |
| `rdf_reason` | `rdf_reasoner_toolchain_type` | Emit the inferred triples for a dataset under a reasoning profile. |

`sparql_query_test` is the workhorse — the production graph at
`kg/java/` uses the same "non-empty result set means violation"
idiom for every PR gate, and rules_rdf lifts that idiom into a
first-class Bazel rule.

## The plugin contract

A plugin is any executable that conforms to:

```
INPUT
  stdin              the RDF document bytes (concatenated dataset, format declared via --in-format)
  argv               --key=value pairs

OUTPUT
  stdout             the generated output (query results, validation report, converted graph, inferred triples)
  stderr             diagnostics

EXIT
  0                  success
  non-zero           failure
```

Standard argv flags every plugin receives: `--rule-name=NAME` and
`--in-format=FORMAT`. Per-toolchain flags (`--query=PATH`,
`--shapes=PATH`, `--out-format=FORMAT`, `--profile=NAME`) are passed
through by the calling rule. See
[`rdf/plugin_contract.md`](https://github.com/tomato-bazel/rules_rdf/blob/main/rdf/plugin_contract.md) for the
authoritative spec (currently v0.1 draft).

## Concrete implementations

- **[fastverk/rules_jena](https://github.com/fastverk/rules_jena)** —
  Apache Jena backend. Ships plugins for all four toolchain types
  (`jena_sparql`, `jena_shacl`, `jena_riot`, `jena_reasoner`) and a
  Maven-pinned `JENA_DEPS` set so consumers don't re-declare it.

Others (RDF4J, Oxigraph) are not blocked by anything in this repo —
the contract is the integration point. PRs to list third-party
implementations here are welcome.

## Install

`.bazelrc`:

```
common --registry=https://registry.fastverk.com/
common --registry=https://bcr.bazel.build/
```

`MODULE.bazel`:

```python
bazel_dep(name = "rules_rdf", version = "0.2.0")
```

No toolchains are registered by default — pull in a concrete
implementation (e.g. `rules_jena`) and register its toolchains in
your `MODULE.bazel`.

## Compatibility

- **Bazel**: 7.4+, bzlmod required (tested on 9.1).

## License

MIT.
