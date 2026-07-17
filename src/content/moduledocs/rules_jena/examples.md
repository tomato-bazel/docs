---
title: "Usage"
module: "rules_jena"
---

Real usage, taken from the module's `examples/`.

### examples/dataset_library/BUILD.bazel

```starlark
load("@rules_java//java:defs.bzl", "java_test")
load("@rules_jena//jena:defs.bzl", "jena_dataset_library")

# The fixture graph, bundled into a java_library with a generated
# example.dataset.Fixture.load() accessor.
jena_dataset_library(
    name = "fixture",
    srcs = ["fixture.ttl"],
    package = "example.dataset",
    classname = "Fixture",
)

# Loads it from the classpath and checks the triple count.
java_test(
    name = "load_test",
    srcs = ["LoadTest.java"],
    main_class = "example.dataset.LoadTest",
    use_testrunner = False,
    deps = [
        ":fixture",
        "@jena_maven//:org_apache_jena_jena_core",
    ],
)
```

### examples/reason/BUILD.bazel

```starlark
load("@rules_jena//jena:defs.bzl", "jena_dataset", "jena_model", "jena_reasoner")

package(default_visibility = ["//visibility:public"])

jena_model(
    name = "ontology",
    srcs = ["ontology.ttl"],
    in_format = "turtle",
)

jena_model(
    name = "facts",
    srcs = ["facts.ttl"],
    in_format = "turtle",
)

# Dataset composing the TBox (ontology) + ABox (facts) — flat
# combined model for the v0.2 reasoner pass.
jena_dataset(
    name = "world",
    default_graph = ":ontology",
    named_graphs = {
        "http://example.org/g/facts": ":facts",
    },
)

# RDFS reasoner — built-in profile, no rule_set needed.
jena_reasoner(
    name = "rdfs",
    profile = "rdfs",
)

# v0.2 ships the providers + the rdf_reasoner_toolchain — the
# user-facing rdf_reason rule that consumes them lands in
# rules_rdf v0.2 (its v0.1 only ships sparql_query_test +
# rdf_validate_test). Until then the smoke is "everything builds
# and provides the right info" — the jena_reasoner_bin binary's
# conformance test is what proves the toolchain is wired right.
filegroup(
    name = "smoke",
    srcs = [":world", ":rdfs"],
)
```

### examples/schemagen/BUILD.bazel

```starlark
load("@rules_java//java:defs.bzl", "java_test")
load("@rules_jena//jena:defs.bzl", "jena_model", "jena_schemagen")

# A toy ontology to exercise the schemagen rule end-to-end.
jena_model(
    name = "fixture_ttl",
    srcs = ["fixture.ttl"],
    in_format = "turtle",
)

# Generate example.schemagen.Spec from the fixture — gains static
# Resource / Property constants for every term in the ontology.
jena_schemagen(
    name = "fixture_vocab",
    classname = "Spec",
    dataset = ":fixture_ttl",
    namespace = "https://example.org/spec#",
    package = "example.schemagen",
)

# Compile-time + runtime check: the generated Spec class is on the
# classpath; its constants have the IRIs we declared. Compile alone
# would catch the "no class generated" failure; the main() catches
# wrong-URI bugs.
java_test(
    name = "vocab_test",
    srcs = ["UseGeneratedVocabTest.java"],
    main_class = "example.schemagen.UseGeneratedVocabTest",
    use_testrunner = False,
    deps = [
        ":fixture_vocab",
        # Strict-deps: the test references Resource + Property directly.
        # `fixture_vocab` re-exports them transitively but the compiler
        # wants them on this target's deps list explicitly.
        "@jena_maven//:org_apache_jena_jena_core",
    ],
)
```

### examples/smoke/BUILD.bazel

```starlark
load("@rules_rdf//rdf:dataset.bzl", "rdf_dataset")
load("@rules_rdf//sparql:defs.bzl", "sparql_query_test")

package(default_visibility = ["//visibility:public"])

rdf_dataset(
    name = "people",
    srcs = ["sample.ttl"],
    in_format = "turtle",
)

# End-to-end: rdf_dataset → sparql_query_test → Jena ARQ engine
# via the registered toolchain → exits 0 because the query returns
# zero rows (both alice and bob have foaf:name).
sparql_query_test(
    name = "no_orphans_gate",
    dataset = ":people",
    query = "no_orphans.rq",
)
```

### examples/validate/BUILD.bazel

```starlark
load("@rules_jena//jena:defs.bzl", "jena_model")
load("@rules_rdf//validate:defs.bzl", "rdf_validate_test")

package(default_visibility = ["//visibility:public"])

# Jena-aware data primitive (also emits RdfDatasetInfo so it flows
# straight into rules_rdf's rdf_validate_test).
jena_model(
    name = "people",
    srcs = ["data.ttl"],
    in_format = "turtle",
)

# End-to-end SHACL gate via the auto-registered jena_shacl
# toolchain. Every foaf:Person must have a foaf:name; both alice
# and bob conform.
rdf_validate_test(
    name = "people_conform",
    dataset = ":people",
    shapes = "shapes.ttl",
)
```
