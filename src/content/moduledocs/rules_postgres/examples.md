---
title: "Usage"
module: "rules_postgres"
---

Real usage, taken from the module's `examples/`.

### examples/meson_smoke/BUILD.bazel

```starlark
load("@rules_postgres//postgres:meson.bzl", "pg_meson_configure")

# Run hermetic `meson setup` against Postgres 17 source and capture
# compile_commands.json. Output is consumable by any downstream tool
# that ingests compile_commands.json (clang-tidy, clangd, rules_lang's
# c_ast_dump_from_compdb, etc.). This is what `rules_postgres`
# contributes; the ingestion step is a separate concern (intentionally
# living in the consuming repo).
#
# bazel build //examples/meson_smoke:pg17_compdb
#   → bazel-bin/examples/meson_smoke/pg17_compdb.compile_commands.json
#     (~1500 TU entries for PG 17.6 with default-disabled options)
pg_meson_configure(
    name = "pg17_compdb",
    srcs = ["@postgres_src//:all_source"],
    marker = "@postgres_src//:meson.build",
    visibility = ["//visibility:public"],
)
```

### examples/parse_smoke/BUILD.bazel

```starlark
load("@rules_postgres//postgres:defs.bzl", "pg_parse_valid_test")
load("@rules_shell//shell:sh_test.bzl", "sh_test")

# Positive smoke: a trivial SELECT must parse cleanly.
pg_parse_valid_test(
    name = "select_one_parses",
    sql = "testdata/select_one.sql",
)

# Positive smoke: CREATE FUNCTION with PL/pgSQL body parses cleanly.
pg_parse_valid_test(
    name = "create_function_parses",
    sql = "testdata/create_function.sql",
)

# Negative smoke: a deliberately broken SQL string must be rejected.
# Together with the positives, this proves the libpg_query toolchain
# is wired end-to-end (download, build, link, run) AND that errors
# actually surface as non-zero exit codes.
sh_test(
    name = "bad_sql_rejected",
    srcs = ["run_inverted.sh"],
    args = [
        "$(location @rules_postgres//tools:parse_check)",
        "$(location testdata/bad_sql.sql)",
    ],
    data = [
        "testdata/bad_sql.sql",
        "@rules_postgres//tools:parse_check",
    ],
)
```
