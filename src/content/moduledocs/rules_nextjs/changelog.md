---
title: "Changelog"
module: "rules_nextjs"
---

All notable changes to rules_nextjs. The format is loosely
[Keep a Changelog](https://keepachangelog.com/) — version headers
mirror the published bazel-registry entries.

### 0.3.0 — next_standalone (runnable + deployable bundle)

- `next_build`: add an `output` attribute (`standalone` | `static` |
  `vercel` | `default`, default `standalone`). Only `standalone` forces
  `NEXT_PRIVATE_STANDALONE=1`; the mode is surfaced on `NextBuildInfo`
  (along with `app_dir`) so downstream rules can gate on it.
- New `next_standalone` macro: from an `output = "standalone"` build it
  emits `<name>.bundle` — the standalone server re-stitched with
  `.next/static` into one deployable `TreeArtifact` (feed to
  `pkg_tar`/`oci_image`) — and `<name>`, a `bazel run`-able launcher
  that serves the bundle on the hermetic Node. Static / vercel builds
  fail fast (no self-contained server). New `NextStandaloneInfo`
  provider + a fixed-name entry shim (`NEXT_STANDALONE_ENTRY`) so an
  `oci_image` `cmd` can target the server regardless of where Next
  nested `server.js`.
- `next_build`: repair the standalone `node_modules` for runtime
  resolution. `next build`'s `cp -RL` promote step deref's the
  standalone into real directories, which disconnects each package from
  its sibling deps under `.aspect_rules_js/<key>/node_modules/` — so
  e.g. `next`'s require-hook can't find `styled-jsx` and the server
  crashes on boot. The build now adds a flat top-level
  `node_modules/<pkg>` entry (relative, internal symlink) for every
  content-store package, so Node's realpath walk always reaches the
  single top-level `node_modules` and resolves every transitive dep.
  `next_standalone`'s bundle preserves these symlinks (`cp -R`) so the
  image isn't doubled. Verified: `bazel run //:standalone` on the
  example app serves HTTP 200.
- Trade-off: against the aspect_rules_js content store, `next build`'s
  trace + the deref produce a large standalone `node_modules`. Correct,
  but heavier than a pnpm-built standalone — narrowing the trace is a
  separate optimization.

### 0.2.0 — next_dev + bundler selection

- Add a `next_dev` rule: a `bazel run`-launched Next.js dev server in
  the workspace tree (companion to the hermetic `next_build`).
- `next_build`: add a `bundler` attribute (`webpack` | `turbopack`) to
  select the Next.js bundler.
- `next_build`: two-action design with tsconfig / next.config rewrites;
  the next.config wrapper handles peer-dep visibility, workspace
  `transpilePackages`, and the `.ts` `extensionAlias`.
- New dependency: `aspect_bazel_lib` (2.22.5).

### 0.1.1 — hermeticity fixes for next_build

- Fix `BAZEL_BINDIR` propagation, pass workspace deps as explicit
  action inputs, and switch to `FilesToRunProvider` so `next build`
  runs cleanly inside the Bazel sandbox.

### 0.1.0 — initial release

- First cut of Bazel rules for [Next.js](https://nextjs.org/): a
  `next_build` rule that runs `next build` as a hermetic Bazel action
  with workspace deps as inputs and `.next/` as the declared output,
  plus a `NextBuildInfo` provider so downstream rules (deploy targets,
  `oci_image` wrappers, doc extractors) can consume builds.
