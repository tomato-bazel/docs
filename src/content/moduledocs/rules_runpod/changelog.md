---
title: "Changelog"
module: "rules_runpod"
---

All notable changes to rules_runpod. The format is loosely
[Keep a Changelog](https://keepachangelog.com/) — version headers
mirror the published bazel-registry entries (when published; v0
is premium / private).

### 0.0.11 — `rsync_down` output-nesting fix

- **`rsync_down` no longer nests pulled outputs.** It omitted the trailing
  slash on its remote source that `rsync_up` has on its local source, so
  `rsync host:outputs/adapter-x local/outputs/adapter-x` copied the directory
  *under* the destination — `outputs/adapter-x/adapter-x/`. A real RunPod
  training run pulled its adapter into the doubled path. Now mirrors the remote
  directory's *contents* into `local` (trailing slash, symmetric with
  `rsync_up`) and creates `local` first since it's the final destination.

### 0.0.10 — `volume create` accepts HTTP 201

- **`volume create` no longer errors on a successful create.** RunPod's
  `POST /networkvolumes` returns `201 Created` with the new volume in the
  body, but the vendored OpenAPI spec only documented `200`, so the
  generated (progenitor) client treated 201 as an `UnexpectedResponse` —
  the volume *was* created, but the CLI errored before printing its id.
  `patch_spec.py` now mirrors the `200` response under `201` for
  `POST /networkvolumes`, so the client parses the created volume.

### 0.0.9 — Create the workdir in volume mode

- **`mkdir -p /root/workdir` before setup/run in volume mode.** The rsync
  path creates `/root/workdir` as a side effect of the upload; volume mode
  skips rsync, so on a fresh pod the setup/run scripts' `cd /root/workdir`
  failed with "No such file or directory" — training never started.
  `ssh::ensure_workdir` now creates it after the rsync-skip.

### 0.0.8 — S3 network-volume data path (rsync-free training)

- **`volume sync` / `volume download`.** S3-compatible upload/download to a
  RunPod network volume (aws-sdk-s3); endpoint + region derived from the
  volume's data center (`s3api-<dc>.runpod.io`, path-style). Credentials
  from the standard AWS env vars (RunPod S3 API keys).
- **Manifest `stage` + `output_archive`.** `train` stages declared inputs to
  the mounted volume via S3 before deploy, and in volume mode pulls a single
  tarred output archive back via S3 — **no workdir rsync either direction**.
  This is the fast data path for datasets / weights, and it delivers
  genrule-built datasets that the `bazel-*` rsync exclude used to drop.
- **Pod-lifecycle fixes** (folded from the in-progress 0.0.8 work): broaden
  the capacity matcher to any create-pod HTTP 5xx, `wait_for_ssh` TCP probe,
  and `template_id` deploy.

### 0.0.7 — GPU fallback list + repeatable --gpu override

- **`train` retries across an ordered GPU fallback list.** The manifest's
  `[resources] gpu_type` now accepts either a single string (backward
  compatible) or a list (`gpu_type = ["NVIDIA L40S", "NVIDIA A40", ...]`).
  `train` tries each in turn, advancing to the next only on a *capacity*
  error ("no instances currently available") and surfacing any other
  error (bad GPU id, auth) immediately. Bails with a clear message when
  every candidate is out of capacity — no more hand-editing the GPU and
  relaunching when SECURE capacity is dry.
- **`--gpu` is now repeatable** (`--gpu A --gpu B`) — a runtime override
  of the candidate list, no manifest edit required.

### 0.0.6 — Detached run execution (survives SSH drops)

The `run` script can now execute detached on the pod
(`detached = true` in the manifest TOML). Instead of streaming
the script over a single long-lived SSH session — which dies if
the connection drops, taking the whole run with it — the script
is written to `.agora_run.sh`, launched under `setsid`/`nohup`,
and the CLI polls for an `.agora_run.exit` sentinel over fresh
SSH connections.

Motivation: three consecutive ~1-hour LoRA training runs (agora
parser fine-tune) died to mid-run `Connection reset by peer` /
`Broken pipe`. The training itself was healthy each time (loss
converging) — the SSH session was the failure point. Detached
execution decouples the run's lifetime from the controlling
session: a dropped connection during the poll is logged + retried
on the next tick; the run keeps going on the pod regardless.

  * New `Manifest.detached` (default false, back-compat) +
    `Manifest.poll_secs` (default 30).
  * `ssh::run_remote_script_detached` + `ssh::poll_remote_until_done`.
  * `setup` still runs foreground (short, cheap to retry); only
    the long-pole `run` script goes detached.
  * SSH keepalive hardened: ServerAliveInterval 30→15,
    ServerAliveCountMax 8, TCPKeepAlive yes.

### 0.0.5 — `runpod_job(ephemeral = True)` for orphan-free iteration

`runpod-cli train` gains a `--down-on-failure` flag (mate of the
existing `--down-on-success`). When training's setup or run script
exits non-zero, the pod is torn down + state cleared automatically.

The `runpod_job` macro accepts `ephemeral = True` which threads
both `--down-on-success` and `--down-on-failure` through the
`.run` wrapper. Recommended for `bazel run` iteration where leaving
orphan pods up costs real money — during the rules_lora pod-side
debug pass, we accumulated 6+ orphan pods that each had to be
manually deleted.

The pod-output pull happens *before* the failure-terminate so
partial checkpoints (e.g. torchtune adapters saved before a
post-train hook errors) still come back locally.

### 0.0.4 — `<name>.run` wrapper uses Bazel's runfiles helper

Fixes a regression in 0.0.3: passing `$(execpath ...)` as sh_binary
args produced `bazel-out/...` paths that didn't resolve from the
sh_binary's runfiles CWD. The runner.sh wrapper now initializes
Bazel's standard bash runfiles helper (the
`@bazel_tools//tools/bash/runfiles` library) and the macro passes
`$(rlocationpath ...)` — the canonical runfiles-resolvable path —
for each artifact. `rlocation $1` returns the absolute on-disk
path inside the runfiles tree, which `realpath`-equivalent
processing happily accepts.

End-to-end smoke: `bazel run //training:parser_jobspec_runpod_job.run`
in the `agora` repo now successfully invokes
`runpod-cli train --manifest <bazel-bin manifest path>`.

### 0.0.3 — `<name>.run` wrapper accepts a bazel-bin manifest path

Fixes a class of failure that surfaced when `rules_lora` 0.0.4
started synthesizing the manifest TOML at build time: the
generated TOML landed in `bazel-bin/...`, but the v0.0.2 `runner.sh`
read `manifest_path` out of the jobspec JSON and tried to resolve
it against `$BUILD_WORKSPACE_DIRECTORY` (the source tree), where
nothing existed.

The runpod_job macro now bundles the manifest itself as a runfile
of the emitted `<name>.run` sh_binary and passes its `$(execpath
...)` as a third positional arg. runner.sh resolves all three
positional args (cli, jobspec, manifest) to absolute paths via
`realpath` *before* cd-ing to the workspace, so the manifest stays
reachable whether it's a source file or a bazel-bin artifact.

Bonus drive-by: config.rs now reports the resolved config-file
path in the "RUNPOD_API_KEY not set" error message (the v0.0.2
message named the Linux-XDG path even on macOS where the actual
file lives under `~/Library/Application Support/`).

### 0.0.2 — `runpod_job` auto-emits `<name>.run` sh_binary

The `runpod_job` macro now emits a sibling `<name>.run` sh_binary
alongside the typed jobspec target. Downstream consumers can:

    bazel run //path:my_job.run [-- <extra args forwarded to CLI>]

…to trigger the actual RunPod training run from the build-time
manifest binding. The wrapper reads `manifest_path` out of the
emitted `<name>.jobspec.json` (via python3) and invokes
`runpod-cli train --manifest <manifest>` from
`$BUILD_WORKSPACE_DIRECTORY` so relative manifest paths resolve.

### 0.0.1 — initial lift + public macros

Rust workspace lifted verbatim from
`prime-transformer/tools/runpod-cli`:

* `api/` — bearer-token wrapper around the progenitor-generated
  `runpod_api` (top-level `openapi_rust_client` target consumes
  the vendored `runpod-openapi.json`, patched by `patch_spec.py`).
* `cli/` — the `runpod-cli` binary (subcommands: `train`, `pod`,
  `ssh`, `exec`, `pull`, `status`, `terminate`, `restream`,
  `template`, `volume`).
* `tui/` — ratatui-based interactive surface over the API.
* `tui-kit/` — generic ratatui widget library; the base pattern
  for any future fastverk TUI app.

Public Starlark surface (`@rules_runpod//runpod:defs.bzl`):

* `runpod_manifest` — wrap a TOML manifest as a typed Bazel
  target (`RunpodManifestInfo` provider).
* `runpod_job` — bind manifest + pod_type + image into a typed
  job spec; emits `<name>.jobspec.json`. v0.0.2 adds the
  `bazel run :<name>` wrapper that invokes the CLI.
* `runpod_pod` — declare a long-lived service pod (klad-embed,
  Ollama, agora bidder); emits `<name>.podspec.json`.

Smoke at `examples/smoke/` exercises all three macros end-to-end:

    bazel build //examples/smoke:smoke_job //examples/smoke:smoke_service

emits two self-contained spec files with reproducible content.

All 13 targets in `bazel build //...` green.

Migration path for prime-transformer (next-turn commit there):
delete `tools/runpod-cli/` and switch `bazel_dep(rules_runpod)`,
re-targeting `runpod-{cli,tui}` consumers to
`@rules_runpod//:cli` and `@rules_runpod//:tui`.
