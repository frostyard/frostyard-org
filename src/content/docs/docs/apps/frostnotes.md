---
title: Frostnotes
description: "Frostnotes is a notes app in the spirit of Obsidian: plain markdown files, sync, a desktop app, and MCP for agents. Pre-release; install the desktop app from the Frostyard Flatpak remote."
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

Frostnotes is pre-release. The latest release is v0.2.0. Its Flatpak is in the
[Frostyard Flatpak remote](/docs/get-software/#flatpak). The release also
attaches `frostyard-notesd_X.Y.Z_amd64.deb`, for lodge's host. The `.deb` holds
`notesd`, `notesctl`, the units, the `frostnotes` user, and the web build for
lodge's notes app. Frostnotes is not in the Frostyard APT repository or the
Frostyard Homebrew tap. Snosi picks the `.deb` up later.

The vault, sync, and the desktop app are done. Notes inside lodge is in
progress: `notesd` runs as lodge's `notes` app. The hub moved behind lodge
on 2026-10-26, and devices now sync through lodge. Graph and queries
(Obsidian Bases) are planned. A hub container image and systemd unit, and
Frostyard APT packages, are planned. Windows and macOS builds, Canvas, and a
mobile app come later.

## Install

The desktop app is a Flatpak. It works on its own: you need no account,
server, lodge, Tailscale, or other app. It carries the UI, `notesd`, and
`notesctl`.

Add the Frostyard remote once:

`flatpak remote-add --if-not-exists frostyard https://frostyard.github.io/flatpak-index/frostyard.flatpakrepo`

The app uses runtimes from Flathub, such as the GNOME runtime. Snow,
Snowfield, and Sundog include Flathub. Floe has no Flatpak. On another
system, add Flathub first: [flathub.org/setup](https://flathub.org/setup).

Install Frostnotes:

`flatpak install frostyard org.frostyard.Frostnotes`

The [Frostyard Flatpak remote](https://github.com/frostyard/flatpak-index/blob/main/README.md#install-apps) has the canonical steps.

Check the install:

`flatpak info org.frostyard.Frostnotes`

You see version 0.2.0. Frostnotes shows in the app grid. Update it with
`flatpak update`. In v0.2.0, `flatpak update` does not replace the `notesd`
that runs. Log out and in to start the new one.

Run the CLI on a desktop through the Flatpak, for example:

`flatpak run --command=notesctl org.frostyard.Frostnotes vault list`

`notesd` runs in its own sandbox. The first launch asks the Background portal
to let it run in the background and start at login. With that permission,
`notesd` keeps running after you close the last window, until you log out.
If you turn Run in Background off (GNOME Settings, Apps, Frostnotes), the
desktop stops `notesd` once no window is open: on GNOME 48, about 45 seconds
after the last window closes. Sync then waits until you open the app again.

The app's data is under
`~/.var/app/org.frostyard.Frostnotes/`, and the `notesd` log is
`~/.var/app/org.frostyard.Frostnotes/.local/state/frostnotes/notesd.log`.

### Sync with a hub

Sync with a hub, for example the hub in [lodge](/docs/apps/lodge/), is
optional. Nothing turns it on for you. The app has no join form yet, so you
join from the terminal:

`flatpak run --command=notesctl org.frostyard.Frostnotes hub join URL NAME`

Then approve the one-time code on the hub. On lodge's host, run
`sudo -u frostnotes notesctl hub approve CODE`. The canonical steps are in
[The hub behind lodge](https://github.com/frostyard/frostnotes/blob/main/docs/design/hub.md)
and [Pairing and sessions](https://github.com/frostyard/frostnotes/blob/main/docs/design/sync.md#pairing-and-sessions).
To leave a hub, run this, with your local vault's name as `VAULT`:

`flatpak run --command=notesctl org.frostyard.Frostnotes sync leave --vault VAULT`

The vault's files stay on your computer, and you can still edit them.

### Build from source

`notesd` and `notesctl` also build from source with Go. You build the app in
an [nsl](/docs/tools/nsl/) machine. See
[Try it](https://github.com/frostyard/frostnotes/blob/main/README.md#try-it)
and [Develop](https://github.com/frostyard/frostnotes/blob/main/README.md#develop)
in the README.

### Install the hub on lodge's host

A hub runs on lodge's host as lodge's `notes` app, as the system user
`frostnotes`. To check the release `.deb` before you install it, run
`gh attestation verify frostyard-notesd_X.Y.Z_amd64.deb --repo frostyard/frostnotes`.
The [hub steps](https://github.com/frostyard/frostnotes/blob/main/docs/design/hub.md) are the canonical ones.

## Documentation

- [README](https://github.com/frostyard/frostnotes/blob/main/README.md): what Frostnotes is and the current status.
- [Frostyard Flatpak remote](https://github.com/frostyard/flatpak-index/blob/main/README.md): the remote and its apps.
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
- `notesd` refuses a newer database. Back up `~/.var/app/org.frostyard.Frostnotes/`
  before you install a newer Flatpak. For a build from source, back up
  `$XDG_DATA_HOME/frostnotes`.

## See also

- [lodge](/docs/apps/lodge/)
- [Frostmail](/docs/apps/frostmail/)
- [Porter](/docs/apps/porter/)
- [frostread](/docs/apps/frostread/)
- [nsl](/docs/tools/nsl/)

## Sources

Reviewed 2026-10-28.

- Frostnotes release v0.2.0 commit [`0573fab7eeeabf7b76a8e94916ca2b429f5b65e3`](https://github.com/frostyard/frostnotes/tree/0573fab7eeeabf7b76a8e94916ca2b429f5b65e3). `main` at [`eafe7bc3d45796c81e548004458ecd0fb304196d`](https://github.com/frostyard/frostnotes/tree/eafe7bc3d45796c81e548004458ecd0fb304196d).
- The Flatpak: [`docs/design/app.md`](https://github.com/frostyard/frostnotes/blob/eafe7bc3d45796c81e548004458ecd0fb304196d/docs/design/app.md) (section "The Flatpak") and [`docs/plans/0008-m6-the-standalone-desktop-app.md`](https://github.com/frostyard/frostnotes/blob/eafe7bc3d45796c81e548004458ecd0fb304196d/docs/plans/0008-m6-the-standalone-desktop-app.md) (gap G1, no join form).
- Frostyard Flatpak remote: flatpak-index [`README.md`](https://github.com/frostyard/flatpak-index/blob/ff27263767e7d95fc777a24592c1d5ff85931b82/README.md) and [`apps.json`](https://github.com/frostyard/flatpak-index/blob/ff27263767e7d95fc777a24592c1d5ff85931b82/apps.json) at `ff27263767e7d95fc777a24592c1d5ff85931b82`. The live catalogue on 2026-10-28 lists Frostnotes 0.2.0 from tag `v0.2.0`.
- Suite rule: core [`docs/adr/0062-make-desktop-suite-apps-standalone-flatpaks-with-opt-in-lodge.md`](https://github.com/frostyard/core/blob/4d340b939fccab2ecb7f0be5dbf9e7ab7c03963c/docs/adr/0062-make-desktop-suite-apps-standalone-flatpaks-with-opt-in-lodge.md) (Accepted 2026-10-27) at `4d340b939fccab2ecb7f0be5dbf9e7ab7c03963c`.
- [`README.md`](https://github.com/frostyard/frostnotes/blob/e850667533e63c52df844fc0cadac28516dc7450/README.md)
- [`docs/design/vault.md`](https://github.com/frostyard/frostnotes/blob/e850667533e63c52df844fc0cadac28516dc7450/docs/design/vault.md), [`docs/design/sync.md`](https://github.com/frostyard/frostnotes/blob/e850667533e63c52df844fc0cadac28516dc7450/docs/design/sync.md), [`docs/design/hub.md`](https://github.com/frostyard/frostnotes/blob/e850667533e63c52df844fc0cadac28516dc7450/docs/design/hub.md), [`docs/design/overview.md`](https://github.com/frostyard/frostnotes/blob/e850667533e63c52df844fc0cadac28516dc7450/docs/design/overview.md)
- [`docs/specs/mcp.md`](https://github.com/frostyard/frostnotes/blob/e850667533e63c52df844fc0cadac28516dc7450/docs/specs/mcp.md), [`docs/specs/lodge-app.md`](https://github.com/frostyard/frostnotes/blob/e850667533e63c52df844fc0cadac28516dc7450/docs/specs/lodge-app.md)
- [`docs/plans/0002-roadmap.md`](https://github.com/frostyard/frostnotes/blob/e850667533e63c52df844fc0cadac28516dc7450/docs/plans/0002-roadmap.md), [`docs/plans/0006-m4-notes-inside-lodge.md`](https://github.com/frostyard/frostnotes/blob/e850667533e63c52df844fc0cadac28516dc7450/docs/plans/0006-m4-notes-inside-lodge.md)
- [`internal/store/store.go`](https://github.com/frostyard/frostnotes/blob/e850667533e63c52df844fc0cadac28516dc7450/internal/store/store.go)
- lodge commit [`a43d3be1de45704e0514d51da4c4b32d575f7c6c`](https://github.com/frostyard/lodge/tree/a43d3be1de45704e0514d51da4c4b32d575f7c6c) on `main`: [`README.md`](https://github.com/frostyard/lodge/blob/a43d3be1de45704e0514d51da4c4b32d575f7c6c/README.md)
- No APT or Homebrew package: the Homebrew tap [`Casks`](https://github.com/frostyard/homebrew-tap/tree/afd829de04b62b37f20a97d2a67fdfe4b477606f/Casks) at `afd829de04b62b37f20a97d2a67fdfe4b477606f` holds only `chairlift.rb` and `nsl.rb`. The Frostyard APT index [`Packages`](https://repository.frostyard.org/debian/dists/trixie/main/binary-amd64/Packages) for trixie on amd64, checked 2026-10-28, lists no suite package.
