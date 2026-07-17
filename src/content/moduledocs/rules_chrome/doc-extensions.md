---
title: "extensions"
module: "rules_chrome"
---

<!-- Generated with Stardoc: http://skydoc.bazel.build -->

Module extension for rules_chrome.

Auto-fetches the prebuilt Chrome for Testing + chromedriver binaries
for the host platform. Versions are pinned by sha256 in
`private/known_versions.bzl`. Consumers can override the version via
the `toolchain` tag class.

Default usage (pulls the default-pinned Chrome + chromedriver):

    chrome = use_extension("@rules_chrome//chrome:extensions.bzl", "chrome")
    use_repo(chrome, "chrome", "chromedriver")
    register_toolchains("@chrome//:chrome_toolchain_def")

Pin a specific Chrome for Testing version:

    chrome = use_extension("@rules_chrome//chrome:extensions.bzl", "chrome")
    chrome.toolchain(version = "148.0.7778.167")
    use_repo(chrome, "chrome", "chromedriver")

<a id="chrome"></a>

### chrome

<pre>
chrome = use_extension("@rules_chrome//chrome:extensions.bzl", "chrome")
chrome.toolchain(<a href="#chrome.toolchain-version">version</a>)
</pre>

Sets up @chrome and @chromedriver as Bazel-fetched prebuilt binaries.


**TAG CLASSES**

<a id="chrome.toolchain"></a>

#### toolchain

**Attributes**

| Name  | Description | Type | Mandatory | Default |
| :------------- | :------------- | :------------- | :------------- | :------------- |
| <a id="chrome.toolchain-version"></a>version |  Override the Chrome for Testing version. Defaults to the value in known_versions.bzl.   | String | optional |  `""`  |
