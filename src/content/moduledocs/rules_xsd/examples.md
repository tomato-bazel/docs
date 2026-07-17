---
title: "Usage"
module: "rules_xsd"
---

Real usage, taken from the module's `examples/`.

### examples/BUILD.bazel

```starlark
load("//xsd:defs.bzl", "xsd_schema", "xsd_to_vocab", "xsd_validate_test")

package(default_visibility = ["//visibility:public"])

# A two-schema closure: person.xsd imports common.xsd by namespace. The import's
# schemaLocation is a remote URL that is never fetched — xsd_validate resolves it
# from this local closure (matched on targetNamespace), so the gate is offline.

xsd_schema(
    name = "common",
    srcs = ["common.xsd"],
)

xsd_schema(
    name = "person",
    srcs = ["person.xsd"],
    deps = [":common"],
)

# Gate: the instance validates against the person schema + its closure.
xsd_validate_test(
    name = "person_valid",
    schema = ":person",
    xml = "person.xml",
)

# XSD → RDF/OWL: generate a Turtle vocabulary (person → owl:Class, id → property).
xsd_to_vocab(
    name = "person_vocab",
    namespace = "https://example.org/person#",
    schema = ":person",
)
```
