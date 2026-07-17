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
export const collections = { docs, moduledocs };
