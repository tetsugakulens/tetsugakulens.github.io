import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

const site = process.env.SITE_URL || "https://tetsugakulens.github.io";

export default defineConfig({
  site,
  output: "static",
  integrations: [sitemap()],
  trailingSlash: "always",
});
