---
title: "a published module must not carry a *_override"
code: "S4"
family: "Supply chain"
sourceUrl: "https://github.com/tomato-bazel/gate/blob/main/gates/s4_no_override_in_published_module.rq"
---
Overrides are honoured only in the ROOT module, so an override in a
dependency does nothing for consumers. That makes it worse than useless:
its presence means the module was published from a workspace where that dep
resolved locally, so it may never have been built against the registry
versions it declares. This is the class of failure that got
`rules_cc_host 0.1.0` yanked with "cannot work as a bazel_dep".

Zero-row gate: any row is a violation.
