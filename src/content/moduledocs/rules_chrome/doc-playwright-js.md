---
title: "playwright_js"
module: "rules_chrome"
---

<!-- Generated with Stardoc: http://skydoc.bazel.build -->

Playwright (Node) wrappers for rules_chrome.

Exports `playwright_chrome_js_test`, a thin macro over `js_test`
(`aspect_rules_js`) that wires `@chrome` into the test's runfiles and
exposes a Bazel-managed user-data-dir through env vars. The runtime
helper at `@rules_chrome//chrome/playwright:rules_chrome_playwright.js`
reads those env vars and returns a Playwright `BrowserContext` via
`launchPersistentContext`.

Consumers bring their own `playwright` npm dep (so the version isn't
pinned by rules_chrome). The typical layout:

    bazel_dep(name = "rules_chrome", version = "...")
    bazel_dep(name = "aspect_rules_js", version = "...")
    bazel_dep(name = "rules_nodejs", version = "...")

    node = use_extension("@rules_nodejs//nodejs:extensions.bzl", "node")
    node.toolchain(node_version = "22.11.0")

    npm = use_extension("@aspect_rules_js//npm:extensions.bzl", "npm")
    npm.npm_translate_lock(
        name = "my_npm",
        pnpm_lock = "//:pnpm-lock.yaml",  # must include playwright
    )
    use_repo(npm, "my_npm")

    chrome = use_extension("@rules_chrome//chrome:extensions.bzl", "chrome")
    use_repo(chrome, "chrome", "chromedriver")

In your BUILD.bazel:

    load("@rules_chrome//chrome/playwright:js.bzl", "playwright_chrome_js_test")
    load("@my_npm//:defs.bzl", "npm_link_all_packages")

    npm_link_all_packages(name = "node_modules")

    playwright_chrome_js_test(
        name = "browser_test",
        entry_point = "browser_test.js",
        data = [":node_modules/playwright"],
    )

Then in `browser_test.js`:

    const { withChromeContext } = require(process.env.RULES_CHROME_PLAYWRIGHT_HELPER);

    withChromeContext(async (ctx) => {
        const page = await ctx.newPage();
        await page.goto('about:blank');
        if (await page.evaluate(() => 1 + 1) !== 2) process.exit(1);
    });

<a id="playwright_chrome_js_test"></a>

## playwright_chrome_js_test

<pre>
load("@rules_chrome//chrome/playwright:js.bzl", "playwright_chrome_js_test")

playwright_chrome_js_test(<a href="#playwright_chrome_js_test-name">name</a>, <a href="#playwright_chrome_js_test-entry_point">entry_point</a>, <a href="#playwright_chrome_js_test-user_data_dir_mode">user_data_dir_mode</a>, <a href="#playwright_chrome_js_test-user_data_dir">user_data_dir</a>, <a href="#playwright_chrome_js_test-headless">headless</a>, <a href="#playwright_chrome_js_test-data">data</a>, <a href="#playwright_chrome_js_test-env">env</a>,
                          <a href="#playwright_chrome_js_test-env_inherit">env_inherit</a>, <a href="#playwright_chrome_js_test-kwargs">**kwargs</a>)
</pre>

Define a Node test that drives Chrome for Testing through Playwright.

**PARAMETERS**


| Name  | Description | Default Value |
| :------------- | :------------- | :------------- |
| <a id="playwright_chrome_js_test-name"></a>name |  Test target name.   |  none |
| <a id="playwright_chrome_js_test-entry_point"></a>entry_point |  Path to the JS file to execute. The script reads the helper's runfiles path from `RULES_CHROME_PLAYWRIGHT_HELPER`.   |  none |
| <a id="playwright_chrome_js_test-user_data_dir_mode"></a>user_data_dir_mode |  One of `"ephemeral"` (fresh per test, default — cleaned by Bazel's sandbox via `$TEST_TMPDIR`) or `"workspace"` (persistent under `$BUILD_WORKSPACE_DIRECTORY/<user_data_dir>`). `"workspace"` mode requires `bazel run` — Bazel's test sandbox doesn't set `BUILD_WORKSPACE_DIRECTORY`, so `bazel test` will fail at runtime.   |  `"ephemeral"` |
| <a id="playwright_chrome_js_test-user_data_dir"></a>user_data_dir |  Workspace-relative profile path for `workspace` mode. Defaults to `.cache/rules_chrome_playwright/<name>`.   |  `""` |
| <a id="playwright_chrome_js_test-headless"></a>headless |  Whether to run chrome in headless mode (default True).   |  `True` |
| <a id="playwright_chrome_js_test-data"></a>data |  Extra js_test data. `@chrome`, the helper JS file, and any `node_modules` deps the consumer adds get appended. The `playwright` npm package (`:node_modules/playwright`) must be included here (consumer-supplied).   |  `None` |
| <a id="playwright_chrome_js_test-env"></a>env |  Extra env vars. The macro adds `RULES_CHROME_PATH`, `RULES_CHROME_PLAYWRIGHT_HELPER`, `RULES_CHROME_PROFILE_REL` (workspace mode only), and `RULES_CHROME_HEADFUL` (when `headless = False`).   |  `None` |
| <a id="playwright_chrome_js_test-env_inherit"></a>env_inherit |  Extra env vars to inherit from the host. `PATH` and `HOME` are inherited by default — Playwright needs both.   |  `None` |
| <a id="playwright_chrome_js_test-kwargs"></a>kwargs |  Forwarded to js_test.   |  none |
