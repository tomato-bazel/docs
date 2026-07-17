---
title: "Overview"
module: "rules_agentic_ide"
---

Project a normalized RDF knowledge graph into per-IDE **agent configs** — skills,
rulesets, and MCP servers for Claude Code, Copilot, and Cursor — with Bazel +
Apache Jena (`rules_jena`).

## Use it

```starlark
# MODULE.bazel — resolves from the fastverk registry (registry.fastverk.com)
bazel_dep(name = "rules_agentic_ide", version = "0.0.3")
```

See the package `BUILD.bazel` / `defs.bzl` for the available rules. Part of the
tomato-bazel distribution.
