---
title: "Overview"
module: "brand"
---

The fastverk visual identity, generated from one parametric source.

The mark plays off **F**, **V**, the down-triangle **∀** (universal quantifier)
and the horizontal arms **∃/E** — fitting, since Lean (and its quantifiers) does
a lot of the work. It's a deliberate, methodical construction on the unit circle
and the golden ratio (φ = 0.618), not a hand-traced drawing.

## The construction (one `Spec`)

`gen/gen_mark.py` builds the mark by exact boolean CSG (shapely):

1. Equilateral triangle on the unit circle, apex down → `T_OUT`.
2. Copy scaled to circumradius φ → `T_IN`. `RING = T_OUT − T_IN`.
3. Band thickness `T = ½(1−φ)` is the one gap/stroke unit.
4. `gap_tr` — the top-right cut: the right-leg segment whose height equals its
   own base (the leg's horizontal width `2T/√3`) → a 60° parallelogram; its "/"
   sides are the triangle's inner & outer "/". The flush line `L` derives from
   it (crossbar-top == cut-bottom, cut-top == top-bar-bottom).
5. `crossbar` — the F arm / ∀ bar / ∃ stroke, with a "/" beveled right end.
6. `cut` — a ⊥ arrow cut through a chosen "\" midpoint (`mid_lower` | `mid_full`).
7. `arrow` — the accent region (`lower_inner` | `full_inner`), unioned with the cut.
8. `tertiary` — `cut` (top-right gap) or `interior` (all inner negative space).

### The family

Both members share the construction; the accent/field colors invert:

| variant | accent | tertiary | reads as |
|---------|--------|----------|----------|
| `full`  | full inner triangle | top-right cut | F+V on an accent field (heraldic; large sizes) |
| `lower` | contained arrow under the F arm | whole interior | accent arrow on a muted field (mark-like; small sizes) |

## Build

Everything is hermetic — the generator runs in-build (shapely/svgwrite wheels):

```sh
bazel build //gen:svgs        # canonical layered SVGs, both variants
bazel build //icons:all       # per-platform rasters + .icns/.ico/favicon
bazel build //brandbook:brandbook   # the brand guidelines PDF
```

Each variant emits Icon-Composer-ready layers: `.bg.svg`, `.tint.svg`,
`.arrow.svg`, `.mark.svg`, and a composite `.svg`.

## Palette

The geometry is locked; colors are `Spec` parameters
(`bg/fg/accent/tertiary`). `gen/gen_palettes.py` explores candidates. The
canonical tokens (the "midnight" palette) are:

| token | hex | role |
|---|---|---|
| ink | `#15161A` | ground |
| ink-2 | `#1c1e24` | raised surface |
| cream | `#ECE7DA` | foreground |
| amber | `#F2C46A` | accent |
| amber-deep | `#C9852B` | accent (gradient end / pressed) |
| muted | `#9A9488` | meta text |

## Skin (`skins/`)

The brand identity is also published as a **meridian skin** — a
`meridian.theme.v1.Theme` that drives every meridian renderer (web console,
SwiftUI app, JavaFX desktop, ratatui TUI) from one source, so the brand reads
identically on every surface.

`skins/fastverk.textpb` authors the Theme once (the tokens above), validated
against meridian's `theme.proto` at build time. `//skins` emits both wire forms:

```sh
bazel build //skins:fastverk_binpb   # fastverk.binpb — native decoders (TUI/Swift/JavaFX)
bazel build //skins:fastverk_json    # fastverk.json  — web `applyTheme(skin, mode)`
bazel build //skins:fastverk         # both, as a stageable filegroup
```

`fastverk.binpb` is produced by `protoc --encode` (which also validates the
textproto against the schema); `fastverk.json` is the proto3-JSON twin
(snake_case field names matching meridian's `theme/web/theme.ts`). Brand depends
on meridian only for the schema — it pulls no renderer code, and meridian itself
stays brand-neutral.
