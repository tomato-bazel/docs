---
title: "defs"
module: "rules_chrome"
---

<!-- Generated with Stardoc: http://skydoc.bazel.build -->

User-facing Bazel rules for rules_chrome.

Exports two `bazel run`-friendly launchers:

- `chrome_run`: launches Chrome for Testing with an isolated user-data-dir
  and the standard testing flags pre-applied. Reusable across smoke
  tests, screenshot tools, scripted browser sessions.
- `chromedriver_run`: launches chromedriver on a configurable port; used
  as the WebDriver backend for selenium / playwright / pytest-selenium.

Both rules resolve their binaries through
`@rules_chrome//chrome:toolchain_type`, so consumers can swap in a
locally-built or alternate-channel chrome via
`register_toolchains(...)` without editing target attributes.

For the bare binaries (without launcher ergonomics) consumers can
depend directly on `@chrome//:chrome` and `@chromedriver//:chromedriver`.

<a id="chrome_run"></a>

## chrome_run

<pre>
load("@rules_chrome//chrome:defs.bzl", "chrome_run")

chrome_run(<a href="#chrome_run-name">name</a>, <a href="#chrome_run-extra_args">extra_args</a>, <a href="#chrome_run-headless">headless</a>, <a href="#chrome_run-user_data_dir">user_data_dir</a>, <a href="#chrome_run-user_data_dir_mode">user_data_dir_mode</a>)
</pre>

Run Chrome for Testing via `bazel run`, with a managed user-data-dir and the standard automation flags pre-applied. Additional CLI arguments are forwarded to chrome verbatim.

**ATTRIBUTES**


| Name  | Description | Type | Mandatory | Default |
| :------------- | :------------- | :------------- | :------------- | :------------- |
| <a id="chrome_run-name"></a>name |  A unique name for this target.   | <a href="https://bazel.build/concepts/labels#target-names">Name</a> | required |  |
| <a id="chrome_run-extra_args"></a>extra_args |  Extra command-line flags appended after the rules_chrome defaults but before any args passed on the CLI. Use this to bake in test-specific flags (e.g. `--remote-debugging-port=9222`).   | List of strings | optional |  `[]`  |
| <a id="chrome_run-headless"></a>headless |  Append `--headless=new` to the command line.   | Boolean | optional |  `False`  |
| <a id="chrome_run-user_data_dir"></a>user_data_dir |  Workspace-relative profile path used when `user_data_dir_mode = "workspace"`. Defaults to `.cache/rules_chrome/<target name>`.   | String | optional |  `""`  |
| <a id="chrome_run-user_data_dir_mode"></a>user_data_dir_mode |  How to seed `--user-data-dir`: * `ephemeral` (default): a fresh `$TMPDIR/chrome_run.XXXXXX` per invocation, cleaned on exit. Safe for tests and parallel runs. * `workspace`: a persistent directory under `$BUILD_WORKSPACE_DIRECTORY/<user_data_dir>` (cookies, extensions, signed-in state survive across `bazel run`). Requires `bazel run`. * `system`: omit `--user-data-dir` entirely. Chrome uses the real per-user profile — almost never what you want for automation.   | String | optional |  `"ephemeral"`  |


<a id="chromedriver_run"></a>

## chromedriver_run

<pre>
load("@rules_chrome//chrome:defs.bzl", "chromedriver_run")

chromedriver_run(<a href="#chromedriver_run-name">name</a>, <a href="#chromedriver_run-extra_args">extra_args</a>, <a href="#chromedriver_run-port">port</a>)
</pre>

Run chromedriver via `bazel run`. The matching driver version is resolved through the registered chrome toolchain; extra CLI arguments are forwarded to chromedriver verbatim.

**ATTRIBUTES**


| Name  | Description | Type | Mandatory | Default |
| :------------- | :------------- | :------------- | :------------- | :------------- |
| <a id="chromedriver_run-name"></a>name |  A unique name for this target.   | <a href="https://bazel.build/concepts/labels#target-names">Name</a> | required |  |
| <a id="chromedriver_run-extra_args"></a>extra_args |  Extra command-line flags appended after the configured `--port` and before any args passed on the CLI.   | List of strings | optional |  `[]`  |
| <a id="chromedriver_run-port"></a>port |  Listen port. `0` (default) lets chromedriver pick — read the chosen port from its first line of stdout.   | Integer | optional |  `0`  |
