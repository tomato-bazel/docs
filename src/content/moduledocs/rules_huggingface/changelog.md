---
title: "Changelog"
module: "rules_huggingface"
---

All notable changes to rules_huggingface. The format is loosely
[Keep a Changelog](https://keepachangelog.com/) — version headers
mirror the published bazel-registry entries.

### 0.0.3 — build-time hermetic dataset fetch

- **`hf_dataset_repository`** repository rule + a `huggingface` bzlmod
  module extension (`huggingface.dataset` tag class). Sha-pinned fetch of
  a single file from a HF dataset/model repo via the
  `resolve/<revision>/<file>` URL, with optional archive extraction and a
  BUILD overlay — the build-time, content-addressed counterpart to the
  run-time `hf_download`. Intended for hermetic build inputs (e.g.
  benchmark archives like ToolBench's ToolEnv tarball pinned into a
  consumer's `MODULE.bazel`). This is the "repository-rule variant"
  flagged as future work in 0.0.2's `hf_download` docs.

### 0.0.2 — hermetic `hf` toolchain + data-plane rules

- **Hermetic `hf` CLI.** `huggingface_hub==1.16.1` served from a pinned,
  universal, hashed pip hub (`@hf_pypi`) via `py_console_script_binary` —
  no system `hf`/`uvx`. (The `[cli]` extra is gone in huggingface_hub 1.x;
  the CLI ships in the base package.)
- **`hf` toolchain.** `//huggingface:toolchain_type` + a default
  `hf_default_toolchain`. Consumers can `register_toolchains` to pin a
  different `huggingface_hub` version without forking the rules.
- **Data-plane rules** (resolve the toolchain, emit a `bazel run`-able
  runner per the cluster verb-suffix convention):
  - `hf_upload`   → `<name>.push`     (create-if-missing + sync a dir)
  - `hf_repo`     → `<name>.create`   (create / no-op reuse a repo)
  - `hf_download` → `<name>.download` (materialize a repo/files locally)
- `hf_model` retained as a typed `HfModelInfo` repo reference.
- Rationale: the data-plane protocol (Git LFS + Xet + the commit
  endpoint) is bespoke client logic only `huggingface_hub` implements,
  so the binary is vendored rather than codegen'd.
- **Control plane — `hf_inference_endpoint`.** The Inference Endpoints
  REST API is a clean OpenAPI 3.1 surface, so (unlike the data plane)
  it's a **typed Rust client** codegen'd by rules_openapi (progenitor)
  from the vendored spec, wrapped by the `hf-endpoints` CLI. Emits
  `<name>.deploy` (config-file body deserialized + validated against the
  generated `types::Endpoint`) plus `.pause / .resume / .scale_to_zero
  / .delete / .describe / .list`. A hermetic 3.1→3.0 down-converter
  (`openapi/downconvert.py`) bridges progenitor's 3.0-only parser. One
  isolated `@hf_crates` universe backs both the client and the CLI.
  (Required upstreaming rules_openapi 0.2.1: threadable chrono/uuid/bytes.)

### 0.0.1 — hf_model + hf_upload

- First public API: `hf_model` (typed ref) + `hf_upload` (macro emitting
  an `sh_binary` `.push` runner over a system `hf`).
