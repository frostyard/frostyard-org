---
title: frostread
description: "frostread is a feed reader and read-later list: a desktop app from the Frostyard Flatpak remote, and Read behind lodge on your tailnet. Pre-release."
follows:
  repo: frostyard/frostread
  tag: v0.6.0
---

frostread is a feed reader and a read-later list. It comes in 2 forms. The
desktop app, Frostread, works on its own on your computer. On lodge's host,
it runs behind [lodge](/docs/apps/lodge/), only your tailnet can reach it,
and lodge shows it as the app Read. You need it if you want to follow feeds
and keep articles to read later.

- Sources: RSS, Atom, and JSON Feed, imported and exported as OPML. Sources can be in folders, and OPML import and export keep the folders. Each
  source polls about every 20 minutes.
- Read later: save a link from the app, with `readctl save`, or from an agent
  with a `read;write` token.
- From your phone: a bookmarklet opens a save page. It saves only when you
  tap Save.
- Articles are extracted and sanitized, and their images are inlined, so the
  browser loads nothing remote.
- Unread, starred, and archived views, and full-text search.
- lodge shows the Unread view's count as Read's badge in the rail.
- Save an article as a note under `Reading/` in
  [Frostnotes](/docs/apps/frostnotes/).
- Agents, such as [Porter](/docs/apps/porter/), reach it at `/mcp/read`.

## Status

frostread is pre-release. The latest release is v0.6.0, from 2026-11-13.

Release v0.6.0 adds the desktop app, the Flatpak `org.frostyard.Frostread`.
It is in the [Frostyard Flatpak remote](/docs/get-software/#flatpak). The app
carries its own `readd` and is local by default. lodge is a connection you
choose, and the app can move your data from lodge. In local mode, an article
exports as a Markdown file.

Each release also attaches one package, `frostyard-readd_X.Y.Z_amd64.deb`,
for lodge's host. On a Frostyard image, the
[readd system extension](/docs/sysexts/readd/) installs it. The system
extension can trail the latest release. The [catalog](/docs/sysexts/) lists
the version it ships.

readd and the desktop app write their panics, and readd 5 coded internal errors,
to the local systemd journal. frostread sends nothing over the network for
them.

## Install

The desktop app is a Flatpak. Add the Frostyard remote and the Flathub remote
for your user, as [Get software](/docs/get-software/#flatpak) shows, then
install it:

`flatpak install --user frostyard org.frostyard.Frostread`

The [Frostyard Flatpak remote](https://github.com/frostyard/flatpak-index/blob/main/README.md#install)
has the canonical steps. Floe has no Flatpak.

On lodge's host, frostread runs as lodge's `read` app, beside lodge and
Notes. The web bundle builds in an [nsl](/docs/tools/nsl/) machine, and
`readd` and `readctl` install to `/usr/bin`. To check a release `.deb`, run
`gh attestation verify frostyard-readd_X.Y.Z_amd64.deb --repo frostyard/frostread`.
The [install steps](https://github.com/frostyard/frostread/blob/main/packaging/README.md#install-on-lodges-host)
in the packaging README are the canonical ones.

## Update and roll back

Update the desktop app with `flatpak update`.

On a Frostyard image, Updex updates and rolls back the readd system extension.
[Update, roll back, and remove](/docs/sysexts/readd/#update-roll-back-and-remove)
has the steps, with the backup to take first. The release `.deb` is built for
that extension, and it is not in the Frostyard APT repository.

On lodge's own host, you install the release `.deb` by hand with `dpkg -i`. Follow
[Update](https://github.com/frostyard/frostread/blob/main/packaging/README.md#update) and
[Roll back](https://github.com/frostyard/frostread/blob/main/packaging/README.md#roll-back)
in the packaging README. The Update steps check the package and take a rollback archive before the new version goes in.

## Documentation

- [README](https://github.com/frostyard/frostread/blob/main/README.md): what frostread is and how it runs behind lodge.
- [Packaging README](https://github.com/frostyard/frostread/blob/main/packaging/README.md): the `.deb`, the Flatpak, and the install, update, and roll-back steps on lodge's host.
- [API spec](https://github.com/frostyard/frostread/blob/main/docs/specs/api.md): the API, `readctl`, the configuration, and the state layout.
- [Design overview](https://github.com/frostyard/frostread/blob/main/docs/design/overview.md): the parts and how they fit.
- [ADR-0008](https://github.com/frostyard/frostread/blob/main/docs/adr/0008-the-desktop-flatpak-carries-its-own-readd-and-lodge-is-a-connection.md): the design of the desktop Flatpak, with its own `readd` and lodge as a connection you choose.
- [The standalone desktop Flatpak](https://github.com/frostyard/frostread/blob/main/docs/plans/0002-the-standalone-desktop-flatpak.md): the plan and what is built.
- [ADR-0003](https://github.com/frostyard/frostread/blob/main/docs/adr/0003-the-fetcher-reaches-only-public-addresses.md): the fetcher reaches only public addresses.
- [ADR-0006](https://github.com/frostyard/frostread/blob/main/docs/adr/0006-save-from-another-page-through-a-confirm-page-a-bookmarklet-opens.md): save from another page with a bookmarklet.
- [Roadmap](https://github.com/frostyard/frostread/blob/main/docs/plans/0001-roadmap.md): what is built and what comes next.

## Limits

- Read fetches only public addresses. A feed on your home network cannot be
  read.
- frostread refuses a database with a newer schema than the program knows.
  Back up `/var/lib/frostread` before an update. v0.4.0 adds a migration, so v0.3.0 cannot open the database after v0.4.0 has run.

## See also

- [lodge](/docs/apps/lodge/)
- [Frostnotes](/docs/apps/frostnotes/)
- [Porter](/docs/apps/porter/)
- [Frostmail](/docs/apps/frostmail/)
- [nsl](/docs/tools/nsl/)

## Sources

Reviewed 2026-11-13.

- frostread v0.6.0 commit [`fb0ba067bdf4de5510e9d02fcf349f35f2977caf`](https://github.com/frostyard/frostread/tree/fb0ba067bdf4de5510e9d02fcf349f35f2977caf), released 2026-11-13 ([release](https://github.com/frostyard/frostread/releases/tag/v0.6.0)). Its release attaches only `frostyard-readd_0.6.0_amd64.deb`. Its notes list the Flatpak ([frostread#49](https://github.com/frostyard/frostread/pull/49), [frostread#50](https://github.com/frostyard/frostread/pull/50), [frostread#65](https://github.com/frostyard/frostread/pull/65)), the lodge connection ([frostread#54](https://github.com/frostyard/frostread/pull/54)), and the Markdown export in local mode and the move from lodge ([frostread#63](https://github.com/frostyard/frostread/pull/63)). v0.5.0 was released 2026-11-04 ([release](https://github.com/frostyard/frostread/releases/tag/v0.5.0)), v0.4.0 on 2026-11-03 ([release](https://github.com/frostyard/frostread/releases/tag/v0.4.0)).
- [`packaging/README.md`](https://github.com/frostyard/frostread/blob/fb0ba067bdf4de5510e9d02fcf349f35f2977caf/packaging/README.md): the `.deb` for lodge's host, the Flatpak `org.frostyard.Frostread`, and the runbooks.
- [`packaging/flatpak/org.frostyard.Frostread.metainfo.xml`](https://github.com/frostyard/frostread/blob/fb0ba067bdf4de5510e9d02fcf349f35f2977caf/packaging/flatpak/org.frostyard.Frostread.metainfo.xml): the app works on its own and saves an article as a Markdown file.
- The listing in the Frostyard Flatpak remote: [flatpak-index#16](https://github.com/frostyard/flatpak-index/pull/16), merged 2026-11-13, and flatpak-index [`README.md`](https://github.com/frostyard/flatpak-index/blob/0886d3caf7f02d23d19bcc779c7e7d2feb1935a6/README.md) at `0886d3caf7f02d23d19bcc779c7e7d2feb1935a6` (the install line).
- [`README.md`](https://github.com/frostyard/frostread/blob/fb0ba067bdf4de5510e9d02fcf349f35f2977caf/README.md)
- [`docs/specs/api.md`](https://github.com/frostyard/frostread/blob/fb0ba067bdf4de5510e9d02fcf349f35f2977caf/docs/specs/api.md), [`docs/design/overview.md`](https://github.com/frostyard/frostread/blob/fb0ba067bdf4de5510e9d02fcf349f35f2977caf/docs/design/overview.md), [`docs/plans/0001-roadmap.md`](https://github.com/frostyard/frostread/blob/fb0ba067bdf4de5510e9d02fcf349f35f2977caf/docs/plans/0001-roadmap.md)
- [`docs/adr/0003-the-fetcher-reaches-only-public-addresses.md`](https://github.com/frostyard/frostread/blob/fb0ba067bdf4de5510e9d02fcf349f35f2977caf/docs/adr/0003-the-fetcher-reaches-only-public-addresses.md), [`docs/adr/0006-save-from-another-page-through-a-confirm-page-a-bookmarklet-opens.md`](https://github.com/frostyard/frostread/blob/fb0ba067bdf4de5510e9d02fcf349f35f2977caf/docs/adr/0006-save-from-another-page-through-a-confirm-page-a-bookmarklet-opens.md)
- [`docs/adr/0008-the-desktop-flatpak-carries-its-own-readd-and-lodge-is-a-connection.md`](https://github.com/frostyard/frostread/blob/fb0ba067bdf4de5510e9d02fcf349f35f2977caf/docs/adr/0008-the-desktop-flatpak-carries-its-own-readd-and-lodge-is-a-connection.md) (Status: Accepted, Brian, 2026-10-28).
- [frostread#40](https://github.com/frostyard/frostread/pull/40) adds source folders. [frostread#41](https://github.com/frostyard/frostread/pull/41) adds the rail badge.
- [`internal/store/migrations/0003_source_folders.sql`](https://github.com/frostyard/frostread/blob/fb0ba067bdf4de5510e9d02fcf349f35f2977caf/internal/store/migrations/0003_source_folders.sql).
- [`docs/plans/0002-the-standalone-desktop-flatpak.md`](https://github.com/frostyard/frostread/blob/fb0ba067bdf4de5510e9d02fcf349f35f2977caf/docs/plans/0002-the-standalone-desktop-flatpak.md) (Status 2026-11-11: Phases 3 to 10 are done).
- `https://repository.frostyard.org/ext/readd/SHA256SUMS`, checked 2026-11-04, lists up to 0.4.0.
- Suite rule: core [`docs/adr/0062-make-desktop-suite-apps-standalone-flatpaks-with-opt-in-lodge.md`](https://github.com/frostyard/core/blob/4d340b939fccab2ecb7f0be5dbf9e7ab7c03963c/docs/adr/0062-make-desktop-suite-apps-standalone-flatpaks-with-opt-in-lodge.md) (Accepted 2026-10-27) at `4d340b939fccab2ecb7f0be5dbf9e7ab7c03963c`. ADR-0008 settles frostread's lodge mode: a connection.
- snosi PR [snosi#1173](https://github.com/frostyard/snosi/pull/1173), merged 2026-10-28, adds the lodge, readd, and porterd extensions.
- snosi PR [snosi#1196](https://github.com/frostyard/snosi/pull/1196), merged 2026-10-31, pins readd 0.3.0.
- [`internal/store/store.go`](https://github.com/frostyard/frostread/blob/fb0ba067bdf4de5510e9d02fcf349f35f2977caf/internal/store/store.go)
- core commit [`cd2720e0c55d08f3ba8f28a3b55dd5796a5c425a`](https://github.com/frostyard/core/tree/cd2720e0c55d08f3ba8f28a3b55dd5796a5c425a): [`docs/plans/0010-suite-packaging.md`](https://github.com/frostyard/core/blob/cd2720e0c55d08f3ba8f28a3b55dd5796a5c425a/docs/plans/0010-suite-packaging.md) (Phase 2: the `.deb` is not registered with apt-publisher)
- [`packaging/nfpm.yaml`](https://github.com/frostyard/frostread/blob/fb0ba067bdf4de5510e9d02fcf349f35f2977caf/packaging/nfpm.yaml) (the description says "Built for Snosi's sysext")
