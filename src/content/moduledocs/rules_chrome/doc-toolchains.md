---
title: "toolchains"
module: "rules_chrome"
---

<!-- Generated with Stardoc: http://skydoc.bazel.build -->

Toolchain rule for rules_chrome.

`chrome_toolchain` wraps a Chrome for Testing binary plus the matching
chromedriver as a single Bazel toolchain. Consumers (the `chrome_run`
and `chromedriver_run` rules) resolve chrome through
`@rules_chrome//chrome:toolchain_type`, so users can register custom
chrome builds (locally-built fork, dev/canary channel, …) via
`register_toolchains(...)` without modifying rule attributes.

The module extension at `@rules_chrome//chrome:extensions.bzl`
generates a default toolchain (`@chrome//:chrome_toolchain_def`)
wrapping the prebuilt binaries. Users register it from their
`MODULE.bazel`:

    register_toolchains("@chrome//:chrome_toolchain_def")

<a id="chrome_toolchain"></a>

### chrome_toolchain

<pre>
load("@rules_chrome//chrome:toolchains.bzl", "chrome_toolchain")

chrome_toolchain(<a href="#chrome_toolchain-name">name</a>, <a href="#chrome_toolchain-chrome">chrome</a>, <a href="#chrome_toolchain-chromedriver">chromedriver</a>)
</pre>

Declare a Chrome for Testing binary + chromedriver as a Bazel toolchain.

**ATTRIBUTES**


| Name  | Description | Type | Mandatory | Default |
| :------------- | :------------- | :------------- | :------------- | :------------- |
| <a id="chrome_toolchain-name"></a>name |  A unique name for this target.   | <a href="https://bazel.build/concepts/labels#target-names">Name</a> | required |  |
| <a id="chrome_toolchain-chrome"></a>chrome |  The chrome executable target (its runfiles carry the rest of the bundle).   | <a href="https://bazel.build/concepts/labels">Label</a> | required |  |
| <a id="chrome_toolchain-chromedriver"></a>chromedriver |  The chromedriver executable target. Optional — leave unset for chrome-only setups.   | <a href="https://bazel.build/concepts/labels">Label</a> | optional |  `None`  |


<a id="ChromeToolchainInfo"></a>

### ChromeToolchainInfo

<pre>
load("@rules_chrome//chrome:toolchains.bzl", "ChromeToolchainInfo")

ChromeToolchainInfo(<a href="#ChromeToolchainInfo-chrome">chrome</a>, <a href="#ChromeToolchainInfo-chromedriver">chromedriver</a>)
</pre>

The Chrome for Testing binaries, resolved via a toolchain.

**FIELDS**

| Name  | Description |
| :------------- | :------------- |
| <a id="ChromeToolchainInfo-chrome"></a>chrome |  Target: the chrome executable target (carries its bundle as runfiles).    |
| <a id="ChromeToolchainInfo-chromedriver"></a>chromedriver |  Target: the chromedriver executable target. May be None if the toolchain was registered without driver support.    |
