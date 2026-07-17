---
title: "Overview"
module: "rules_chrome"
---

Bazel rules for [Chrome for Testing](https://github.com/GoogleChromeLabs/chrome-for-testing).
Fetches the prebuilt chrome + matching chromedriver hermetically and exposes
them through a Bazel toolchain plus thin `bazel run` launchers tuned for test
automation.

- **module extension**: `chrome` — auto-creates `@chrome` + `@chromedriver`
  external repos at a pinned version. See [docs/extensions.md](https://github.com/tomato-bazel/rules_chrome/blob/main/docs/extensions.md).
- **toolchain**: `chrome_toolchain` — wraps the chrome binary + chromedriver;
  resolved via `@rules_chrome//chrome:toolchain_type`. See
  [docs/toolchains.md](https://github.com/tomato-bazel/rules_chrome/blob/main/docs/toolchains.md).
- **rules**:
  - `chrome_run` — `bazel run //path:target` → launches Chrome for Testing
    with a managed `--user-data-dir` and the standard automation flags.
  - `chromedriver_run` — `bazel run //path:target` → launches chromedriver
    on a configurable port; consume from selenium / playwright / pytest.

  See [docs/defs.md](https://github.com/tomato-bazel/rules_chrome/blob/main/docs/defs.md).
- **playwright sub-module** (opt-in): `playwright_chrome_py_test` and
  `playwright_chrome_js_test` macros that wire `@chrome` into a Playwright
  `launchPersistentContext` against a Bazel-managed user-data-dir. See
  [docs/playwright_py.md](https://github.com/tomato-bazel/rules_chrome/blob/main/docs/playwright_py.md) and
  [docs/playwright_js.md](https://github.com/tomato-bazel/rules_chrome/blob/main/docs/playwright_js.md). Consumers only pay the
  `rules_python` / `aspect_rules_js` cost if they load the sub-module — the
  default `bazel_dep` on `rules_chrome` is a zero-cost chrome+chromedriver
  toolchain.

## Install

Add the registry to your `.bazelrc`:

```
common --registry=https://registry.fastverk.com/
common --registry=https://bcr.bazel.build/
```

In your `MODULE.bazel`:

```python
bazel_dep(name = "rules_chrome", version = "0.1.0")

chrome = use_extension("@rules_chrome//chrome:extensions.bzl", "chrome")
use_repo(chrome, "chrome", "chromedriver")
register_toolchains("@chrome//:chrome_toolchain_def")
```

Override the version if needed:

```python
chrome.toolchain(version = "148.0.7778.167")
```

The default tracks the upstream **Stable** channel as of the last
[`tools/refresh_versions.py`](https://github.com/tomato-bazel/rules_chrome/blob/main/tools/refresh_versions.py) run. The chromedriver
version is locked to the chrome version — they ship as a matched pair from
upstream.

## Quick start

A smoke check that the binaries resolve and launch:

```python
# BUILD.bazel
load("@rules_chrome//chrome:defs.bzl", "chrome_run", "chromedriver_run")

chrome_run(
    name = "browser",
    headless = True,
    extra_args = ["--disable-gpu"],
)

chromedriver_run(
    name = "driver",
    port = 9515,
)
```

```
bazel run //:browser -- https://example.com
bazel run //:driver
```

Pass any chrome flag after `--`; they're appended after the rules_chrome
defaults so they always win. The launcher provisions an ephemeral
`--user-data-dir` under `$TMPDIR` and cleans it up on exit; flip
`user_data_dir_mode = "workspace"` to persist cookies / extensions across
`bazel run` sessions.

For the bare binaries (Selenium grids, custom test rules, screenshot tools)
depend directly on `@chrome//:chrome` and `@chromedriver//:chromedriver` — both
are `executable` targets with the rest of the bundle in their runfiles:

```python
sh_test(
    name = "page_loads",
    srcs = ["page_loads.sh"],
    data = [
        "@chrome//:chrome",
        "@chromedriver//:chromedriver",
    ],
)
```

## How it works

The `chrome` module extension downloads two zips per build:

| Repo            | Source                                                              |
| --------------- | ------------------------------------------------------------------- |
| `@chrome`       | `https://storage.googleapis.com/chrome-for-testing-public/{v}/{p}/chrome-{p}.zip` |
| `@chromedriver` | `…/chromedriver-{p}.zip`                                            |

`{v}` is the pinned version and `{p}` is one of `linux64`, `mac-arm64`,
`mac-x64`, `win32`, `win64`, resolved from `rctx.os.name` / `rctx.os.arch`. The
extracted bundle stays intact inside its repo — on macOS that means the full
`.app` wrapper, because chrome's dyld load commands resolve `Frameworks/`
relative to the executable. The `:chrome` target is a thin launcher script
that exec's the real bundle binary by absolute path so `@executable_path`
points at `Contents/MacOS/` (not the repo root).

### Hermeticity

| Layer            | Pinned by                                                       |
| ---------------- | --------------------------------------------------------------- |
| chrome binary    | `sha256` in [`chrome/private/known_versions.bzl`](https://github.com/tomato-bazel/rules_chrome/blob/main/chrome/private/known_versions.bzl) per `(version, platform)` |
| chromedriver     | same table                                                      |
| Profile state    | ephemeral `--user-data-dir` per `chrome_run` invocation         |

Unpinned versions still download — a warning is emitted at load time but the
build proceeds. To lock a new version:

```
tools/refresh_versions.py --version 148.0.7778.167
```

The tool pulls the upstream `last-known-good-versions-with-downloads.json`
endpoint (or `{version}.json` for a specific build), downloads every
`(binary, platform)` zip, hashes it, and rewrites `known_versions.bzl` in
place. Stdlib-only — no `pip install` needed.

## Playwright integration (opt-in)

If you drive chrome through Playwright, the `chrome/playwright` sub-module
gives you idiomatic Bazel macros that compose correctly with `launch_persistent_context`:

```python
# MODULE.bazel — add rules_python and your own pip hub
bazel_dep(name = "rules_python", version = "2.0.1")

pip = use_extension("@rules_python//python/extensions:pip.bzl", "pip")
pip.parse(
    hub_name = "my_pip",
    python_version = "3.12",
    requirements_lock = "//:requirements_lock.txt",   # must include playwright
)
use_repo(pip, "my_pip")
```

```python
# BUILD.bazel
load("@rules_chrome//chrome/playwright:py.bzl", "playwright_chrome_py_test")
load("@my_pip//:requirements.bzl", "requirement")

playwright_chrome_py_test(
    name = "browser_test",
    srcs = ["browser_test.py"],
    user_data_dir_mode = "workspace",  # persistent profile under bazel run
    deps = [requirement("playwright")],
)
```

```python
# browser_test.py
from rules_chrome_playwright import chrome_context

def test_thing():
    with chrome_context() as ctx:           # BrowserContext, not Browser
        page = ctx.new_page()
        page.goto("https://example.com")
        # cookies/extensions/local-storage survive across `bazel run` in workspace mode
```

The Node side mirrors this — `playwright_chrome_js_test` from
`@rules_chrome//chrome/playwright:js.bzl`, with Playwright pulled through
`aspect_rules_js`. See [examples/smoke](https://github.com/tomato-bazel/rules_chrome/blob/main/examples/smoke) for runnable
versions of both.

Consumers who **don't** load the sub-module don't pay for it — `rules_python`
and `aspect_rules_js` are `dev_dependency` on rules_chrome, so they only
appear in your dep graph if your `MODULE.bazel` brings them in itself.

## Scope and non-goals

This module intentionally stays small. It provides the **generally reusable**
piece — fetching chrome + chromedriver hermetically, launching them through
the toolchain with sane automation defaults. Things that stay in your repo:

- Selenium / Playwright / Puppeteer integrations — install the client of your
  choice via `rules_python` / `rules_js`, and point it at the chromedriver
  binary or the `chromedriver_run` target.
- Extension loading — pass `--load-extension=...` through `extra_args` or the
  `bazel run` CLI.
- Profile bootstrapping (preset bookmarks, signed-in cookies) — drop a
  pre-populated profile under `.cache/rules_chrome/...` and run
  `chrome_run(user_data_dir_mode = "workspace")`.
- chrome-headless-shell — upstream ships this as a separate artifact; add it
  to `tools/refresh_versions.py`'s `BINARIES` tuple plus a new repo rule in
  `chrome/extensions.bzl` to expose it as `@chrome_headless_shell`.

## Compatibility

- **Bazel**: 7.4+, bzlmod required.
- **Chrome for Testing**: 148.0.7778.167 pinned by default. Bump via
  `tools/refresh_versions.py`.
- **Platforms**: `linux64`, `mac-arm64`, `mac-x64`, `win64` (`win32` available
  but untested in CI).

On Linux runners chrome needs a handful of shared libs that ubuntu-latest
doesn't ship by default — the bundled CI workflow installs `libnss3`,
`libnspr4`, `libatk1.0-0`, `libatk-bridge2.0-0`, `libcups2`, `libdrm2`,
`libxkbcommon0`, `libxcomposite1`, `libxdamage1`, `libxfixes3`, `libxrandr2`,
`libgbm1`, `libpango-1.0-0`, `libcairo2`, and `libasound2t64`. If your own CI
launches chrome (not just `--version`), mirror that list.

## Contributing

Reference docs (`docs/defs.md`, `docs/extensions.md`, `docs/toolchains.md`)
are stardoc-generated from the `.bzl` docstrings and committed to source.
After editing a rule docstring:

```sh
bazel run //docs:update
```

CI gates this via `bazel test //docs/...` (diff_test against the committed
output) and the smoke targets in `examples/smoke/`:

| Target                                    | Exercises                                                                 |
| ----------------------------------------- | ------------------------------------------------------------------------- |
| `chrome_version_test`                     | `@chrome` launcher → `chrome --version` exits 0                           |
| `chromedriver_version_test`               | `@chromedriver` launcher → `chromedriver --version` exits 0               |
| `playwright_smoke_test` (py)              | Python Playwright → `executable_path=@chrome` → about:blank + JS eval     |
| `playwright_node_smoke_test` (js)         | Node Playwright → same shape, exercises the primary CDP code path         |
| `playwright_module_py_test`               | `playwright_chrome_py_test` macro + `rules_chrome_playwright` helper      |
| `playwright_module_js_test`               | `playwright_chrome_js_test` macro + helper, end-to-end                    |

The Playwright tests pull `playwright==1.59.0` hermetically — `rules_python` +
`smoke_pip` for the Python side, `aspect_rules_js` + `smoke_npm` for Node.
Both are scoped as dev-only `MODULE.bazel` extensions; consumers of
`rules_chrome` never see them.

To pull a newer Chrome for Testing release:

```sh
tools/refresh_versions.py                       # latest Stable
tools/refresh_versions.py --channel Beta        # latest Beta
tools/refresh_versions.py --version 149.0.7800.0   # specific build
```

…then bump `MODULE.bazel`'s `version` and commit both.

## License

MIT.
