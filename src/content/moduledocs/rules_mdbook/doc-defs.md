---
title: "defs"
module: "rules_mdbook"
---

<!-- Generated with Stardoc: http://skydoc.bazel.build -->

User-facing Bazel rules for rules_mdbook.

Exports `mdbook_book`, which runs `mdbook build` over a staged source
tree and packages the rendered HTML into a tarball. Optional plugin
executables (e.g. mdbook-mermaid) are staged onto PATH so mdbook can
resolve them by their bare names.

Targets returning `MdbookSiteInfo` expose the site tarball
programmatically so future rules (a deploy step, a link checker, a
`mdbook serve` wrapper) can consume the output without re-running
mdbook.

<a id="mdbook_book"></a>

### mdbook_book

<pre>
load("@rules_mdbook//mdbook:defs.bzl", "mdbook_book")

mdbook_book(<a href="#mdbook_book-name">name</a>, <a href="#mdbook_book-srcs">srcs</a>, <a href="#mdbook_book-out">out</a>, <a href="#mdbook_book-book_toml">book_toml</a>, <a href="#mdbook_book-plugins">plugins</a>, <a href="#mdbook_book-src_strip_prefix">src_strip_prefix</a>)
</pre>

Run `mdbook build` over a staged source tree and produce an HTML tarball.

**ATTRIBUTES**


| Name  | Description | Type | Mandatory | Default |
| :------------- | :------------- | :------------- | :------------- | :------------- |
| <a id="mdbook_book-name"></a>name |  A unique name for this target.   | <a href="https://bazel.build/concepts/labels#target-names">Name</a> | required |  |
| <a id="mdbook_book-srcs"></a>srcs |  All source files (Markdown, SUMMARY.md, theme assets, etc.). Each file is staged at its package-relative path minus `src_strip_prefix`. A directory (tree artifact produced by an upstream rule) is copied recursively into its computed relative path, so a rule that stages a generated chapter tree can feed it here directly.   | <a href="https://bazel.build/concepts/labels">List of labels</a> | required |  |
| <a id="mdbook_book-out"></a>out |  The rendered site, packaged as a `.tar.gz`.   | <a href="https://bazel.build/concepts/labels">Label</a> | required |  |
| <a id="mdbook_book-book_toml"></a>book_toml |  The mdbook configuration file. Staged at the root of the build sandbox.   | <a href="https://bazel.build/concepts/labels">Label</a> | required |  |
| <a id="mdbook_book-plugins"></a>plugins |  mdbook plugin executables (e.g. `@mdbook_mermaid//:mdbook-mermaid`). Staged onto PATH so mdbook can resolve them by bare name.   | <a href="https://bazel.build/concepts/labels">List of labels</a> | optional |  `[]`  |
| <a id="mdbook_book-src_strip_prefix"></a>src_strip_prefix |  Prefix to strip from each src's package-relative path before staging. Empty means files land at their package-relative paths.   | String | optional |  `""`  |


<a id="mdbook_serve"></a>

### mdbook_serve

<pre>
load("@rules_mdbook//mdbook:defs.bzl", "mdbook_serve")

mdbook_serve(<a href="#mdbook_serve-name">name</a>, <a href="#mdbook_serve-plugins">plugins</a>)
</pre>

Run `mdbook serve` (with watch + live reload) against the live user source tree under `$BUILD_WORKSPACE_DIRECTORY/<package>`. Invoke via `bazel run //path/to:target`. The target's package directory must contain the `book.toml`; mdbook's own watch picks up edits without Bazel re-running.

**ATTRIBUTES**


| Name  | Description | Type | Mandatory | Default |
| :------------- | :------------- | :------------- | :------------- | :------------- |
| <a id="mdbook_serve-name"></a>name |  A unique name for this target.   | <a href="https://bazel.build/concepts/labels#target-names">Name</a> | required |  |
| <a id="mdbook_serve-plugins"></a>plugins |  mdbook plugin executables, staged onto PATH so mdbook resolves them by bare name. Match the plugins listed in your book.toml.   | <a href="https://bazel.build/concepts/labels">List of labels</a> | optional |  `[]`  |


<a id="MdbookSiteInfo"></a>

### MdbookSiteInfo

<pre>
load("@rules_mdbook//mdbook:defs.bzl", "MdbookSiteInfo")

MdbookSiteInfo(<a href="#MdbookSiteInfo-tarball">tarball</a>)
</pre>

A rendered mdbook site.

**FIELDS**

| Name  | Description |
| :------------- | :------------- |
| <a id="MdbookSiteInfo-tarball"></a>tarball |  File: the gzipped tar of the rendered HTML tree.    |
