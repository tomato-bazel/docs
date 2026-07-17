---
title: "defs"
module: "rules_xsd"
---

<!-- Generated with Stardoc: http://skydoc.bazel.build -->

User-facing XSD rules (the `rules_xsd` seed).

Two rules, deliberately shaped like rules_rdf's `rdf_dataset` + `rdf_validate_test`
so the whole package lifts into a standalone `rules_xsd` ruleset once the shape
settles (legislative-kg §11):

  * `xsd_schema(name, srcs, deps)` — declare an XSD plus the schemas it imports
    (as other `xsd_schema` targets). Produces `XsdInfo` carrying the transitive
    import closure, the XSD analog of an `rdf_dataset` closure.

  * `xsd_validate_test(name, schema, xml)` — assert an XML instance validates
    against an `XsdInfo`'s schema (resolving every `<xsd:import>` from the local
    closure, never the network). The first correct-by-construction gate.

```python
load("//xsd:defs.bzl", "xsd_schema", "xsd_validate_test")

xsd_schema(name = "xml_ns", srcs = ["@uslm_schema//:xml.xsd"])
xsd_schema(name = "uslm",   srcs = ["@uslm_schema//:USLM-1.0.15.xsd"], deps = [":xml_ns", ...])

xsd_validate_test(name = "slice_valid", schema = ":uslm", xml = "//data:usc_t26_slice.xml")
```

Next step (the `owl:imports`-strict-manifest analog): an aspect that parses each
schema's `<xsd:import namespace=…>` and fails unless every imported namespace is
covered by a declared `dep`'s `targetNamespace` — a closure-completeness gate.
For the first cut, `deps` are explicit and the validator fails loudly if a needed
namespace is absent from the closure.

<a id="xsd_schema"></a>

## xsd_schema

<pre>
load("@rules_xsd//xsd:defs.bzl", "xsd_schema")

xsd_schema(<a href="#xsd_schema-name">name</a>, <a href="#xsd_schema-deps">deps</a>, <a href="#xsd_schema-srcs">srcs</a>, <a href="#xsd_schema-root">root</a>)
</pre>

Declare an XSD schema + its transitive import closure.

**ATTRIBUTES**


| Name  | Description | Type | Mandatory | Default |
| :------------- | :------------- | :------------- | :------------- | :------------- |
| <a id="xsd_schema-name"></a>name |  A unique name for this target.   | <a href="https://bazel.build/concepts/labels#target-names">Name</a> | required |  |
| <a id="xsd_schema-deps"></a>deps |  Imported schemas (other `xsd_schema` targets); their closures fold into this one's `transitive_files`.   | <a href="https://bazel.build/concepts/labels">List of labels</a> | optional |  `[]`  |
| <a id="xsd_schema-srcs"></a>srcs |  This schema's own .xsd file(s).   | <a href="https://bazel.build/concepts/labels">List of labels</a> | required |  |
| <a id="xsd_schema-root"></a>root |  Entry-point schema to validate / generate against (defaults to `srcs[0]`).   | <a href="https://bazel.build/concepts/labels">Label</a> | optional |  `None`  |


<a id="xsd_to_vocab"></a>

## xsd_to_vocab

<pre>
load("@rules_xsd//xsd:defs.bzl", "xsd_to_vocab")

xsd_to_vocab(<a href="#xsd_to_vocab-name">name</a>, <a href="#xsd_to_vocab-namespace">namespace</a>, <a href="#xsd_to_vocab-schema">schema</a>)
</pre>

Generate a Turtle RDF/OWL vocabulary from an XSD — the 'XSD -> RDF, first instance'. Feed the output to jena_schemagen for typed views.

**ATTRIBUTES**


| Name  | Description | Type | Mandatory | Default |
| :------------- | :------------- | :------------- | :------------- | :------------- |
| <a id="xsd_to_vocab-name"></a>name |  A unique name for this target.   | <a href="https://bazel.build/concepts/labels#target-names">Name</a> | required |  |
| <a id="xsd_to_vocab-namespace"></a>namespace |  Ontology namespace IRI for the generated terms (defaults to the schema's targetNamespace + '#').   | String | optional |  `""`  |
| <a id="xsd_to_vocab-schema"></a>schema |  The `xsd_schema` whose root is translated to an RDF/OWL vocabulary.   | <a href="https://bazel.build/concepts/labels">Label</a> | required |  |


<a id="xsd_validate_test"></a>

## xsd_validate_test

<pre>
load("@rules_xsd//xsd:defs.bzl", "xsd_validate_test")

xsd_validate_test(<a href="#xsd_validate_test-name">name</a>, <a href="#xsd_validate_test-schema">schema</a>, <a href="#xsd_validate_test-xml">xml</a>)
</pre>

Assert an XML instance validates against an XSD closure (offline).

**ATTRIBUTES**


| Name  | Description | Type | Mandatory | Default |
| :------------- | :------------- | :------------- | :------------- | :------------- |
| <a id="xsd_validate_test-name"></a>name |  A unique name for this target.   | <a href="https://bazel.build/concepts/labels#target-names">Name</a> | required |  |
| <a id="xsd_validate_test-schema"></a>schema |  The `xsd_schema` to validate against (its closure resolves imports).   | <a href="https://bazel.build/concepts/labels">Label</a> | required |  |
| <a id="xsd_validate_test-xml"></a>xml |  The XML instance to validate.   | <a href="https://bazel.build/concepts/labels">Label</a> | required |  |
