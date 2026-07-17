---
title: "Changelog"
module: "rules_web"
---

### 0.0.1 (in progress)

- Initial scaffold. `web/webidl/` v0 toolchain interface:
  `webidl_toolchain_type`, `WebIDLToolchainInfo` provider,
  `WebIDLInfo` provider for libraries, and the consumer-facing
  `webidl_library` + `webidl_parse` rules.
- `web/html/`, `web/css/`, `web/js/` subdirs stubbed with empty
  `toolchain_type` placeholders so the structure is in place when
  the first concrete consumer arrives (likely
  `firefox_html_parser` for the html toolchain).
- Canonical WebIDL impl registered separately by
  [`firefox_webidl_parser`](https://github.com/fastverk/rules_firefox/tree/main/webidl_parser).
