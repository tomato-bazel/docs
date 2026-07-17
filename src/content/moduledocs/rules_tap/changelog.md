---
title: "Changelog"
module: "rules_tap"
---

All notable changes to rules_tap. The format is loosely
[Keep a Changelog](https://keepachangelog.com/) — version headers
mirror the published bazel-registry entries.

### 0.0.3

- Prebuilt CLI bumped to **tap-cli-v0.0.2** (`cli.bzl`): the `tap affected` CLI is now
  CI-env-aware — a faithful drop-in for `scripts/ci/affected-test-targets.sh`. With no
  `--base` it resolves the diff base from the pipeline env
  (`CI_MERGE_REQUEST_DIFF_BASE_SHA`, `GITHUB_BASE_REF`, then the origin/main merge-base) and
  forces the full tag-filtered universe on a tag pipeline, a default-branch build, or the
  `BAZEL_TEST_ALL` override. Without this a default-branch push (empty merge-base diff) would
  test nothing.
- `tap_ci_feature()` default `diff_base` is now `""` (omit `--base`, let the env-aware CLI
  resolve it) — so the single generated `test:affected` job is correct in every pipeline
  context (affected on MRs, full on main/tags), no `rules:` gymnastics. Pass an explicit
  `diff_base` only for a non-standard CI.

### 0.0.2

- `//ci:defs.bzl` — `tap_ci_feature()`, a `fastverk_project` (rules_ci) feature-bundle helper
  that adds tap's change-based affected-test lane to a generated CI pipeline:
  `fastverk_project(features = {"tap": tap_ci_feature()})`. Pure Starlark (returns a
  `{"jobs", "variables"}` dict) — rules_ci stays decoupled (no `bazel_dep` on rules_tap); the
  generic `features` mechanism composes the lane. The job runs the prebuilt `//cli:tap`
  (fetched anonymously) to emit the diff-affected `bazel test` labels and runs exactly those
  (`bazel run @rules_tap//cli:tap -- affected … | xargs -r bazel test`), superseding the legacy
  `scripts/ci/affected-test-targets.sh`. No change to the rules or the prebuilt CLI (still
  `tap-cli-v0.0.1`).

### 0.0.1

- The public Bazel surface for tap, extracted from the (now private) `fastverk/tap`:
  - `//bazel:defs.bzl` — `test_impact_aspect` (per-target source-impact manifest aspect),
    `tap_test_attrs` (owner/flake/shard tagging), `tap_test_universe` (cacheable genquery universe).
    Pure Starlark, no dependency on the private engine.
  - `//cli:tap` — the prebuilt, per-arch `tap` CLI, fetched from this repo's GitHub release assets
    (`tap-cli-v*`) by `//:cli.bzl` and exposed as a host-arch-selected `native_binary`. Built +
    uploaded by the private `fastverk/tap` repo's `publish-tap-cli` workflow (mirrors rules_lang's
    atlas oleans).
