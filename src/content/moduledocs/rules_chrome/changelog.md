---
title: "Changelog"
module: "rules_chrome"
---

All notable changes to rules_chrome. The format is loosely
[Keep a Changelog](https://keepachangelog.com/) — version headers
mirror the published bazel-registry entries.

### 0.1.0 — initial release

- Initial release of Bazel rules for [Chrome for Testing]: a module
  extension that creates pinned `@chrome` + `@chromedriver` external
  repos, a `chrome_toolchain` (resolved via
  `@rules_chrome//chrome:toolchain_type`), and `chrome_run` /
  `chromedriver_run` launchers tuned for test automation.
- Optional `chrome/playwright` sub-module: `playwright_chrome_py_test`
  and `playwright_chrome_js_test` macros wire `@chrome` into a
  Playwright `launchPersistentContext` with a Bazel-managed
  `--user-data-dir`. The default `bazel_dep` stays a zero-cost
  chrome+chromedriver toolchain — `rules_python` / `aspect_rules_js`
  costs only apply when the sub-module is loaded.
- Pre-tag hardening: bumped pins, added workspace-mode + refresher
  tests, plus Playwright (py + node) smoke tests against the
  `@chrome` launcher.
