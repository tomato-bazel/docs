---
title: "sparql"
module: "rules_rdf"
---

<!-- Generated with Stardoc: http://skydoc.bazel.build -->

User-facing SPARQL rules.

`sparql_query_test` is the zero-row gate idiom: declare an
invariant as a SPARQL query whose result set is empty when the
graph satisfies the invariant. CI runs it as a Bazel test; any
non-empty row triggers a failure.

It's the rules_rdf analog of the production `GateZeroRows.java`
pattern in the Aion RFC repo's `kg/java/`. v0.1 wires the rule
through `sparql_engine_toolchain_type`; the actual SPARQL
execution comes from whichever concrete toolchain the consumer
registered (rules_jena, a future rules_rdflib, etc.).

```python
load("@rules_rdf//rdf:dataset.bzl", "rdf_dataset")
load("@rules_rdf//sparql:defs.bzl", "sparql_query_test")

rdf_dataset(name = "corpus", srcs = glob(["*.ttl"]))

sparql_query_test(
    name = "no_dangling_refs",
    dataset = ":corpus",
    query = "queries/dangling.rq",
)
```

<a id="sparql_query"></a>

### sparql_query

<pre>
load("@rules_rdf//sparql:defs.bzl", "sparql_query")

sparql_query(<a href="#sparql_query-name">name</a>, <a href="#sparql_query-dataset">dataset</a>, <a href="#sparql_query-out_format">out_format</a>, <a href="#sparql_query-query">query</a>)
</pre>

Run a SPARQL query and emit the results as a build artifact (the producer counterpart to sparql_query_test's gate). Turns a reasoned graph into queryable, downstream-consumable data — e.g. grounding tuples for training-data generation.

**ATTRIBUTES**


| Name  | Description | Type | Mandatory | Default |
| :------------- | :------------- | :------------- | :------------- | :------------- |
| <a id="sparql_query-name"></a>name |  A unique name for this target.   | <a href="https://bazel.build/concepts/labels#target-names">Name</a> | required |  |
| <a id="sparql_query-dataset"></a>dataset |  The `rdf_dataset` (closure) to query.   | <a href="https://bazel.build/concepts/labels">Label</a> | required |  |
| <a id="sparql_query-out_format"></a>out_format |  Result serialization. Tabular (tsv/csv/json/xml) for SELECT/ASK; RDF (turtle/ntriples/…) for CONSTRUCT/DESCRIBE (also yields an rdf_dataset).   | String | required |  |
| <a id="sparql_query-query"></a>query |  The SPARQL query file (SELECT/ASK → tabular; CONSTRUCT/DESCRIBE → graph).   | <a href="https://bazel.build/concepts/labels">Label</a> | required |  |


<a id="sparql_query_smoke_test"></a>

### sparql_query_smoke_test

<pre>
load("@rules_rdf//sparql:defs.bzl", "sparql_query_smoke_test")

sparql_query_smoke_test(<a href="#sparql_query_smoke_test-name">name</a>, <a href="#sparql_query_smoke_test-dataset">dataset</a>, <a href="#sparql_query_smoke_test-queries">queries</a>)
</pre>

Assert that a set of SPARQL queries all parse + execute against a dataset. The query-smoke gate idiom — catches syntax errors and reference rot after schema changes.

**ATTRIBUTES**


| Name  | Description | Type | Mandatory | Default |
| :------------- | :------------- | :------------- | :------------- | :------------- |
| <a id="sparql_query_smoke_test-name"></a>name |  A unique name for this target.   | <a href="https://bazel.build/concepts/labels#target-names">Name</a> | required |  |
| <a id="sparql_query_smoke_test-dataset"></a>dataset |  An `rdf_dataset` the queries run against.   | <a href="https://bazel.build/concepts/labels">Label</a> | required |  |
| <a id="sparql_query_smoke_test-queries"></a>queries |  SPARQL query files. The test passes iff every one parses and executes without error (no row-count assertion — that's `sparql_query_test`).   | <a href="https://bazel.build/concepts/labels">List of labels</a> | required |  |


<a id="sparql_query_test"></a>

### sparql_query_test

<pre>
load("@rules_rdf//sparql:defs.bzl", "sparql_query_test")

sparql_query_test(<a href="#sparql_query_test-name">name</a>, <a href="#sparql_query_test-dataset">dataset</a>, <a href="#sparql_query_test-query">query</a>)
</pre>

Run a SPARQL query against an RDF dataset; fail if the result set is non-empty. The zero-row gate idiom.

**ATTRIBUTES**


| Name  | Description | Type | Mandatory | Default |
| :------------- | :------------- | :------------- | :------------- | :------------- |
| <a id="sparql_query_test-name"></a>name |  A unique name for this target.   | <a href="https://bazel.build/concepts/labels#target-names">Name</a> | required |  |
| <a id="sparql_query_test-dataset"></a>dataset |  An `rdf_dataset` whose triples the query runs against.   | <a href="https://bazel.build/concepts/labels">Label</a> | required |  |
| <a id="sparql_query_test-query"></a>query |  The SPARQL query file. Result set must be empty for the test to pass (per `--fail-on-nonempty`).   | <a href="https://bazel.build/concepts/labels">Label</a> | required |  |
