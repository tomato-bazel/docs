---
title: "repositories"
module: "rules_github"
---

<!-- Generated with Stardoc: http://skydoc.bazel.build -->

Two repository rules for GitHub-release-based content.

* `github_binary_repository` — fetch a per-platform binary release
  asset (the `releases/download/<tag>/<asset>` URL shape used by
  most CLI projects: mdbook, bun, ripgrep, jq, …).

* `github_source_repository` — fetch a source tarball from a tag
  (the `archive/refs/tags/<tag>.tar.gz` URL shape, used when a
  project doesn't publish prebuilt release assets — e.g.,
  libpg_query — or when you want to build the source yourself).

Both rules:

  - Construct the release tag from a template (`v{version}`,
    `bun-v{version}`, `{version}`, etc.).
  - Verify integrity via sha256.
  - Write the consumer-supplied BUILD overlay (inline or label).

Consumers that need a Bazel toolchain wrapping the downloaded binary
declare it inside `build_file_content` — `rules_github` deliberately
doesn't ship its own toolchain rule because toolchain providers vary
per-tool (each downstream rules_* repo has its own
`ToolToolchainInfo` provider shape).

<a id="github_binary_repository"></a>

## github_binary_repository

<pre>
load("@rules_github//github:repositories.bzl", "github_binary_repository")

github_binary_repository(<a href="#github_binary_repository-name">name</a>, <a href="#github_binary_repository-allow_unverified">allow_unverified</a>, <a href="#github_binary_repository-asset_template">asset_template</a>, <a href="#github_binary_repository-build_file">build_file</a>, <a href="#github_binary_repository-build_file_content">build_file_content</a>,
                         <a href="#github_binary_repository-platform">platform</a>, <a href="#github_binary_repository-platform_aliases">platform_aliases</a>, <a href="#github_binary_repository-platform_shas">platform_shas</a>, <a href="#github_binary_repository-repo">repo</a>, <a href="#github_binary_repository-strip_prefix_template">strip_prefix_template</a>,
                         <a href="#github_binary_repository-tag_format">tag_format</a>, <a href="#github_binary_repository-version">version</a>)
</pre>

Fetch a per-platform binary release asset from a GitHub release.

**ATTRIBUTES**


| Name  | Description | Type | Mandatory | Default |
| :------------- | :------------- | :------------- | :------------- | :------------- |
| <a id="github_binary_repository-name"></a>name |  A unique name for this repository.   | <a href="https://bazel.build/concepts/labels#target-names">Name</a> | required |  |
| <a id="github_binary_repository-allow_unverified"></a>allow_unverified |  If True, missing sha256 for the host platform downgrades to a warning + unverified download. Useful for bumping to a new version before computing pins.   | Boolean | optional |  `False`  |
| <a id="github_binary_repository-asset_template"></a>asset_template |  Asset filename pattern. `{version}` + `{platform}` substituted. The platform substitution uses the alias from `platform_aliases` for the detected host.   | String | required |  |
| <a id="github_binary_repository-build_file"></a>build_file |  BUILD.bazel content as a label. Alternative to `build_file_content`.   | <a href="https://bazel.build/concepts/labels">Label</a> | optional |  `None`  |
| <a id="github_binary_repository-build_file_content"></a>build_file_content |  Inline BUILD.bazel content for the generated repo. Either this OR `build_file` must be set.   | String | optional |  `""`  |
| <a id="github_binary_repository-platform"></a>platform |  Override host-platform detection. Empty = auto-detect.   | String | optional |  `""`  |
| <a id="github_binary_repository-platform_aliases"></a>platform_aliases |  Canonical-platform → project-specific-platform mapping. Canonical keys: `darwin_aarch64`, `darwin_x86_64`, `linux_x86_64`, `linux_aarch64`, `windows_x86_64`. Project values follow whatever the upstream release uses (`aarch64-apple-darwin`, `darwin-aarch64`, etc.). Missing key = canonical name used verbatim.   | <a href="https://bazel.build/rules/lib/dict">Dictionary: String -> String</a> | optional |  `{}`  |
| <a id="github_binary_repository-platform_shas"></a>platform_shas |  Canonical-platform → sha256 hex. Lookup keys match `platform_aliases`. Missing entry for the host platform fails the build unless `allow_unverified = True`.   | <a href="https://bazel.build/rules/lib/dict">Dictionary: String -> String</a> | optional |  `{}`  |
| <a id="github_binary_repository-repo"></a>repo |  GitHub repo as `owner/name` (e.g. `oven-sh/bun`).   | String | required |  |
| <a id="github_binary_repository-strip_prefix_template"></a>strip_prefix_template |  Optional strip-prefix pattern with `{version}` + `{platform}` substitution. Defaults to empty (binary at archive root).   | String | optional |  `""`  |
| <a id="github_binary_repository-tag_format"></a>tag_format |  Release tag pattern. `{version}` is substituted. Examples: `v{version}` (default; mdbook, most tools), `bun-v{version}` (bun), `{version}` (libpg_query: `17-6.2.2` IS the tag).   | String | optional |  `"v{version}"`  |
| <a id="github_binary_repository-version"></a>version |  Upstream version string (no leading `v`, no tag prefix).   | String | required |  |


<a id="github_source_repository"></a>

## github_source_repository

<pre>
load("@rules_github//github:repositories.bzl", "github_source_repository")

github_source_repository(<a href="#github_source_repository-name">name</a>, <a href="#github_source_repository-allow_unverified">allow_unverified</a>, <a href="#github_source_repository-build_file">build_file</a>, <a href="#github_source_repository-build_file_content">build_file_content</a>, <a href="#github_source_repository-repo">repo</a>, <a href="#github_source_repository-sha256">sha256</a>,
                         <a href="#github_source_repository-strip_prefix_template">strip_prefix_template</a>, <a href="#github_source_repository-tag_format">tag_format</a>, <a href="#github_source_repository-version">version</a>)
</pre>

Fetch a source tarball from a GitHub release tag.

**ATTRIBUTES**


| Name  | Description | Type | Mandatory | Default |
| :------------- | :------------- | :------------- | :------------- | :------------- |
| <a id="github_source_repository-name"></a>name |  A unique name for this repository.   | <a href="https://bazel.build/concepts/labels#target-names">Name</a> | required |  |
| <a id="github_source_repository-allow_unverified"></a>allow_unverified |  Skip sha256 requirement; downgrade missing sha to warning.   | Boolean | optional |  `False`  |
| <a id="github_source_repository-build_file"></a>build_file |  BUILD.bazel content as a label.   | <a href="https://bazel.build/concepts/labels">Label</a> | optional |  `None`  |
| <a id="github_source_repository-build_file_content"></a>build_file_content |  Inline BUILD.bazel content. Either this OR `build_file` must be set.   | String | optional |  `""`  |
| <a id="github_source_repository-repo"></a>repo |  GitHub repo as `owner/name`.   | String | required |  |
| <a id="github_source_repository-sha256"></a>sha256 |  sha256 of the auto-generated source tarball. Required unless `allow_unverified = True`.   | String | optional |  `""`  |
| <a id="github_source_repository-strip_prefix_template"></a>strip_prefix_template |  Override strip-prefix pattern. Default: `<repo-basename>-{version}` (matches GitHub's auto-tarball convention).   | String | optional |  `""`  |
| <a id="github_source_repository-tag_format"></a>tag_format |  Release tag pattern. Same semantics as `github_binary_repository`.   | String | optional |  `"v{version}"`  |
| <a id="github_source_repository-version"></a>version |  Upstream version string.   | String | required |  |
