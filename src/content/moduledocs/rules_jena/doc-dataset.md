---
title: "dataset"
module: "rules_jena"
---

<!-- Generated with Stardoc: http://skydoc.bazel.build -->

`jena_dataset(name, default_graph, named_graphs)` — a Jena
Dataset: a default graph plus a set of named graphs addressable
by IRI.

Provider-only. Composes `jena_model` labels. Like `jena_model`,
also emits `RdfDatasetInfo` (the union of all triples across the
default + named graphs) so rules_rdf rules consume it transparently.

```python
load("@rules_jena//jena:defs.bzl", "jena_model", "jena_dataset")

jena_model(name = "core", srcs = ["core.ttl"], in_format = "turtle")
jena_model(name = "facts", srcs = ["facts.ttl"], in_format = "turtle")
jena_model(name = "claims", srcs = ["claims.ttl"], in_format = "turtle")

jena_dataset(
    name = "corpus",
    default_graph = ":core",
    named_graphs = {
        "http://example.org/g/facts": ":facts",
        "http://example.org/g/claims": ":claims",
    },
)
```

Datasets without named graphs are a degenerate case — for those,
use `jena_model` directly.

<a id="jena_dataset"></a>

### jena_dataset

<pre>
load("@rules_jena//jena:dataset.bzl", "jena_dataset")

jena_dataset(<a href="#jena_dataset-name">name</a>, <a href="#jena_dataset-default_graph">default_graph</a>, <a href="#jena_dataset-named_graphs">named_graphs</a>)
</pre>

A Jena Dataset composed of named-graph `jena_model`s + an optional default graph.

**ATTRIBUTES**


| Name  | Description | Type | Mandatory | Default |
| :------------- | :------------- | :------------- | :------------- | :------------- |
| <a id="jena_dataset-name"></a>name |  A unique name for this target.   | <a href="https://bazel.build/concepts/labels#target-names">Name</a> | required |  |
| <a id="jena_dataset-default_graph"></a>default_graph |  A `jena_model` whose triples form the dataset's default graph (unnamed). Optional.   | <a href="https://bazel.build/concepts/labels">Label</a> | optional |  `None`  |
| <a id="jena_dataset-named_graphs"></a>named_graphs |  Map of graph IRI → `jena_model` label. Each entry becomes a named graph in the resulting Dataset.   | Dictionary: String -> Label | optional |  `{}`  |
