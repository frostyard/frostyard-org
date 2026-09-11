# frostyard.org

Technical landing page for Frostyard's snosi operating system images and the
Firn, Updex, and ChairLift tools that make their layered software model
practical.

## Development

```sh
npm install
npm run dev
```

Use `npm run build` to produce the static site in `dist/`.

The build refreshes the extension catalog from `https://repository.frostyard.org/ext/index`.
It uses the committed catalog snapshot if the published repository is unavailable.

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
