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

Frostnotes is pre-release. The latest release is v0.3.0. Its Flatpak is in the
[Frostyard Flatpak remote](/docs/get-software/#flatpak). The release also
attaches `frostyard-notesd_X.Y.Z_amd64.deb`, for lodge's host. The `.deb` holds
`notesd`, `notesctl`, the units, the `frostnotes` user, and the web build for
lodge's notes app. Frostnotes is not in the Frostyard APT repository or the
Frostyard Homebrew tap. On a Frostyard image, the
[notesd system extension](/docs/sysexts/notesd/) installs it.

The vault, sync, and the desktop app are done. Notes inside lodge is in
progress: `notesd` runs as lodge's `notes` app. The hub moved behind lodge
on 2026-10-26, and devices now sync through lodge. Graph and queries
(Obsidian Bases) are planned. A hub container image and systemd unit, and
Frostyard APT packages, are planned. Windows and macOS builds, Canvas, and a
mobile app come later.

Release v0.3.0 adds a hub join from the app, a background setting, and a
new window that replaces an older `notesd` after an update. The window also
says why `notesd` did not start. The join form, the background setting, and
the update replacement are not yet tested on a real desktop.

## Install

The desktop app is a Flatpak. It works on its own: you need no account,
server, lodge, Tailscale, or other app. It carries the UI, `notesd`, and
`notesctl`. Floe has no Flatpak.

Add the Frostyard remote once, for your user:

`flatpak remote-add --user --if-not-exists frostyard https://frostyard.github.io/flatpak-index/frostyard.flatpakrepo`

Snow images already have this remote, so Snow users can skip this step.

Apps use runtimes from Flathub, such as the GNOME runtime. A `--user` install
gets a missing runtime only from a user remote, so add Flathub for your user
too:

`flatpak remote-add --user --if-not-exists flathub https://dl.flathub.org/repo/flathub.flatpakrepo`

Install Frostnotes:

`flatpak install --user frostyard org.frostyard.Frostnotes`

The [Frostyard Flatpak remote](https://github.com/frostyard/flatpak-index/blob/main/README.md#install-apps) has the canonical steps.

Check the install:

`flatpak info org.frostyard.Frostnotes`

You see version 0.3.0. Frostnotes shows in the app grid. Update it with
`flatpak update`. From v0.3.0, when you open a new window after
`flatpak update`, the app replaces a `notesd` of an older build with the new
one, and you need no logout. The update from v0.2.0 to v0.3.0 is different:
the v0.2.0 `notesd` keeps running until you log out and in. Your notes,
files, and versions stay.

Run the CLI on a desktop through the Flatpak, for example:

`flatpak run --command=notesctl org.frostyard.Frostnotes vault list`

`notesd` runs in its own sandbox. The first launch asks the Background portal
to let it run in the background and start at login. With that permission,
and with the app's setting On (below), `notesd` keeps running after you close the last window, until you log out.
If you turn Run in Background off (GNOME Settings, Apps, Frostnotes), the
desktop stops `notesd` once no window is open: on GNOME 48, about 45 seconds
after the last window closes. Sync then waits until you open the app again.

You can also set this in the app. Open Settings, then Background, then
"Keep syncing when no window is open". It is On by default. On: `notesd`
keeps running after the last window closes, and it can start at login. Off:
`notesd` stops when the last window closes and does not start at login, so
notes from other devices arrive only while a window is open. With the
desktop permission off, the desktop's own stop wins. The setting applies to
the installed app, for all vaults. The section shows only in the Flatpak.

The app's data is under
`~/.var/app/org.frostyard.Frostnotes/`, and the `notesd` log is
`~/.var/app/org.frostyard.Frostnotes/.local/state/frostnotes/notesd.log`.

### If notesd does not start

If `notesd` does not start, the window says why, under "Reconnecting to
notesd…". It shows the last line of `notesd.log`, or, when the Flatpak portal
did not start `notesd`, the checks to run. It always shows the path of
`notesd.log`.

If the Flatpak portal did not start `notesd`, the window lists these
commands:

- `flatpak override --user --show org.frostyard.Frostnotes`
- `flatpak override --user --reset org.frostyard.Frostnotes`
- `systemctl --user status flatpak-portal.service`

If you add or create a vault in a folder outside the Flatpak's file access,
the app refuses it and names the fix:
`flatpak override --user --filesystem=PATH org.frostyard.Frostnotes`. Then log
out and in.

### Sync with a hub

Sync with a hub, for example the hub in [lodge](/docs/apps/lodge/), is
optional. Nothing turns it on for you.

1. Open the vault menu, and press Manage vaults…. With no vault yet, the app
   opens there.
2. Press Join on the row "Join a vault on a hub".
3. Fill in Hub URL, for example
   `https://lodge.example.ts.net/device/notes`, Hub vault name, This device's
   name (optional), and Location.
4. Press Join.

If this device has not paired with that hub before, the app shows a one-time
code. Approve it on the hub's machine with `notesctl hub approve CODE`. On
lodge's host, run `sudo -u frostnotes notesctl hub approve CODE`. The code
expires in 10 minutes. The app then makes the vault, joins it, and opens it.

The canonical steps are in
[The hub behind lodge](https://github.com/frostyard/frostnotes/blob/main/docs/design/hub.md)
and [Pairing and sessions](https://github.com/frostyard/frostnotes/blob/main/docs/design/sync.md#pairing-and-sessions).

To sync a vault you already have, open the vault, then Settings, Sync, Join….

Settings, Sync also has Pair again… for a hub that refused this device's
token. To leave a hub, open Settings, Sync. In the Stop syncing row, press
Leave, then press Leave again to confirm. The vault's files stay on your
computer, and you can still edit them.
The hub keeps its copy.

From the terminal, with your local vault's name as `VAULT`:

`flatpak run --command=notesctl org.frostyard.Frostnotes sync leave --vault VAULT`

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

Reviewed 2026-10-29.

- Frostnotes release v0.3.0 commit [`2d80734337b90f497c5b6f0c7e87038d2bc96b20`](https://github.com/frostyard/frostnotes/tree/2d80734337b90f497c5b6f0c7e87038d2bc96b20), released 2026-10-28, and `main` at [`edee4ee870e55981d8912a4ecfe146b6958abfdc`](https://github.com/frostyard/frostnotes/tree/edee4ee870e55981d8912a4ecfe146b6958abfdc).
- [`docs/plans/0008-m6-the-standalone-desktop-app.md`](https://github.com/frostyard/frostnotes/blob/2d80734337b90f497c5b6f0c7e87038d2bc96b20/docs/plans/0008-m6-the-standalone-desktop-app.md) (Phase 4: G1, G2, G3, G5), [`docs/adr/0032-an-update-replaces-the-running-notesd.md`](https://github.com/frostyard/frostnotes/blob/2d80734337b90f497c5b6f0c7e87038d2bc96b20/docs/adr/0032-an-update-replaces-the-running-notesd.md), [`docs/adr/0033-a-setting-keeps-notesd-running-without-a-window.md`](https://github.com/frostyard/frostnotes/blob/2d80734337b90f497c5b6f0c7e87038d2bc96b20/docs/adr/0033-a-setting-keeps-notesd-running-without-a-window.md).
- [`docs/specs/ui.md`](https://github.com/frostyard/frostnotes/blob/2d80734337b90f497c5b6f0c7e87038d2bc96b20/docs/specs/ui.md) (sections Connecting, Settings, Vault manager) and [`docs/design/app.md`](https://github.com/frostyard/frostnotes/blob/2d80734337b90f497c5b6f0c7e87038d2bc96b20/docs/design/app.md) (section The Flatpak), and [`app/src/features/connecting/NotesdCause.tsx`](https://github.com/frostyard/frostnotes/blob/2d80734337b90f497c5b6f0c7e87038d2bc96b20/app/src/features/connecting/NotesdCause.tsx).
- Plan 0008 at `main` [`edee4ee870e55981d8912a4ecfe146b6958abfdc`](https://github.com/frostyard/frostnotes/blob/edee4ee870e55981d8912a4ecfe146b6958abfdc/docs/plans/0008-m6-the-standalone-desktop-app.md) (Phase 3, Run 2: the update from v0.2.0 to v0.3.0, 2026-10-29).
- The live Frostyard catalogue on 2026-10-29 lists `frostyard/frostnotes` at tag `latest`, digest `sha256:46e19029bb751b1bfe9c0182e9e72d5d052ed1618b84f5bd7145360a4dd96145`, the v0.3.0 image.
- Frostyard Flatpak remote: flatpak-index [`README.md`](https://github.com/frostyard/flatpak-index/blob/ff27263767e7d95fc777a24592c1d5ff85931b82/README.md) and [`apps.json`](https://github.com/frostyard/flatpak-index/blob/ff27263767e7d95fc777a24592c1d5ff85931b82/apps.json) at `ff27263767e7d95fc777a24592c1d5ff85931b82`.
- Install text: flatpak-index [flatpak-index#7](https://github.com/frostyard/flatpak-index/pull/7) at [`8f951e53a8801b289e4edcd7d06f018a0333f73e`](https://github.com/frostyard/flatpak-index/blob/8f951e53a8801b289e4edcd7d06f018a0333f73e/README.md) (open on 2026-10-30): the per-user remote and the Flathub user remote.
- The per-user remote: Brian's decision T532a, 2026-10-29. Snow images already have a user-level remote named `frostyard`.
- The Flathub user remote: a test on 2026-10-30 with Flatpak 1.16.6 and an empty user installation. Without Flathub as a user remote, `flatpak install --user` fails with `requires the runtime org.gnome.Platform/x86_64/51 which was not found`.
- Suite rule: core [`docs/adr/0062-make-desktop-suite-apps-standalone-flatpaks-with-opt-in-lodge.md`](https://github.com/frostyard/core/blob/4d340b939fccab2ecb7f0be5dbf9e7ab7c03963c/docs/adr/0062-make-desktop-suite-apps-standalone-flatpaks-with-opt-in-lodge.md) (Accepted 2026-10-27) at `4d340b939fccab2ecb7f0be5dbf9e7ab7c03963c`.
- snosi PR [snosi#1169](https://github.com/frostyard/snosi/pull/1169), merged 2026-10-28, adds the notesd and maild extensions.
- [`README.md`](https://github.com/frostyard/frostnotes/blob/e850667533e63c52df844fc0cadac28516dc7450/README.md)
- [`docs/design/vault.md`](https://github.com/frostyard/frostnotes/blob/e850667533e63c52df844fc0cadac28516dc7450/docs/design/vault.md), [`docs/design/sync.md`](https://github.com/frostyard/frostnotes/blob/e850667533e63c52df844fc0cadac28516dc7450/docs/design/sync.md), [`docs/design/hub.md`](https://github.com/frostyard/frostnotes/blob/e850667533e63c52df844fc0cadac28516dc7450/docs/design/hub.md), [`docs/design/overview.md`](https://github.com/frostyard/frostnotes/blob/e850667533e63c52df844fc0cadac28516dc7450/docs/design/overview.md)
- [`docs/specs/mcp.md`](https://github.com/frostyard/frostnotes/blob/e850667533e63c52df844fc0cadac28516dc7450/docs/specs/mcp.md), [`docs/specs/lodge-app.md`](https://github.com/frostyard/frostnotes/blob/e850667533e63c52df844fc0cadac28516dc7450/docs/specs/lodge-app.md)
- [`docs/plans/0002-roadmap.md`](https://github.com/frostyard/frostnotes/blob/e850667533e63c52df844fc0cadac28516dc7450/docs/plans/0002-roadmap.md), [`docs/plans/0006-m4-notes-inside-lodge.md`](https://github.com/frostyard/frostnotes/blob/e850667533e63c52df844fc0cadac28516dc7450/docs/plans/0006-m4-notes-inside-lodge.md)
- [`internal/store/store.go`](https://github.com/frostyard/frostnotes/blob/e850667533e63c52df844fc0cadac28516dc7450/internal/store/store.go)
- lodge commit [`a43d3be1de45704e0514d51da4c4b32d575f7c6c`](https://github.com/frostyard/lodge/tree/a43d3be1de45704e0514d51da4c4b32d575f7c6c) on `main`: [`README.md`](https://github.com/frostyard/lodge/blob/a43d3be1de45704e0514d51da4c4b32d575f7c6c/README.md)
- No APT or Homebrew package: the Homebrew tap [`Casks`](https://github.com/frostyard/homebrew-tap/tree/afd829de04b62b37f20a97d2a67fdfe4b477606f/Casks) at `afd829de04b62b37f20a97d2a67fdfe4b477606f` holds only `chairlift.rb` and `nsl.rb`. The Frostyard APT index [`Packages`](https://repository.frostyard.org/debian/dists/trixie/main/binary-amd64/Packages) for trixie on amd64, checked 2026-10-28, lists no suite package.
