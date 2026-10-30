---
title: Frostmail
description: "Frostmail is a mail client that works like Apple Mail.app, for Linux and Windows, with a daemon, an app, and a CLI. Pre-release; install the desktop app from the Frostyard Flatpak remote."
---

Frostmail is a mail client that works like Apple Mail.app. It runs on Linux
and on Windows. It keeps your mail, contacts, calendars, and tasks in a
daemon on your machine, and the app and the command line talk to it.

- `maild` is a per-user Go daemon. It syncs your mail, keeps a SQLite cache
  with full-text search, and serves a JSON-RPC socket.
- The app is Tauri v2 with a React UI. It uses WebKitGTK on Linux and
  WebView2 on Windows.
- `mailctl` is a command-line client of the same socket.
- The daemon can also serve a phone and any browser on your tailnet, as the
  mail app of [lodge](/docs/apps/lodge/).
- Mail: sync, read, search, and send for generic IMAP, Gmail, iCloud, and
  Outlook.com accounts.
- Contacts, calendars, and tasks over CardDAV, CalDAV, Google Tasks, and
  Microsoft Graph. You answer invitations from the reader, and you edit
  events and contacts in place. A To-Do bar sits beside the inbox.
- Rules, smart mailboxes, VIPs, Send Later, and Remind Me.

## Status

Frostmail is pre-release. The latest release is v0.4.0. Its Flatpak,
`org.frostyard.Frostmail`, is in the
[Frostyard Flatpak remote](/docs/get-software/#flatpak). The release also
attaches `frostyard-maild_X.Y.Z_amd64.deb`, for lodge's host. The `.deb` holds
`maild`, `mailctl`, the units, the `frostmail` user, and the web build for
lodge's mail app. Frostmail is not in the Frostyard APT repository or the
Frostyard Homebrew tap. On a Frostyard image, the
[maild system extension](/docs/sysexts/maild/) installs it.

The Flatpak carries `maild` and `mailctl`, and its launcher starts its own
local `maild`. Local is the default, and [lodge](/docs/apps/lodge/) is a
connection you choose: nothing turns it on for you, and a change of mode never
copies, moves, merges, or deletes your data.

Mail in lodge is built and still in progress. Its last step, the move of a
real mail store to lodge's host, has not run yet. Calendar, task, and contact
tools for agents are built. Google and Microsoft verification are planned.

## Install

The desktop app is a Flatpak. It works on its own: it carries `maild` and
`mailctl`, and you need no lodge. Floe has no Flatpak.

Add the Frostyard remote once, for your user:

`flatpak remote-add --user --if-not-exists frostyard https://frostyard.github.io/flatpak-index/frostyard.flatpakrepo`

Apps use runtimes from Flathub, such as the GNOME runtime. A `--user` install
gets a missing runtime only from a user remote, so add Flathub for your user
too:

`flatpak remote-add --user --if-not-exists flathub https://dl.flathub.org/repo/flathub.flatpakrepo`

Install Frostmail:

`flatpak install --user frostyard org.frostyard.Frostmail`

The [Frostyard Flatpak remote](https://github.com/frostyard/flatpak-index/blob/main/README.md#install-apps)
has the canonical steps. Check the install:

`flatpak info org.frostyard.Frostmail`

The output shows `ID: org.frostyard.Frostmail`. Frostmail shows in the app
grid. Update it with `flatpak update`. The app's data is under
`~/.var/app/org.frostyard.Frostmail/`.

If you ran `maild` on the host before, the welcome screen shows a note with the
steps that move your mail into the Flatpak. [The Flatpak's own
maild](https://github.com/frostyard/frostmail/blob/main/docs/design/desktop.md#the-flatpaks-own-maild)
has them.

To build from source, `make install` puts `maild` and `mailctl` in
`~/.local/bin` with a systemd user service, and you build the app in an
[nsl](/docs/tools/nsl/) machine. The
[install steps](https://github.com/frostyard/frostmail/blob/main/docs/design/desktop.md#installing-for-one-user)
for one user are the canonical ones. Behind [lodge](/docs/apps/lodge/), `maild`
runs as the system user `frostmail` on lodge's host. To check the release
`.deb` before you install it, run
`gh attestation verify frostyard-maild_X.Y.Z_amd64.deb --repo frostyard/frostmail`.

## Documentation

- [README](https://github.com/frostyard/frostmail/blob/main/README.md): what Frostmail is and what works now.
- [Frostyard Flatpak remote](https://github.com/frostyard/flatpak-index/blob/main/README.md): the remote and its apps.
- [Installing for one user](https://github.com/frostyard/frostmail/blob/main/docs/design/desktop.md#installing-for-one-user): the build from source with `make install`, and where its data lives.
- [The Flatpak's own maild](https://github.com/frostyard/frostmail/blob/main/docs/design/desktop.md#the-flatpaks-own-maild): the launcher, the modes, the paths, and the move from a host `maild`.
- [Accounts, sign-in and providers](https://github.com/frostyard/frostmail/blob/main/docs/design/accounts.md): how to add an account, and what each provider needs.
- [A personal Google client](https://github.com/frostyard/frostmail/blob/main/docs/design/accounts.md#setting-up-a-personal-google-client): the Google Cloud steps for Gmail sign-in.
- [On a maild behind lodge](https://github.com/frostyard/frostmail/blob/main/docs/design/desktop.md#on-a-maild-behind-lodge): how the desktop app reaches lodge's `maild`.
- [Mail in lodge](https://github.com/frostyard/frostmail/blob/main/docs/specs/lodge-app.md): the app contract, the user, the socket, and the agent tools.
- [Windows](https://github.com/frostyard/frostmail/blob/main/docs/design/desktop.md#windows): the Windows build and how it starts at sign-in.
- [Search](https://github.com/frostyard/frostmail/blob/main/docs/specs/search.md): the search language.
- [The standalone desktop Flatpak](https://github.com/frostyard/frostmail/blob/main/docs/plans/0013-m6-the-standalone-desktop-flatpak.md): the plan and its phases.
- [Roadmap](https://github.com/frostyard/frostmail/blob/main/docs/plans/0002-roadmap.md): what is built and what comes next.

## Limits

- Gmail OAuth sign-in needs your own Google client until Frostmail has a
  verified one. A Gmail app password works without one.
- Microsoft work and school accounts are not supported.
- `maild` applies database migrations at start and refuses a newer database.
  Back up `~/.var/app/org.frostyard.Frostmail/` before you install a newer
  Flatpak. For a build from source, back up `$XDG_DATA_HOME/frostmail`.

## See also

- [lodge](/docs/apps/lodge/)
- [Frostnotes](/docs/apps/frostnotes/)
- [Porter](/docs/apps/porter/)
- [nsl](/docs/tools/nsl/)

## Sources

Reviewed 2026-10-30.

- Frostmail release v0.4.0 commit [`32d764c1dfd59d5178621bcf17290a6e6dc68963`](https://github.com/frostyard/frostmail/tree/32d764c1dfd59d5178621bcf17290a6e6dc68963), released 2026-10-29. Its [release](https://github.com/frostyard/frostmail/releases/tag/v0.4.0) attaches only `frostyard-maild_0.4.0_amd64.deb`.
- The Flatpak: GHCR `ghcr.io/frostyard/frostmail` tags `v0.4.0` and `latest` at digest `sha256:89980a48d4492400636022d8db44ef64dcc16e3c405f501617d4357f7b90cf2a`, which the live Frostyard catalogue lists on 2026-10-30. [`packaging/flatpak/org.frostyard.Frostmail.json`](https://github.com/frostyard/frostmail/blob/32d764c1dfd59d5178621bcf17290a6e6dc68963/packaging/flatpak/org.frostyard.Frostmail.json) (runtime `org.gnome.Platform` 51).
- Frostyard Flatpak remote: flatpak-index [`README.md`](https://github.com/frostyard/flatpak-index/blob/ec8b85e371bd9cac79512904c1a8b27179c5cc6a/README.md) and [`apps.json`](https://github.com/frostyard/flatpak-index/blob/ec8b85e371bd9cac79512904c1a8b27179c5cc6a/apps.json) at `ec8b85e371bd9cac79512904c1a8b27179c5cc6a`, after [flatpak-index#6](https://github.com/frostyard/flatpak-index/pull/6), merged 2026-10-29.
- Install text: flatpak-index [flatpak-index#7](https://github.com/frostyard/flatpak-index/pull/7) at [`8f951e53a8801b289e4edcd7d06f018a0333f73e`](https://github.com/frostyard/flatpak-index/blob/8f951e53a8801b289e4edcd7d06f018a0333f73e/README.md) (open on 2026-10-30): the per-user remote and the Flathub user remote.
- The per-user remote: Brian's decisions T532a (2026-10-29) and T532b: every user adds the remote. A fresh Snow install has no `frostyard` remote, user or system (Murbella's check, T540).
- The Flathub user remote: a test on 2026-10-30 with Flatpak 1.16.6 and an empty user installation. Without Flathub as a user remote, `flatpak install --user` fails with `requires the runtime org.gnome.Platform/x86_64/51 which was not found`.
- [`README.md`](https://github.com/frostyard/frostmail/blob/32d764c1dfd59d5178621bcf17290a6e6dc68963/README.md)
- [`docs/design/desktop.md`](https://github.com/frostyard/frostmail/blob/32d764c1dfd59d5178621bcf17290a6e6dc68963/docs/design/desktop.md) (sections Installing for one user, The Flatpak in CI, The Flatpak's own maild, Windows), [`docs/design/accounts.md`](https://github.com/frostyard/frostmail/blob/32d764c1dfd59d5178621bcf17290a6e6dc68963/docs/design/accounts.md), [`docs/design/overview.md`](https://github.com/frostyard/frostmail/blob/32d764c1dfd59d5178621bcf17290a6e6dc68963/docs/design/overview.md)
- [`docs/specs/lodge-app.md`](https://github.com/frostyard/frostmail/blob/32d764c1dfd59d5178621bcf17290a6e6dc68963/docs/specs/lodge-app.md), [`docs/specs/search.md`](https://github.com/frostyard/frostmail/blob/32d764c1dfd59d5178621bcf17290a6e6dc68963/docs/specs/search.md)
- [`docs/plans/0002-roadmap.md`](https://github.com/frostyard/frostmail/blob/32d764c1dfd59d5178621bcf17290a6e6dc68963/docs/plans/0002-roadmap.md), [`docs/plans/0010-m7-microsoft-and-windows.md`](https://github.com/frostyard/frostmail/blob/32d764c1dfd59d5178621bcf17290a6e6dc68963/docs/plans/0010-m7-microsoft-and-windows.md), [`docs/plans/0011-m8-mail-in-lodge.md`](https://github.com/frostyard/frostmail/blob/32d764c1dfd59d5178621bcf17290a6e6dc68963/docs/plans/0011-m8-mail-in-lodge.md), [`docs/plans/0013-m6-the-standalone-desktop-flatpak.md`](https://github.com/frostyard/frostmail/blob/32d764c1dfd59d5178621bcf17290a6e6dc68963/docs/plans/0013-m6-the-standalone-desktop-flatpak.md)
- [`docs/adr/0046-the-desktop-flatpak-carries-its-own-maild.md`](https://github.com/frostyard/frostmail/blob/32d764c1dfd59d5178621bcf17290a6e6dc68963/docs/adr/0046-the-desktop-flatpak-carries-its-own-maild.md) (Accepted 2026-10-28)
- [`internal/store/store.go`](https://github.com/frostyard/frostmail/blob/32d764c1dfd59d5178621bcf17290a6e6dc68963/internal/store/store.go)
- Suite rule: core [`docs/adr/0062-make-desktop-suite-apps-standalone-flatpaks-with-opt-in-lodge.md`](https://github.com/frostyard/core/blob/4d340b939fccab2ecb7f0be5dbf9e7ab7c03963c/docs/adr/0062-make-desktop-suite-apps-standalone-flatpaks-with-opt-in-lodge.md) (Accepted 2026-10-27) at `4d340b939fccab2ecb7f0be5dbf9e7ab7c03963c`.
- snosi PR [snosi#1169](https://github.com/frostyard/snosi/pull/1169), merged 2026-10-28, adds the notesd and maild extensions.
- No APT or Homebrew package: the Homebrew tap [`Casks`](https://github.com/frostyard/homebrew-tap/tree/916d4cf577e54696afbdaaa9845cf3bef8b3edd4/Casks) at `916d4cf577e54696afbdaaa9845cf3bef8b3edd4` holds only `chairlift.rb` and `nsl.rb`. The Frostyard APT index [`Packages`](https://repository.frostyard.org/debian/dists/trixie/main/binary-amd64/Packages) for trixie on amd64, checked 2026-10-30, lists no Frostmail package.
