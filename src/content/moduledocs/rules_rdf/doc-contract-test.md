---
title: "contract_test"
module: "rules_rdf"
---

<!-- Generated with Stardoc: http://skydoc.bazel.build -->

`rdf_plugin_contract_test(name, plugin, toolchain_type)` runs
the rules_rdf conformance test driver against any executable
claiming to implement the plugin contract for the named toolchain
type. See [`plugin_contract.md`](https://github.com/tomato-bazel/rules_rdf/blob/main/plugin_contract.md) for what the
driver asserts.

Plugin authors gate toolchain registration on it:

```python
load("@rules_rdf//rdf:contract_test.bzl", "rdf_plugin_contract_test")

rdf_plugin_contract_test(
    name = "jena_sparql_conforms",
    plugin = "//jena:jena_sparql",
    toolchain_type = "sparql_engine",
)
```

The four toolchain types each have their own minimum-valid input
inside the driver; pass the bare name (without the
`_toolchain_type` suffix or `@rules_rdf//rdf:` prefix).

<a id="rdf_plugin_contract_test"></a>

## rdf_plugin_contract_test

<pre>
load("@rules_rdf//rdf:contract_test.bzl", "rdf_plugin_contract_test")

rdf_plugin_contract_test(<a href="#rdf_plugin_contract_test-name">name</a>, <a href="#rdf_plugin_contract_test-plugin">plugin</a>, <a href="#rdf_plugin_contract_test-toolchain_type">toolchain_type</a>)
</pre>

Run the rules_rdf conformance test driver against a plugin binary. See plugin_contract.md.

**ATTRIBUTES**


| Name  | Description | Type | Mandatory | Default |
| :------------- | :------------- | :------------- | :------------- | :------------- |
| <a id="rdf_plugin_contract_test-name"></a>name |  A unique name for this target.   | <a href="https://bazel.build/concepts/labels#target-names">Name</a> | required |  |
| <a id="rdf_plugin_contract_test-plugin"></a>plugin |  The plugin binary to test. Any executable that claims to implement the rules_rdf plugin contract.   | <a href="https://bazel.build/concepts/labels">Label</a> | required |  |
| <a id="rdf_plugin_contract_test-toolchain_type"></a>toolchain_type |  Which toolchain type's scenarios to run: one of sparql_engine, rdf_validator, rdf_serializer, rdf_reasoner.   | String | required |  |
