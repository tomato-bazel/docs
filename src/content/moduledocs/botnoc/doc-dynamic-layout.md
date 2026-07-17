---
title: "dynamic-layout"
module: "botnoc"
---

# Dynamic meridian layouts + the plugin-pattern collapse

**Status:** design + landed proto contracts (meridian-schemas 0.6.0). Server
implementation is a follow-up (Parts A/C/D below).

## Why this exists

`botnoc` is an aggregator, not a monolith (see [TOPOLOGY.md](https://github.com/fastverk/botnoc/blob/main/TOPOLOGY.md)): it fans
out to N feature plugins (forge, builds, depot, tbzl, agents, compliance,
workspaces, org, planning, chat…), each a per-plugin BFF exposing an identical
HTTP surface (`/healthz`, `/describe`, `/panels.binpb`, `/mcp`, REST routes),
discovered from `FASTVERK_BACKEND_<ID>=<url>` env vars. Two structural problems
have grown with the plugin count:

1. **Per-plugin boilerplate is copy-pasted.** compliance and agents both comment
   that they "mirror the builds plugin's facade" — the axum bootstrap, the
   runfiles panel-bundle loader, the hand-inlined `/describe` JSON, the
   gateway-token middleware, and the confirm-gate write protocol recur
   near-verbatim across ≥3 plugins.

2. **The layout is 100% static and client-hardcoded.** meridian ships pure
   descriptor data; **it had zero gRPC services** (verified: no `service` block in
   any `meridian-schemas` proto). Layouts are authored as textproto → `.binpb` at
   build time and served as opaque files, and the *composition* — section order,
   tab grouping, RPC→REST routing — lives entirely in
   [web/static/assets/main.js](https://github.com/fastverk/botnoc/blob/main/web/static/assets/main.js). Nothing about the
   console structure is computed per user, role, entitlement, or state.

The user ask that drove this: *"what additional meridian gRPC services should we
define so meridian layouts are more dynamic,"* plus *"identify repeated plugin
patterns that could be collapsed,"* with the constraint that **as much generic
functionality as possible lands in the `meridian-ux` GitHub org** (published via
the tomato-bazel bazel-registry), keeping only fastverk-specific code here.

## The generic ↔ fastverk boundary (governs every placement)

botnoc has fully cut over to the fractured meridian-ux modules
([MODULE.bazel](https://github.com/fastverk/botnoc/blob/main/MODULE.bazel) lines ~113–146); the monolith `@meridian`
(`github.com/fastverk/meridian`) is legacy — nothing new goes there. The generic
design language lives in independent `meridian-ux` repos, published to
`github.com/tomato-bazel/bazel-registry` and consumed as `bazel_dep`s:

| Module (repo) | Role |
|---|---|
| `meridian_schemas` (`meridian-ux/meridian-schemas`) | Framework/brand-neutral root: the `meridian.ui.v1` + `meridian.theme.v1` **proto contracts**, the protobuf-es TS surface, and the neutral `WebRenderer`/`RpcInvoker`/`RenderContext` host-transport seam. **All new generic contracts go here.** |
| `meridian_web` (`meridian-ux/meridian-web`) | `meridian_panel_bundle` rule + web-components renderer. New renderer support goes here. |
| `meridian_uiview_core` / `meridian_tui` | Native Rust core + wasm / ratatui renderer. |

**Rule of thumb:** generic UI vocabulary + contracts → **meridian-ux**; fastverk
implementations + policy (who the plugins are, identity, entitlement evaluation,
the plugin-host facade) → **here (fvkit / botnoc)**.

## What meridian already had (before this slice)

The `meridian-schemas` 0.5.0 repo is richer than a first read suggests — the
composition tier already exists:

- **`PanelDescriptor`** (`proto/panel.proto`) — one right-pane view; a flat
  `oneof body` of table/lro/adhoc/prompt/llm_prompt/gallery/form. `PanelBundle` is
  a **flat list**.
- **`ViewDescriptor`** (`proto/view.proto`) — the layout tier ABOVE a panel:
  `Layout` (list/stacked/tabbed/two-column) arranging `Slot`s, each rendering a
  panel, plus a neutral `Action` (labeled `RpcCall` + placement). This already
  covers multi-panel pages / dashboards.
- **`RpcCall` / `FieldBinding`** (`proto/rpc.proto`) — data-binding, including the
  0.5.0 `Source::Signal` (chart selection → RPC).
- **`RpcInvoker` / `RenderContext`** (`src/uiview/transport.ts`) — the host
  supplies transport; meridian owns the *contract*, not the wire.
- **`PRIMITIVES-NEXT.md`** — meridian's own roadmap, which had already designed
  **`NavTree`** (§1, "replaces botnoc's hand-rolled `buildRail`") as the next
  release's flagship.

The one true gap was **delivery**: every dynamic decision still had to be host
glue because meridian named *what* to render but never *served* it. That is the
tier this slice adds.

## Landed in this slice — meridian-schemas 0.6.0 (generic)

Two additive contracts, both in package `meridian.ui.v1`, wired into
`uiview_proto` (`proto/BUILD.bazel`); protobuf-es 2.x emits them into the TS
surface (the service becomes a `GenService` consumed via
`@connectrpc/connect`'s `createClient`). No language stub is forced on anyone —
each renderer/host repo generates the grpc stubs it wants.

### 1. `proto/nav_tree.proto` — the navigation primitive (adopts PRIMITIVES-NEXT §1)

`NavTree { repeated NavNode roots }`; `NavNode { id, label, icon, oneof target {
panel_id | view_id }, repeated children, default_open, badge }`. A declarative
sections → groups → leaves tree; a leaf targets a panel or a view, a group has
children. Cross-modal by design (web rail / TUI tree / chat numbered menu), with
the documented degradation ladder (a renderer that can't do a tree renders leaves
flat — never worse than today). This replaces the host-side rail composition in
`main.js`.

### 2. `proto/layout_service.proto` — the OPTIONAL server-driven delivery tier

The **first gRPC service in meridian** — the answer to "what services to define":

```proto
service LayoutService {
  rpc GetNavTree(GetNavTreeRequest) returns (NavTree);            // rail/menu for THIS caller
  rpc WatchNavTree(GetNavTreeRequest) returns (stream NavTree);   // push nav changes
  rpc GetView(GetViewRequest) returns (ViewDescriptor);           // one composed page, per caller
  rpc WatchView(GetViewRequest) returns (stream ViewDescriptor);  // live dashboards
  rpc GetPanel(GetPanelRequest) returns (PanelDescriptor);        // one panel, per caller
}
```

Design decisions:

- **Additive + optional.** The static `.binpb` path is untouched. A meridian app
  opts in by implementing the service; one that prefers static bundles never does.
- **Neutrality is load-bearing.** `LayoutService` is the proto analogue of the
  `RpcInvoker`/`RenderContext` contracts meridian already ships — a contract, not
  an implementation, referencing ONLY `meridian.ui.v1` descriptor messages. It was
  verified to contain **zero** host/app/brand symbols (no `fastverk`,
  `PluginManifest`, `botnoc`) in both source and generated TS.
- **Caller dimensions are opaque.** Tenant/role/entitlement/feature-flag inputs
  travel as `map<string,string> LayoutContext.attributes` — meaningful only to the
  implementing host. Server-side gating (entitlement-based nav, role-scoped views)
  is expressed by the server *computing a different tree/view per context*, so no
  host schema leaks into the neutral contract.
- **Content negotiation.** `LayoutContext.surface` ("web"|"tui"|"chat") lets the
  server tailor shape per modality — the meridian "descriptor names intent; each
  surface transcodes" philosophy, extended to the server for cases where the shape
  itself should differ.
- **Streaming closes the push gap.** `Watch*` replaces the `AdhocPanel` SSE
  side-channels used today to shoehorn live data.

### How the new services map to the old gaps

| Static/hardcoded today | Replaced by |
|---|---|
| `main.js:composeSections`/`groupTabs`/`NAMED_TAB_GROUPS` + `fleet.js` rail | `GetNavTree` (+ `NavTree`) |
| static `/panels.binpb` file per plugin | `GetPanel` (dynamic, per caller) |
| multi-panel pages implicit in file order | `GetView` (`ViewDescriptor` already existed) |
| live data via `AdhocPanel` SSE | `WatchNavTree` / `WatchView` |
| the vaporware admin "ReloadDescriptors RPC" (a comment in the monolith) | this whole service |

## Part A — collapse the repeated plugin patterns (fastverk)

All fastverk-specific (the plugin-*host* contract, not generic UI):

1. **Shared `fastverk-plugin-server` crate** — **LANDED** as
   [`crates/fastverk-plugin-server`](https://github.com/fastverk/botnoc/blob/main/crates/fastverk-plugin-server) (not
   `fvkit`). It owns the boilerplate every `services/*` plugin repeated verbatim:
   `init()` (the aws-lc-rs crypto provider + a `RUST_LOG` tracing subscriber),
   `load_panels()` (the runfiles panel-bundle loader), and `facade()` — the
   standard axum surface (`/healthz` open + `/describe` + `/panels.binpb` + the
   shared gateway-token guard around the plugin's own data routes). The 6 in-repo
   panel plugins (forge/builds/depot/tbzl/registry/workspaces) are migrated onto
   it; each `http.rs` drops its own copy of `require_gateway_token` (there were
   **9** identical copies), the `/describe`+`/panels.binpb` handlers, and the
   `main()` preamble. It complements
   [`fastverk-layout`](https://github.com/fastverk/botnoc/blob/main/crates/fastverk-layout) (the nav plane).
   **Home = botnoc, not fvkit**, deliberately: an out-of-repo plugin (isolated
   crate_universe) can't link a shared crate without duplicate tonic/tokio symbols
   (the cross-module boundary), so a fvkit git-dep gains nothing there; in-repo
   plugins (one cargo workspace) consume it directly, and external repos replicate
   the small surface. `HttpState` shrank to just the backend (`/describe` +
   `/panels.binpb` moved into the facade, so the panel bytes no longer thread
   through each plugin's state).
2. **Generate `/describe` from `PluginManifest`** instead of the hand-inlined
   `describe_json()` literals (compliance/agents/forge) — serialize a real
   `PluginManifest` (proto3-JSON). *(Still hand-built JSON; the facade now serves
   it uniformly, but the shape is still per-plugin. A mirrored `PluginManifest`
   proto would finish this.)*
3. **First-class confirm-gate.** The "forge pattern" (`bool confirm` → preview) is
   ad-hoc today (`confirm literal:"false"` panel binding). meridian's neutral
   `Action` (view.proto) already carries actions; a future additive
   `Confirmation` field there would let renderers gate uniformly with the fastverk
   server just populating it.
4. **Retire `RPC_REST`** (`main.js`) — **LANDED** (see Part D#2): each plugin now
   declares its own web-plane routes (`PluginManifest.web_routes`, served in
   `/describe`), and the console assembles its routing table from them at
   discovery time instead of hardcoding a row per `(service, method)`.

Not part of the abstraction: catalog, spec, forge/crank, wave, brand/brando, and
the standalone `agent` Node webhook backend.

## Part C — unify chat presentation onto meridian descriptors (fastverk; future)

Add `ui__render_panel` to
[services/chat/src/present.rs](https://github.com/fastverk/botnoc/blob/main/services/chat/src/present.rs) — arg is a
`PanelDescriptor` (proto3-JSON). `turn.rs` intercepts it like the existing
`ui__render_table/_fields/_list`, emits a `chat.v1` block carrying the descriptor,
and the chat block renderer delegates to the generic meridian web renderer
(`renderPanelInto`, the same path the rail uses). The agent then drops a *real*
meridian gallery/lro/table into chat — one vocabulary. Any new generic block
primitive this needs goes to `meridian-web`, not botnoc.

## Part D — fastverk implementation roadmap (implements the generic contract)

1. **botnoc implements `LayoutService`.** `GetNavTree` computes the rail from the
   live `FASTVERK_BACKEND_*` plugin set + Cognito identity + catalog-entitlement
   evaluation of `LayoutContext.attributes`. This is where the policy lives; the
   contract stays neutral.
2. **Plugin-declared RPC→REST routing** (kills `main.js:RPC_REST`) — **LANDED.**
   Rather than the browser carrying a hand-maintained `(service,method)→[verb,path]`
   table, each plugin ships its own routes in `PluginManifest.web_routes` (a new
   repeated `WebRoute{service, method, http_method, path}` on the fvkit contract),
   surfaced verbatim in its `/describe`. The console assembles a runtime
   `rpcRoutes` map from the plugins it already discovers (`registerRoutes` in
   `fetchPluginPanels`), and `endpointFor` resolves against it — so a plugin OWNS
   and ships its web routing, and adding/changing an RPC never edits console JS. A
   panel whose RPC no plugin declared degrades to a per-panel error (unchanged
   from the old unmapped-RPC behavior). This is the pragmatic form of the
   originally-sketched gRPC-ServerReflection gateway: the plugin *declares* its
   surface instead of the host *reflecting* it, which fits the HTTP/JSON data
   plane the browser already speaks. A full browser→gRPC Connect/grpc-web
   `RpcInvoker` transport (the generic impl belongs in `meridian-web`) remains a
   later option if the REST facade is ever retired. Bespoke sections (workspaces,
   registry) build their own `/api/gw/<id>/…` URLs and never used the table.
   *Deploy note:* plugin backends must ship `web_routes` before the console that
   relies on them — merge/deploy backends first, console last.
3. **Migrate `main.js`** off `composeSections`/`groupTabs`/`NAMED_TAB_GROUPS`;
   render the `NavTree` from `GetNavTree`. `fleet.js`'s Fleet section becomes a
   server-returned `NavNode` group.
4. **Per-plugin `GetPanel`** — **LANDED** (first slice of the GetPanel/GetView/Watch*
   arc). The botnoc `LayoutService` mirror gained `GetPanel(GetPanelRequest) returns
   (PanelResponse)`, where `PanelResponse.panel_bundle` is a serialized single-panel
   `meridian.ui.v1.PanelBundle` — **opaque canonical bytes**, not a typed mirror. The
   shared `fastverk-layout` crate resolves it by extracting the requested panel from
   the plugin's compiled bundle via a **wire-compatible** trick (`repeated bytes
   panels = 2` decodes byte-identically to `repeated PanelDescriptor panels = 2`; a
   1-field `PanelHeader` reads the id, skipping the rest) — no ~49-message panel
   schema mirrored into Rust. Every plugin passes its bundle to the layout server
   (`StaticLayout::with_panels` / `serve(.., panels)`). botnoc-web exposes
   `GET /api/shell/panel/<plugin>/<panel_id>` (entitlement-gated, `PLUGIN_RPC_TIMEOUT`
   -bounded), returning the bytes; the browser (`fetchLayoutPanel`) decodes them with
   the same protobuf-es `decodeBundle` as `/panels.binpb` and prefers the per-caller
   panel for server-nav (`viaLayout`) entries, falling back to the bundle descriptor
   on any failure.
   **`GetView`** — **LANDED** (same opaque-bytes approach). `GetView(GetViewRequest)
   returns (ViewResponse)`; `fastverk-layout` synthesizes a `ViewDescriptor` from a nav
   GROUP — a `TabbedLayout` with one `Slot` per child leaf, each `Slot.panel` = the
   leaf's serialized `PanelDescriptor` lifted verbatim from the bundle (a `bytes` field
   at tag 6 is wire-identical to an embedded `PanelDescriptor`). botnoc-web
   (`GET /api/shell/view/<plugin>/<view_id>`) decodes the descriptor to a small JSON
   projection (`{ layout, slots:[{ panelId, tabLabel, title }] }`) — the browser has no
   ViewDescriptor decoder — and `main.js` `renderView` lays the slots out per `layout`,
   rendering each slot's panel through the GetPanel path. A nav leaf targets a view via
   `view_id`.
   **Authored views** — a plugin ships bespoke non-tabbed pages (not just synthesized
   tabs): `StaticLayout::with_views(vec![view(id, title, ViewLayout::{Stacked|TwoColumn|
   Tabbed}, vec![slot("panel_id","Label").main()/.sidebar()])])` + a `view_leaf(id, label)`
   in the nav. `GetView` serves an authored view (its slots' panels lifted from the
   bundle) in preference to synthesizing from a group; `encode_view` handles all three
   layouts (Slot.placement carries `tab_label` for tabbed / `column` for two-column).
   builds ships the first one — a stacked **Dashboard** (overview + cache + workers +
   queue on one page), distinct from its per-metric tab groups.
   **`Watch*`** — **LANDED**, completing the arc. `WatchNavTree(...) returns (stream
   NavTree)` and `WatchView(...) returns (stream ViewResponse)`. `fastverk-layout`
   implements both as **emit-current-then-hold** streams (a 1-slot mpsc: send the
   value, then park on `closed()` until the client drops) — a static plugin emits once
   and keeps the stream open; a future dynamic layout source pushes more on the same
   channel. botnoc-web bridges each to the browser as **Server-Sent Events**
   (`GET /api/shell/watch-nav/<plugin>`, `.../watch-view/<plugin>/<view_id>`), mapping
   each pushed `NavTree`/view-JSON to an SSE event (reusing the `noc_agent_proxy`
   `text/event-stream` pattern via `axum::response::Sse`). `main.js` gains
   `subscribeNav`/`subscribeView` (`EventSource`, self-closing on error); `renderView`
   subscribes to WatchView so an open page live-updates (first event echoes the initial
   GetView and is skipped; closed on navigation via `closeViewSub`). Honest limit: with
   only static plugin sources the streams emit once — the reactive value awaits a plugin
   with a real change source; the push channel end-to-end is complete and correct.
   **Remaining (deferred):** a companion `ThemeService.GetTheme` for per-tenant theming.

## Publish runbook (post-tag; not doable without pushing)

The registry entry and botnoc's dep-bump both need the **v0.6.0 GitHub tarball**
(its sha256 is the `source.json` integrity), which can't exist until the tag is
pushed — so these are deliberately left as post-publish steps:

1. In `meridian-ux/meridian-schemas`: commit the two new protos + BUILD/MODULE
   changes; tag **`v0.6.0`**; push.
2. In `tomato-bazel/bazel-registry`, branch `marsh/register-meridian-schemas-0.6.0`
   (matching the existing `marsh/register-meridian-schemas-0.5.0` convention): add
   `modules/meridian_schemas/0.6.0/{MODULE.bazel,source.json}` (source.json =
   `{integrity, strip_prefix:"meridian-schemas-0.6.0", url:".../v0.6.0.tar.gz"}`)
   and append `"0.6.0"` to `metadata.json`; merge to `main`.
3. In botnoc [MODULE.bazel](https://github.com/fastverk/botnoc/blob/main/MODULE.bazel): bump
   `bazel_dep(name = "meridian_schemas", version = "0.6.0")` — the one line that
   makes the new contracts available. (Left unbumped until 0.6.0 is published, so
   botnoc's build doesn't break against an unresolvable version.)

## Verification performed

In the `meridian-schemas` checkout:

- `bazel build //proto:uiview_proto //proto:proto_ts` → **success** (57 actions);
  `proto_ts` type-checks the generated TS, so the new files emit cleanly.
- Generated `layout_service_pb.ts` contains
  `export const LayoutService: GenService<{…}>` with all **5 RPCs** (`GetNavTree`
  unary, `WatchNavTree` `server_streaming`, `GetView`, `WatchView`, `GetPanel`);
  `nav_tree_pb.ts` emits `NavTree`/`NavNode`.
- **Neutrality guard:** grep for `fastverk|PluginManifest|botnoc|cognito` over both
  new protos and the generated TS → **zero hits**.

Still to do at implementation time: `buf lint` parity, a `Shell`/`NavTree`
textproto round-trip against the real fastverk section set (Integrations → Fleet →
plugins → Access Keys), and — post-publish — `bazel build //...` in botnoc with the
bumped dep.
