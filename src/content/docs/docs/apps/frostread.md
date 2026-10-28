---
title: frostread
description: "frostread is a tailnet-only feed reader and read-later list that runs behind lodge as Read. Pre-release: the only package is a `.deb` for lodge's host."
---

frostread is a feed reader and a read-later list that only your tailnet can
reach. It runs behind [lodge](/docs/apps/lodge/), where lodge shows it as the
app Read. You need it if you run lodge and want to follow feeds and keep
articles to read later.

- Sources: RSS, Atom, and JSON Feed, imported and exported as OPML. Each
  source polls about every 20 minutes.
- Read later: save a link from the app, with `readctl save`, or from an agent
  with a `read;write` token.
- From your phone: a bookmarklet opens a save page. It saves only when you
  tap Save.
- Articles are extracted and sanitized, and their images are inlined, so the
  browser loads nothing remote.
- Unread, starred, and archived views, and full-text search.
- Save an article as a note under `Reading/` in
  [Frostnotes](/docs/apps/frostnotes/).
- Agents, such as [Porter](/docs/apps/porter/), reach it at `/mcp/read`.

## Status

frostread is pre-release. The latest release is v0.1.0. Each release attaches
one package, `frostyard-readd_X.Y.Z_amd64.deb`, for lodge's host. Snosi picks
the `.deb` up later. The daemon, its API, `readctl`, MCP, save-as-note, the web app,
save from the phone, and the blob sweep are built.

A desktop app is planned: the Flatpak `org.frostyard.Frostread`, with its own
`readd`, local by default. How it works with lodge is not decided yet.
Nothing is built. Today frostread runs only behind lodge.

## Install

frostread runs as lodge's `read` app, beside lodge and Notes, on lodge's
host. The web bundle builds in an [nsl](/docs/tools/nsl/) machine, and
`readd` and `readctl` install to `/usr/bin`. To check a release `.deb`, run
`gh attestation verify frostyard-readd_X.Y.Z_amd64.deb --repo frostyard/frostread`.
The [install steps](https://github.com/frostyard/frostread/blob/main/README.md#install-on-lodges-host)
in the README are the canonical ones.

## Documentation

- [README](https://github.com/frostyard/frostread/blob/main/README.md): what frostread is and how it runs behind lodge.
- [Install on lodge's host](https://github.com/frostyard/frostread/blob/main/README.md#install-on-lodges-host): the 6 install steps.
- [Update](https://github.com/frostyard/frostread/blob/main/README.md#update) and [Roll back](https://github.com/frostyard/frostread/blob/main/README.md#roll-back): stop frostread, take a rollback archive, copy the new build, and check the version.
- [API spec](https://github.com/frostyard/frostread/blob/main/docs/specs/api.md): the API, `readctl`, the configuration, and the state layout.
- [Design overview](https://github.com/frostyard/frostread/blob/main/docs/design/overview.md): the parts and how they fit.
- [ADR-0008](https://github.com/frostyard/frostread/blob/main/docs/adr/0008-the-desktop-flatpak-carries-its-own-readd-and-lodge-is-a-connection.md): the proposed design of the desktop Flatpak. Its lodge mode is still an open question.
- [ADR-0003](https://github.com/frostyard/frostread/blob/main/docs/adr/0003-the-fetcher-reaches-only-public-addresses.md): the fetcher reaches only public addresses.
- [ADR-0006](https://github.com/frostyard/frostread/blob/main/docs/adr/0006-save-from-another-page-through-a-confirm-page-a-bookmarklet-opens.md): save from another page with a bookmarklet.
- [Roadmap](https://github.com/frostyard/frostread/blob/main/docs/plans/0001-roadmap.md): what is built and what comes next.

## Limits

- Read fetches only public addresses. A feed on your home network cannot be
  read.
- frostread refuses a database with a newer schema than the program knows.
  Back up `/var/lib/frostread` before an update.

## See also

- [lodge](/docs/apps/lodge/)
- [Frostnotes](/docs/apps/frostnotes/)
- [Porter](/docs/apps/porter/)
- [Frostmail](/docs/apps/frostmail/)
- [nsl](/docs/tools/nsl/)

## Sources

Reviewed 2026-10-28.

- frostread v0.1.0 commit [`3dc30c605f750d671e04465ef8b52810bc52ff2c`](https://github.com/frostyard/frostread/tree/3dc30c605f750d671e04465ef8b52810bc52ff2c) 
- [`README.md`](https://github.com/frostyard/frostread/blob/3dc30c605f750d671e04465ef8b52810bc52ff2c/README.md)
- [`docs/specs/api.md`](https://github.com/frostyard/frostread/blob/3dc30c605f750d671e04465ef8b52810bc52ff2c/docs/specs/api.md), [`docs/design/overview.md`](https://github.com/frostyard/frostread/blob/3dc30c605f750d671e04465ef8b52810bc52ff2c/docs/design/overview.md), [`docs/plans/0001-roadmap.md`](https://github.com/frostyard/frostread/blob/3dc30c605f750d671e04465ef8b52810bc52ff2c/docs/plans/0001-roadmap.md)
- [`docs/adr/0003-the-fetcher-reaches-only-public-addresses.md`](https://github.com/frostyard/frostread/blob/3dc30c605f750d671e04465ef8b52810bc52ff2c/docs/adr/0003-the-fetcher-reaches-only-public-addresses.md), [`docs/adr/0006-save-from-another-page-through-a-confirm-page-a-bookmarklet-opens.md`](https://github.com/frostyard/frostread/blob/3dc30c605f750d671e04465ef8b52810bc52ff2c/docs/adr/0006-save-from-another-page-through-a-confirm-page-a-bookmarklet-opens.md)
- frostread `main` at [`ef216dd72df14dfe3f3059bcdd571320c9786544`](https://github.com/frostyard/frostread/tree/ef216dd72df14dfe3f3059bcdd571320c9786544): [`docs/adr/0008-the-desktop-flatpak-carries-its-own-readd-and-lodge-is-a-connection.md`](https://github.com/frostyard/frostread/blob/ef216dd72df14dfe3f3059bcdd571320c9786544/docs/adr/0008-the-desktop-flatpak-carries-its-own-readd-and-lodge-is-a-connection.md) (Status: Proposed) and [`docs/plans/0002-the-standalone-desktop-flatpak.md`](https://github.com/frostyard/frostread/blob/ef216dd72df14dfe3f3059bcdd571320c9786544/docs/plans/0002-the-standalone-desktop-flatpak.md) ("Nothing is built"; open question 1, the lodge mode, is Brian's).
- Suite rule: core [`docs/adr/0062-make-desktop-suite-apps-standalone-flatpaks-with-opt-in-lodge.md`](https://github.com/frostyard/core/blob/4d340b939fccab2ecb7f0be5dbf9e7ab7c03963c/docs/adr/0062-make-desktop-suite-apps-standalone-flatpaks-with-opt-in-lodge.md) (Accepted 2026-10-27) at `4d340b939fccab2ecb7f0be5dbf9e7ab7c03963c`: frostread's lodge mode is "not decided: sync or connection".
- [`internal/store/store.go`](https://github.com/frostyard/frostread/blob/3dc30c605f750d671e04465ef8b52810bc52ff2c/internal/store/store.go)
