import { defineCollection, z } from "astro:content";
const docs = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    badge: z.string().optional(),
    editPath: z.string().optional(),
  }),
});
const moduledocs = defineCollection({
  type: "content",
  schema: z.object({ title: z.string().optional(), module: z.string().optional() }),
});
// One entry per gate: the rationale, extracted from the `.rq` file's own header
// comment by gate-report and written here by tools/gen_conformance.mjs. It is a
// content collection rather than a string in conformance.json so Astro's
// markdown pipeline renders it — the D2/D3 rationales contain code blocks.
// GENERATED; do not hand-edit. Fix the gate's `.rq` header instead, which is the
// whole point: the query is the enforcement mechanism, so its comment is the
// documentation and the two cannot drift.
const gatedocs = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    code: z.string(),
    family: z.string(),
    sourceUrl: z.string().optional(),
  }),
});
export const collections = { docs, moduledocs, gatedocs };
