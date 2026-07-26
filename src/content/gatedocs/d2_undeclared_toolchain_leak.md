---
title: "a non-dev register_toolchains propagates to every transitive consumer"
code: "D2"
family: "Dev-dep & toolchains"
sourceUrl: "https://github.com/tomato-bazel/gate/blob/main/gates/d2_undeclared_toolchain_leak.rq"
---
`rules_k8s` refuses to register at all and defers to --extra_toolchains;
`rules_lean` scopes its smoke toolchain with dev_dependency = True. Both are
deliberate, and both are documented in prose in their MODULE.bazel. This
makes that reasoning machine-checked.

The predicate is UNDECLARED leakage, not any registration: `rules_jena`
legitimately registers four Jena toolchains because being a toolchain
implementation is its entire purpose. Providers opt in via
gate:declaredToolchainProvider in declarations.ttl, which keeps the
exception list reviewable as data rather than buried in a query.
