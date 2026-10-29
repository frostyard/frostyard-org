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

Frostmail is pre-release. The latest release is v0.3.0. Each release
attaches one package, `frostyard-maild_X.Y.Z_amd64.deb`, for lodge's host. It holds `maild`, `mailctl`, the units, the `frostmail`
user, and the web build for lodge's mail app. The desktop app has no
package. Frostmail is not in the Frostyard APT repository, the Frostyard
Flatpak remote, or the Frostyard Homebrew tap. On a Frostyard image, the
[maild system extension](/docs/sysexts/maild/) installs it.

A standalone desktop Flatpak, `org.frostyard.Frostmail`, is in
release-candidate testing. It carries `maild` and `mailctl`, and its launcher
starts its own local `maild`. Local is the default, and
[lodge](/docs/apps/lodge/) is a connection you choose: nothing turns it on
for you, and a change of mode never copies, moves, merges, or deletes your
data unless you confirm it. Secrets in its own keyring namespace, Save As
through the file chooser portal, the first run, and the change of mode are
built. The Flatpak is not in the Frostyard Flatpak remote yet, and release
v0.3.0 has no Flatpak.

Mail in lodge is built and still in progress. Its last step, the move of a
real mail store to lodge's host, has not run yet. Calendar, task, and
contact tools for agents are built. Google and Microsoft verification are planned.

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
- [The standalone desktop Flatpak](https://github.com/frostyard/frostmail/blob/main/docs/plans/0013-m6-the-standalone-desktop-flatpak.md): the plan for the coming Flatpak.
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

Reviewed 2026-10-29.

- Frostmail release v0.3.0 commit [`89243ae6753d6da11947c6fd7023c84ad0ce59d7`](https://github.com/frostyard/frostmail/tree/89243ae6753d6da11947c6fd7023c84ad0ce59d7), released 2026-10-28. Its [release](https://github.com/frostyard/frostmail/releases/tag/v0.3.0) attaches only `frostyard-maild_0.3.0_amd64.deb`.
- Frostmail `main` at [`32d764c1dfd59d5178621bcf17290a6e6dc68963`](https://github.com/frostyard/frostmail/tree/32d764c1dfd59d5178621bcf17290a6e6dc68963): [`docs/plans/0013-m6-the-standalone-desktop-flatpak.md`](https://github.com/frostyard/frostmail/blob/32d764c1dfd59d5178621bcf17290a6e6dc68963/docs/plans/0013-m6-the-standalone-desktop-flatpak.md) (Status, 2026-10-29: Phases 2 to 7 built; Phase 8's workflow built in PR #143; Phase 8's test remote and Phases 9 and 10 not done).
- Frostmail v0.1.0 commit [`df106558209fad29c63983710a1a646557064dd4`](https://github.com/frostyard/frostmail/tree/df106558209fad29c63983710a1a646557064dd4)
- [`README.md`](https://github.com/frostyard/frostmail/blob/df106558209fad29c63983710a1a646557064dd4/README.md)
- [`docs/design/desktop.md`](https://github.com/frostyard/frostmail/blob/df106558209fad29c63983710a1a646557064dd4/docs/design/desktop.md), [`docs/design/accounts.md`](https://github.com/frostyard/frostmail/blob/df106558209fad29c63983710a1a646557064dd4/docs/design/accounts.md), [`docs/design/overview.md`](https://github.com/frostyard/frostmail/blob/df106558209fad29c63983710a1a646557064dd4/docs/design/overview.md)
- [`docs/specs/lodge-app.md`](https://github.com/frostyard/frostmail/blob/df106558209fad29c63983710a1a646557064dd4/docs/specs/lodge-app.md), [`docs/specs/search.md`](https://github.com/frostyard/frostmail/blob/df106558209fad29c63983710a1a646557064dd4/docs/specs/search.md)
- [`docs/plans/0002-roadmap.md`](https://github.com/frostyard/frostmail/blob/df106558209fad29c63983710a1a646557064dd4/docs/plans/0002-roadmap.md), [`docs/plans/0010-m7-microsoft-and-windows.md`](https://github.com/frostyard/frostmail/blob/df106558209fad29c63983710a1a646557064dd4/docs/plans/0010-m7-microsoft-and-windows.md), [`docs/plans/0011-m8-mail-in-lodge.md`](https://github.com/frostyard/frostmail/blob/df106558209fad29c63983710a1a646557064dd4/docs/plans/0011-m8-mail-in-lodge.md)
- [`internal/store/store.go`](https://github.com/frostyard/frostmail/blob/df106558209fad29c63983710a1a646557064dd4/internal/store/store.go)
- Frostmail `main` at [`9c91d183f4946dc0fb966e58f1748ac7028e590a`](https://github.com/frostyard/frostmail/tree/9c91d183f4946dc0fb966e58f1748ac7028e590a), after PR #126 (merge commit `433ae7059429b98093b48d8ee12a4e349fead5eb`): [`docs/plans/0013-m6-the-standalone-desktop-flatpak.md`](https://github.com/frostyard/frostmail/blob/9c91d183f4946dc0fb966e58f1748ac7028e590a/docs/plans/0013-m6-the-standalone-desktop-flatpak.md) (Status, 2026-10-28: Phases 2 and 3 are built in PR #126; Phases 4 to 10 are not built) and [`docs/adr/0046-the-desktop-flatpak-carries-its-own-maild.md`](https://github.com/frostyard/frostmail/blob/9c91d183f4946dc0fb966e58f1748ac7028e590a/docs/adr/0046-the-desktop-flatpak-carries-its-own-maild.md) (Accepted 2026-10-28).
- Frostmail release v0.2.0 commit [`0424a736cc44a4ab8a0bfb247a8d445c0b967387`](https://github.com/frostyard/frostmail/tree/0424a736cc44a4ab8a0bfb247a8d445c0b967387), released 2026-10-28. It includes PR #126 and PR #129, and its [release](https://github.com/frostyard/frostmail/releases/tag/v0.2.0) attaches only `frostyard-maild_0.2.0_amd64.deb`.
- Suite rule: core [`docs/adr/0062-make-desktop-suite-apps-standalone-flatpaks-with-opt-in-lodge.md`](https://github.com/frostyard/core/blob/4d340b939fccab2ecb7f0be5dbf9e7ab7c03963c/docs/adr/0062-make-desktop-suite-apps-standalone-flatpaks-with-opt-in-lodge.md) (Accepted 2026-10-27) at `4d340b939fccab2ecb7f0be5dbf9e7ab7c03963c`.
- snosi PR [snosi#1169](https://github.com/frostyard/snosi/pull/1169), merged 2026-10-28, adds the notesd and maild extensions.
- No package: the Flatpak index [`apps.json`](https://github.com/frostyard/flatpak-index/blob/36eafa7332b1b63fc78a4c2609ab7ebc10705874/apps.json) at `36eafa7332b1b63fc78a4c2609ab7ebc10705874` has no entry, and the Homebrew tap [`Casks`](https://github.com/frostyard/homebrew-tap/tree/afd829de04b62b37f20a97d2a67fdfe4b477606f/Casks) at `afd829de04b62b37f20a97d2a67fdfe4b477606f` holds only `chairlift.rb` and `nsl.rb`. The Frostyard APT index [`Packages`](https://repository.frostyard.org/debian/dists/trixie/main/binary-amd64/Packages) for trixie on amd64, checked 2026-10-29, lists no package.
