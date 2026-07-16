import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";

// docs.tbzl.dev — a static Astro docs site (replaces the mdBook), deployed to
// GitHub Pages. Full-text search is provided by Pagefind, run over dist/ after
// the build (see package.json `build` + .github/workflows/docs.yml).
export default defineConfig({
  site: "https://docs.tbzl.dev",
  trailingSlash: "ignore",
  build: { format: "directory" },
  integrations: [mdx(), sitemap()],
  markdown: {
    shikiConfig: {
      themes: { light: "github-light", dark: "github-dark" },
      defaultColor: false,
      wrap: false,
    },
  },
});
