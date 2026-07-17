---
title: "Changelog"
module: "rules_rdf"
---

All notable changes to rules_rdf. The format is loosely
[Keep a Changelog](https://keepachangelog.com/) — version headers
mirror the published bazel-registry entries.

### 0.4.0 — canonical RDF statement substrate proto

- **`//rdf:statement_proto`** (`fastverk.rdf.v1`, `dev.fastverk.rdf.v1`):
  the canonical RDF statement substrate — `Term` (IRI / literal / bnode),
  `Triple` / `Quad`, `Literal` (lexical + language/datatype), `PrefixDecl`,
  and `RdfStatement` (the stream unit). The message shapes mirror Apache
  Jena's RDF Protobuf wire format, so a stream converts mechanically into a
  Jena `Model` / `Dataset` and round-trips through the `rdfprotobuf`
  serialization rules_rdf already speaks. This is the L1 wire format every
  graph reduces to, keyed on stable IRIs; domain vocabularies + SHACL shapes
  layer on top. **Schema-only** — consumers generate their own bindings
  (`java_proto_library`, …), so the only new dependency is `protobuf` (for
  `proto_library`). Provenance is carried out of band by the domain (e.g. as
  the key in `KV<Context, RdfStatement>`), keeping the substrate neutral.

### 0.3.0 — hermetic RDF-resource fetch + linked-graph closure

- **`rdf_resource_repository`** repository rule + **`rdf`** bzlmod module
  extension (`rdf.resource` tag class). Sha-pinned fetch of a single RDF
  document (TTL / JSON-LD / N-Triples / …) from a URL (with mirror
  fallback) into a repo whose default BUILD overlay exports the raw file
  and declares a ready `rdf_dataset(:dataset)`. The pin-an-ontology
  primitive for grounding vendored vocabularies (schema.org, SKOS, DC)
  into the build graph for `rdf_transform` / `sparql_query` / `rdf_reason`.
- **`rdf_dataset` gains `deps`** (other `rdf_dataset`s it links to) and
  `RdfDatasetInfo` gains `transitive_files` — the linked-graph closure
  (own files + the transitive closure of every dep). `sparql_query` /
  `rdf_reason` / `rdf_validate` / `rdf_transform` now operate over the
  closure, so cross-vocabulary subclass/subproperty chains resolve (a
  schema.org type whose superclass lives in an imported module). Fully
  backward compatible: with no `deps`, `transitive_files == files`.
- **`rdf_namespace_aspect`** (+ `rdf_namespace_manifest`): traverses a
  dataset's `deps` graph, extracting per-node namespaces + `owl:imports`
  (via the stdlib `ns_tool`), and folds them into a manifest with the
  harvested namespace set (the grounding vocabulary) + an
  import-completeness check. `strict = True` fails the build if any
  `owl:imports` is unprovided in the closure.
- **`sparql_query`** producer rule: runs a SELECT/ASK (→ tsv/csv/json/xml)
  or CONSTRUCT/DESCRIBE (→ turtle/… , and yields an `rdf_dataset`) over a
  dataset's closure, emitting results as a **build artifact** — the
  producer counterpart to `sparql_query_test`'s gate. Turns a reasoned
  graph into downstream-consumable data (e.g. grounding tuples for
  training-data generation).

### 0.2.0 — build-action rules + binary RDF formats

- `rdf_reason` (`//reason:defs.bzl`) — build-action rule that
  runs the registered `rdf_reasoner` toolchain over a base
  dataset; emits the derived-triples Turtle file. Provides a
  fresh `RdfDatasetInfo` so consumers can chain
  reason → validate → query.
- `rdf_transform` (`//transform:defs.bzl`) — convert between
  serializations via the registered `rdf_serializer` toolchain.
  Output extension auto-selected from `out_format`.
- Binary RDF formats added to `RDF_FORMATS`: `rdfthrift` (`.rt`)
  and `rdfprotobuf` (`.rpb` / `.bin`). Apache Jena's binary
  serializations — useful as cached intermediate forms.
- Smoke fixtures rewritten as bash plugins (no py_binary
  bootstrap to stage in action runfiles trees). Four no-op
  plugins cover every toolchain type; `bazel test //...` runs
  14/14 (8 stardoc diff_tests + 4 conformance + 4 rule smokes).
- Stardoc for `reason/defs.bzl` + `transform/defs.bzl`.

### 0.1.0 — first usable surface

- Four `toolchain_type`s under `//rdf:`: `sparql_engine`,
  `rdf_validator`, `rdf_serializer`, `rdf_reasoner`.
- Toolchain registration rules + providers carrying both the
  plugin binary and its runfiles (so py_binary / java_binary
  plugins resolve in the sandbox).
- `rdf_dataset` + `RdfDatasetInfo` provider.
- `sparql_query_test` — zero-row SPARQL gate, the workhorse rule.
- `rdf_validate_test` — SHACL gate.
- `rdf_plugin_contract_test` rule + Python driver. Four scenarios:
  `valid_minimal`, `malformed_input`, `unknown_flag`,
  `determinism`.
- Plugin contract finalized at `rdf/plugin_contract.md` (v1).
- Stardoc reference for all six public-API .bzl files.
- End-to-end smoke (`examples/smoke/`) using a no-op Python SPARQL
  engine. Validates the contract pipeline without depending on a
  concrete RDF backend.

### 0.0.1 — scaffold

- Initial scaffold via `rels scaffold`. No public API yet.
