# frostyard.org

Technical landing page for Frostyard's snosi operating system images and the
Firn, Updex, and ChairLift tools that make their layered software model
practical. The site also carries the `/docs/` operator documentation pilot.

## Development

Install the locked dependencies with `npm ci`:

```sh
npm ci
npm run dev
```

Use `npm run build` to produce the static site in `dist/client/`. Use
`npm run build:check` to build from the committed extension snapshot without a
network refresh. `npm run check` runs Astro diagnostics, and
`npm run check:site` checks the built routes, docs navigation, source links, and
existing route invariants. `npm run ci` runs all three in order.

The build refreshes the extension catalog from `https://repository.frostyard.org/ext/index`.
It uses the committed catalog snapshot if the published repository is unavailable.
`build:check` deliberately skips the refresh so CI stays network-independent and
does not rewrite `src/data/extensions.json`. Do not hand-edit that generated file.

## Documentation pilot

Astro Starlight supplies the `/docs/` shell, sidebar, table of contents, search,
code-copy controls, and light/dark theme. The docs content lives in
`src/content/docs/docs/`; the nested `docs/` directory is intentional, because it
scopes the injected Starlight routes under `/docs/` without changing the
existing site routes, Cloudflare adapter, `wrangler.jsonc`, or `/cayo` redirect.

- `src/content/docs/docs/index.mdx` is the docs landing page. It explains the
  image choices, install and first boot, software layers, and the source policy.
- `src/content/docs/docs/images/snow.md` covers the Snow GNOME image, its
  composition, installation, first boot, updates, rollback, and support limits.
- `src/content/docs/docs/images/snowfield.md` covers the Snowfield GNOME image
  for Microsoft Surface devices, its Surface kernel, installation, first boot,
  updates, rollback, and support limits.
- `src/content/docs/docs/images/sundog.md` covers the Sundog KDE Plasma image,
  its KDE packages and services, installation, first boot, updates, rollback,
  and support limits.
- `src/content/docs/docs/images/floe.md` covers the Floe headless server image,
  its composition, installation, first boot, updates, rollback, containers, and
  support limits.
- `src/content/docs/docs/images/base.md` covers the shared Base layer, what
  every image inherits from it, and why Base is not an installer choice.
- `src/content/docs/docs/sysexts/docker.mdx` covers the Docker CE extension.
- `src/content/docs/docs/sysexts/incus.mdx` covers the Incus extension.
- `src/content/docs/docs/sysexts/tailscale.mdx` covers the Tailscale extension.
- `src/content/docs/docs/sysexts/index.mdx` is the system extension catalog.
  It covers finding, enabling, updating, and removing an extension, and lists
  every extension from the checked catalog snapshot.
- `src/content/docs/docs/tools/updex.md` covers Updex: features, components,
  updates, the daemon, catalogs, and removal.
- `src/content.config.ts` defines the typed Starlight `docs` collection.
- `src/components/starlight/MobileMenuToggle.astro` wraps the Starlight
  component and mirrors its expanded state onto the visible button for
  assistive technology. The default component still handles click and Escape.
- `src/components/ExtensionSnapshot.astro` reads the checked
  `src/data/extensions.json` snapshot for the three extension pages. It renders
  labels and versions as escaped text, shows the snapshot date and source, and
  never derives a link from a catalog value. The snapshot version is a regex
  match from `SHA256SUMS`, not a latest-version claim.
- `src/components/ExtensionCatalog.astro` reads the same snapshot for the
  catalog page. It renders labels, component names, and versions as escaped
  text, builds no link from a catalog value, and links a guide only from the
  docs collection.
- `src/layouts/Site.astro` links the landing site navigation to `/docs/`.

Every docs page ends with commit-pinned Sources. Add or change a product fact
only with a source file that supports it; do not invent commands or flags.
`npm run check:site` fails if a pilot page, required section, source link, docs
navigation link, or Pagefind page disappears.

## Page inventory

`src/pages/index.astro` is the image and extension overview.
`src/pages/base.astro` describes the shared image foundation.
`src/pages/snow.astro` covers the general-purpose GNOME desktop.
`src/pages/snowfield.astro` covers the GNOME desktop for Microsoft Surface.
`src/pages/sundog.astro` covers the bootc-only KDE Plasma desktop.
`src/pages/floe.astro` covers the headless server image.
`src/pages/install.astro` provides the bootc-first Firn installation path and
lifecycle guidance. `src/pages/why-atomic.astro` explains the atomic model and
supported workload boundaries. `src/pages/tools.astro` is the dedicated Firn,
Updex, and ChairLift page.

The docs pilot adds these content routes:

`src/content/docs/docs/index.mdx` is `/docs/`.
`src/content/docs/docs/images/snow.md` is `/docs/images/snow/`.
`src/content/docs/docs/images/snowfield.md` is `/docs/images/snowfield/`.
`src/content/docs/docs/images/sundog.md` is `/docs/images/sundog/`.
`src/content/docs/docs/images/floe.md` is `/docs/images/floe/`.
`src/content/docs/docs/images/base.md` is `/docs/images/base/`.
`src/content/docs/docs/sysexts/index.mdx` is `/docs/sysexts/`.
`src/content/docs/docs/sysexts/docker.mdx` is `/docs/sysexts/docker/`.
`src/content/docs/docs/sysexts/incus.mdx` is `/docs/sysexts/incus/`.
`src/content/docs/docs/sysexts/tailscale.mdx` is `/docs/sysexts/tailscale/`.
`src/content/docs/docs/tools/updex.md` is `/docs/tools/updex/`.
