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
        { label: "Images", items: [{ label: "Install, update, and roll back", slug: "docs/images/install-update" }, { label: "Snow", slug: "docs/images/snow" }, { label: "Snowfield", slug: "docs/images/snowfield" }, { label: "Sundog", slug: "docs/images/sundog" }, { label: "Floe", slug: "docs/images/floe" }, { label: "Base", slug: "docs/images/base" }] },
        {
          label: "System extensions",
          items: [
            { label: "Catalog", link: "/docs/sysexts/" },
            { label: "Manage extensions", slug: "docs/sysexts/manage" },
            { label: "Dev tools", slug: "docs/sysexts/dev" },
            { label: "Docker", slug: "docs/sysexts/docker" },
            { label: "Incus", slug: "docs/sysexts/incus" },
            { label: "K3s", slug: "docs/sysexts/k3s" },
            { label: "Nix", slug: "docs/sysexts/nix" },
            { label: "Tailscale", slug: "docs/sysexts/tailscale" },
            { label: "Visual Studio Code", slug: "docs/sysexts/vscode" },
          ],
        },
        {
          label: "Apps",
          items: [
            { label: "Frostmail", slug: "docs/apps/frostmail" },
            { label: "Frostnotes", slug: "docs/apps/frostnotes" },
          ],
        },
        {
          label: "Tools",
          items: [
            { label: "Updex", slug: "docs/tools/updex" },
            { label: "nsl", slug: "docs/tools/nsl" },
            { label: "Igloo", slug: "docs/tools/igloo" },
            { label: "ChairLift", slug: "docs/tools/chairlift" },
            { label: "intuneme", slug: "docs/tools/intuneme" },
          ],
        },
      ],
    }),
  ],
  redirects: {
    "/cayo": { status: 301, destination: "/floe" }
  }
});
