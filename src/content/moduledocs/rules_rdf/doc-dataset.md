---
title: "dataset"
module: "rules_rdf"
---

<!-- Generated with Stardoc: http://skydoc.bazel.build -->

`rdf_dataset(name, srcs, in_format)` — declare a labeled
collection of RDF files.

This is the single source of "what triples are in this graph?"
that every other rule consumes. Carrying both the file depset and
the format string up-front lets sparql_query_test / rdf_validate_test /
… avoid sniffing extensions at action time and lets consumers
mix datasets with declared formats in one BUILD target without
ambiguity.

Multi-file datasets are concatenated by the consuming rule in
**lexicographic order** before being piped to the plugin's stdin
(see `rdf/plugin_contract.md`). Consumers that care about ordering
should name files to sort accordingly.

<a id="rdf_dataset"></a>

### rdf_dataset

<pre>
load("@rules_rdf//rdf:dataset.bzl", "rdf_dataset")

rdf_dataset(<a href="#rdf_dataset-name">name</a>, <a href="#rdf_dataset-deps">deps</a>, <a href="#rdf_dataset-srcs">srcs</a>, <a href="#rdf_dataset-in_format">in_format</a>)
</pre>

A labeled collection of RDF source files + linked-graph deps.

**ATTRIBUTES**


| Name  | Description | Type | Mandatory | Default |
| :------------- | :------------- | :------------- | :------------- | :------------- |
| <a id="rdf_dataset-name"></a>name |  A unique name for this target.   | <a href="https://bazel.build/concepts/labels#target-names">Name</a> | required |  |
| <a id="rdf_dataset-deps"></a>deps |  Other `rdf_dataset`s this graph links to (imported ontologies, vocabulary modules). Their files are folded into this dataset's `transitive_files` closure, so reasoning/query over the linked vocabularies resolves. Deps should share `in_format` (normalize otherwise).   | <a href="https://bazel.build/concepts/labels">List of labels</a> | optional |  `[]`  |
| <a id="rdf_dataset-srcs"></a>srcs |  RDF source files. Concatenated in lexicographic order by consuming rules before being piped to the plugin's stdin.   | <a href="https://bazel.build/concepts/labels">List of labels</a> | required |  |
| <a id="rdf_dataset-in_format"></a>in_format |  Serialization of every file in `srcs`. Mixed-format datasets aren't supported in v0.1 — use rdf_transform first.   | String | optional |  `"turtle"`  |
