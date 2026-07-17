---
title: "playwright_py"
module: "rules_chrome"
---

<!-- Generated with Stardoc: http://skydoc.bazel.build -->

Playwright (Python) wrappers for rules_chrome.

Exports `playwright_chrome_py_test`, a thin macro over `py_test` that
wires `@chrome` into the test's runfiles and exposes a Bazel-managed
user-data-dir through env vars. The runtime helper at
`@rules_chrome//chrome/playwright:helper.py` reads those env vars and
returns a Playwright `BrowserContext` via `launch_persistent_context`.

Consumers bring their own `playwright` pip dep (so the version isn't
pinned by rules_chrome). The typical layout:

    bazel_dep(name = "rules_chrome", version = "...")
    bazel_dep(name = "rules_python", version = "...")

    pip = use_extension("@rules_python//python/extensions:pip.bzl", "pip")
    pip.parse(
        hub_name = "my_pip",
        python_version = "3.12",
        requirements_lock = "//:requirements_lock.txt",  # must include playwright
    )
    use_repo(pip, "my_pip")

    chrome = use_extension("@rules_chrome//chrome:extensions.bzl", "chrome")
    use_repo(chrome, "chrome", "chromedriver")

In your BUILD.bazel:

    load("@rules_chrome//chrome/playwright:py.bzl", "playwright_chrome_py_test")
    load("@my_pip//:requirements.bzl", "requirement")

    playwright_chrome_py_test(
        name = "browser_test",
        srcs = ["browser_test.py"],
        deps = [requirement("playwright")],
    )

Then in `browser_test.py`:

    from rules_chrome_playwright import chrome_context

    def test_x():
        with chrome_context() as ctx:
            page = ctx.new_page()
            page.goto("about:blank")
            assert page.evaluate("1+1") == 2

<a id="playwright_chrome_py_test"></a>

## playwright_chrome_py_test

<pre>
load("@rules_chrome//chrome/playwright:py.bzl", "playwright_chrome_py_test")

playwright_chrome_py_test(<a href="#playwright_chrome_py_test-name">name</a>, <a href="#playwright_chrome_py_test-srcs">srcs</a>, <a href="#playwright_chrome_py_test-main">main</a>, <a href="#playwright_chrome_py_test-user_data_dir_mode">user_data_dir_mode</a>, <a href="#playwright_chrome_py_test-user_data_dir">user_data_dir</a>, <a href="#playwright_chrome_py_test-headless">headless</a>, <a href="#playwright_chrome_py_test-deps">deps</a>, <a href="#playwright_chrome_py_test-data">data</a>,
                          <a href="#playwright_chrome_py_test-env">env</a>, <a href="#playwright_chrome_py_test-env_inherit">env_inherit</a>, <a href="#playwright_chrome_py_test-kwargs">**kwargs</a>)
</pre>

Define a Python test that drives Chrome for Testing through Playwright.

**PARAMETERS**


| Name  | Description | Default Value |
| :------------- | :------------- | :------------- |
| <a id="playwright_chrome_py_test-name"></a>name |  Test target name.   |  none |
| <a id="playwright_chrome_py_test-srcs"></a>srcs |  Python source files.   |  none |
| <a id="playwright_chrome_py_test-main"></a>main |  Entry-point Python file. Defaults to `srcs[0]` when a single src is given, so `srcs = ["browser_test.py"]` Just Works regardless of the target's `name`.   |  `None` |
| <a id="playwright_chrome_py_test-user_data_dir_mode"></a>user_data_dir_mode |  One of `"ephemeral"` (fresh per test, default — cleaned by Bazel's sandbox via `$TEST_TMPDIR`) or `"workspace"` (persistent under `$BUILD_WORKSPACE_DIRECTORY/<user_data_dir>`). `"workspace"` mode requires `bazel run` — Bazel's test sandbox doesn't set `BUILD_WORKSPACE_DIRECTORY`, so `bazel test` will fail at runtime.   |  `"ephemeral"` |
| <a id="playwright_chrome_py_test-user_data_dir"></a>user_data_dir |  Workspace-relative profile path for `workspace` mode. Defaults to `.cache/rules_chrome_playwright/<name>`.   |  `""` |
| <a id="playwright_chrome_py_test-headless"></a>headless |  Whether to run chrome in headless mode (default True).   |  `True` |
| <a id="playwright_chrome_py_test-deps"></a>deps |  Extra py_test deps. The `playwright` pip requirement must be included here (consumer-supplied). The helper py_library is added automatically.   |  `None` |
| <a id="playwright_chrome_py_test-data"></a>data |  Extra py_test data. `@chrome` is added automatically.   |  `None` |
| <a id="playwright_chrome_py_test-env"></a>env |  Extra env vars. The macro adds `RULES_CHROME_PATH`, `RULES_CHROME_PROFILE_REL` (workspace mode only), and `RULES_CHROME_HEADFUL` (when `headless = False`).   |  `None` |
| <a id="playwright_chrome_py_test-env_inherit"></a>env_inherit |  Extra env vars to inherit from the host. `PATH` and `HOME` are inherited by default — Playwright needs both to spawn its bundled node driver.   |  `None` |
| <a id="playwright_chrome_py_test-kwargs"></a>kwargs |  Forwarded to py_test.   |  none |
