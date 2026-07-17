---
title: "model"
module: "rules_jena"
---

<!-- Generated with Stardoc: http://skydoc.bazel.build -->

`jena_model(name, srcs, in_format, base_iri)` — declare one RDF
graph as a Jena-aware data primitive.

Provider-only: no Bazel actions, no parsed-form artifacts. The
`srcs` files remain the source of truth; downstream rules either
read them directly or feed them to a Java tool that parses them
into an in-memory `Model`.

Every `jena_model` ALSO emits `RdfDatasetInfo` (the abstract
provider from rules_rdf) so it's a drop-in dataset for any
rules_rdf rule:

```python
load("@rules_jena//jena:defs.bzl", "jena_model")
load("@rules_rdf//sparql:defs.bzl", "sparql_query_test")

jena_model(
    name = "ontology",
    srcs = ["ontology.ttl"],
    in_format = "turtle",
)

sparql_query_test(  # works: resolves via RdfDatasetInfo
    name = "ontology_well_formed",
    dataset = ":ontology",
    query = "queries/check.rq",
)
```

For named-graph use cases see `jena_dataset`.

<a id="jena_model"></a>

### jena_model

<pre>
load("@rules_jena//jena:model.bzl", "jena_model")

jena_model(<a href="#jena_model-name">name</a>, <a href="#jena_model-srcs">srcs</a>, <a href="#jena_model-base_iri">base_iri</a>, <a href="#jena_model-in_format">in_format</a>)
</pre>

A Jena Model (single RDF graph) declared as Bazel data.

**ATTRIBUTES**


| Name  | Description | Type | Mandatory | Default |
| :------------- | :------------- | :------------- | :------------- | :------------- |
| <a id="jena_model-name"></a>name |  A unique name for this target.   | <a href="https://bazel.build/concepts/labels#target-names">Name</a> | required |  |
| <a id="jena_model-srcs"></a>srcs |  Source RDF files for this single graph. Concatenated in lexicographic order by Jena tools.   | <a href="https://bazel.build/concepts/labels">List of labels</a> | required |  |
| <a id="jena_model-base_iri"></a>base_iri |  Optional base IRI for resolving relative references in `srcs`. Empty = none.   | String | optional |  `""`  |
| <a id="jena_model-in_format"></a>in_format |  Serialization of every file in `srcs`. Mixed formats aren't supported — pipe through `rdf_transform` first if you need to combine.   | String | optional |  `"turtle"`  |
