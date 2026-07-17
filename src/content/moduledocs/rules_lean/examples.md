---
title: "Usage"
module: "rules_lean"
---

Real usage, taken from the module's `examples/`.

### examples/batteries_smoke/BUILD.bazel

```starlark
load("@rules_lean//lean:lean.bzl", "lean_test")
load("@lake_deps_smoke//:packages.bzl", "LAKE_PACKAGES")

package(default_visibility = ["//visibility:public"])

exports_files([
    "lakefile.lean",
    "lake-manifest.json",
    "lean-toolchain",
])

# End-to-end smoke: validates that lake_workspace materialized Batteries
# and exposed it as a per-package lean_prebuilt_library that lean_test
# can consume. No mathlib in deps -> no Reservoir cache get -> the
# `allow_source_build = True` source-build path is what's under test.
#
# Also validates the generated `packages.bzl`: instead of hand-listing
# `@lake_deps_smoke//:batteries`, consume the derived `LAKE_PACKAGES`
# label set (here, exactly [batteries]).
lean_test(
    name = "smoke_test",
    srcs = ["Smoke.lean"],
    entry = "Smoke.lean",
    deps = LAKE_PACKAGES,
)
```

### examples/olean_roundtrip/BUILD.bazel

```starlark
load("@rules_lean//lean:lean.bzl", "lean_library", "lean_olean_archive", "lean_test")
load("@rules_shell//shell:sh_test.bzl", "sh_test")

# Round-trip for the 0.4.0 cross-repo compiled-olean seam:
#
#   lean_library  → compile Lib/Thing.lean to a persistent Lib/Thing.olean tree
#   lean_test     → Consumer.lean type-checks against the PREBUILT olean (dep),
#                   with no source re-share and no recompile of the library
#   lean_olean_archive → bundle the library's .olean tree into a tarball
#   sh_test       → assert the tarball carries Lib/Thing.olean
#
# (The full http_archive → lean_imported_library hop is exercised where a
# release artifact is actually fetched; lean_imported_library shares its
# implementation with the lake-tested lean_prebuilt_library.)

lean_library(
    name = "lib",
    srcs = ["Lib/Thing.lean"],
)

lean_test(
    name = "consume_test",
    srcs = ["Consumer.lean"],
    entry = "Consumer.lean",
    deps = [":lib"],
)

lean_olean_archive(
    name = "lib_archive",
    library = ":lib",
)

sh_test(
    name = "archive_has_olean_test",
    srcs = ["archive_check.sh"],
    args = ["$(location :lib_archive)"],
    data = [":lib_archive"],
)
```

### examples/regen_smoke/BUILD.bazel

```starlark
load("@rules_lean//lean:lean.bzl", "lean_main_test", "lean_regen_test")

# Smoke for `lean_regen_test`. Validates the full pipeline:
#   1. lean_emit runs Hello.lean via the registered Lean toolchain.
#   2. Captures `IO.println "hello from lean_regen_test"` to stdout.
#   3. diff_test compares the captured stdout (with trailing newline)
#      against the committed expected.txt.
# Fails if the committed expected drifts from what Hello.lean emits.
lean_regen_test(
    name = "regen_smoke",
    srcs = ["Hello.lean"],
    entry = "Hello.lean",
    expected = "expected.txt",
)

# Smoke for the `data` attr (v0.3.3). EchoFixture.lean does
# `IO.FS.readFile "fixture.txt"` and echoes the content; lean_regen_test
# diff_tests the captured stdout against the same `fixture.txt`.
# Passing proves the data file is staged in the action's work dir
# and reachable via package-relative path from the Lean entry.
lean_regen_test(
    name = "regen_smoke_data",
    srcs = ["EchoFixture.lean"],
    entry = "EchoFixture.lean",
    data = ["fixture.txt"],
    expected = "fixture.txt",
)

# Smoke for `lean_main_test` (v0.3.5). Compiles + runs ExitZero.lean
# whose `main : IO UInt32` returns 0. Test passes iff the Lean program
# exits 0; non-zero exit (or compile failure) fails the test.
lean_main_test(
    name = "regen_smoke_exit",
    srcs = ["ExitZero.lean"],
    entry = "ExitZero.lean",
)
```
