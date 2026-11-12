# Site structure

## How the docs are built

Astro Starlight supplies the `/docs/` shell, sidebar, table of contents, search,
code-copy controls, and light/dark theme. The docs content lives in
`src/content/docs/docs/`; the nested `docs/` directory is intentional, because
it scopes the injected Starlight routes under `/docs/` without changing the
existing site routes, Cloudflare adapter, `wrangler.jsonc`, or the `/cayo`
redirect in `astro.config.mjs`.

- `src/content.config.ts` defines the typed Starlight `docs` collection.
- `src/components/starlight/MobileMenuToggle.astro` wraps the Starlight
  component and mirrors its expanded state onto the visible button for
  assistive technology. The default component still handles click and Escape.
- `src/components/ExtensionSnapshot.astro` reads the checked
  `src/data/extensions.json` snapshot for the extension pages. It renders
  labels and versions as escaped text, shows the snapshot date and source, and
  never derives a link from a catalog value. The snapshot version is the
  highest version in `SHA256SUMS` when the snapshot was taken.
- `src/components/ExtensionCatalog.astro` reads the same snapshot for the
  catalog page. It renders labels, component names, and versions as escaped
  text, builds no link from a catalog value, and links a guide only from the
  docs collection.
- `src/layouts/Site.astro` links the landing site navigation to `/docs/`.
  Its footer, on every page outside `/docs/`, links the privacy policy at
  `/privacy`.
- `src/components/starlight/Footer.astro` wraps Starlight's footer and adds
  the same privacy link to every docs page. `scripts/check-site.mjs` fails
  when a page with a footer has no link to `/privacy`.

## Page inventory

| File | Route | Covers |
| --- | --- | --- |
| `src/pages/index.astro` | `/` | The image and extension overview. |
| `src/pages/base.astro` | `/base/` | The shared image foundation. |
| `src/pages/snow.astro` | `/snow/` | The general-purpose GNOME desktop. |
| `src/pages/snowfield.astro` | `/snowfield/` | The GNOME desktop for Microsoft Surface. |
| `src/pages/sundog.astro` | `/sundog/` | The bootc-only KDE Plasma desktop. |
| `src/pages/floe.astro` | `/floe/` | The headless server image. |
| `src/pages/install.astro` | `/install/` | The bootc-first Firn installation path. |
| `src/pages/why-atomic.astro` | `/why-atomic/` | The atomic model and supported workload boundaries. |
| `src/pages/tools.astro` | `/tools/` | The dedicated Firn, Updex, and ChairLift page. |
| `src/pages/stats.astro` | `/stats/` | The weekly problem report counts. |
| `src/pages/frostmail.astro` | `/frostmail/` | Frostmail's home page for its Google OAuth consent screen: what the app does, where it runs, how to get it, and the privacy link. `public/_redirects` also serves it at `/frostmail`. |
| `src/pages/privacy/index.astro` | `/privacy/` | The privacy policy of the site and of Frostmail's Google user data, with the Limited Use statement. `public/_redirects` also serves it at `/privacy`, the URL that Google's branding check fetches. |
| `src/pages/privacy/problem-reports.astro` | `/privacy/problem-reports/` | The privacy page for opt-in problem reports: what a report holds, how long it is kept, what a public bug report holds, and your rights. |
| `src/content/docs/docs/index.mdx` | `/docs/` | The docs landing page: the image choices, install and first boot, the software layers, and the source policy. |
| `src/content/docs/docs/get-software.md` | `/docs/get-software/` | How to choose Flatpak, Homebrew, a system extension, or Distrobox to add software to a Frostyard image. |
| `src/content/docs/docs/images/install-update.md` | `/docs/images/install-update/` | The shared procedure for every image: install with Firn, how updates arrive, update by hand, roll back, and move from an nbc or A/B install. |
| `src/content/docs/docs/images/snow.md` | `/docs/images/snow/` | The Snow GNOME image: its composition, installation, first boot, updates, rollback, and support limits. |
| `src/content/docs/docs/images/snowfield.md` | `/docs/images/snowfield/` | The Snowfield GNOME image for Microsoft Surface devices: its Surface kernel, installation, first boot, updates, rollback, and support limits. |
| `src/content/docs/docs/images/sundog.md` | `/docs/images/sundog/` | The Sundog KDE Plasma image: its KDE packages and services, installation, first boot, updates, rollback, and support limits. |
| `src/content/docs/docs/images/floe.md` | `/docs/images/floe/` | The Floe headless server image: its composition, installation, first boot, updates, rollback, containers, and support limits. |
| `src/content/docs/docs/images/base.md` | `/docs/images/base/` | The shared Base layer, what every image inherits from it, and why Base is not an installer choice. |
| `src/content/docs/docs/sysexts/index.mdx` | `/docs/sysexts/` | The system extension catalog: finding and enabling an extension, and every extension from the checked catalog snapshot. |
| `src/content/docs/docs/sysexts/manage.md` | `/docs/sysexts/manage/` | The full lifecycle of any extension: find, enable, check, update, and remove. |
| `src/content/docs/docs/sysexts/1password-cli.mdx` | `/docs/sysexts/1password-cli/` | The 1Password CLI extension. |
| `src/content/docs/docs/sysexts/code-server.mdx` | `/docs/sysexts/code-server/` | The code-server extension. |
| `src/content/docs/docs/sysexts/coder.mdx` | `/docs/sysexts/coder/` | The Coder extension. |
| `src/content/docs/docs/sysexts/debdev.mdx` | `/docs/sysexts/debdev/` | The Debian development extension. |
| `src/content/docs/docs/sysexts/dev.mdx` | `/docs/sysexts/dev/` | The Dev tools extension. |
| `src/content/docs/docs/sysexts/docker.mdx` | `/docs/sysexts/docker/` | The Docker CE extension. |
| `src/content/docs/docs/sysexts/maild.mdx` | `/docs/sysexts/maild/` | The Frostmail maild extension. |
| `src/content/docs/docs/sysexts/notesd.mdx` | `/docs/sysexts/notesd/` | The Frostnotes notesd extension. |
| `src/content/docs/docs/sysexts/readd.mdx` | `/docs/sysexts/readd/` | The frostread readd extension. |
| `src/content/docs/docs/sysexts/himmelblau.mdx` | `/docs/sysexts/himmelblau/` | The Himmelblau extension. |
| `src/content/docs/docs/sysexts/incus.mdx` | `/docs/sysexts/incus/` | The Incus extension. |
| `src/content/docs/docs/sysexts/k3s.mdx` | `/docs/sysexts/k3s/` | The k3s Kubernetes extension. |
| `src/content/docs/docs/sysexts/lemonade.mdx` | `/docs/sysexts/lemonade/` | The Lemonade extension. |
| `src/content/docs/docs/sysexts/lodge.mdx` | `/docs/sysexts/lodge/` | The lodge extension. |
| `src/content/docs/docs/sysexts/nix.mdx` | `/docs/sysexts/nix/` | The Nix package manager extension. |
| `src/content/docs/docs/sysexts/pilothouse.mdx` | `/docs/sysexts/pilothouse/` | The pilothouse extension. |
| `src/content/docs/docs/sysexts/podman.mdx` | `/docs/sysexts/podman/` | The Podman + Distrobox extension. |
| `src/content/docs/docs/sysexts/porterd.mdx` | `/docs/sysexts/porterd/` | The Porter porterd extension. |
| `src/content/docs/docs/sysexts/sunshine.mdx` | `/docs/sysexts/sunshine/` | The Sunshine extension. |
| `src/content/docs/docs/sysexts/tailscale.mdx` | `/docs/sysexts/tailscale/` | The Tailscale extension. |
| `src/content/docs/docs/sysexts/1password.mdx` | `/docs/sysexts/1password/` | The 1Password desktop extension. |
| `src/content/docs/docs/sysexts/bitwarden.mdx` | `/docs/sysexts/bitwarden/` | The Bitwarden extension. |
| `src/content/docs/docs/sysexts/chatgpt.mdx` | `/docs/sysexts/chatgpt/` | The ChatGPT extension. |
| `src/content/docs/docs/sysexts/claude-desktop.mdx` | `/docs/sysexts/claude-desktop/` | The Claude Desktop extension. |
| `src/content/docs/docs/sysexts/gitdesktop.mdx` | `/docs/sysexts/gitdesktop/` | The GitDesktop extension. |
| `src/content/docs/docs/sysexts/github-copilot.mdx` | `/docs/sysexts/github-copilot/` | The GitHub Copilot extension. |
| `src/content/docs/docs/sysexts/localsend.mdx` | `/docs/sysexts/localsend/` | The LocalSend extension. |
| `src/content/docs/docs/sysexts/edge.mdx` | `/docs/sysexts/edge/` | The Microsoft Edge extension. |
| `src/content/docs/docs/sysexts/moonlight.mdx` | `/docs/sysexts/moonlight/` | The Moonlight extension. |
| `src/content/docs/docs/sysexts/obsidian.mdx` | `/docs/sysexts/obsidian/` | The Obsidian extension. |
| `src/content/docs/docs/sysexts/paseo.mdx` | `/docs/sysexts/paseo/` | The paseo extension. |
| `src/content/docs/docs/sysexts/vscode.mdx` | `/docs/sysexts/vscode/` | The Visual Studio Code extension. |
| `src/content/docs/docs/sysexts/voxtype.mdx` | `/docs/sysexts/voxtype/` | The Voxtype extension. |
| `src/content/docs/docs/tools/firn.md` | `/docs/tools/firn/` | Firn: keeping the wizard's recipe, reinstalling from it, and the 2026-12-30 end of version 1 recipes. |
| `src/content/docs/docs/tools/updex.md` | `/docs/tools/updex/` | Updex: features, components, updates, the daemon, catalogs, and removal. |
| `src/content/docs/docs/tools/apt-repository.md` | `/docs/tools/apt-repository/` | The Frostyard APT repository, which feeds Frostyard image builds, and its unsupported use on plain Debian 13 hosts: add it, install, update, roll back, and remove. |
| `src/content/docs/docs/tools/nsl.md` | `/docs/tools/nsl/` | nsl: host checks, install, machines, and removal. |
| `src/content/docs/docs/tools/igloo.md` | `/docs/tools/igloo/` | The Igloo terminal: install, use, and update. |
| `src/content/docs/docs/tools/chairlift.md` | `/docs/tools/chairlift/` | ChairLift: the pages, everyday tasks, and install. |
| `src/content/docs/docs/tools/intuneme.md` | `/docs/tools/intuneme/` | intuneme: install, enrollment, daily use, upgrade, and removal. |
| `src/content/docs/docs/apps/frostmail.md` | `/docs/apps/frostmail/` | Frostmail: where it runs, what works now, its limits, and deep links to its docs. |
| `src/content/docs/docs/apps/frostnotes.md` | `/docs/apps/frostnotes/` | Frostnotes: where it runs, what is built, its limits, and deep links to its docs. |
| `src/content/docs/docs/apps/lodge.md` | `/docs/apps/lodge/` | lodge: building it from source, installing it on a host, adding apps, agent tokens, and inference providers. |
| `src/content/docs/docs/apps/frostread.md` | `/docs/apps/frostread/` | frostread: installing it on lodge's host, feeds, read later, saving a note, `readctl`, and agents. |
| `src/content/docs/docs/apps/porter.md` | `/docs/apps/porter/` | Porter: installing it on lodge's host, chat, routines, and what it can and cannot do. |

`scripts/test/site-map.test.mjs` fails when a page file is missing from this table, or when the table names a file that does not exist.
