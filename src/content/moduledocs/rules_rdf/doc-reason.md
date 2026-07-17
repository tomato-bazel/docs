---
title: "reason"
module: "rules_rdf"
---

<!-- Generated with Stardoc: http://skydoc.bazel.build -->

User-facing inference rules.

`rdf_reason` runs the registered `rdf_reasoner` toolchain over an
RDF dataset and emits the derived-triples graph (Turtle) as a
build artifact. Unlike `sparql_query_test` / `rdf_validate_test`,
this is a regular rule — its output is a file that downstream
rules can declare as a `src` or `data` dependency.

```python
load("@rules_rdf//rdf:dataset.bzl", "rdf_dataset")
load("@rules_rdf//reason:defs.bzl", "rdf_reason")

rdf_dataset(name = "ontology", srcs = glob(["*.ttl"]))

rdf_reason(
    name = "inferred",
    base = ":ontology",
    profile = "rdfs",
)
```

For custom rule sets (Jena RETE rules):

```python
rdf_reason(
    name = "inferred",
    base = ":ontology",
    profile = "custom",
    rules = "rules/transitive.rule",
)
```

The reasoner toolchain implementation decides which profiles are
supported; the abstract layer only validates that `profile =
"custom"` is paired with `rules` and vice versa.

<a id="rdf_reason"></a>

### rdf_reason

<pre>
load("@rules_rdf//reason:defs.bzl", "rdf_reason")

rdf_reason(<a href="#rdf_reason-name">name</a>, <a href="#rdf_reason-base">base</a>, <a href="#rdf_reason-include_base">include_base</a>, <a href="#rdf_reason-profile">profile</a>, <a href="#rdf_reason-rules">rules</a>)
</pre>

Run inference over an RDF dataset; emit the derived-triples graph (Turtle).

**ATTRIBUTES**


| Name  | Description | Type | Mandatory | Default |
| :------------- | :------------- | :------------- | :------------- | :------------- |
| <a id="rdf_reason-name"></a>name |  A unique name for this target.   | <a href="https://bazel.build/concepts/labels#target-names">Name</a> | required |  |
| <a id="rdf_reason-base"></a>base |  RDF dataset to run inference over.   | <a href="https://bazel.build/concepts/labels">Label</a> | required |  |
| <a id="rdf_reason-include_base"></a>include_base |  If True, emit base + derived triples; otherwise only the derived (default).   | Boolean | optional |  `False`  |
| <a id="rdf_reason-profile"></a>profile |  Reasoning profile. `custom` requires `rules`.   | String | optional |  `"rdfs"`  |
| <a id="rdf_reason-rules"></a>rules |  Custom rule file (Jena RETE syntax). Required iff profile = 'custom'.   | <a href="https://bazel.build/concepts/labels">Label</a> | optional |  `None`  |
