---
title: "extensions"
module: "rules_mdbook"
---

<!-- Generated with Stardoc: http://skydoc.bazel.build -->

Module extension for rules_mdbook.

Auto-fetches prebuilt mdbook + mdbook-mermaid binaries for the host
platform. Versions are pinned by sha256 in
`private/known_versions.bzl`. Consumers can override the version per
tool via the `toolchain` tag class.

Default usage (pulls the default-pinned mdbook + mdbook-mermaid):

    mdbook = use_extension("@rules_mdbook//mdbook:extensions.bzl", "mdbook")
    use_repo(mdbook, "mdbook", "mdbook_mermaid")

Pin a specific version:

    mdbook = use_extension("@rules_mdbook//mdbook:extensions.bzl", "mdbook")
    mdbook.toolchain(mdbook_version = "0.5.2", mermaid_version = "0.17.0")
    use_repo(mdbook, "mdbook", "mdbook_mermaid")

Release fetching is delegated to
`@rules_github//github:repositories.bzl%github_binary_repository`
so all our rules_* repos share one URL-shape + sha-pinning impl.

<a id="mdbook"></a>

## mdbook

<pre>
mdbook = use_extension("@rules_mdbook//mdbook:extensions.bzl", "mdbook")
mdbook.toolchain(<a href="#mdbook.toolchain-mdbook_version">mdbook_version</a>, <a href="#mdbook.toolchain-mermaid_version">mermaid_version</a>)
</pre>

Sets up @mdbook and @mdbook_mermaid as Bazel-fetched prebuilt binaries.


**TAG CLASSES**

<a id="mdbook.toolchain"></a>

### toolchain

**Attributes**

| Name  | Description | Type | Mandatory | Default |
| :------------- | :------------- | :------------- | :------------- | :------------- |
| <a id="mdbook.toolchain-mdbook_version"></a>mdbook_version |  Override mdbook version. Defaults to the value in known_versions.bzl.   | String | optional |  `""`  |
| <a id="mdbook.toolchain-mermaid_version"></a>mermaid_version |  Override mdbook-mermaid version. Defaults to the value in known_versions.bzl.   | String | optional |  `""`  |
