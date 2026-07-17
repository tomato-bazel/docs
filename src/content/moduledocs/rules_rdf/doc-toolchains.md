---
title: "toolchains"
module: "rules_rdf"
---

<!-- Generated with Stardoc: http://skydoc.bazel.build -->

Toolchain registration rules for rules_rdf.

One rule per toolchain type. Each takes the plugin binary as a
mandatory exec-config label and exposes the matching `*ToolchainInfo`
provider with both the binary File and its runfiles bundle.

Concrete plugins (rules_jena, rules_rdflib, …) register via:

    sparql_engine_toolchain(
        name = "jena_arq_sparql_toolchain",
        binary = ":jena_sparql",
    )

    toolchain(
        name = "jena_arq_sparql",
        toolchain = ":jena_arq_sparql_toolchain",
        toolchain_type = "@rules_rdf//rdf:sparql_engine_toolchain_type",
    )

<a id="rdf_reasoner_toolchain"></a>

## rdf_reasoner_toolchain

<pre>
load("@rules_rdf//rdf:toolchains.bzl", "rdf_reasoner_toolchain")

rdf_reasoner_toolchain(<a href="#rdf_reasoner_toolchain-name">name</a>, <a href="#rdf_reasoner_toolchain-binary">binary</a>)
</pre>

Declare an RDF reasoner (inference) toolchain.

**ATTRIBUTES**


| Name  | Description | Type | Mandatory | Default |
| :------------- | :------------- | :------------- | :------------- | :------------- |
| <a id="rdf_reasoner_toolchain-name"></a>name |  A unique name for this target.   | <a href="https://bazel.build/concepts/labels#target-names">Name</a> | required |  |
| <a id="rdf_reasoner_toolchain-binary"></a>binary |  The plugin executable. Must conform to the contract in [rdf/plugin_contract.md](https://github.com/tomato-bazel/rules_rdf/blob/main/plugin_contract.md).   | <a href="https://bazel.build/concepts/labels">Label</a> | required |  |


<a id="rdf_serializer_toolchain"></a>

## rdf_serializer_toolchain

<pre>
load("@rules_rdf//rdf:toolchains.bzl", "rdf_serializer_toolchain")

rdf_serializer_toolchain(<a href="#rdf_serializer_toolchain-name">name</a>, <a href="#rdf_serializer_toolchain-binary">binary</a>)
</pre>

Declare an RDF serializer (format-converter) toolchain.

**ATTRIBUTES**


| Name  | Description | Type | Mandatory | Default |
| :------------- | :------------- | :------------- | :------------- | :------------- |
| <a id="rdf_serializer_toolchain-name"></a>name |  A unique name for this target.   | <a href="https://bazel.build/concepts/labels#target-names">Name</a> | required |  |
| <a id="rdf_serializer_toolchain-binary"></a>binary |  The plugin executable. Must conform to the contract in [rdf/plugin_contract.md](https://github.com/tomato-bazel/rules_rdf/blob/main/plugin_contract.md).   | <a href="https://bazel.build/concepts/labels">Label</a> | required |  |


<a id="rdf_validator_toolchain"></a>

## rdf_validator_toolchain

<pre>
load("@rules_rdf//rdf:toolchains.bzl", "rdf_validator_toolchain")

rdf_validator_toolchain(<a href="#rdf_validator_toolchain-name">name</a>, <a href="#rdf_validator_toolchain-binary">binary</a>)
</pre>

Declare an RDF validator toolchain.

**ATTRIBUTES**


| Name  | Description | Type | Mandatory | Default |
| :------------- | :------------- | :------------- | :------------- | :------------- |
| <a id="rdf_validator_toolchain-name"></a>name |  A unique name for this target.   | <a href="https://bazel.build/concepts/labels#target-names">Name</a> | required |  |
| <a id="rdf_validator_toolchain-binary"></a>binary |  The plugin executable. Must conform to the contract in [rdf/plugin_contract.md](https://github.com/tomato-bazel/rules_rdf/blob/main/plugin_contract.md).   | <a href="https://bazel.build/concepts/labels">Label</a> | required |  |


<a id="sparql_engine_toolchain"></a>

## sparql_engine_toolchain

<pre>
load("@rules_rdf//rdf:toolchains.bzl", "sparql_engine_toolchain")

sparql_engine_toolchain(<a href="#sparql_engine_toolchain-name">name</a>, <a href="#sparql_engine_toolchain-binary">binary</a>)
</pre>

Declare a SPARQL engine toolchain.

**ATTRIBUTES**


| Name  | Description | Type | Mandatory | Default |
| :------------- | :------------- | :------------- | :------------- | :------------- |
| <a id="sparql_engine_toolchain-name"></a>name |  A unique name for this target.   | <a href="https://bazel.build/concepts/labels#target-names">Name</a> | required |  |
| <a id="sparql_engine_toolchain-binary"></a>binary |  The plugin executable. Must conform to the contract in [rdf/plugin_contract.md](https://github.com/tomato-bazel/rules_rdf/blob/main/plugin_contract.md).   | <a href="https://bazel.build/concepts/labels">Label</a> | required |  |
