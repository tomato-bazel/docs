---
title: "validate"
module: "rules_rdf"
---

<!-- Generated with Stardoc: http://skydoc.bazel.build -->

User-facing RDF validation rules.

`rdf_validate_test` runs a SHACL shapes graph against an RDF
dataset and fails the build if any violations are reported.
Resolves through `rdf_validator_toolchain_type` so the actual
SHACL engine is pluggable (rules_jena's
`org.apache.jena.shacl.ShaclValidator`, a future
`rules_pyshacl`, …).

```python
load("@rules_rdf//rdf:dataset.bzl", "rdf_dataset")
load("@rules_rdf//validate:defs.bzl", "rdf_validate_test")

rdf_dataset(name = "ontology", srcs = glob(["ontology/*.ttl"]))

rdf_validate_test(
    name = "ontology_conforms",
    dataset = ":ontology",
    shapes = "shapes.ttl",
)
```

ShEx support is in scope for v0.2 (the toolchain contract leaves
room for it via the `--shapes-language` arg, but for v0.1 the
shapes file is assumed Turtle-encoded SHACL).

<a id="rdf_validate_test"></a>

### rdf_validate_test

<pre>
load("@rules_rdf//validate:defs.bzl", "rdf_validate_test")

rdf_validate_test(<a href="#rdf_validate_test-name">name</a>, <a href="#rdf_validate_test-dataset">dataset</a>, <a href="#rdf_validate_test-severity">severity</a>, <a href="#rdf_validate_test-shapes">shapes</a>)
</pre>

Validate an RDF dataset against a SHACL shapes graph.

**ATTRIBUTES**


| Name  | Description | Type | Mandatory | Default |
| :------------- | :------------- | :------------- | :------------- | :------------- |
| <a id="rdf_validate_test-name"></a>name |  A unique name for this target.   | <a href="https://bazel.build/concepts/labels#target-names">Name</a> | required |  |
| <a id="rdf_validate_test-dataset"></a>dataset |  An `rdf_dataset` to validate.   | <a href="https://bazel.build/concepts/labels">Label</a> | required |  |
| <a id="rdf_validate_test-severity"></a>severity |  Minimum severity that fails the build.   | String | optional |  `"violation"`  |
| <a id="rdf_validate_test-shapes"></a>shapes |  SHACL shapes graph (Turtle).   | <a href="https://bazel.build/concepts/labels">Label</a> | required |  |
