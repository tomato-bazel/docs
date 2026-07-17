---
title: "Usage"
module: "rules_rdf"
---

Real usage, taken from the module's `examples/`.

### examples/smoke/BUILD.bazel

```starlark
load("@rules_shell//shell:sh_binary.bzl", "sh_binary")
load("@rules_rdf//rdf:contract_test.bzl", "rdf_plugin_contract_test")
load("@rules_rdf//rdf:dataset.bzl", "rdf_dataset")
load(
    "@rules_rdf//rdf:toolchains.bzl",
    "rdf_reasoner_toolchain",
    "rdf_serializer_toolchain",
    "rdf_validator_toolchain",
    "sparql_engine_toolchain",
)
load("@rules_rdf//rdf:namespace.bzl", "rdf_namespace_manifest")
load("@rules_rdf//reason:defs.bzl", "rdf_reason")
load("@rules_rdf//sparql:defs.bzl", "sparql_query", "sparql_query_test")
load("@rules_rdf//transform:defs.bzl", "rdf_transform")
load("@rules_rdf//validate:defs.bzl", "rdf_validate_test")

package(default_visibility = ["//visibility:public"])

# No-op plugins for every rules_rdf toolchain type. Bash scripts —
# not py_binary — so they have no stage2 bootstrap to stage in
# action runfiles trees. Real implementations (rules_jena's jena_*)
# replace these for production.

sh_binary(name = "no_op_sparql", srcs = ["no_op_sparql.sh"])
sh_binary(name = "no_op_validator", srcs = ["no_op_validator.sh"])
sh_binary(name = "no_op_serializer", srcs = ["no_op_serializer.sh"])
sh_binary(name = "no_op_reasoner", srcs = ["no_op_reasoner.sh"])

sparql_engine_toolchain(name = "no_op_sparql_toolchain", binary = ":no_op_sparql")
rdf_validator_toolchain(name = "no_op_validator_toolchain", binary = ":no_op_validator")
rdf_serializer_toolchain(name = "no_op_serializer_toolchain", binary = ":no_op_serializer")
rdf_reasoner_toolchain(name = "no_op_reasoner_toolchain", binary = ":no_op_reasoner")

toolchain(
    name = "no_op_sparql_toolchain_def",
    toolchain = ":no_op_sparql_toolchain",
    toolchain_type = "@rules_rdf//rdf:sparql_engine_toolchain_type",
)

toolchain(
    name = "no_op_validator_toolchain_def",
    toolchain = ":no_op_validator_toolchain",
    toolchain_type = "@rules_rdf//rdf:rdf_validator_toolchain_type",
)

toolchain(
    name = "no_op_serializer_toolchain_def",
    toolchain = ":no_op_serializer_toolchain",
    toolchain_type = "@rules_rdf//rdf:rdf_serializer_toolchain_type",
)

toolchain(
    name = "no_op_reasoner_toolchain_def",
    toolchain = ":no_op_reasoner_toolchain",
    toolchain_type = "@rules_rdf//rdf:rdf_reasoner_toolchain_type",
)

# Source data — a 1-triple Turtle file every smoke target chains off.
rdf_dataset(
    name = "sample",
    srcs = ["sample.ttl"],
    in_format = "turtle",
)

# A linked vocabulary + a dataset that deps on it. `composed`'s
# transitive_files closure = sample.ttl + linked.ttl, so every consuming
# rule (query/reason/validate/transform) sees both graphs — the
# import-closure model used to ground schema.org + SKOS + DC.
rdf_dataset(
    name = "linked",
    srcs = ["linked.ttl"],
    in_format = "turtle",
)

rdf_dataset(
    name = "composed",
    srcs = ["sample.ttl"],
    in_format = "turtle",
    deps = [":linked"],
)

# -- End-to-end smokes ---------------------------------------------------------

sparql_query_test(
    name = "zero_row_gate_smoke",
    dataset = ":sample",
    query = "query.rq",
)

# Exercises the transitive closure through a consumer: the no-op engine
# receives both sample.ttl and linked.ttl.
sparql_query_test(
    name = "closure_smoke",
    dataset = ":composed",
    query = "query.rq",
)

# Import-closure aspect: parent owl:imports child; with child in deps the
# closure is complete, so the strict manifest builds. Drop the dep and
# `strict = True` would fail the build (the completeness gate).
rdf_dataset(
    name = "ont_child",
    srcs = ["ont_child.ttl"],
    in_format = "turtle",
)

rdf_dataset(
    name = "ont_parent",
    srcs = ["ont_parent.ttl"],
    in_format = "turtle",
    deps = [":ont_child"],
)

rdf_namespace_manifest(
    name = "closure_manifest",
    dataset = ":ont_parent",
    strict = True,
)

rdf_validate_test(
    name = "validate_smoke",
    dataset = ":sample",
    shapes = "shapes.ttl",
)

rdf_transform(
    name = "transform_smoke",
    dataset = ":sample",
    out_format = "ntriples",
)

# Producer: emit SELECT results as a build artifact (vs the zero-row
# gate). Turns a reasoned graph into downstream-consumable data.
sparql_query(
    name = "select_smoke",
    dataset = ":sample",
    out_format = "tsv",
    query = "query.rq",
)

rdf_reason(
    name = "reason_smoke",
    base = ":sample",
    profile = "rdfs",
)

# -- Conformance gates ---------------------------------------------------------

rdf_plugin_contract_test(
    name = "no_op_sparql_conforms",
    plugin = ":no_op_sparql",
    toolchain_type = "sparql_engine",
)

rdf_plugin_contract_test(
    name = "no_op_validator_conforms",
    plugin = ":no_op_validator",
    toolchain_type = "rdf_validator",
)

# … truncated — see the repo for the full example
```
