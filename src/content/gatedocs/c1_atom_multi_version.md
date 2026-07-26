---
title: "one live version per third-party atom"
code: "C1"
family: "Convergence"
sourceUrl: "https://github.com/tomato-bazel/gate/blob/main/gates/c1_atom_multi_version.rq"
---
This is the convergence invariant, and since Bazel 8.6.0/9.1.0 it is also the
COMPATIBILITY invariant. `compatibility_level` is now a no-op, so MVS will
silently upgrade a consumer across a breaking change and Bazel cannot object.
One version per atom means no incompatible co-selection is possible — which
makes this the only thing standing between a consumer and a silent break.

Compares MVS results across every module graph in the registry, so it catches
transitive divergence a scan of declared pins would miss.
