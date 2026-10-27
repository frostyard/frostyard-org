---
title: Frostmail
description: "Frostmail is a mail client that works like Apple Mail.app, for Linux and Windows, with a daemon, an app, and a CLI. Pre-release: the only package is a `.deb` of the daemon for lodge."
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

Frostmail is pre-release. The latest release is v0.1.0. Each release attaches
one package, `frostyard-maild_X.Y.Z_amd64.deb`, for lodge's host. It holds
`maild`, `mailctl`, the units, the `frostmail` user, and the web build for
lodge's mail app. The desktop app has no package. Frostmail is not in the
Frostyard APT repository, the Frostyard Flatpak remote, or the Frostyard
Homebrew tap. Snosi picks the `.deb` up later.

Mail in lodge is built and still in progress. Its last step, the move of a
real mail store to lodge's host, has not run yet. Calendar, task, and
contact tools for agents are built. A Flatpak with portals, and Google and
Microsoft verification, are planned.

## Install

On your Linux host, Frostmail runs for one user and needs no root.
`make install` puts `maild` and `mailctl` in `~/.local/bin` with a systemd
user service. The app is a local Flatpak that you build in an
[nsl](/docs/tools/nsl/) machine. Behind [lodge](/docs/apps/lodge/), `maild`
runs as the system user `frostmail` on lodge's host. To check the release
`.deb` before you install it, run
`gh attestation verify frostyard-maild_X.Y.Z_amd64.deb --repo frostyard/frostmail`.
The [install steps](https://github.com/frostyard/frostmail/blob/main/docs/design/desktop.md#installing-for-one-user)
for one user are the canonical ones.

## Documentation

- [README](https://github.com/frostyard/frostmail/blob/main/README.md): what Frostmail is and what works now.
- [Installing for one user](https://github.com/frostyard/frostmail/blob/main/docs/design/desktop.md#installing-for-one-user): `make install`, the app Flatpak, and where the data lives.
- [Accounts, sign-in and providers](https://github.com/frostyard/frostmail/blob/main/docs/design/accounts.md): how to add an account, and what each provider needs.
- [A personal Google client](https://github.com/frostyard/frostmail/blob/main/docs/design/accounts.md#setting-up-a-personal-google-client): the Google Cloud steps for Gmail sign-in.
- [On a maild behind lodge](https://github.com/frostyard/frostmail/blob/main/docs/design/desktop.md#on-a-maild-behind-lodge): how the desktop app reaches lodge's `maild`.
- [Mail in lodge](https://github.com/frostyard/frostmail/blob/main/docs/specs/lodge-app.md): the app contract, the user, the socket, and the agent tools.
- [Windows](https://github.com/frostyard/frostmail/blob/main/docs/design/desktop.md#windows): the Windows build and how it starts at sign-in.
- [Search](https://github.com/frostyard/frostmail/blob/main/docs/specs/search.md): the search language.
- [Roadmap](https://github.com/frostyard/frostmail/blob/main/docs/plans/0002-roadmap.md): what is built and what comes next.

## Limits

- Gmail OAuth sign-in needs your own Google client until Frostmail has a
  verified one. A Gmail app password works without one.
- Microsoft work and school accounts are not supported.
- `maild` applies database migrations at start and refuses a newer database.
  Back up `$XDG_DATA_HOME/frostmail` before you build a newer `main`.

## See also

- [lodge](/docs/apps/lodge/)
- [Frostnotes](/docs/apps/frostnotes/)
- [Porter](/docs/apps/porter/)
- [nsl](/docs/tools/nsl/)

## Sources

Reviewed 2026-10-27.

- Frostmail v0.1.0 commit [`df106558209fad29c63983710a1a646557064dd4`](https://github.com/frostyard/frostmail/tree/df106558209fad29c63983710a1a646557064dd4)
- [`README.md`](https://github.com/frostyard/frostmail/blob/df106558209fad29c63983710a1a646557064dd4/README.md)
- [`docs/design/desktop.md`](https://github.com/frostyard/frostmail/blob/df106558209fad29c63983710a1a646557064dd4/docs/design/desktop.md), [`docs/design/accounts.md`](https://github.com/frostyard/frostmail/blob/df106558209fad29c63983710a1a646557064dd4/docs/design/accounts.md), [`docs/design/overview.md`](https://github.com/frostyard/frostmail/blob/df106558209fad29c63983710a1a646557064dd4/docs/design/overview.md)
- [`docs/specs/lodge-app.md`](https://github.com/frostyard/frostmail/blob/df106558209fad29c63983710a1a646557064dd4/docs/specs/lodge-app.md), [`docs/specs/search.md`](https://github.com/frostyard/frostmail/blob/df106558209fad29c63983710a1a646557064dd4/docs/specs/search.md)
- [`docs/plans/0002-roadmap.md`](https://github.com/frostyard/frostmail/blob/df106558209fad29c63983710a1a646557064dd4/docs/plans/0002-roadmap.md), [`docs/plans/0010-m7-microsoft-and-windows.md`](https://github.com/frostyard/frostmail/blob/df106558209fad29c63983710a1a646557064dd4/docs/plans/0010-m7-microsoft-and-windows.md), [`docs/plans/0011-m8-mail-in-lodge.md`](https://github.com/frostyard/frostmail/blob/df106558209fad29c63983710a1a646557064dd4/docs/plans/0011-m8-mail-in-lodge.md)
- [`internal/store/store.go`](https://github.com/frostyard/frostmail/blob/df106558209fad29c63983710a1a646557064dd4/internal/store/store.go)
- No package: the Flatpak index [`apps.json`](https://github.com/frostyard/flatpak-index/blob/ce9f016860ed19d8e532facb605b7b9635f380cd/apps.json) at `ce9f016860ed19d8e532facb605b7b9635f380cd` has no entry, and the Homebrew tap [`Casks`](https://github.com/frostyard/homebrew-tap/tree/afd829de04b62b37f20a97d2a67fdfe4b477606f/Casks) at `afd829de04b62b37f20a97d2a67fdfe4b477606f` holds only `chairlift.rb` and `nsl.rb`. The Frostyard APT index [`Packages`](https://repository.frostyard.org/debian/dists/trixie/main/binary-amd64/Packages) for trixie on amd64, checked 2026-10-26, lists no package.
