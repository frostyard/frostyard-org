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
            {
              label: "Services and tools",
              collapsed: true,
              items: [
                { label: "1Password CLI", slug: "docs/sysexts/1password-cli" },
                { label: "code-server", slug: "docs/sysexts/code-server" },
                { label: "Coder", slug: "docs/sysexts/coder" },
                { label: "Debian development", slug: "docs/sysexts/debdev" },
                { label: "Dev tools", slug: "docs/sysexts/dev" },
                { label: "Docker", slug: "docs/sysexts/docker" },
                { label: "Himmelblau", slug: "docs/sysexts/himmelblau" },
                { label: "Incus", slug: "docs/sysexts/incus" },
                { label: "K3s", slug: "docs/sysexts/k3s" },
                { label: "Lemonade", slug: "docs/sysexts/lemonade" },
                { label: "Nix", slug: "docs/sysexts/nix" },
                { label: "pilothouse", slug: "docs/sysexts/pilothouse" },
                { label: "Podman + Distrobox", slug: "docs/sysexts/podman" },
                { label: "Sunshine", slug: "docs/sysexts/sunshine" },
                { label: "Tailscale", slug: "docs/sysexts/tailscale" },
              ],
            },
            {
              label: "Desktop apps",
              collapsed: true,
              items: [
                { label: "1Password desktop", slug: "docs/sysexts/1password" },
                { label: "Bitwarden", slug: "docs/sysexts/bitwarden" },
                { label: "ChatGPT", slug: "docs/sysexts/chatgpt" },
                { label: "Claude Desktop", slug: "docs/sysexts/claude-desktop" },
                { label: "GitDesktop", slug: "docs/sysexts/gitdesktop" },
                { label: "GitHub Copilot", slug: "docs/sysexts/github-copilot" },
                { label: "LocalSend", slug: "docs/sysexts/localsend" },
                { label: "Microsoft Edge", slug: "docs/sysexts/edge" },
                { label: "Moonlight", slug: "docs/sysexts/moonlight" },
                { label: "Obsidian", slug: "docs/sysexts/obsidian" },
                { label: "paseo", slug: "docs/sysexts/paseo" },
                { label: "Visual Studio Code", slug: "docs/sysexts/vscode" },
                { label: "Voxtype", slug: "docs/sysexts/voxtype" },
              ],
            },
          ],
        },
        {
          label: "Apps",
          items: [
            { label: "Frostmail", slug: "docs/apps/frostmail" },
            { label: "Frostnotes", slug: "docs/apps/frostnotes" },
            { label: "lodge", slug: "docs/apps/lodge" },
            { label: "frostread", slug: "docs/apps/frostread" },
            { label: "Porter", slug: "docs/apps/porter" },
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
