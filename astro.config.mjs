import { defineConfig } from "astro/config";

import cloudflare from "@astrojs/cloudflare";

export default defineConfig({
  site: "https://frostyard.org",
  adapter: cloudflare(),
  redirects: {
    "/cayo": { status: 301, destination: "/floe" }
  }
});