---
title: "defs"
module: "rules_gitlab"
---

<!-- Generated with Stardoc: http://skydoc.bazel.build -->

Public Bazel rules for working with GitLab CI configuration.

Today (v0.1.0):

  * `gitlab_ci_validate(name, src)` — build-action rule. Validates
    a `.gitlab-ci.yml` against the official GitLab JSON Schema
    pinned by sha via the `gitlab_schemas` module extension.
    Hermetic; no network, no auth.
  * `gitlab_ci_lint(name, src, host, repo)` — `bazel run`-able
    target. Wraps `glab ci lint <src>` via the `glab` toolchain.
    Hits the GitLab API for full pipeline validation (semantic
    checks beyond pure schema + `include:` resolution). Requires
    `glab auth login` to the target instance.

Future surface:

  * `gitlab_ci_lint_remote(name, src, project)` — call
    `/api/v4/projects/:id/ci/lint` directly (no glab CLI
    indirection), bake the project context.
  * Deploy + registry helpers, schema-derived typed Starlark rules
    for authoring `.gitlab-ci.yml` from Bazel (mirroring the
    rules_jsonschema + rules_cloudformation pattern).

Limitations of `gitlab_ci_validate`:

  * Does not follow `include:` directives. A `.gitlab-ci.yml`
    that imports another project's snippets is validated only at
    its own leaf level; chain validations on the included files
    by registering each as a separate `gitlab_ci_validate`
    target. `gitlab_ci_lint` handles includes server-side.

<a id="gitlab_ci_lint"></a>

## gitlab_ci_lint

<pre>
load("@rules_gitlab//gitlab:defs.bzl", "gitlab_ci_lint")

gitlab_ci_lint(<a href="#gitlab_ci_lint-name">name</a>, <a href="#gitlab_ci_lint-src">src</a>, <a href="#gitlab_ci_lint-host">host</a>, <a href="#gitlab_ci_lint-repo">repo</a>)
</pre>

`bazel run`-able target that lints a `.gitlab-ci.yml` via `glab ci lint`. Network-bound: hits the GitLab API, requires the user to be `glab auth login`-ed to the target instance. For hermetic schema-only validation, use `gitlab_ci_validate` instead.

**ATTRIBUTES**


| Name  | Description | Type | Mandatory | Default |
| :------------- | :------------- | :------------- | :------------- | :------------- |
| <a id="gitlab_ci_lint-name"></a>name |  A unique name for this target.   | <a href="https://bazel.build/concepts/labels#target-names">Name</a> | required |  |
| <a id="gitlab_ci_lint-src"></a>src |  Label of the `.gitlab-ci.yml` (or fragment) to lint.   | <a href="https://bazel.build/concepts/labels">Label</a> | required |  |
| <a id="gitlab_ci_lint-host"></a>host |  GitLab host (e.g. `gitlab.savvifi.com`). Used to anchor `glab`'s API target when the runfiles cwd doesn't have a gitlab remote. Ignored if `repo` is set (which carries host).   | String | optional |  `""`  |
| <a id="gitlab_ci_lint-repo"></a>repo |  `OWNER/REPO` or full URL passed as `glab -R`. Strongly recommended — lets `glab` pick the right GitLab instance + project context without inspecting the sandbox's git state.   | String | optional |  `""`  |


<a id="gitlab_ci_validate"></a>

## gitlab_ci_validate

<pre>
load("@rules_gitlab//gitlab:defs.bzl", "gitlab_ci_validate")

gitlab_ci_validate(<a href="#gitlab_ci_validate-name">name</a>, <a href="#gitlab_ci_validate-src">src</a>)
</pre>

Validate a `.gitlab-ci.yml` against the official GitLab JSON Schema (pinned by sha256 via the `gitlab_schemas` module extension). Output: a stamp file Bazel checks for caching; on schema violation the build fails with check-jsonschema's diagnostic on stderr.

**ATTRIBUTES**


| Name  | Description | Type | Mandatory | Default |
| :------------- | :------------- | :------------- | :------------- | :------------- |
| <a id="gitlab_ci_validate-name"></a>name |  A unique name for this target.   | <a href="https://bazel.build/concepts/labels#target-names">Name</a> | required |  |
| <a id="gitlab_ci_validate-src"></a>src |  Label of the `.gitlab-ci.yml` (or sibling fragment) to validate.   | <a href="https://bazel.build/concepts/labels">Label</a> | required |  |


<a id="gitlab_ci"></a>

## gitlab_ci

<pre>
load("@rules_gitlab//gitlab:defs.bzl", "gitlab_ci")

gitlab_ci(<a href="#gitlab_ci-name">name</a>, <a href="#gitlab_ci-stages">stages</a>, <a href="#gitlab_ci-variables">variables</a>, <a href="#gitlab_ci-default">default</a>, <a href="#gitlab_ci-image">image</a>, <a href="#gitlab_ci-include">include</a>, <a href="#gitlab_ci-workflow">workflow</a>, <a href="#gitlab_ci-jobs">jobs</a>, <a href="#gitlab_ci-extra">extra</a>, <a href="#gitlab_ci-out">out</a>, <a href="#gitlab_ci-write_to">write_to</a>,
          <a href="#gitlab_ci-validate">validate</a>, <a href="#gitlab_ci-kwargs">**kwargs</a>)
</pre>

Generate a `.gitlab-ci.yml` from a typed Starlark spec.

Assembles the spec in a fixed top-level order (include, workflow,
default, image, stages, variables, jobs sorted by name, extra),
emits it deterministically as YAML, and (by default) schema-validates
the result. Set `write_to` (e.g. `".gitlab-ci.yml"`) to also create
`<name>.update` — `bazel run …:<name>.update` writes the file into the
source tree; `bazel test …:<name>.update` checks it is up to date.


**PARAMETERS**


| Name  | Description | Default Value |
| :------------- | :------------- | :------------- |
| <a id="gitlab_ci-name"></a>name |  target name.   |  none |
| <a id="gitlab_ci-stages"></a>stages |  list of stage names (order preserved).   |  `[]` |
| <a id="gitlab_ci-variables"></a>variables |  global CI variables (dict).   |  `{}` |
| <a id="gitlab_ci-default"></a>default |  the `default:` job-config block (dict).   |  `None` |
| <a id="gitlab_ci-image"></a>image |  top-level default image (str or dict).   |  `None` |
| <a id="gitlab_ci-include"></a>include |  `include:` entries (list).   |  `None` |
| <a id="gitlab_ci-workflow"></a>workflow |  the `workflow:` block (dict).   |  `None` |
| <a id="gitlab_ci-jobs"></a>jobs |  dict of job-name -> job (a `gitlab_job(...)` dict or a raw dict).   |  `{}` |
| <a id="gitlab_ci-extra"></a>extra |  escape hatch — raw dict merged at the top level last.   |  `{}` |
| <a id="gitlab_ci-out"></a>out |  output filename; defaults to `<name>.gitlab-ci.yml`.   |  `None` |
| <a id="gitlab_ci-write_to"></a>write_to |  source-relative path to also create `<name>.update`.   |  `None` |
| <a id="gitlab_ci-validate"></a>validate |  chain `gitlab_ci_validate` on the generated file (default True).   |  `True` |
| <a id="gitlab_ci-kwargs"></a>kwargs |  forwarded to the underlying rule (visibility, tags, …).   |  none |


<a id="gitlab_job"></a>

## gitlab_job

<pre>
load("@rules_gitlab//gitlab:defs.bzl", "gitlab_job")

gitlab_job(<a href="#gitlab_job-stage">stage</a>, <a href="#gitlab_job-script">script</a>, <a href="#gitlab_job-image">image</a>, <a href="#gitlab_job-services">services</a>, <a href="#gitlab_job-before_script">before_script</a>, <a href="#gitlab_job-after_script">after_script</a>, <a href="#gitlab_job-rules">rules</a>, <a href="#gitlab_job-needs">needs</a>, <a href="#gitlab_job-artifacts">artifacts</a>,
           <a href="#gitlab_job-variables">variables</a>, <a href="#gitlab_job-cache">cache</a>, <a href="#gitlab_job-tags">tags</a>, <a href="#gitlab_job-environment">environment</a>, <a href="#gitlab_job-when">when</a>, <a href="#gitlab_job-allow_failure">allow_failure</a>, <a href="#gitlab_job-interruptible">interruptible</a>, <a href="#gitlab_job-timeout">timeout</a>, <a href="#gitlab_job-retry">retry</a>,
           <a href="#gitlab_job-parallel">parallel</a>, <a href="#gitlab_job-coverage">coverage</a>, <a href="#gitlab_job-extends">extends</a>, <a href="#gitlab_job-dependencies">dependencies</a>, <a href="#gitlab_job-extra">extra</a>)
</pre>

Build one GitLab CI job as a `None`-stripped, key-ordered dict.

Returns a plain dict (Starlark structs aren't `json.encode`-able), so
pass the result as a value in `gitlab_ci(jobs = {...})`. Any key not
modeled here can be supplied via `extra` (a raw dict, merged last).

**PARAMETERS**


| Name  | Description | Default Value |
| :------------- | :------------- | :------------- |
| <a id="gitlab_job-stage"></a>stage |  <p align="center"> - </p>   |  `None` |
| <a id="gitlab_job-script"></a>script |  <p align="center"> - </p>   |  `None` |
| <a id="gitlab_job-image"></a>image |  <p align="center"> - </p>   |  `None` |
| <a id="gitlab_job-services"></a>services |  <p align="center"> - </p>   |  `None` |
| <a id="gitlab_job-before_script"></a>before_script |  <p align="center"> - </p>   |  `None` |
| <a id="gitlab_job-after_script"></a>after_script |  <p align="center"> - </p>   |  `None` |
| <a id="gitlab_job-rules"></a>rules |  <p align="center"> - </p>   |  `None` |
| <a id="gitlab_job-needs"></a>needs |  <p align="center"> - </p>   |  `None` |
| <a id="gitlab_job-artifacts"></a>artifacts |  <p align="center"> - </p>   |  `None` |
| <a id="gitlab_job-variables"></a>variables |  <p align="center"> - </p>   |  `None` |
| <a id="gitlab_job-cache"></a>cache |  <p align="center"> - </p>   |  `None` |
| <a id="gitlab_job-tags"></a>tags |  <p align="center"> - </p>   |  `None` |
| <a id="gitlab_job-environment"></a>environment |  <p align="center"> - </p>   |  `None` |
| <a id="gitlab_job-when"></a>when |  <p align="center"> - </p>   |  `None` |
| <a id="gitlab_job-allow_failure"></a>allow_failure |  <p align="center"> - </p>   |  `None` |
| <a id="gitlab_job-interruptible"></a>interruptible |  <p align="center"> - </p>   |  `None` |
| <a id="gitlab_job-timeout"></a>timeout |  <p align="center"> - </p>   |  `None` |
| <a id="gitlab_job-retry"></a>retry |  <p align="center"> - </p>   |  `None` |
| <a id="gitlab_job-parallel"></a>parallel |  <p align="center"> - </p>   |  `None` |
| <a id="gitlab_job-coverage"></a>coverage |  <p align="center"> - </p>   |  `None` |
| <a id="gitlab_job-extends"></a>extends |  <p align="center"> - </p>   |  `None` |
| <a id="gitlab_job-dependencies"></a>dependencies |  <p align="center"> - </p>   |  `None` |
| <a id="gitlab_job-extra"></a>extra |  <p align="center"> - </p>   |  `{}` |


<a id="gitlab_pages_job"></a>

## gitlab_pages_job

<pre>
load("@rules_gitlab//gitlab:defs.bzl", "gitlab_pages_job")

gitlab_pages_job(<a href="#gitlab_pages_job-site">site</a>, <a href="#gitlab_pages_job-site_artifact">site_artifact</a>, <a href="#gitlab_pages_job-stage">stage</a>, <a href="#gitlab_pages_job-strip_components">strip_components</a>, <a href="#gitlab_pages_job-only_default_branch">only_default_branch</a>, <a href="#gitlab_pages_job-rules">rules</a>, <a href="#gitlab_pages_job-kwargs">**kwargs</a>)
</pre>

A GitLab Pages job that publishes a Bazel-built static site.

GitLab Pages serves the `public/` artifact of a job named `pages`. This
builds `site` (a target whose output `site_artifact` is a `.tar.gz` of the
site root — e.g. an `mdbook_book` or any `pkg_tar` of HTML) and unpacks it
into `public/`. The generic "ship this repo's static site to Pages" job:

    gitlab_ci(
        name = "ci",
        stages = ["pages"],
        jobs = {
            "pages": gitlab_pages_job(
                site = "//docs:site",
                site_artifact = "bazel-bin/docs/site.tar.gz",
            ),
        },
    )


**PARAMETERS**


| Name  | Description | Default Value |
| :------------- | :------------- | :------------- |
| <a id="gitlab_pages_job-site"></a>site |  the Bazel label (string) that builds the static site.   |  none |
| <a id="gitlab_pages_job-site_artifact"></a>site_artifact |  workspace-relative path to the built site `.tar.gz`.   |  none |
| <a id="gitlab_pages_job-stage"></a>stage |  the CI stage for the job (default `"pages"`).   |  `"pages"` |
| <a id="gitlab_pages_job-strip_components"></a>strip_components |  tar `--strip-components`, for archives with a top-level directory. mdbook's output is flat, so the default `0` is correct.   |  `0` |
| <a id="gitlab_pages_job-only_default_branch"></a>only_default_branch |  when True (default) and `rules` is unset, restrict the job to the default branch — Pages publishes from a single ref.   |  `True` |
| <a id="gitlab_pages_job-rules"></a>rules |  explicit GitLab `rules:`; overrides `only_default_branch`.   |  `None` |
| <a id="gitlab_pages_job-kwargs"></a>kwargs |  any other `gitlab_job` field (needs, variables, image, …).   |  none |

**RETURNS**

A job dict for use as a `gitlab_ci(jobs = {...})` value. The job name
MUST be `"pages"` for GitLab to publish it.


<a id="gitlab_reference"></a>

## gitlab_reference

<pre>
load("@rules_gitlab//gitlab:defs.bzl", "gitlab_reference")

gitlab_reference(<a href="#gitlab_reference-parts">*parts</a>)
</pre>

Emit a GitLab `!reference [job, key, ...]` tag value.

Usable as a value anywhere in a spec; survives `json.encode` as a
sentinel the emitter turns back into a real `!reference` YAML tag.

**PARAMETERS**


| Name  | Description | Default Value |
| :------------- | :------------- | :------------- |
| <a id="gitlab_reference-parts"></a>parts |  <p align="center"> - </p>   |  none |
