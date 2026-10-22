import { defineConfig } from "astro/config";

import cloudflare from "@astrojs/cloudflare";
import starlight from "@astrojs/starlight";

export default defineConfig({
  site: "https://frostyard.org",
  // The site is static and has no sessions, so the adapter must not add a SESSION KV binding.
  session: false,
  // Keep the Astro 5 behaviour: build-time images (no Images binding to provision) and
  // prerendering in Node. Starlight's Markdown parser has no workerd build.
  adapter: cloudflare({ imageService: "compile", prerenderEnvironment: "node" }),
  integrations: [
    starlight({
      title: "Frostyard docs",
      description: "Install, update, and extend Frostyard bootc images.",
      disable404Route: true,
      components: {
        MobileMenuToggle: "./src/components/starlight/MobileMenuToggle.astro",
      },
      tableOfContents: { minHeadingLevel: 2, maxHeadingLevel: 3 },
      sidebar: [
        { label: "Start here", items: [{ label: "Documentation", link: "/docs/" }] },
        { label: "Images", items: [{ label: "Snow", slug: "docs/images/snow" }] },
        {
          label: "System extensions",
          items: [
            { label: "Docker", slug: "docs/sysexts/docker" },
            { label: "Incus", slug: "docs/sysexts/incus" },
            { label: "Tailscale", slug: "docs/sysexts/tailscale" },
          ],
        },
      ],
    }),
  ],
  redirects: {
    "/cayo": { status: 301, destination: "/floe" }
  }
});
