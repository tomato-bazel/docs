---
title: "Overview"
module: "rules_schema_org"
---

The **grounding ontology** for typed tool-capability matching. Pins
schema.org (and, incrementally, SKOS / DC / the module closure) as
sha-verified RDF, RDFS-materializes its class/property hierarchy, and
emits the grounding tuples that an NL→BGP capability parser is trained
to target.

Built on the cluster's RDF rules:

```
rules_rdf   — rdf.resource (pin) · rdf_dataset (closure) ·
              rdf_namespace_aspect (harvest/validate) · rdf_reason ·
              sparql_query (producer)
rules_jena  — Apache Jena backends for the four rdf toolchain types
```

## Pipeline

```
rdf.resource  →  rdf_dataset(deps=…)  →  rdf_reason(rdfs, include_base)  →  sparql_query
  (pin TTL)        (linked closure)        (materialize subClassOf)          (grounding tuples)
```

## Targets

| target | what |
|---|---|
| `@schemaorg_ttl//:dataset` | the pinned schema.org vocabulary |
| `//schemaorg:schemaorg` | composing `rdf_dataset` (add SKOS/DC via `deps`) |
| `//schemaorg:schemaorg_manifest` | harvested namespace set + import audit |
| `//schemaorg:schemaorg_rdfs` | RDFS-materialized closure |
| `//schemaorg:grounding_classes` | class→superclass tuples (TSV) |

## Requirements

Apache Jena needs a **Java 17+** runtime; `.bazelrc` pins
`--java_runtime_version=remotejdk_17`.

## Replaces

The ad-hoc `savvi-studio/tools/schemaorg` index generator — superseded
by a hermetic, sha-pinned, reasoned, queryable grounding ontology.
