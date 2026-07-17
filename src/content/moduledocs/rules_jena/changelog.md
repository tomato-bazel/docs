---
title: "Changelog"
module: "rules_jena"
---

All notable changes to rules_jena. The format is loosely
[Keep a Changelog](https://keepachangelog.com/) — version headers
mirror the published bazel-registry entries.

### 0.3.1 — `jena_schemagen` rule

- New `jena_schemagen(name, dataset, package, classname, namespace, …)`
  macro: generate a Java vocabulary class (Resource + Property
  constants) from any `JenaModelInfo` or `RdfDatasetInfo` dataset
  via Apache Jena's built-in `jena.schemagen` tool. Resolves the
  "I need typo-proof `Schema.Person` / `Prov.Entity` constants from
  RDF datasets" need that Jena has been able to satisfy since
  forever but rules_jena didn't expose.
- Companion `JenaSchemagenInfo` provider, public
  `:jena_runtime` `java_library` re-exporting jena-arq / core /
  base / iri / slf4j so consumers across module boundaries can
  compile generated Java without redeclaring jena_maven.
- MODULE.bazel adds `org.apache.jena:jena-cmds:5.2.0` (schemagen
  lives in jena-cmds, not jena-arq / core).
- end-to-end test under `examples/schemagen/`: a fixture ontology
  generates a `Spec.java` whose constants are asserted by a
  `java_test`.
- Three real gotchas documented inline (verified against jena-cmds
  5.2.0): `-e N3` not `--encoding TTL`, `-n` not `--classname`,
  stdout capture (not `-o <path>` — schemagen treats not-yet-
  existing paths as directories and writes `<path>/<classname>.java`
  inside).

### 0.3.0 — rules_rdf 0.3 dep bump

### 0.2.1 — binary RDF formats + rules_rdf 0.2 dep bump

- All four Jena toolchain binaries (`jena_sparql`, `jena_shacl`,
  `jena_riot`, `jena_reasoner_bin`) now accept `rdfthrift` and
  `rdfprotobuf` as `--in-format` values. `jena_riot` additionally
  emits both formats via `--out-format` (`RDFFormat.RDF_THRIFT` /
  `RDFFormat.RDF_PROTO`). Useful as cached intermediate forms in
  long pipelines — significantly faster to parse than Turtle for
  large datasets.
- `rules_rdf` dep bumped to `0.2.0` to pick up the same
  `RDF_FORMATS` vocabulary on the abstract side + the new
  `rdf_reason` / `rdf_transform` build-action rules.

### 0.2.0 — Bazel-idiomatic Jena API + full rules_rdf backend

Four provider-only data primitives:

- `jena_model(name, srcs, in_format, base_iri)` — single Jena
  Model. Emits both `JenaModelInfo` and `RdfDatasetInfo` so it's
  drop-in for rules_rdf rules.
- `jena_dataset(name, default_graph, named_graphs)` — composed of
  one or more `jena_model` labels, addressable by graph IRI. Also
  emits `RdfDatasetInfo` (flattened union).
- `jena_rule_set(name, rules)` — collection of Jena `.rule` files
  for the RETE reasoner.
- `jena_reasoner(name, profile|rule_set)` — built-in profile
  (`rdfs` / `owl-rl` / `owl-mini` / `owl-micro`) or `custom` with
  a rule set.

Three new java_binaries, each satisfying the corresponding
rules_rdf plugin contract:

- `//jena/shacl:jena_shacl` → `rdf_validator_toolchain_type`.
- `//jena/riot:jena_riot` → `rdf_serializer_toolchain_type`.
- `//jena/reasoner:jena_reasoner_bin` → `rdf_reasoner_toolchain_type`.

All four toolchains (sparql + shacl + riot + reasoner) auto-register
in `MODULE.bazel` — pulling in rules_jena gives consumers a complete
rules_rdf backend with zero configuration.

Conformance tests run rules_rdf's contract driver against every
binary; all four pass. End-to-end smoke
`examples/validate/people_conform` chains `jena_model` →
`rdf_validate_test` → registered `jena_shacl` toolchain.

Stardoc reference docs for every public `.bzl`. `bazel test //...`
runs 12/12 (6 stardoc diff_tests + 4 conformance + 1 sparql smoke
+ 1 shacl smoke).

### 0.1.1 — public JENA_DEPS + stardoc reference docs

- Public `JENA_DEPS` constant in `//jena:defs.bzl` — the five Maven
  labels every Jena-using `java_binary` depends on, now re-exportable
  by downstream consumers (`load("@rules_jena//jena:defs.bzl",
  "JENA_DEPS")`). Replaces the inlined list previously hard-coded in
  `jena/sparql/BUILD.bazel`.
- Stardoc-generated reference in `docs/` — `bazel run //docs:update`
  regenerates `docs/defs.md` from the `.bzl` docstrings; a
  `diff_test` gate keeps the committed markdown in sync with the
  source.

### 0.1.0 — first concrete implementation: `jena_sparql`

- Maven dep pinning via `rules_jvm_external`: Apache Jena 5.2.0
  (`jena-arq`, `jena-core`, `jena-base`, `jena-iri`, `jena-shacl`)
  + `slf4j-simple` 2.0.16. Committed `maven_install.json`.
- `jena_sparql` — `java_binary` satisfying rules_rdf's
  `sparql_engine_toolchain_type` contract. ARQ-backed; supports
  SELECT / ASK / CONSTRUCT / DESCRIBE; emits TSV / CSV / JSON /
  SRX / Turtle; honors `--fail-on-nonempty` for zero-row gates.
- `//jena:jena_sparql_toolchain_def` auto-registered by
  `MODULE.bazel` — consumers get the toolchain for free.
- Conformance gate: `//jena:jena_sparql_conforms` runs the
  rules_rdf contract driver. All four scenarios pass against the
  real Jena binary.
- End-to-end smoke (`examples/smoke/`) — FOAF dataset +
  zero-row SPARQL gate through the registered toolchain.
- `.bazelrc` pins `--java_runtime_version=remotejdk_21` so builds
  don't depend on host `JAVA_HOME`.

### 0.0.1 — scaffold

- Initial scaffold via `rels scaffold`. No public API yet.
