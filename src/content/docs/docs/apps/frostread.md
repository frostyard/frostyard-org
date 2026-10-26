---
title: frostread
description: "frostread is a tailnet-only feed reader and read-later list that runs behind lodge as Read. Pre-release: there is no package yet."
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

frostread is pre-release. The repository has no release, and there is no
package. The daemon, its API, `readctl`, MCP, save-as-note, the web app,
save from the phone, and the blob sweep are built.

## Install

frostread runs as lodge's `read` app, beside lodge and Notes, on lodge's
host. The web bundle builds in an [nsl](/docs/tools/nsl/) machine. The
[install steps](https://github.com/frostyard/frostread/blob/main/README.md#install-on-lodges-host)
in the README are the canonical ones.

## Documentation

- [README](https://github.com/frostyard/frostread/blob/main/README.md): what frostread is and how it runs behind lodge.
- [Install on lodge's host](https://github.com/frostyard/frostread/blob/main/README.md#install-on-lodges-host): the 6 install steps.
- [Update](https://github.com/frostyard/frostread/blob/main/README.md#update) and [roll back](https://github.com/frostyard/frostread/blob/main/README.md#roll-back): a rollback archive first, then the new commit, and how to go back.
- [API spec](https://github.com/frostyard/frostread/blob/main/docs/specs/api.md): the API, `readctl`, the configuration, and the state layout.
- [Design overview](https://github.com/frostyard/frostread/blob/main/docs/design/overview.md): the parts and how they fit.
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

Reviewed 2026-10-26.

- frostread commit [`511cc819e78875fda4e6d507594d912600dcdeea`](https://github.com/frostyard/frostread/tree/511cc819e78875fda4e6d507594d912600dcdeea) on `main`. There is no release.
- [`README.md`](https://github.com/frostyard/frostread/blob/511cc819e78875fda4e6d507594d912600dcdeea/README.md)
- [`docs/specs/api.md`](https://github.com/frostyard/frostread/blob/511cc819e78875fda4e6d507594d912600dcdeea/docs/specs/api.md), [`docs/design/overview.md`](https://github.com/frostyard/frostread/blob/511cc819e78875fda4e6d507594d912600dcdeea/docs/design/overview.md), [`docs/plans/0001-roadmap.md`](https://github.com/frostyard/frostread/blob/511cc819e78875fda4e6d507594d912600dcdeea/docs/plans/0001-roadmap.md)
- [`docs/adr/0003-the-fetcher-reaches-only-public-addresses.md`](https://github.com/frostyard/frostread/blob/511cc819e78875fda4e6d507594d912600dcdeea/docs/adr/0003-the-fetcher-reaches-only-public-addresses.md), [`docs/adr/0006-save-from-another-page-through-a-confirm-page-a-bookmarklet-opens.md`](https://github.com/frostyard/frostread/blob/511cc819e78875fda4e6d507594d912600dcdeea/docs/adr/0006-save-from-another-page-through-a-confirm-page-a-bookmarklet-opens.md)
- [`internal/store/store.go`](https://github.com/frostyard/frostread/blob/511cc819e78875fda4e6d507594d912600dcdeea/internal/store/store.go)
