---
title: "reasoner"
module: "rules_jena"
---

<!-- Generated with Stardoc: http://skydoc.bazel.build -->

`jena_reasoner(name, profile|rule_set)` — declare a reasoner
configuration.

Provider-only. Either a built-in profile or a custom rule set;
the rule rejects both-or-neither.

Built-in profiles map onto Jena's
[`ReasonerRegistry`](https://jena.apache.org/documentation/inference/):

| `profile` | Jena equivalent |
|---|---|
| `rdfs` | `ReasonerRegistry.getRDFSReasoner()` |
| `owl-rl` | `ReasonerRegistry.getOWLReasoner()` |
| `owl-mini` | `ReasonerRegistry.getOWLMiniReasoner()` |
| `owl-micro` | `ReasonerRegistry.getOWLMicroReasoner()` |
| `custom` | `GenericRuleReasoner` with the given `rule_set`. |

The Aion production `kg_reasoner` uses `owl-micro` plus
purpose-written Jena rule files; both shapes have first-class
support here.

```python
load("@rules_jena//jena:defs.bzl", "jena_rule_set", "jena_reasoner")

jena_rule_set(name = "kg_rules", rules = glob(["rules/*.rule"]))

jena_reasoner(name = "owl_micro_plus_kg", profile = "custom", rule_set = ":kg_rules")
```

To actually apply the reasoner to a base model, use `jena_reason`
(which runs a build action) or the abstract `rdf_reason` rule
from rules_rdf (which resolves the reasoner toolchain).

<a id="jena_reasoner"></a>

## jena_reasoner

<pre>
load("@rules_jena//jena:reasoner.bzl", "jena_reasoner")

jena_reasoner(<a href="#jena_reasoner-name">name</a>, <a href="#jena_reasoner-profile">profile</a>, <a href="#jena_reasoner-rule_set">rule_set</a>)
</pre>

A Jena reasoner configuration (provider-only).

**ATTRIBUTES**


| Name  | Description | Type | Mandatory | Default |
| :------------- | :------------- | :------------- | :------------- | :------------- |
| <a id="jena_reasoner-name"></a>name |  A unique name for this target.   | <a href="https://bazel.build/concepts/labels#target-names">Name</a> | required |  |
| <a id="jena_reasoner-profile"></a>profile |  Built-in profile name or `custom`. `custom` requires `rule_set`.   | String | optional |  `"rdfs"`  |
| <a id="jena_reasoner-rule_set"></a>rule_set |  A `jena_rule_set` label. Required iff profile = 'custom'.   | <a href="https://bazel.build/concepts/labels">Label</a> | optional |  `None`  |
