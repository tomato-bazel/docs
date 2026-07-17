---
title: "Changelog"
module: "rules_schema_org"
---

All notable changes to rules_schema_org. The format is loosely
[Keep a Changelog](https://keepachangelog.com/) — version headers
mirror the published bazel-registry entries.

### 0.0.1 — schema.org grounding ontology

- Pins the schema.org current vocabulary by sha256 via rules_rdf's
  `rdf.resource` (`@schemaorg_ttl`).
- `//schemaorg:schemaorg` — the composing `rdf_dataset` (SKOS / DC /
  module pins fold in via `deps`).
- `//schemaorg:schemaorg_manifest` — harvested namespace set (the
  grounding vocabulary) + owl:imports completeness audit.
- `//schemaorg:schemaorg_rdfs` — RDFS-materialized subclass/subproperty
  closure (Apache Jena via rules_jena).
- `//schemaorg:grounding_classes` — the class→superclass grounding
  tuples (5,201 rows) emitted as a build artifact; the type hierarchy
  the NL→BGP parser's SFT is generated from.
- Requires a Java 17 runtime for the Jena backends (pinned in
  `.bazelrc`).
