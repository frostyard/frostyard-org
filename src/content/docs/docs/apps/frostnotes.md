---
title: Frostnotes
description: "Frostnotes is a notes app in the spirit of Obsidian: plain markdown files, sync, a desktop app, and MCP for agents. Pre-release: the only package is a `.deb` of the daemon for lodge."
---

Frostnotes is a notes app in the spirit of Obsidian. Your notes are plain
markdown files with YAML frontmatter, in a folder you own. You need it if you
want notes that sync between your devices and that agents can read and write.

- `notesd` is a Go daemon. It watches your files and keeps a SQLite index.
- Each device syncs with a self-hosted hub. There are no conflict copies.
- The desktop app is Tauri v2 with a CodeMirror 6 editor. It is a sibling of
  [Frostmail](/docs/apps/frostmail/).
- The web app is the same UI, served by [lodge](/docs/apps/lodge/). A narrow
  screen gets a phone layout.
- Agents use MCP: `notesctl mcp` on your host, or lodge's `/mcp/notes` with
  a scoped token.
- Obsidian vaults open as they are.
- Every write is kept as a version for 30 days.

## Status

Frostnotes is pre-release. The latest release is v0.1.0. Each release attaches
one package, `frostyard-notesd_X.Y.Z_amd64.deb`, for lodge's host. It holds
`notesd`, `notesctl`, the units, the `frostnotes` user, and the web build for
lodge's notes app. The desktop app has no published package. Frostnotes is not
in the Frostyard APT repository, the Frostyard Flatpak remote, or the
Frostyard Homebrew tap. Snosi picks the `.deb` up later.

The vault, sync, and the desktop app are done. Notes inside lodge is in
progress: `notesd` runs as lodge's `notes` app. The hub moved behind lodge
on 2026-10-26, and devices now sync through lodge. Graph and queries
(Obsidian Bases) are planned. The desktop app's Flatpak is in progress. A hub
container image and systemd unit, and Frostyard APT packages, are planned.
Windows and macOS builds, Canvas, and a mobile app come later.

## Install

`notesd` and `notesctl` build from source with Go. They run on your Linux
host, one `notesd` for each user. You build the app in an
[nsl](/docs/tools/nsl/) machine. A hub runs on lodge's host as lodge's `notes`
app, as the system user `frostnotes`. To check the release `.deb` before you
install it, run
`gh attestation verify frostyard-notesd_X.Y.Z_amd64.deb --repo frostyard/frostnotes`.
The [try-it steps](https://github.com/frostyard/frostnotes/blob/main/README.md#try-it)
in the README are the canonical ones.

## Documentation

- [README](https://github.com/frostyard/frostnotes/blob/main/README.md): what Frostnotes is and the current status.
- [Try it](https://github.com/frostyard/frostnotes/blob/main/README.md#try-it): build, start `notesd`, add a vault, and connect an agent.
- [Develop](https://github.com/frostyard/frostnotes/blob/main/README.md#develop): the nsl machine and the build targets.
- [Vault](https://github.com/frostyard/frostnotes/blob/main/docs/design/vault.md): the files on disk, the index, writes, and versions.
- [Sync](https://github.com/frostyard/frostnotes/blob/main/docs/design/sync.md): how devices and the hub merge edits.
- [The hub behind lodge](https://github.com/frostyard/frostnotes/blob/main/docs/design/hub.md): how the hub runs in lodge, and how devices move to it.
- [MCP](https://github.com/frostyard/frostnotes/blob/main/docs/specs/mcp.md): the tools an agent gets.
- [Notes in lodge](https://github.com/frostyard/frostnotes/blob/main/docs/specs/lodge-app.md): the app contract with lodge.
- [Roadmap](https://github.com/frostyard/frostnotes/blob/main/docs/plans/0002-roadmap.md): what is done and what comes next.
- [Notes inside lodge](https://github.com/frostyard/frostnotes/blob/main/docs/plans/0006-m4-notes-inside-lodge.md): the plan and its phases.

## Limits

- There is no graph view and no query view yet.
- The desktop app builds for Linux only.
- `notesd` indexes a note over 10 MB by name only.
- `notesd` refuses a newer database. Back up `$XDG_DATA_HOME/frostnotes`
  before you build a newer `main`.

## See also

- [lodge](/docs/apps/lodge/)
- [Frostmail](/docs/apps/frostmail/)
- [Porter](/docs/apps/porter/)
- [frostread](/docs/apps/frostread/)
- [nsl](/docs/tools/nsl/)

## Sources

Reviewed 2026-10-27.

- Frostnotes commit [`e850667533e63c52df844fc0cadac28516dc7450`](https://github.com/frostyard/frostnotes/tree/e850667533e63c52df844fc0cadac28516dc7450) on `main`. The latest release, v0.1.0, is an earlier commit.
- [`README.md`](https://github.com/frostyard/frostnotes/blob/e850667533e63c52df844fc0cadac28516dc7450/README.md)
- [`docs/design/vault.md`](https://github.com/frostyard/frostnotes/blob/e850667533e63c52df844fc0cadac28516dc7450/docs/design/vault.md), [`docs/design/sync.md`](https://github.com/frostyard/frostnotes/blob/e850667533e63c52df844fc0cadac28516dc7450/docs/design/sync.md), [`docs/design/hub.md`](https://github.com/frostyard/frostnotes/blob/e850667533e63c52df844fc0cadac28516dc7450/docs/design/hub.md), [`docs/design/overview.md`](https://github.com/frostyard/frostnotes/blob/e850667533e63c52df844fc0cadac28516dc7450/docs/design/overview.md)
- [`docs/specs/mcp.md`](https://github.com/frostyard/frostnotes/blob/e850667533e63c52df844fc0cadac28516dc7450/docs/specs/mcp.md), [`docs/specs/lodge-app.md`](https://github.com/frostyard/frostnotes/blob/e850667533e63c52df844fc0cadac28516dc7450/docs/specs/lodge-app.md)
- [`docs/plans/0002-roadmap.md`](https://github.com/frostyard/frostnotes/blob/e850667533e63c52df844fc0cadac28516dc7450/docs/plans/0002-roadmap.md), [`docs/plans/0006-m4-notes-inside-lodge.md`](https://github.com/frostyard/frostnotes/blob/e850667533e63c52df844fc0cadac28516dc7450/docs/plans/0006-m4-notes-inside-lodge.md)
- [`internal/store/store.go`](https://github.com/frostyard/frostnotes/blob/e850667533e63c52df844fc0cadac28516dc7450/internal/store/store.go)
- lodge commit [`a43d3be1de45704e0514d51da4c4b32d575f7c6c`](https://github.com/frostyard/lodge/tree/a43d3be1de45704e0514d51da4c4b32d575f7c6c) on `main`: [`README.md`](https://github.com/frostyard/lodge/blob/a43d3be1de45704e0514d51da4c4b32d575f7c6c/README.md)
- No package: the Flatpak index [`apps.json`](https://github.com/frostyard/flatpak-index/blob/ce9f016860ed19d8e532facb605b7b9635f380cd/apps.json) at `ce9f016860ed19d8e532facb605b7b9635f380cd` has no entry, and the Homebrew tap [`Casks`](https://github.com/frostyard/homebrew-tap/tree/afd829de04b62b37f20a97d2a67fdfe4b477606f/Casks) at `afd829de04b62b37f20a97d2a67fdfe4b477606f` holds only `chairlift.rb` and `nsl.rb`. The Frostyard APT index [`Packages`](https://repository.frostyard.org/debian/dists/trixie/main/binary-amd64/Packages) for trixie on amd64, checked 2026-10-27, lists no package.
