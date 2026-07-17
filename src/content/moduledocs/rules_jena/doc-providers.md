---
title: "providers"
module: "rules_jena"
---

<!-- Generated with Stardoc: http://skydoc.bazel.build -->

Provider types for the rules_jena public API.

The data primitives (`jena_model`, `jena_dataset`, `jena_rule_set`,
`jena_reasoner`) are provider-only — they carry references to
files + small Jena-shaped config, no build actions. Build-action
rules (`jena_reason`, the rules_rdf-driven `rdf_validate_test`,
etc.) consume them.

Every data-providing rule also emits the abstract `RdfDatasetInfo`
from rules_rdf, so jena_model / jena_dataset are drop-in
replacements for `rdf_dataset` in any rules_rdf rule. Consumers
who want Jena-aware features (named graphs, rule sets, OWL
profiles) reach for the Jena providers; everyone else stays on
the abstract interface.

The names use the package-prefixed convention (`JenaXInfo`) so
that an unwrapped `JenaModelInfo` import is unambiguous next to
the rules_rdf `RdfDatasetInfo`.

<a id="JenaDatasetInfo"></a>

## JenaDatasetInfo

<pre>
load("@rules_jena//jena:providers.bzl", "JenaDatasetInfo")

JenaDatasetInfo(<a href="#JenaDatasetInfo-default_graph">default_graph</a>, <a href="#JenaDatasetInfo-named_graphs">named_graphs</a>)
</pre>

A Jena Dataset (collection of named graphs + an optional default graph). Used by rules that need named-graph addressability (Fuseki, multi-graph SPARQL).

**FIELDS**

| Name  | Description |
| :------------- | :------------- |
| <a id="JenaDatasetInfo-default_graph"></a>default_graph |  JenaModelInfo \| None: triples that live outside any named graph.    |
| <a id="JenaDatasetInfo-named_graphs"></a>named_graphs |  dict[str, JenaModelInfo]: graph IRI → model. Order-preserving.    |


<a id="JenaModelInfo"></a>

## JenaModelInfo

<pre>
load("@rules_jena//jena:providers.bzl", "JenaModelInfo")

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

## JenaReasonerInfo

<pre>
load("@rules_jena//jena:providers.bzl", "JenaReasonerInfo")

JenaReasonerInfo(<a href="#JenaReasonerInfo-profile">profile</a>, <a href="#JenaReasonerInfo-rule_set">rule_set</a>)
</pre>

A Jena reasoner configuration. Either a built-in profile (`rdfs`, `owl-rl`, `owl-mini`, `owl-micro`) or a custom rule set; never both. Consumed by `jena_reason` and by the `rdf_reasoner_toolchain_type` plugin contract.

**FIELDS**

| Name  | Description |
| :------------- | :------------- |
| <a id="JenaReasonerInfo-profile"></a>profile |  str: built-in profile name, or empty if custom.    |
| <a id="JenaReasonerInfo-rule_set"></a>rule_set |  JenaRuleSetInfo \| None: rule set for the `custom` profile.    |


<a id="JenaRuleSetInfo"></a>

## JenaRuleSetInfo

<pre>
load("@rules_jena//jena:providers.bzl", "JenaRuleSetInfo")

JenaRuleSetInfo(<a href="#JenaRuleSetInfo-files">files</a>)
</pre>

A set of Jena rule files consumed by the rule-engine reasoner (Jena's RETE-based forward/backward inference). See https://jena.apache.org/documentation/inference/ for the rule syntax. Distinct from SPARQL .rq files.

**FIELDS**

| Name  | Description |
| :------------- | :------------- |
| <a id="JenaRuleSetInfo-files"></a>files |  depset[File]: .rule files in the set.    |
