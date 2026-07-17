---
title: "Usage"
module: "rules_chrome"
---

Real usage, taken from the module's `examples/`.

### examples/smoke/BUILD.bazel

```starlark
load("@aspect_rules_js//js:defs.bzl", "js_test")
load("@rules_chrome//chrome:defs.bzl", "chrome_run", "chromedriver_run")
load("@rules_chrome//chrome/playwright:js.bzl", "playwright_chrome_js_test")
load("@rules_chrome//chrome/playwright:py.bzl", "playwright_chrome_py_test")
load("@rules_python//python:py_test.bzl", "py_test")
load("@rules_shell//shell:sh_test.bzl", "sh_test")
load("@smoke_npm//:defs.bzl", "npm_link_all_packages")
load("@smoke_pip//:requirements.bzl", "requirement")

# `bazel run //examples/smoke:chrome` — launches headless chrome with a
# fresh ephemeral profile. Verifies the toolchain resolves and the
# binary executes on the host.
chrome_run(
    name = "chrome",
    extra_args = ["--disable-gpu"],
    headless = True,
)

# `bazel run //examples/smoke:chromedriver` — launches chromedriver on
# the OS-assigned port. Read it from chromedriver's stdout.
chromedriver_run(
    name = "chromedriver",
)

# Smoke test: `chrome --version` exits 0 and prints a version string.
sh_test(
    name = "chrome_version_test",
    srcs = ["version_smoke.sh"],
    args = ["$(rootpath @chrome//:chrome)"],
    data = ["@chrome"],
)

# Smoke test: `chromedriver --version` exits 0 and prints a version string.
sh_test(
    name = "chromedriver_version_test",
    srcs = ["version_smoke.sh"],
    args = ["$(rootpath @chromedriver//:chromedriver)"],
    data = ["@chromedriver"],
)

# Playwright integration: launches headless chrome via the @chrome
# launcher, drives it over CDP, evaluates a trivial JS expression.
# Confirms our wrapper survives Playwright's subprocess-spawn /
# CDP-handshake path (chromedriver isn't in this loop — Playwright
# speaks CDP directly).
py_test(
    name = "playwright_smoke_test",
    srcs = ["playwright_smoke.py"],
    args = ["$(rootpath @chrome//:chrome)"],
    data = ["@chrome"],
    # Playwright's launch spawns a subprocess and refuses to find its
    # bundled node driver if PATH is empty under sandboxing — let it
    # inherit the host PATH. Same goes for HOME (used by tmpdir).
    env_inherit = [
        "PATH",
        "HOME",
    ],
    main = "playwright_smoke.py",
    deps = [requirement("playwright")],
)

# Materialize the @smoke_npm/* labels under this package so js_test can
# depend on `//examples/smoke:node_modules/playwright`. The macro
# expands per pnpm-lock entry — no per-package boilerplate.
npm_link_all_packages(name = "node_modules")

# Playwright (Node) integration: same shape as the py_test, but
# exercises Playwright's primary (Node) bindings rather than the Python
# wrapper. Covers the launcher under a different subprocess-spawn path.
js_test(
    name = "playwright_node_smoke_test",
    args = ["$(rootpath @chrome//:chrome)"],
    data = [
        "playwright_smoke.js",
        ":node_modules/playwright",
        "@chrome",
    ],
    entry_point = "playwright_smoke.js",
    env = {
        # Skip the post-install chromium fetch. We point Playwright at
        # @chrome via executablePath; its bundled browser is dead weight.
        "PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD": "1",
    },
)

# `playwright_chrome_py_test` macro smoke: exercises the rules_chrome
# sub-module abstraction (env wiring + helper module) end-to-end.
# Ephemeral mode → profile lives under $TEST_TMPDIR.
playwright_chrome_py_test(
    name = "playwright_module_py_test",
    srcs = ["playwright_module_smoke.py"],
    deps = [requirement("playwright")],
)

# Same shape, JS side — `playwright_chrome_js_test` macro.
playwright_chrome_js_test(
    name = "playwright_module_js_test",
    data = [":node_modules/playwright"],
    entry_point = "playwright_module_smoke.js",
)

# Workspace-mode coverage: fakes BUILD_WORKSPACE_DIRECTORY so the
# launch_persistent_context path that's normally only reachable via
# `bazel run` (not `bazel test`) gets CI coverage too. Also exercises
# the helper's clear-error behavior when the env var is missing.
playwright_chrome_py_test(
    name = "playwright_workspace_mode_test",
    srcs = ["workspace_mode_smoke.py"],
    deps = [requirement("playwright")],
)
```
