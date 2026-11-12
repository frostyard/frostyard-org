---
title: Frostmail
description: "Frostmail is a mail client that works like Apple Mail.app, for Linux and Windows, with a daemon, an app, and a CLI. Pre-release; install the desktop app from the Frostyard Flatpak remote."
follows:
  repo: frostyard/frostmail
  tag: v0.6.0
---

Frostmail is a mail client that works like Apple Mail.app. It runs on Linux
and on Windows. It keeps your mail, contacts, calendars, and tasks in a
daemon on your machine, and the app and the command line talk to it.

- `maild` is a per-user Go daemon. It syncs your mail, keeps a SQLite cache
  with full-text search, and serves a JSON-RPC socket.
- The app is a native Go app, drawn with MyGo and frostui. It shows each
  message in a web view: WebKitGTK on Linux, WebView2 on Windows. lodge
  serves a React web app of the same mail.
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

Frostmail is pre-release. The latest release is v0.6.0. Its Flatpak,
`org.frostyard.Frostmail`, is in the
[Frostyard Flatpak remote](/docs/get-software/#flatpak). The release also
attaches `frostyard-maild_X.Y.Z_amd64.deb`, for lodge's host. The `.deb` holds
`maild`, `mailctl`, the units, the `frostmail` user, and the web build for
lodge's mail app. Frostmail is not in the Frostyard APT repository or the
Frostyard Homebrew tap. On a Frostyard image, the
[maild system extension](/docs/sysexts/maild/) installs `maild` for lodge's
host.

Release v0.5.0 adds a Follow Up section to the sidebar: sent mail with no
reply for 3 days or more. With maild v0.5.0 on lodge's host and lodge v0.2.0
or later, Frostmail's rail button shows the unread count of your inboxes. The
maild system extension can trail the latest release. The
[catalog](/docs/sysexts/) lists the version it ships. The Flatpak and the
`.deb` of v0.6.0 come from the same commit.

Release v0.6.0 replaces the desktop app with a native Go app. Your mail,
accounts, and the install steps stay the same. v0.6.0 adds database
migrations, so v0.5.0 cannot open the database after v0.6.0 has run. It also adds snippets that you
insert from compose, a command palette (Ctrl+Shift+P), Find in the message
shown (Ctrl+F), and replies that quote the text you select in the reader. Read
messages in a conversation collapse to 1 row each. The reader warns "Sender
not verified" when the provider's sender checks fail. Compose asks before it
sends when the text mentions an attachment that is missing. A search says how
far it looked, and you choose each account's sync window in Settings. Erase
Deleted Items and Erase Junk Mail remove old mail from Trash and Junk when you
ask.

From v0.6.0, `maild`, `mailctl`, and the app write their panics and a few
coded errors to the local systemd journal. They send nothing over the
network. On a Frostyard image, [ChairLift](/docs/tools/chairlift/) can show
these records, and it sends nothing without your consent.

The Flatpak carries `maild` and `mailctl`, and its launcher starts its own
local `maild`. Local is the default, and [lodge](/docs/apps/lodge/) is a
connection you choose: nothing turns it on for you, and a change of mode never
copies, moves, merges, or deletes your data.

The first launch asks the Background portal to let `maild` run in the
background and start at login. If you refuse, `maild` runs only while a window
is open, so sync, Send Later, and notifications wait until you open the app.

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
`~/.local/bin` with a systemd user service, and `make install-app` builds the
app with Go and installs it as a local Flatpak. The local build has the same
app ID as the Flatpak from the remote: install one of the two at a time. The
[install steps](https://github.com/frostyard/frostmail/blob/main/docs/design/desktop.md#installing-for-one-user)
for one user are the canonical ones. Behind [lodge](/docs/apps/lodge/), `maild`
runs as the system user `frostmail` on lodge's host. To check the release
`.deb` before you install it, run
`gh attestation verify frostyard-maild_X.Y.Z_amd64.deb --repo frostyard/frostmail`.

## Documentation

- [README](https://github.com/frostyard/frostmail/blob/main/README.md): what Frostmail is and what works now.
- [Problem records](https://github.com/frostyard/frostmail/blob/main/docs/adr/0049-record-problems-in-the-local-journal.md): what the app writes to the journal, and how to read it.
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
- [The desktop app in MyGo](https://github.com/frostyard/frostmail/blob/main/docs/plans/0015-mygo-desktop.md): the native app and its parity with the old app.
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

Reviewed 2026-11-11.

- Frostmail release v0.6.0 commit [`f505fcb8d5310d0a9ad245f3e906f10a61bcef15`](https://github.com/frostyard/frostmail/tree/f505fcb8d5310d0a9ad245f3e906f10a61bcef15), released 2026-11-11. Its [release](https://github.com/frostyard/frostmail/releases/tag/v0.6.0) attaches only `frostyard-maild_0.6.0_amd64.deb`. The tag `v0.6.0` is the commit of the release candidate `v0.6.0-rc.1`.
- The Flatpak at v0.6.0: the live Frostyard catalogue, checked 2026-11-11, lists `org.frostyard.Frostmail` at digest `sha256:6321577ba8ce08377d39bc5c161bf210748abecc267809b7f0f9fcd17e325214`, built from `f505fcb8`, with the release `0.6.0` in its AppStream data.
- The native app: [frostmail#223](https://github.com/frostyard/frostmail/pull/223), [`docs/adr/0054-draw-the-desktop-app-natively-with-mygo-and-frostui.md`](https://github.com/frostyard/frostmail/blob/f505fcb8d5310d0a9ad245f3e906f10a61bcef15/docs/adr/0054-draw-the-desktop-app-natively-with-mygo-and-frostui.md), [`docs/plans/0015-mygo-desktop.md`](https://github.com/frostyard/frostmail/blob/f505fcb8d5310d0a9ad245f3e906f10a61bcef15/docs/plans/0015-mygo-desktop.md), [`README.md`](https://github.com/frostyard/frostmail/blob/f505fcb8d5310d0a9ad245f3e906f10a61bcef15/README.md), and [`docs/design/desktop.md`](https://github.com/frostyard/frostmail/blob/f505fcb8d5310d0a9ad245f3e906f10a61bcef15/docs/design/desktop.md) (Installing for one user, The Flatpak in CI, The Flatpak's own maild, Windows). `make install-app` depends on `desktop-build`, a Go build: [`Makefile`](https://github.com/frostyard/frostmail/blob/f505fcb8d5310d0a9ad245f3e906f10a61bcef15/Makefile).
- v0.6.0's features: snippets [frostmail#192](https://github.com/frostyard/frostmail/pull/192), the command palette [frostmail#210](https://github.com/frostyard/frostmail/pull/210), find in the message [frostmail#219](https://github.com/frostyard/frostmail/pull/219), the quoted selection [frostmail#220](https://github.com/frostyard/frostmail/pull/220), collapsed read messages [frostmail#211](https://github.com/frostyard/frostmail/pull/211), "Sender not verified" [frostmail#169](https://github.com/frostyard/frostmail/pull/169), the missing attachment [frostmail#168](https://github.com/frostyard/frostmail/pull/168), the search's reach and the sync window [frostmail#209](https://github.com/frostyard/frostmail/pull/209), erasing Trash and Junk [frostmail#221](https://github.com/frostyard/frostmail/pull/221); [`docs/specs/ui.md`](https://github.com/frostyard/frostmail/blob/f505fcb8d5310d0a9ad245f3e906f10a61bcef15/docs/specs/ui.md) (Command palette, Find in the message). The native app's code has each one under `internal/desktop/`; `internal/desktop/mainwin/mainwin_test.go` tests that Ctrl+Shift+P opens the palette.
- The migrations of v0.6.0: [`internal/store/migrations`](https://github.com/frostyard/frostmail/tree/f505fcb8d5310d0a9ad245f3e906f10a61bcef15/internal/store/migrations) adds `0021_snippets.sql` and `0022_erase_old.sql` after v0.5.0.
- Problem records: [frostmail#157](https://github.com/frostyard/frostmail/pull/157) and [`docs/adr/0049-record-problems-in-the-local-journal.md`](https://github.com/frostyard/frostmail/blob/f505fcb8d5310d0a9ad245f3e906f10a61bcef15/docs/adr/0049-record-problems-in-the-local-journal.md).
- Frostmail release v0.5.0 commit [`88d71ce16bcc4035aa080a2a7ca46f441d92ac77`](https://github.com/frostyard/frostmail/tree/88d71ce16bcc4035aa080a2a7ca46f441d92ac77), released 2026-11-07. Its [release](https://github.com/frostyard/frostmail/releases/tag/v0.5.0) attaches only `frostyard-maild_0.5.0_amd64.deb`. The tag `v0.5.0` is the commit of the release candidate `v0.5.0-rc.1`.
- The Flatpak: the live Frostyard catalogue (its `Last-Modified` is 2026-11-07 20:55:15 GMT) lists `org.frostyard.Frostmail` at digest `sha256:0e6f1e07c475224c4a315d2705e9c867d2f6a19b33d5a83807c7257b747ec07b`, built from `88d71ce1`, with the release `0.5.0` in its AppStream data ([frostmail#152](https://github.com/frostyard/frostmail/pull/152) stamps it). [`packaging/flatpak/org.frostyard.Frostmail.json`](https://github.com/frostyard/frostmail/blob/88d71ce16bcc4035aa080a2a7ca46f441d92ac77/packaging/flatpak/org.frostyard.Frostmail.json) (runtime `org.gnome.Platform` 51).
- Follow Up: [frostmail#153](https://github.com/frostyard/frostmail/pull/153), [`docs/specs/ui.md`](https://github.com/frostyard/frostmail/blob/88d71ce16bcc4035aa080a2a7ca46f441d92ac77/docs/specs/ui.md) (Sidebar, Follow Up) and [`docs/specs/parity.md`](https://github.com/frostyard/frostmail/blob/88d71ce16bcc4035aa080a2a7ca46f441d92ac77/docs/specs/parity.md) (P-413).
- The lodge badge: [frostmail#154](https://github.com/frostyard/frostmail/pull/154) and [`docs/specs/lodge-app.md`](https://github.com/frostyard/frostmail/blob/88d71ce16bcc4035aa080a2a7ca46f441d92ac77/docs/specs/lodge-app.md) (`badge`). lodge draws it from [lodge#45](https://github.com/frostyard/lodge/pull/45) (merge commit `58cd0c5`), which [lodge v0.2.0](https://github.com/frostyard/lodge/releases/tag/v0.2.0) contains. maild sends `badge` from v0.5.0: frostmail#154 is not in v0.4.1. The maild system extension: [snosi#1257](https://github.com/frostyard/snosi/pull/1257), merged 2026-11-09, pins maild 0.5.0, and [`SHA256SUMS`](https://repository.frostyard.org/ext/maild/SHA256SUMS), checked 2026-11-11, lists 0.2.0, 0.3.0, 0.4.1 and 0.5.0.
- The release path: [`docs/adr/0048-tag-each-release-on-its-tested-candidates-commit.md`](https://github.com/frostyard/frostmail/blob/88d71ce16bcc4035aa080a2a7ca46f441d92ac77/docs/adr/0048-tag-each-release-on-its-tested-candidates-commit.md).
- Frostyard Flatpak remote: flatpak-index [`README.md`](https://github.com/frostyard/flatpak-index/blob/4828c9836d451aaa7376483737d25a764b4e17bd/README.md) and [`apps.json`](https://github.com/frostyard/flatpak-index/blob/4828c9836d451aaa7376483737d25a764b4e17bd/apps.json) at `4828c9836d451aaa7376483737d25a764b4e17bd`, after [flatpak-index#6](https://github.com/frostyard/flatpak-index/pull/6), merged 2026-10-29.
- Install text: flatpak-index [`README.md`](https://github.com/frostyard/flatpak-index/blob/4828c9836d451aaa7376483737d25a764b4e17bd/README.md) at `4828c9836d451aaa7376483737d25a764b4e17bd` ([flatpak-index#7](https://github.com/frostyard/flatpak-index/pull/7), merged 2026-10-30): the per-user remote and the Flathub user remote.
- The per-user remote: Brian's decisions T532a (2026-10-29) and T532b: every user adds the remote. A fresh Snow install has no `frostyard` remote, user or system (Murbella's check, T540).
- The Flathub user remote: a test on 2026-10-30 with Flatpak 1.16.6 and an empty user installation. Without Flathub as a user remote, `flatpak install --user` fails with `requires the runtime org.gnome.Platform/x86_64/51 which was not found`.
- [`README.md`](https://github.com/frostyard/frostmail/blob/88d71ce16bcc4035aa080a2a7ca46f441d92ac77/README.md)
- [`docs/design/desktop.md`](https://github.com/frostyard/frostmail/blob/88d71ce16bcc4035aa080a2a7ca46f441d92ac77/docs/design/desktop.md) (sections Installing for one user, The Flatpak in CI, The Flatpak's own maild, Windows), [`docs/design/accounts.md`](https://github.com/frostyard/frostmail/blob/88d71ce16bcc4035aa080a2a7ca46f441d92ac77/docs/design/accounts.md), [`docs/design/overview.md`](https://github.com/frostyard/frostmail/blob/88d71ce16bcc4035aa080a2a7ca46f441d92ac77/docs/design/overview.md)
- [`docs/specs/lodge-app.md`](https://github.com/frostyard/frostmail/blob/88d71ce16bcc4035aa080a2a7ca46f441d92ac77/docs/specs/lodge-app.md), [`docs/specs/search.md`](https://github.com/frostyard/frostmail/blob/88d71ce16bcc4035aa080a2a7ca46f441d92ac77/docs/specs/search.md)
- [`docs/plans/0002-roadmap.md`](https://github.com/frostyard/frostmail/blob/88d71ce16bcc4035aa080a2a7ca46f441d92ac77/docs/plans/0002-roadmap.md), [`docs/plans/0010-m7-microsoft-and-windows.md`](https://github.com/frostyard/frostmail/blob/88d71ce16bcc4035aa080a2a7ca46f441d92ac77/docs/plans/0010-m7-microsoft-and-windows.md), [`docs/plans/0011-m8-mail-in-lodge.md`](https://github.com/frostyard/frostmail/blob/88d71ce16bcc4035aa080a2a7ca46f441d92ac77/docs/plans/0011-m8-mail-in-lodge.md), [`docs/plans/0013-m6-the-standalone-desktop-flatpak.md`](https://github.com/frostyard/frostmail/blob/88d71ce16bcc4035aa080a2a7ca46f441d92ac77/docs/plans/0013-m6-the-standalone-desktop-flatpak.md)
- [`docs/adr/0046-the-desktop-flatpak-carries-its-own-maild.md`](https://github.com/frostyard/frostmail/blob/88d71ce16bcc4035aa080a2a7ca46f441d92ac77/docs/adr/0046-the-desktop-flatpak-carries-its-own-maild.md) (Accepted 2026-10-28)
- A refused Background portal: [`docs/adr/0046-the-desktop-flatpak-carries-its-own-maild.md`](https://github.com/frostyard/frostmail/blob/88d71ce16bcc4035aa080a2a7ca46f441d92ac77/docs/adr/0046-the-desktop-flatpak-carries-its-own-maild.md) (amended 2026-10-29, Brian, T491c) and [`docs/design/desktop.md`](https://github.com/frostyard/frostmail/blob/88d71ce16bcc4035aa080a2a7ca46f441d92ac77/docs/design/desktop.md) (section The Flatpak's own maild).
- [`internal/store/store.go`](https://github.com/frostyard/frostmail/blob/88d71ce16bcc4035aa080a2a7ca46f441d92ac77/internal/store/store.go)
- Suite rule: core [`docs/adr/0062-make-desktop-suite-apps-standalone-flatpaks-with-opt-in-lodge.md`](https://github.com/frostyard/core/blob/4d340b939fccab2ecb7f0be5dbf9e7ab7c03963c/docs/adr/0062-make-desktop-suite-apps-standalone-flatpaks-with-opt-in-lodge.md) (Accepted 2026-10-27) at `4d340b939fccab2ecb7f0be5dbf9e7ab7c03963c`.
- snosi PR [snosi#1169](https://github.com/frostyard/snosi/pull/1169), merged 2026-10-28, adds the notesd and maild extensions.
- No APT or Homebrew package: the Homebrew tap [`Casks`](https://github.com/frostyard/homebrew-tap/tree/8dfab8783f6b22e6333656aa317b5aac2611d5f7/Casks) at `8dfab8783f6b22e6333656aa317b5aac2611d5f7` holds only `chairlift.rb` and `nsl.rb`. The Frostyard APT index [`Packages`](https://repository.frostyard.org/debian/dists/trixie/main/binary-amd64/Packages) for trixie on amd64, checked 2026-11-01, lists no Frostmail package.
