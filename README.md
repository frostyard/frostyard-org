# frostyard.org

Technical landing page for Frostyard's snosi operating system images, plus the
Updex and ChairLift tools that make their layered software model practical.

## Development

```sh
npm install
npm run dev
```

Use `npm run build` to produce the static site in `dist/`.

The build refreshes the extension catalog from `https://repository.frostyard.org/ext/index`.
It uses the committed catalog snapshot if the published repository is unavailable.

`src/pages/index.astro` is the image and extension overview. `src/pages/base.astro`
describes the shared image foundation, and the `snow`, `snowfield`, and `cayo`
pages cover each image's distinct role. `src/pages/why-atomic.astro` explains
the atomic model and supported workload boundaries. `src/pages/tools.astro` is
the dedicated Updex and ChairLift page.
