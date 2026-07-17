---
title: "transform"
module: "rules_rdf"
---

<!-- Generated with Stardoc: http://skydoc.bazel.build -->

User-facing format-conversion rule.

`rdf_transform` re-serializes an RDF dataset into a different
format via the registered `rdf_serializer` toolchain. The output
is a regular build artifact.

```python
load("@rules_rdf//rdf:dataset.bzl", "rdf_dataset")
load("@rules_rdf//transform:defs.bzl", "rdf_transform")

rdf_dataset(name = "src_turtle", srcs = ["data.ttl"], in_format = "turtle")

rdf_transform(
    name = "data_ntriples",
    dataset = ":src_turtle",
    out_format = "ntriples",
)
```

Output filename = `<name>.<ext>` where `<ext>` is the canonical
extension for `out_format` (`.ttl`, `.nt`, `.nq`, `.trig`,
`.jsonld`, `.rdf`).

<a id="rdf_transform"></a>

### rdf_transform

<pre>
load("@rules_rdf//transform:defs.bzl", "rdf_transform")

rdf_transform(<a href="#rdf_transform-name">name</a>, <a href="#rdf_transform-dataset">dataset</a>, <a href="#rdf_transform-out_format">out_format</a>)
</pre>

Convert an RDF dataset between serializations.

**ATTRIBUTES**


| Name  | Description | Type | Mandatory | Default |
| :------------- | :------------- | :------------- | :------------- | :------------- |
| <a id="rdf_transform-name"></a>name |  A unique name for this target.   | <a href="https://bazel.build/concepts/labels#target-names">Name</a> | required |  |
| <a id="rdf_transform-dataset"></a>dataset |  RDF dataset to convert.   | <a href="https://bazel.build/concepts/labels">Label</a> | required |  |
| <a id="rdf_transform-out_format"></a>out_format |  Target serialization.   | String | required |  |
