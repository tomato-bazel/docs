---
title: "extensions"
module: "rules_bun"
---

<!-- Generated with Stardoc: http://skydoc.bazel.build -->

Module extensions for rules_bun.

Two extensions:

  * `bun` — auto-fetches a prebuilt Bun binary for the host platform.
    Versions are sha256-pinned in `private/known_versions.bzl`.
    Consumers can override via the `toolchain` tag class.

        bun = use_extension("@rules_bun//bun:extensions.bzl", "bun")
        use_repo(bun, "bun")
        register_toolchains("@bun//:bun_toolchain_def")

    Pin a specific version:

        bun.toolchain(version = "1.3.14")

  * `bun_deps` — Bun-native `node_modules` staging. Each `install` tag
    produces a repo `@<name>` whose `:node_modules` filegroup is a
    `bun install --frozen-lockfile`-ed tree. The pure-Bun replacement
    for aspect_rules_js's `npm_translate_lock` + `npm_link_all_packages`
    (no pnpm-lock, no aspect_rules_js):

        bun_deps = use_extension("@rules_bun//bun:extensions.bzl", "bun_deps")
        bun_deps.install(
            name = "npm",
            package_json = "//:package.json",
            lock = "//:bun.lock",
        )
        use_repo(bun_deps, "npm")

    then `bun_test(node_modules = "@npm//:node_modules", ...)` and
    `bun_bundle(node_modules = "@npm//:node_modules", ...)`.

The actual release fetching is delegated to
`@rules_github//github:repositories.bzl%github_binary_repository`
so that the URL-shape + sha-pinning logic stays consistent across
all our rules_* repos.

<a id="bun"></a>

### bun

<pre>
bun = use_extension("@rules_bun//bun:extensions.bzl", "bun")
bun.toolchain(<a href="#bun.toolchain-version">version</a>)
</pre>

Sets up @bun as a Bazel-fetched prebuilt Bun binary.


**TAG CLASSES**

<a id="bun.toolchain"></a>

#### toolchain

**Attributes**

| Name  | Description | Type | Mandatory | Default |
| :------------- | :------------- | :------------- | :------------- | :------------- |
| <a id="bun.toolchain-version"></a>version |  Override Bun version. Defaults to the value in known_versions.bzl.   | String | optional |  `""`  |


<a id="bun_deps"></a>

### bun_deps

<pre>
bun_deps = use_extension("@rules_bun//bun:extensions.bzl", "bun_deps")
bun_deps.install(<a href="#bun_deps.install-name">name</a>, <a href="#bun_deps.install-bun_version">bun_version</a>, <a href="#bun_deps.install-ignore_scripts">ignore_scripts</a>, <a href="#bun_deps.install-install_flags">install_flags</a>, <a href="#bun_deps.install-lock">lock</a>, <a href="#bun_deps.install-package_json">package_json</a>,
                 <a href="#bun_deps.install-trusted_dependencies">trusted_dependencies</a>)
</pre>

Bun-native node_modules staging — `@<name>//:node_modules` from a `bun install --frozen-lockfile`. Replaces aspect_rules_js's npm_translate_lock + npm_link_all_packages for pure-Bun repos.


**TAG CLASSES**

<a id="bun_deps.install"></a>

#### install

Stage a node_modules tree from a package.json + bun.lock.

**Attributes**

| Name  | Description | Type | Mandatory | Default |
| :------------- | :------------- | :------------- | :------------- | :------------- |
| <a id="bun_deps.install-name"></a>name |  Name of the generated repo. Reference its node_modules as `@<name>//:node_modules`.   | <a href="https://bazel.build/concepts/labels#target-names">Name</a> | required |  |
| <a id="bun_deps.install-bun_version"></a>bun_version |  Bun version to fetch for the install. Empty = the toolchain extension's default.   | String | optional |  `""`  |
| <a id="bun_deps.install-ignore_scripts"></a>ignore_scripts |  Skip dependency lifecycle scripts (`--ignore-scripts`). Default True.   | Boolean | optional |  `True`  |
| <a id="bun_deps.install-install_flags"></a>install_flags |  Extra raw flags appended to `bun install`.   | List of strings | optional |  `[]`  |
| <a id="bun_deps.install-lock"></a>lock |  The `bun.lock` pinning the install (`--frozen-lockfile`).   | <a href="https://bazel.build/concepts/labels">Label</a> | required |  |
| <a id="bun_deps.install-package_json"></a>package_json |  The `package.json` to install from.   | <a href="https://bazel.build/concepts/labels">Label</a> | required |  |
| <a id="bun_deps.install-trusted_dependencies"></a>trusted_dependencies |  Packages to `--trust` (run lifecycle scripts for) even when `ignore_scripts` is True.   | List of strings | optional |  `[]`  |
