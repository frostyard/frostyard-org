<!-- readme-kind: website -->
# frostyard.org

This repository is the source of [frostyard.org](https://frostyard.org), the
website of Frostyard. Frostyard builds bootc operating system images on Debian
with [snosi](https://github.com/frostyard/snosi), system extensions that add
software to them, and the tools and apps that run on them. The site is an
[Astro](https://astro.build) site with [Starlight](https://starlight.astro.build)
docs, served by Cloudflare Workers.

**Status:** in production.

**Documentation:** [frostyard.org](https://frostyard.org)

## What the site covers

- [Images](https://frostyard.org/): [Snow](https://frostyard.org/snow/),
  [Snowfield](https://frostyard.org/snowfield/),
  [Sundog](https://frostyard.org/sundog/), [Floe](https://frostyard.org/floe/)
  and the shared [Base](https://frostyard.org/base/).
- [Install](https://frostyard.org/install/) and
  [why atomic](https://frostyard.org/why-atomic/).
- [Tools](https://frostyard.org/tools/): Firn, Updex and ChairLift.
- [Documentation](https://frostyard.org/docs/): guides for each image, the
  [system extension catalog](https://frostyard.org/docs/sysexts/), the apps
  and the tools.
- [Problem report statistics](https://frostyard.org/stats/) and the
  [problem report privacy page](https://frostyard.org/privacy/problem-reports/).

## Deploy

Cloudflare Workers Builds builds `main` and deploys it to frostyard.org after
each merge. A pull request gets a preview URL in its `Workers Builds:
frostyard-org` check. [docs/development.md](docs/development.md#ci-and-deploy)
describes CI and the deploy.

## Develop

You need [mise](https://mise.jdx.dev) and `make`.

```sh
mise install      # the pinned Node release
npm ci            # the locked dependencies
npm run dev       # a local server with live reload
make ci           # the full gate: tests, checks and an offline build
```

[docs/development.md](docs/development.md) explains each command, the
generated data files and the checks.

## Where to go next

- [AGENTS.md](AGENTS.md): the rules for agents and contributors.
- [docs/README.md](docs/README.md): the index of the repository docs, with
  the development guide and the site map.
- [SECURITY.md](SECURITY.md): report a vulnerability privately.
- [LICENSE](LICENSE): MIT.
