// The docs information architecture. Server-renders the sidebar and seeds the
// search fallback (when the Pagefind index isn't present, e.g. in `astro dev`).
export interface NavItem { title: string; href: string; badge?: string; snip?: string; }
export interface NavGroup { group: string; badge?: string; items: NavItem[]; }

export const NAV: NavGroup[] = [
  { group: "Get started", items: [
    { title: "Overview", href: "/", snip: "What tomato-bazel is and how the pieces fit." },
    { title: "Using the registry", href: "/using-the-registry/", snip: "Point Bazel at registry.tbzl.dev." },
    { title: "Authoring a module", href: "/authoring-a-module/", snip: "Publish a versioned module with rels." },
  ]},
  { group: "Concepts", items: [
    { title: "Blast radius", href: "/concepts/blast-radius/", badge: "stable", snip: "rdeps — what a change can break." },
    { title: "Gating", href: "/concepts/gating/", snip: "Zero-row invariants proved from the module graph before a version is admitted." },
  ]},
  { group: "Conformance", items: [
    { title: "Overview", href: "/conformance/", snip: "How the registry is doing against every invariant, right now." },
    { title: "Invariants", href: "/conformance/gates/", snip: "The gates: what each proves, and what it currently finds." },
    { title: "Third-party atoms", href: "/conformance/atoms/", snip: "The frontier — one live version per atom is the compatibility mechanism." },
  ]},
  { group: "Reference", items: [
    { title: "Modules", href: "/reference/modules/", snip: "Every module in the registry, generated." },
    { title: "Dependency graph", href: "/reference/graph/", snip: "The registry as a tomato vine — modules and their bazel_deps." },
  ]},
];

export function flatNav() {
  const out: {title:string;href:string;group:string;snip:string}[] = [];
  for (const g of NAV) for (const it of g.items)
    out.push({ title: it.title, href: it.href, group: g.group, snip: it.snip || "" });
  return out;
}
