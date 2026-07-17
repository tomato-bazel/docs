---
title: "defs"
module: "rules_autoconf"
---

<!-- Generated with Stardoc: http://skydoc.bazel.build -->

User-facing rules for rules_autoconf.

The Bazel-native equivalents of common autoconf AC_* primitives. Each
rule emits a single result file that other rules (notably
`config_header`) consume — so probe results compose into a graph, not
into shell-script global state.

The probes use Python tools that shell out to the host C compiler. The
host compiler choice is the `CC` env var (defaults to `cc`). v0.1 does
NOT use Bazel's `@bazel_tools//tools/cpp` C toolchain — it relies on
whatever `cc` resolves to on the host. v0.2+ will integrate the proper
Bazel C toolchain for full hermeticity.

Available rules:
  cc_check_header     — autoconf's AC_CHECK_HEADER
  cc_check_function   — autoconf's AC_CHECK_FUNC (link test)
  cc_check_symbol     — autoconf's AC_CHECK_DECL / AC_CHECK_TYPE
  config_header       — autoconf's AC_CONFIG_HEADERS (renders config.h
                        from a template + define dict + probe results)

<a id="cc_check_function"></a>

### cc_check_function

<pre>
load("@rules_autoconf//autoconf:defs.bzl", "cc_check_function")

cc_check_function(<a href="#cc_check_function-name">name</a>, <a href="#cc_check_function-define_name">define_name</a>, <a href="#cc_check_function-function">function</a>, <a href="#cc_check_function-header">header</a>, <a href="#cc_check_function-libraries">libraries</a>)
</pre>

Probe whether a C function is linkable. Bazel-native equivalent of autoconf's AC_CHECK_FUNC.

**ATTRIBUTES**


| Name  | Description | Type | Mandatory | Default |
| :------------- | :------------- | :------------- | :------------- | :------------- |
| <a id="cc_check_function-name"></a>name |  A unique name for this target.   | <a href="https://bazel.build/concepts/labels#target-names">Name</a> | required |  |
| <a id="cc_check_function-define_name"></a>define_name |  Override the macro name. Defaults to `HAVE_<FUNCTION>` (uppercased).   | String | optional |  `""`  |
| <a id="cc_check_function-function"></a>function |  Function to probe (e.g. "strlcpy", "getifaddrs").   | String | required |  |
| <a id="cc_check_function-header"></a>header |  Optional header to #include (e.g. "string.h"). Some functions need a declaration to compile cleanly.   | String | optional |  `""`  |
| <a id="cc_check_function-libraries"></a>libraries |  Libraries to link (each becomes -l<name>).   | List of strings | optional |  `[]`  |


<a id="cc_check_header"></a>

### cc_check_header

<pre>
load("@rules_autoconf//autoconf:defs.bzl", "cc_check_header")

cc_check_header(<a href="#cc_check_header-name">name</a>, <a href="#cc_check_header-define_name">define_name</a>, <a href="#cc_check_header-header">header</a>)
</pre>

Probe whether a C header is includable. Bazel-native equivalent of autoconf's AC_CHECK_HEADER.

**ATTRIBUTES**


| Name  | Description | Type | Mandatory | Default |
| :------------- | :------------- | :------------- | :------------- | :------------- |
| <a id="cc_check_header-name"></a>name |  A unique name for this target.   | <a href="https://bazel.build/concepts/labels#target-names">Name</a> | required |  |
| <a id="cc_check_header-define_name"></a>define_name |  Override the macro name. Defaults to `HAVE_<HEADER>` (uppercased, non-alphanumeric -> underscore).   | String | optional |  `""`  |
| <a id="cc_check_header-header"></a>header |  Header to probe (e.g. "string.h", "sys/socket.h").   | String | required |  |


<a id="cc_check_symbol"></a>

### cc_check_symbol

<pre>
load("@rules_autoconf//autoconf:defs.bzl", "cc_check_symbol")

cc_check_symbol(<a href="#cc_check_symbol-name">name</a>, <a href="#cc_check_symbol-define_name">define_name</a>, <a href="#cc_check_symbol-header">header</a>, <a href="#cc_check_symbol-symbol">symbol</a>)
</pre>

Probe whether a symbol is declared. Bazel-native equivalent of autoconf's AC_CHECK_DECL.

**ATTRIBUTES**


| Name  | Description | Type | Mandatory | Default |
| :------------- | :------------- | :------------- | :------------- | :------------- |
| <a id="cc_check_symbol-name"></a>name |  A unique name for this target.   | <a href="https://bazel.build/concepts/labels#target-names">Name</a> | required |  |
| <a id="cc_check_symbol-define_name"></a>define_name |  Override the macro name. Defaults to `HAVE_DECL_<SYMBOL>`.   | String | optional |  `""`  |
| <a id="cc_check_symbol-header"></a>header |  Header to #include to bring the symbol into scope.   | String | optional |  `""`  |
| <a id="cc_check_symbol-symbol"></a>symbol |  Symbol/identifier to probe. Works for type names, macros, enum members, function declarations.   | String | required |  |


<a id="config_header"></a>

### config_header

<pre>
load("@rules_autoconf//autoconf:defs.bzl", "config_header")

config_header(<a href="#config_header-name">name</a>, <a href="#config_header-out">out</a>, <a href="#config_header-defines">defines</a>, <a href="#config_header-probes">probes</a>, <a href="#config_header-template">template</a>)
</pre>

Render an autoconf-style config header from a template + defines + probe results.

**ATTRIBUTES**


| Name  | Description | Type | Mandatory | Default |
| :------------- | :------------- | :------------- | :------------- | :------------- |
| <a id="config_header-name"></a>name |  A unique name for this target.   | <a href="https://bazel.build/concepts/labels#target-names">Name</a> | required |  |
| <a id="config_header-out"></a>out |  The rendered config header.   | <a href="https://bazel.build/concepts/labels">Label</a> | required |  |
| <a id="config_header-defines"></a>defines |  Static substitutions. Values become both `#define` bodies (for `#undef VAR` lines) and `@VAR@` substitutions.   | <a href="https://bazel.build/rules/lib/dict">Dictionary: String -> String</a> | optional |  `{}`  |
| <a id="config_header-probes"></a>probes |  Probe targets (cc_check_header / cc_check_function / etc.). Each contributes `<DEFINE_NAME>=1` to `defines` iff the probe result is '1' (autoconf's HAVE_* convention).   | <a href="https://bazel.build/concepts/labels">List of labels</a> | optional |  `[]`  |
| <a id="config_header-template"></a>template |  The template header (typically `config.h.in`). Lines matching `#undef VAR` are substituted with `#define VAR <value>` when `VAR` is in `defines`. `@VAR@` substitutions are also applied.   | <a href="https://bazel.build/concepts/labels">Label</a> | required |  |


<a id="ProbeResultInfo"></a>

### ProbeResultInfo

<pre>
load("@rules_autoconf//autoconf:defs.bzl", "ProbeResultInfo")

ProbeResultInfo(<a href="#ProbeResultInfo-result_file">result_file</a>, <a href="#ProbeResultInfo-define_name">define_name</a>)
</pre>

A compile-test probe result.

**FIELDS**

| Name  | Description |
| :------------- | :------------- |
| <a id="ProbeResultInfo-result_file"></a>result_file |  File: contains '1' if the feature is present, '0' otherwise.    |
| <a id="ProbeResultInfo-define_name"></a>define_name |  string: the macro name this probe defines when present (e.g. "HAVE_STRLCPY").    |
