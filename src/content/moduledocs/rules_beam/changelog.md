---
title: "Changelog"
module: "rules_beam"
---

All notable changes to rules_beam. The format is loosely
[Keep a Changelog](https://keepachangelog.com/) — version headers
mirror the published bazel-registry entries.

### 0.0.2 — `data` passthrough on `beam_pipeline_binary`

- `beam_pipeline_binary` gains an optional `data` attribute that is
  forwarded to the underlying `java_binary`. Use for runtime binaries
  the pipeline shells to (sidecars, helper tools) when running locally
  on DirectRunner. Cloud-runner consumers should prefer
  `native_binaries` (bundled inside the fat jar at `/native/<basename>`)
  because runfiles aren't carried across to Dataflow / Flink / Spark
  workers.

### 0.0.1 — scaffold

- Initial scaffold via `rels scaffold`. No public API yet.
