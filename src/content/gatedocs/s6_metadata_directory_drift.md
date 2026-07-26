---
title: "metadata.json and the version directories must agree"
code: "S6"
family: "Supply chain"
sourceUrl: "https://github.com/tomato-bazel/gate/blob/main/gates/s6_metadata_directory_drift.rq"
---
A registry entry is two things that can disagree: `metadata.json`'s `versions`
list, and the directories actually on disk under `modules/<name>/`. Nothing
reconciles them today, and `rels release` writes both without ever
re-verifying.

Three shapes of drift, all reported here:

  * `declared_no_directory` — listed in metadata.json, but no directory. A
    consumer resolving that version gets a 404 from the registry.
  * `directory_not_declared` — a directory Bazel can fetch that metadata.json
    does not admit to. Invisible to anything reading the metadata, including
    the yank list.
  * `no_versions_at_all` — a metadata.json with no version directories
    whatsoever.
  * `all_versions_yanked` — every version present is yanked, so the entry
    exists but resolves to nothing for any consumer. `rules_cc_host` is
    exactly this: 0.1.0 is its only version and was yanked with "cannot work
    as a bazel_dep". Its metadata and directories agree perfectly, which is
    why the drift checks alone do not see it.

That last case is why this gate exists rather than a flag. The projector
carries `--allow-unresolved` because `latest()` skips yanked versions and so
returns nothing for such a module; a tolerated warning is exactly the kind of
thing that stops being read. As a gate it is counted, attributed, and has to be
resolved deliberately — republished, or the entry retired.
