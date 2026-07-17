---
title: "Usage"
module: "rules_gitlab"
---

Real usage, taken from the module's `examples/`.

### examples/generate/BUILD.bazel

```starlark
load("@bazel_skylib//rules:diff_test.bzl", "diff_test")
load("//gitlab:defs.bzl", "gitlab_ci", "gitlab_job", "gitlab_pages_job", "gitlab_reference")

package(default_visibility = ["//visibility:public"])

# Smoke: assemble a small pipeline from typed Starlark, emit it as YAML,
# schema-validate the result, and gate the bytes against a committed
# golden. `bazel run //examples/generate:pipeline.update` regenerates the
# golden; `bazel test //examples/generate:...` checks it's current + valid.
gitlab_ci(
    name = "pipeline",
    stages = ["build", "test", "pages"],
    variables = {"GREETING": "hello"},
    jobs = {
        # Hidden template job + a `!reference` to it (round-trip test).
        ".setup": gitlab_job(
            before_script = ["echo setting up"],
        ),
        "build": gitlab_job(
            stage = "build",
            before_script = gitlab_reference(".setup", "before_script"),
            script = ['echo "$GREETING from build"'],
        ),
        "test": gitlab_job(
            stage = "test",
            script = ['echo "$GREETING from test"'],
            coverage = "/^TOTAL\\s+\\d+/",
        ),
        # The generic static-site → GitLab Pages job.
        "pages": gitlab_pages_job(
            site = "//docs:site",
            site_artifact = "bazel-bin/docs/site.tar.gz",
        ),
    },
    write_to = "golden/.gitlab-ci.yml",
)

diff_test(
    name = "pipeline_golden_test",
    file1 = ":pipeline",
    file2 = "golden/.gitlab-ci.yml",
)
```

### examples/smoke/BUILD.bazel

```starlark
load("@bazel_skylib//rules:build_test.bzl", "build_test")
load("@rules_gitlab//gitlab:defs.bzl", "gitlab_ci_lint", "gitlab_ci_validate")

package(default_visibility = ["//visibility:public"])

# Smoke test: a minimal valid .gitlab-ci.yml fixture must pass
# schema validation. Failure of this target in CI signals either
# a schema-pin drift (upstream broke compatibility) or a bug in
# the rule wiring.
gitlab_ci_validate(
    name = "valid_smoke",
    src = "valid.gitlab-ci.yml",
)

# Lint variant exercises the launcher-script generation +
# toolchain resolution; `bazel build` is enough to verify the
# launcher is produced. Running it requires `glab auth login`,
# so we don't gate CI on actually running it.
gitlab_ci_lint(
    name = "valid_smoke_lint",
    src = "valid.gitlab-ci.yml",
    # Empty repo — under `bazel run` glab will fall back to the
    # cwd's git remote (gitlab.com if nothing matches). Real
    # consumers should set this; the fixture leaves it blank
    # because we only `bazel build` here.
)

# Surface the validate + lint smoke targets under `bazel test` so
# rules_gitlab's GitHub Actions CI gates them. The lint target's
# output is just the generated launcher script (no network call
# happens during build), so this stays hermetic.
build_test(
    name = "smoke_build_test",
    targets = [
        ":valid_smoke",
        ":valid_smoke_lint",
    ],
)
```
