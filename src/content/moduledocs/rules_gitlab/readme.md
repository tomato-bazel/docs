---
title: "Overview"
module: "rules_gitlab"
---

Bazel rules for working with GitLab CI configuration.

| Rule | What | Hermetic |
|---|---|---|
| `gitlab_ci(name, jobs, …, write_to)` | **Generate** a `.gitlab-ci.yml` from a typed Starlark spec (`gitlab_job` / `gitlab_reference` helpers); deterministic YAML via ruamel. Auto-chains `gitlab_ci_validate` + an optional `<name>.update` write-back. | ✅ |
| `gitlab_ci_validate(name, src)` | Validate `.gitlab-ci.yml` against the official GitLab JSON Schema (pinned by sha256 against `gitlab-org/gitlab-foss/.../editor/schema/ci.json` — the file GitLab's web editor uses). | ✅ |
| `gitlab_ci_lint(name, src, repo)` | `bazel run`-able target wrapping `glab ci lint <src>`. Hits the GitLab API for server-side lint (resolves `include:` references, applies semantic checks). | Network + auth |

## Generate a `.gitlab-ci.yml`

```python
load("@rules_gitlab//gitlab:defs.bzl", "gitlab_ci", "gitlab_job", "gitlab_reference")

gitlab_ci(
    name = "ci",
    stages = ["build", "test"],
    variables = {"GREETING": "hello"},
    jobs = {
        ".setup": gitlab_job(before_script = ["echo setting up"]),
        "build": gitlab_job(
            stage = "build",
            before_script = gitlab_reference(".setup", "before_script"),
            script = ['echo "$GREETING from build"'],
        ),
        "test": gitlab_job(stage = "test", script = ["pytest"], coverage = "/^TOTAL/"),
    },
    write_to = ".gitlab-ci.yml",  # `bazel run :ci.update` writes it back
)
```

`bazel run :ci.update` writes `.gitlab-ci.yml`; `bazel test :ci.update`
checks it's current; the auto-wired `:ci_validate` schema-checks the
generated file. Unmodeled keys go through `gitlab_job(extra={...})` or
`gitlab_ci(extra={...})`.

## Quick start

```python
# MODULE.bazel
bazel_dep(name = "rules_gitlab", version = "0.1.0")

# (rules_gitlab auto-registers a PATH-based default `glab` toolchain
#  for gitlab_ci_lint; override by registering your own if you
#  want a hermetic glab binary.)
```

```python
# BUILD.bazel
load("@rules_gitlab//gitlab:defs.bzl", "gitlab_ci_validate", "gitlab_ci_lint")

gitlab_ci_validate(
    name = "ci_validate",
    src = ".gitlab-ci.yml",
)

gitlab_ci_lint(
    name = "ci_lint",
    src = ".gitlab-ci.yml",
    repo = "https://gitlab.com/my-group/my-project",
)
```

```sh
bazel build :ci_validate    # hermetic schema check
bazel run   :ci_lint        # network-bound full lint
```

## Architecture

```
gitlab/
├── defs.bzl                # public rules: gitlab_ci_validate, gitlab_ci_lint
├── extensions.bzl          # http_file pin for the GitLab JSON Schema
├── glab/                   # toolchain abstraction over the `glab` CLI
│   ├── defs.bzl            # glab_toolchain rule
│   ├── system_glab.sh      # default toolchain: shells out to system `glab`
│   └── toolchain_type.bzl
└── private/
    ├── BUILD.bazel
    └── validate_main.py    # check-jsonschema wrapper invoked by the validate rule

tooling/
├── pyproject.toml          # check-jsonschema dep
└── uv.lock                 # resolved by `rules_uv`'s pip.parse
```

## Limitations of `gitlab_ci_validate`

- Skips the `format: regex` JSON Schema check. GitLab's actual
  parser accepts Perl-style `/regex/` slash-literals (used in
  fields like `coverage:`) while the schema declares those
  fields with `format: regex`; the strict regex format validator
  rejects the wrapped form. Everything else (`uri`, structural,
  `additionalProperties`, etc.) stays enforced.
- Does not follow `include:` references. Chain validation on
  included files by registering each as its own
  `gitlab_ci_validate` target. `gitlab_ci_lint` covers
  `include:` resolution server-side.

## Provenance

Lifted from `savvi/gitlab/` (the SAVVI Bazel aggregator) where
the rules were first prototyped against `selectsmart-engine`'s
real `.gitlab-ci.yml`. Same layout; only the namespace differs.

## Schema refresh

The pinned schema sha is at the top of
[`gitlab/extensions.bzl`](https://github.com/tomato-bazel/rules_gitlab/blob/main/gitlab/extensions.bzl). To refresh:

```sh
curl -fL "https://gitlab.com/gitlab-org/gitlab-foss/-/raw/master/app/assets/javascripts/editor/schema/ci.json" -o /tmp/ci.json
shasum -a 256 /tmp/ci.json
# paste the digest into _CI_SCHEMA_SHA256
```
