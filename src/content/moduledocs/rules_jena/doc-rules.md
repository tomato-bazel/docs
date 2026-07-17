---
title: "rules"
module: "rules_jena"
---

<!-- Generated with Stardoc: http://skydoc.bazel.build -->

`jena_rule_set(name, rules)` — a collection of Jena rule files
for the rule-engine reasoner.

Provider-only. Consumed by `jena_reasoner(profile = "custom")` and
by the `rdf_reasoner_toolchain_type` plugin contract when the
plugin's `--rules` flag points at a file from this set.

Jena rule syntax (the RETE forward-chainer's input — distinct from
SPARQL):

```text
@prefix ex: <http://example.org/> .

[transitiveSubOrg:
    (?a ex:partOf ?b),
    (?b ex:partOf ?c)
    -> (?a ex:partOf ?c)
]
```

See https://jena.apache.org/documentation/inference/#rules. The
file extension is `.rule` by convention; .txt is tolerated.

<a id="jena_rule_set"></a>

## jena_rule_set

<pre>
load("@rules_jena//jena:rules.bzl", "jena_rule_set")

jena_rule_set(<a href="#jena_rule_set-name">name</a>, <a href="#jena_rule_set-rules">rules</a>)
</pre>

A set of Jena rule files for the rule-engine reasoner.

**ATTRIBUTES**


| Name  | Description | Type | Mandatory | Default |
| :------------- | :------------- | :------------- | :------------- | :------------- |
| <a id="jena_rule_set-name"></a>name |  A unique name for this target.   | <a href="https://bazel.build/concepts/labels#target-names">Name</a> | required |  |
| <a id="jena_rule_set-rules"></a>rules |  Jena rule files. Each must follow the rule-engine syntax at https://jena.apache.org/documentation/inference/#rules.   | <a href="https://bazel.build/concepts/labels">List of labels</a> | required |  |
