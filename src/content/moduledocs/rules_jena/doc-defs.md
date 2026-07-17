---
title: "defs"
module: "rules_jena"
---

<!-- Generated with Stardoc: http://skydoc.bazel.build -->

Public API surface for rules_jena.

Re-exports the v0.2 user-facing rules (Bazel-idiomatic Jena data
primitives) + the `JENA_DEPS` Maven label set shared with anyone
writing their own Jena `java_binary`.

```python
load("@rules_jena//jena:defs.bzl",
     "JENA_DEPS",
     "jena_model", "jena_dataset", "jena_rule_set", "jena_reasoner",
     "JenaModelInfo", "JenaDatasetInfo", "JenaRuleSetInfo", "JenaReasonerInfo")
```

Pair with the rules_rdf user-facing test rules (`sparql_query_test`,
`rdf_validate_test`) — `jena_model` / `jena_dataset` emit both
`JenaModelInfo` / `JenaDatasetInfo` AND `RdfDatasetInfo`, so they're
drop-in replacements for `rdf_dataset` in any rules_rdf rule.

rules_jena's `MODULE.bazel` auto-registers four toolchains
satisfying every rules_rdf toolchain type — pulling in
`rules_jena` is enough to run any of `sparql_query_test`,
`rdf_validate_test`, `rdf_transform`, `rdf_reason`. v0.2's
`jena_reason` build action is the consumer-facing alternative
when a downstream rule wants a concrete file artifact instead of
the test-shaped `rdf_reason`.

<a id="jena_dataset"></a>

### jena_dataset

<pre>
load("@rules_jena//jena:defs.bzl", "jena_dataset")

jena_dataset(<a href="#jena_dataset-name">name</a>, <a href="#jena_dataset-default_graph">default_graph</a>, <a href="#jena_dataset-named_graphs">named_graphs</a>)
</pre>

A Jena Dataset composed of named-graph `jena_model`s + an optional default graph.

**ATTRIBUTES**


| Name  | Description | Type | Mandatory | Default |
| :------------- | :------------- | :------------- | :------------- | :------------- |
| <a id="jena_dataset-name"></a>name |  A unique name for this target.   | <a href="https://bazel.build/concepts/labels#target-names">Name</a> | required |  |
| <a id="jena_dataset-default_graph"></a>default_graph |  A `jena_model` whose triples form the dataset's default graph (unnamed). Optional.   | <a href="https://bazel.build/concepts/labels">Label</a> | optional |  `None`  |
| <a id="jena_dataset-named_graphs"></a>named_graphs |  Map of graph IRI → `jena_model` label. Each entry becomes a named graph in the resulting Dataset.   | Dictionary: String -> Label | optional |  `{}`  |


<a id="jena_model"></a>

### jena_model

<pre>
load("@rules_jena//jena:defs.bzl", "jena_model")

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


<a id="jena_reasoner"></a>

### jena_reasoner

<pre>
load("@rules_jena//jena:defs.bzl", "jena_reasoner")

jena_reasoner(<a href="#jena_reasoner-name">name</a>, <a href="#jena_reasoner-profile">profile</a>, <a href="#jena_reasoner-rule_set">rule_set</a>)
</pre>

A Jena reasoner configuration (provider-only).

**ATTRIBUTES**


| Name  | Description | Type | Mandatory | Default |
| :------------- | :------------- | :------------- | :------------- | :------------- |
| <a id="jena_reasoner-name"></a>name |  A unique name for this target.   | <a href="https://bazel.build/concepts/labels#target-names">Name</a> | required |  |
| <a id="jena_reasoner-profile"></a>profile |  Built-in profile name or `custom`. `custom` requires `rule_set`.   | String | optional |  `"rdfs"`  |
| <a id="jena_reasoner-rule_set"></a>rule_set |  A `jena_rule_set` label. Required iff profile = 'custom'.   | <a href="https://bazel.build/concepts/labels">Label</a> | optional |  `None`  |


<a id="jena_rule_set"></a>

### jena_rule_set

<pre>
load("@rules_jena//jena:defs.bzl", "jena_rule_set")

jena_rule_set(<a href="#jena_rule_set-name">name</a>, <a href="#jena_rule_set-rules">rules</a>)
</pre>

A set of Jena rule files for the rule-engine reasoner.

**ATTRIBUTES**


| Name  | Description | Type | Mandatory | Default |
| :------------- | :------------- | :------------- | :------------- | :------------- |
| <a id="jena_rule_set-name"></a>name |  A unique name for this target.   | <a href="https://bazel.build/concepts/labels#target-names">Name</a> | required |  |
| <a id="jena_rule_set-rules"></a>rules |  Jena rule files. Each must follow the rule-engine syntax at https://jena.apache.org/documentation/inference/#rules.   | <a href="https://bazel.build/concepts/labels">List of labels</a> | required |  |


<a id="JenaDatasetInfo"></a>

### JenaDatasetInfo

<pre>
load("@rules_jena//jena:defs.bzl", "JenaDatasetInfo")

JenaDatasetInfo(<a href="#JenaDatasetInfo-default_graph">default_graph</a>, <a href="#JenaDatasetInfo-named_graphs">named_graphs</a>)
</pre>

A Jena Dataset (collection of named graphs + an optional default graph). Used by rules that need named-graph addressability (Fuseki, multi-graph SPARQL).

**FIELDS**

| Name  | Description |
| :------------- | :------------- |
| <a id="JenaDatasetInfo-default_graph"></a>default_graph |  JenaModelInfo \| None: triples that live outside any named graph.    |
| <a id="JenaDatasetInfo-named_graphs"></a>named_graphs |  dict[str, JenaModelInfo]: graph IRI → model. Order-preserving.    |


<a id="JenaModelInfo"></a>

### JenaModelInfo

<pre>
load("@rules_jena//jena:defs.bzl", "JenaModelInfo")

JenaModelInfo(<a href="#JenaModelInfo-files">files</a>, <a href="#JenaModelInfo-in_format">in_format</a>, <a href="#JenaModelInfo-base_iri">base_iri</a>)
</pre>

A single Jena Model (RDF graph). Provider-only — the files declared on the rule remain the source of truth.

**FIELDS**

| Name  | Description |
| :------------- | :------------- |
| <a id="JenaModelInfo-files"></a>files |  depset[File]: source files concatenated to form the model.    |
| <a id="JenaModelInfo-in_format"></a>in_format |  str: serialization (turtle, ntriples, nquads, trig, jsonld, rdfxml). Matches the rules_rdf RDF_FORMATS vocabulary.    |
| <a id="JenaModelInfo-base_iri"></a>base_iri |  str: optional base IRI for relative references in the source files. Empty string = no base.    |


<a id="JenaReasonerInfo"></a>

### JenaReasonerInfo

<pre>
load("@rules_jena//jena:defs.bzl", "JenaReasonerInfo")

JenaReasonerInfo(<a href="#JenaReasonerInfo-profile">profile</a>, <a href="#JenaReasonerInfo-rule_set">rule_set</a>)
</pre>

A Jena reasoner configuration. Either a built-in profile (`rdfs`, `owl-rl`, `owl-mini`, `owl-micro`) or a custom rule set; never both. Consumed by `jena_reason` and by the `rdf_reasoner_toolchain_type` plugin contract.

**FIELDS**

| Name  | Description |
| :------------- | :------------- |
| <a id="JenaReasonerInfo-profile"></a>profile |  str: built-in profile name, or empty if custom.    |
| <a id="JenaReasonerInfo-rule_set"></a>rule_set |  JenaRuleSetInfo \| None: rule set for the `custom` profile.    |


<a id="JenaRuleSetInfo"></a>

### JenaRuleSetInfo

<pre>
load("@rules_jena//jena:defs.bzl", "JenaRuleSetInfo")

JenaRuleSetInfo(<a href="#JenaRuleSetInfo-files">files</a>)
</pre>

A set of Jena rule files consumed by the rule-engine reasoner (Jena's RETE-based forward/backward inference). See https://jena.apache.org/documentation/inference/ for the rule syntax. Distinct from SPARQL .rq files.

**FIELDS**

| Name  | Description |
| :------------- | :------------- |
| <a id="JenaRuleSetInfo-files"></a>files |  depset[File]: .rule files in the set.    |
