---
title: "Overview"
module: "rules_postgres"
---

Bazel rules for PostgreSQL tooling.

- **`pg.query`** — fetches [libpg_query](https://github.com/pganalyze/libpg_query) (PostgreSQL's parser as a standalone C library) and builds it as a `cc_library`. Used to gate SQL files against PostgreSQL's own parser without running a live server.
- **`pg.source`** — fetches the full PostgreSQL source tarball with a minimal BUILD overlay. Lets you compile parts of the PG codebase under Bazel without invoking autoconf or GNU Make. Experimental.
- **`pg_parse_valid_test`** — sh_test wrapper around `parse_check` (a CLI built on libpg_query) that asserts a `.sql` file parses cleanly.
- **C tools** — `@rules_postgres//tools:parse_check` and `@rules_postgres//tools:plpgsql_to_json` — minimal CLIs wrapping libpg_query's APIs. Reusable in your own genrules and sh_tests.

See [docs/extensions.md](#doc-extensions) and [docs/defs.md](#doc-defs) for full reference.

## Install

Add the registry to your `.bazelrc`:

```
common --registry=https://registry.fastverk.com/
common --registry=https://bcr.bazel.build/
```

In your `MODULE.bazel`:

```python
bazel_dep(name = "rules_postgres", version = "0.1.0")

pg = use_extension("@rules_postgres//postgres:extensions.bzl", "pg")
pg.query(version = "17-6.2.2")
use_repo(pg, "libpg_query")
```

Add the full PG source if you also want `@postgres_src`:

```python
pg.source(version = "17.6")
use_repo(pg, "libpg_query", "postgres_src")
```

## Quick start

Gate emitted SQL against PostgreSQL's parser:

```python
load("@rules_postgres//postgres:defs.bzl", "pg_parse_valid_test")

pg_parse_valid_test(
    name = "my_emit_parses",
    sql  = "//path/to:my_emit.sql",
)
```

`bazel test //path/to:my_emit_parses` fails iff the SQL doesn't parse cleanly — surfaces typos, missing keywords, and version-drift in features like `INCLUDE` columns or `GENERATED AS IDENTITY` early.

Call `parse_check` directly from a genrule or sh_test:

```python
load("@rules_shell//shell:sh_test.bzl", "sh_test")

sh_test(
    name = "validate_all_my_sql",
    srcs = ["check.sh"],
    args = ["$(location @rules_postgres//tools:parse_check)"],
    data = [
        "@rules_postgres//tools:parse_check",
        ":all_my_sql_files",
    ],
)
```

## How it works

`pg.query`:

1. Downloads the libpg_query tarball (sha256-pinned per version in [`postgres/private/known_versions.bzl`](https://github.com/tomato-bazel/rules_postgres/blob/main/postgres/private/known_versions.bzl)).
2. Lays a BUILD overlay that splits the build into modular `cc_library` targets:
   - `:protobuf_c_runtime` — vendored protobuf-c runtime.
   - `:xxhash` — vendored xxhash hash function.
   - `:pg_query_pb_c` — pre-generated protobuf-c bindings for `pg_query.proto`.
   - `:libpg_query` — the parser library proper, depending on the three above.
3. Also exposes `pg_query.proto` as a filegroup for downstream codegen (Lean readers, Go bindings, etc.).

`pg.source`:

1. Downloads the PostgreSQL source tarball (sha256-pinned).
2. Layers hand-written `pg_config*.h` headers into `src/include/` (substituting what `configure` would have generated for a modern darwin_aarch64 / linux_x86_64 host).
3. Lays a BUILD overlay exposing `:all_source`, `:common_sources`, `:include_headers` filegroups + a `pg_common_string` probe `cc_library` compiling one file from `src/common/`.

For real backend compilation under Bazel, extend the overlay in your repo — the probe is a feasibility test, not the end state.

### Hermeticity

| Layer                  | Pinned by                                                                  |
| ---------------------- | -------------------------------------------------------------------------- |
| libpg_query release    | `sha256` in [`postgres/private/known_versions.bzl`](https://github.com/tomato-bazel/rules_postgres/blob/main/postgres/private/known_versions.bzl) |
| PostgreSQL source      | same table                                                                 |
| PG config headers      | hand-written, in `postgres/private/overlay/` (NOT autoconf-generated)      |

Unpinned versions still build (warning emitted) but lose hermeticity. Add an entry to `known_versions.bzl` to lock — compute with `curl -fsSL <url> | shasum -a 256`.

## Why not vendor libpg_query against our pg.source?

It's tempting to ask the extension to build libpg_query from your `pg.source` PG version instead of libpg_query's bundled subset. **It doesn't work that way**: libpg_query vendors a heavily-patched subset of PG's parser/lexer along with a custom protobuf serialization layer that upstream maintainers patch by hand against each PG release. You can't point libpg_query at a raw PG source tree.

The unified-pinning approach (regenerate libpg_query's vendored subset from a `pg.source`-pinned PG via libpg_query's `extract_source.rb` script wrapped as a `genrule`) is a real possible direction for a future release, but only pays off if version drift between libpg_query's bundled PG and your `pg.source` PG starts mattering.

## Compatibility

- **Bazel**: 7.4+, bzlmod required.
- **libpg_query**: `17-6.2.2` default. Older PG-major variants (`16-*`, `15-*`) work — add the sha to `known_versions.bzl`.
- **PostgreSQL source**: `17.6` default. Other 17.x and most 16.x releases should work with the same overlay; older majors may need overlay tweaks.
- **Platforms**: darwin_aarch64, darwin_x86_64, linux_x86_64. Windows untested.

## Contributing

Reference docs are stardoc-generated and committed. After editing a `.bzl` docstring:

```sh
bazel run //docs:update
```

CI gates this via `bazel test //docs/...` and the smoke tests in `examples/parse_smoke/`.

## License

MIT.
