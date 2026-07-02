# Authoring a module

Modules are published to the registry with the `rels` tool (in
[`tomato-bazel/bazel-registry`](https://github.com/tomato-bazel/bazel-registry)),
which cuts a version from a GitHub tag.

## Cut a release

1. Tag the module repo at the release commit — the tag is `v<version>` (matching
   the `version` in its `MODULE.bazel`):

   ```
   git tag v0.1.0 && git push origin v0.1.0
   ```

   The repo (and thus the tag tarball) must be **public** — a registry module's
   source has to be anonymously fetchable, or keyless CI can't resolve it.

2. From a `bazel-registry` checkout, cut the version — `rels` fetches the tag
   tarball, computes the integrity, and writes
   `modules/<name>/<version>/{source.json, MODULE.bazel}` + upserts `metadata.json`:

   ```
   bazel run //tools/rels:rels -- release \
     --repo tomato-bazel/<repo> --version 0.1.0 --name <module_name>
   ```

3. Commit + push. `registry.tbzl.dev` serves the new version within about a minute.

## Conventions

- Module `name` is the bzlmod module name (snake_case), which may differ from the
  repo basename — pass `--name` when it does.
- `rels audit` flags tag↔registry drift, missing CI/CHANGELOG, and dep-pin drift.
