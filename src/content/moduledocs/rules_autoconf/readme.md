---
title: "Overview"
module: "rules_autoconf"
---

Bazel-native autoconf-style configuration. Replaces the autoconf+m4 shell
pipeline with Bazel rules that compose probe results into a graph.

- **`cc_check_header`** — autoconf's `AC_CHECK_HEADER`. Bazel-native equivalent.
- **`cc_check_function`** — autoconf's `AC_CHECK_FUNC` (compile + link test).
- **`cc_check_symbol`** — autoconf's `AC_CHECK_DECL` / `AC_CHECK_TYPE`.
- **`config_header`** — autoconf's `AC_CONFIG_HEADERS`. Renders a `config.h` template from a `defines` dict + probe results.

See [docs/defs.md](https://github.com/tomato-bazel/rules_autoconf/blob/main/docs/defs.md) for the full reference.

## What this is and isn't (v0.1)

**Is:** the Bazel-native seed of an autoconf replacement. Probes execute as
Bazel actions, so their results compose into the build graph and are
cache-aware. No shell, no m4, no `configure` script generation.

**Isn't (yet):** a full autoconf clone. v0.1 covers the most common AC_*
primitives — enough to ground a hand-written `config.h.in` against the
host. The long tail (`AC_C_BIGENDIAN`, `AC_CHECK_SIZEOF`, `AC_FUNC_*`
function-specific tests, `AC_PROG_*` program detection) lands in
subsequent releases.

**Doesn't run real autoconf:** v0.1 has no `autoconf` or `m4` binary
dependency. The probes use the host C compiler (whatever `$CC` resolves
to, defaulting to `cc`). For projects that ship a pre-generated
`configure` script (like PostgreSQL), a future `configure_run` rule
will let you invoke it under Bazel sandboxing without needing autoconf
itself. For projects that need autoconf-generated configure scripts
built on the fly, that's v0.3+ work.

## Install

Add the registry to your `.bazelrc`:

```
common --registry=https://registry.fastverk.com/
common --registry=https://bcr.bazel.build/
```

In your `MODULE.bazel`:

```python
bazel_dep(name = "rules_autoconf", version = "0.1.0")
```

## Quick start

A typical autoconf project has a `config.h.in` template with `#undef`
stubs. Tell rules_autoconf which probes to run and what static values to
substitute:

```python
load(
    "@rules_autoconf//autoconf:defs.bzl",
    "cc_check_function",
    "cc_check_header",
    "config_header",
)

cc_check_header(name = "have_stdio_h",      header = "stdio.h")
cc_check_header(name = "have_sys_socket_h", header = "sys/socket.h")

cc_check_function(
    name     = "have_strlcpy",
    function = "strlcpy",
    header   = "string.h",
)

cc_check_function(
    name      = "have_openssl_init_ssl",
    function  = "OPENSSL_init_ssl",
    header    = "openssl/ssl.h",
    libraries = ["ssl", "crypto"],
)

config_header(
    name    = "config_h",
    out     = "config.h",
    template = "config.h.in",
    defines = {
        "PACKAGE_NAME":    "\"myproj\"",
        "PACKAGE_VERSION": "\"0.1.0\"",
    },
    probes = [
        ":have_stdio_h",
        ":have_sys_socket_h",
        ":have_strlcpy",
        ":have_openssl_init_ssl",
    ],
)
```

`bazel build //path/to:config_h` runs each probe as a Bazel action,
captures its success/failure, and stamps the result into `config.h`:

```c
/* config.h */
#define PACKAGE_NAME "myproj"
#define PACKAGE_VERSION "0.1.0"
#define HAVE_STDIO_H 1
#define HAVE_SYS_SOCKET_H 1
#define HAVE_STRLCPY 1
#undef HAVE_OPENSSL_INIT_SSL          /* OpenSSL not in -lssl -lcrypto on this host */
```

The probes are content-addressed by their inputs (header name, function
signature, library list, host compiler), so they're cached: rebuilding
without changing probe attrs reuses results. Changing a probe attr
invalidates only its own result and the downstream `config_header`.

## How it differs from rules_foreign_cc

`rules_foreign_cc` wraps autoconf+make+cmake builds end-to-end as
opaque `cc_library` outputs. rules_autoconf instead **replaces** the
autoconf step with Bazel-native primitives — you keep fine-grained
control over the resulting `cc_library` graph, but you lose the
ability to drive an existing `configure.ac` directly. The two
complement each other:

- **Use rules_foreign_cc** if you want a Bazel-managed build of an
  autoconf project without doing the dependency surgery yourself.
- **Use rules_autoconf** if you want a hand-written, fine-grained
  Bazel build of an autoconf project and just need the `config.h`
  generated correctly.

## Roadmap

| Version | Adds |
|---------|------|
| v0.1 (this) | cc_check_{header,function,symbol}, config_header |
| v0.2 | cc_check_sizeof, cc_check_bigendian, cc_check_decl (compile-only function probe), cc_check_libraries (cumulative -l detection) |
| v0.3 | configure_run rule for projects shipping pre-generated configure scripts |
| v0.4 | autoconf+m4 binaries packaged as Bazel toolchains (built from source under Bazel via hand-rolled cc_library for m4) |
| v0.5+ | Long-tail AC_* macros, AC_ARG_ENABLE / AC_ARG_WITH equivalents, optional Bazel C-toolchain integration replacing host `$CC` |

## Limitations of v0.1

- **Probes use the host compiler** via `$CC` (default `cc`). The Bazel C
  toolchain integration that would make probes fully hermetic against
  the registered `cc_toolchain` lands in v0.5+.
- **No cross-compilation** — probes always run on the exec platform.
- **No `AC_TRY_RUN`-style probes** that need to execute the test binary.
  Compile+link is sufficient for most checks; run-time probes (like
  `AC_C_BIGENDIAN`'s fallback path) are deferred.
- **No `@VAR@` substitution in non-header files yet** — only the header
  template path. Adding generic file substitution is straightforward
  but not in v0.1.

## Compatibility

- **Bazel**: 7.4+, bzlmod required.
- **Host**: a C compiler on `$PATH` (or `$CC` set).
- **Platforms**: any host with a working C compiler. Tested on
  darwin_aarch64 and linux_x86_64.

## Contributing

Reference docs (`docs/defs.md`) are stardoc-generated from the `.bzl`
docstrings. After editing a rule docstring:

```sh
bazel run //docs:update
```

CI gates this via `bazel test //docs/...` plus the end-to-end smoke
build in `examples/hello/`.

## License

MIT.
