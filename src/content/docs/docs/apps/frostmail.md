---
title: Frostmail
description: "Build Frostmail from source, run its daemon and CLI, and add a mail account. Pre-release: there is no installer yet."
---

Frostmail is a mail client that works like Apple Mail.app. It has three
parts: `maild`, a per-user daemon that syncs your accounts and keeps a local
search index; the desktop app, a Tauri window; and `mailctl`, a command-line
client of the same daemon. The daemon can also serve a browser or a phone as
the mail app of [lodge](https://github.com/frostyard/lodge).

Frostmail is pre-release. The repository has no release, and Frostmail is not
in the Frostyard APT repository, the Frostyard Flatpak remote, or the
Frostyard Homebrew tap. You build it from source with the steps below.

## Status

Working now:

- Sync, read, search, and send for generic IMAP, Gmail, iCloud, and
  Outlook.com accounts.
- Contacts, calendars, and tasks over CardDAV, CalDAV, Google Tasks, and
  Microsoft Graph. You can answer invitations from the reader, edit events and
  contacts in place, and keep a To-Do bar beside the inbox.
- Rules, smart mailboxes, VIPs, Send Later, and Remind Me.

In progress: mail inside lodge. The web build, the agent endpoint, and the
desktop app's remote mode are built and not yet used with a real mailbox.

Planned: packaging, which means a Flatpak built in the SDK and Google and
Microsoft verification of Frostmail's sign-in clients.

## Before you start

You need:

- Go 1.27, `make`, and `git`.
- A Linux session with systemd user services, so `maild` can run in the
  background.
- For the desktop app: an x86-64 host with [nsl](/docs/tools/nsl/), and Flatpak
  with the GNOME 51 runtime. The app is built inside an nsl machine and then
  wrapped in a local Flatpak.

## Install maild and mailctl

Frostmail has no release tags, so you build `main`. If a step fails, read the
repository's README: `main` can change.

Clone the repository and install:

```bash
git clone https://github.com/frostyard/frostmail
cd frostmail
make install
```

`make install` builds both programs, copies them to `~/.local/bin`, installs
`maild.service` as a systemd user service, and enables and restarts it.
`~/.local/bin` must be on your `PATH`.

Check that the daemon runs:

```bash
mailctl hello
```

It prints `maild`, its version, and `(protocol 1)`.

Your mail data stays in `$XDG_DATA_HOME/frostmail` and its cache in
`$XDG_CACHE_HOME/frostmail`. The daemon's socket is
`$XDG_RUNTIME_DIR/frostmail/maild.sock`.

## Add an account

Connect an account by its address. This example uses a password and marks the
account read-only, so Frostmail never changes anything on the server while you
try it:

```bash
read -rs PASSWORD && printf '%s\n' "$PASSWORD" | mailctl account connect you@example.com --password-stdin --read-only; unset PASSWORD
```

`mailctl` finds the servers for the address and prints `added account` with
the account's ID, then `password stored`.

If it prints `no servers found`, give the servers yourself:

```bash
mailctl account add you@example.com --imap mail.example.com:993 --smtp mail.example.com:465 --password-stdin
```

It prints `added account` and the account's ID. A port other than 993, 465, 143, 587, or 25
needs a mode: `host:port/tls`, `host:port/starttls`, or `host:port/insecure`.

For Gmail, iCloud, and Outlook.com, see [Accounts](#accounts).

Sync and look at the mailboxes:

```bash
mailctl sync --wait
mailctl mailboxes
```

`sync --wait` returns when every account is up to date. `mailboxes` lists each
mailbox with an ID, its role, and its counts.

Read from a mailbox, using an ID from that list:

```bash
mailctl ls MAILBOX_ID
mailctl show MESSAGE_ID
```

`ls` lists the newest messages first, and `show` prints one message. Other
commands include `mailctl search TERMS`, `mailctl send`, and
`mailctl verify`, which compares the stored mail with the server and changes
nothing. `mailctl --help` lists them all, including calendar, contacts, tasks,
and rules.

To keep only recent mail, add `--sync-days N` to `account connect`. This is
useful for a large Gmail account, since Gmail limits IMAP downloads to
2,500 MB a day. Without it, Frostmail keeps every message.

## Install the desktop app

The app runs from a local Flatpak that you build yourself. You build it in an
nsl machine, because an image-based host cannot install the WebKitGTK
development packages.

Create the build machine, from the repository root:

```bash
nsl create frostmail --distro debian:13
nsl run -m frostmail --root bash dev/nsl/provision.sh "$(id -un)"
```

The script installs the Node, Go, and Rust toolchains and the WebKitGTK
development packages in the machine. Re-running it is safe.

Install the Flatpak runtime if you do not have it:

```bash
flatpak --user install flathub org.gnome.Platform//51
```

Build and install the app:

```bash
make install-app
```

It ends with `installed org.frostyard.Frostmail; run it from the app menu or with frostmail`.

Start it from the app menu, or run `frostmail`. The app talks to the `maild`
you installed above. It is a single-instance app: a second launch focuses the
first window. `maild` keeps syncing and sending mail while the app is closed,
and a click on a new-mail notification opens that message.

## Accounts

| Account | Sign-in | What you need |
| --- | --- | --- |
| Generic IMAP | Password | The address. Servers come from autoconfig, the Thunderbird ISPDB, or SRV records, or you enter them. |
| Gmail | OAuth, or an app password | Your own Google OAuth client. See below. |
| iCloud | App-specific password | An app-specific password from account.apple.com, under Sign-In and Security. |
| Outlook.com and Hotmail | OAuth | Nothing. Frostmail's own sign-in client is built in. |

### Gmail

Frostmail has no verified Google client yet, so you register your own once:

1. In the Google Cloud console, create a project and enable the Gmail API.
2. Set up the OAuth consent screen with audience External and the scope
   `https://mail.google.com/`. Publish the app so its status is In production.
   In Testing, refresh tokens expire after 7 days. The app stays unverified, so
   Google shows a warning screen at sign-in. Accept it for your own client.
3. Create an OAuth client ID of type Desktop app.
4. Give the client ID and secret to `maild`:

   ```bash
   mailctl oauth set-client google --client-id CLIENT_ID --secret-stdin
   ```

   Type or paste the client secret, then press Enter. The command prints
   `google client set with its secret`.

Then sign in:

```bash
mailctl account connect you@gmail.com --oauth
```

`mailctl` prints an address to open in your browser. After you approve, it
prints `signed in`. It waits 5 minutes by default.

For a password instead, turn on 2-Step Verification, create an app password at
myaccount.google.com/apppasswords, and use `--password-stdin` as in the first
example.

### Outlook.com and Hotmail

```bash
mailctl account connect you@outlook.com --oauth
```

The command works as for Gmail. For Microsoft accounts, calendars and contacts
sync over Microsoft Graph.

## Frostmail and lodge

[lodge](https://github.com/frostyard/lodge) is Frostyard's web shell for its
own apps. It is the only process on your tailnet. When `maild` runs as lodge's
`mail` app, one daemon serves your phone, your browsers, the desktop app, and
agents.

In that mode:

- `maild --lodge` runs as the system user `frostmail`. It listens on
  `/run/lodge/apps/mail.sock`, which only lodge's user can open. Secrets go to
  a file in `/var/lib/frostmail`, because a system service has no Secret
  Service.
- lodge serves the web build at `/app/mail/`. You build it with
  `make web-build`.
- The desktop app can use that daemon instead of a local one. You set
  `{"lodge": "https://lodge.<tailnet>.ts.net"}` in
  `$XDG_CONFIG_HOME/frostmail/app.json`, or choose it in Settings, in the
  Server pane. For the Flatpak, the file is
  `~/.var/app/org.frostyard.Frostmail/config/frostmail/app.json`.
- Agents reach mail at lodge's `/mcp/mail` with a scoped token. A read scope
  gives `list_mailboxes`, `search_messages`, and `read_thread`. Adding
  `;write` allows flags, moves, drafts, tasks, and Remind Me. Adding `;send`
  allows sending a draft after your undo delay. No agent tool deletes mail.
- Run `mailctl` on that machine as the `frostmail` user:
  `sudo -u frostmail mailctl hello`.
- When a sign-in cannot reach `maild`'s loopback address, as behind lodge,
  finish it with the address your browser was sent to:
  `mailctl account finish-signin URL`.

To stage `maild`, its units, and the web build as a lodge app, run
`make web-build` and then `make lodge-package`. The staged tree goes under
`build/lodge-root` unless you set `LODGE_DESTDIR`. Frostmail has no package for
this yet, and lodge is pre-release too, so you set the rest up by hand.

## Remove

```bash
make uninstall
flatpak --user uninstall org.frostyard.Frostmail
rm ~/.local/bin/frostmail
```

`make uninstall` stops and removes `maild`, `mailctl`, and the user service,
and keeps your mail data. The last two commands remove the app and its
launcher.

## Limits

- Gmail needs your own Google OAuth client until Frostmail has a verified one.
- Microsoft work and school accounts are not supported yet. Outlook.com and
  Hotmail are.
- Frostmail also has a Windows build. This page covers Linux.

## See also

- [nsl](/docs/tools/nsl/): the machine that builds the app
- [Frostnotes](/docs/apps/frostnotes/): the notes app from the same project
- [Frostmail repository](https://github.com/frostyard/frostmail)
- [lodge](https://github.com/frostyard/lodge)

## Sources

Reviewed 2026-10-22.

- Frostmail commit [`c713a5a0bb8daa411c27f0647755fed9b5efff47`](https://github.com/frostyard/frostmail/tree/c713a5a0bb8daa411c27f0647755fed9b5efff47) on `main`. There is no release.
- [`README.md`](https://github.com/frostyard/frostmail/blob/c713a5a0bb8daa411c27f0647755fed9b5efff47/README.md)
- [`Makefile`](https://github.com/frostyard/frostmail/blob/c713a5a0bb8daa411c27f0647755fed9b5efff47/Makefile)
- [`docs/README.md`](https://github.com/frostyard/frostmail/blob/c713a5a0bb8daa411c27f0647755fed9b5efff47/docs/README.md)
- [`docs/design/overview.md`](https://github.com/frostyard/frostmail/blob/c713a5a0bb8daa411c27f0647755fed9b5efff47/docs/design/overview.md)
- [`docs/design/accounts.md`](https://github.com/frostyard/frostmail/blob/c713a5a0bb8daa411c27f0647755fed9b5efff47/docs/design/accounts.md)
- [`docs/design/desktop.md`](https://github.com/frostyard/frostmail/blob/c713a5a0bb8daa411c27f0647755fed9b5efff47/docs/design/desktop.md)
- [`docs/adr/0013-app-as-a-local-flatpak.md`](https://github.com/frostyard/frostmail/blob/c713a5a0bb8daa411c27f0647755fed9b5efff47/docs/adr/0013-app-as-a-local-flatpak.md)
- [`docs/plans/0002-roadmap.md`](https://github.com/frostyard/frostmail/blob/c713a5a0bb8daa411c27f0647755fed9b5efff47/docs/plans/0002-roadmap.md)
- [`docs/plans/0010-m7-microsoft-and-windows.md`](https://github.com/frostyard/frostmail/blob/c713a5a0bb8daa411c27f0647755fed9b5efff47/docs/plans/0010-m7-microsoft-and-windows.md)
- [`docs/plans/0011-m8-mail-in-lodge.md`](https://github.com/frostyard/frostmail/blob/c713a5a0bb8daa411c27f0647755fed9b5efff47/docs/plans/0011-m8-mail-in-lodge.md)
- [`docs/specs/lodge-app.md`](https://github.com/frostyard/frostmail/blob/c713a5a0bb8daa411c27f0647755fed9b5efff47/docs/specs/lodge-app.md)
- [`packaging/systemd/maild.service`](https://github.com/frostyard/frostmail/blob/c713a5a0bb8daa411c27f0647755fed9b5efff47/packaging/systemd/maild.service)
- [`packaging/flatpak/install.sh`](https://github.com/frostyard/frostmail/blob/c713a5a0bb8daa411c27f0647755fed9b5efff47/packaging/flatpak/install.sh)
- [`packaging/lodge/app.json`](https://github.com/frostyard/frostmail/blob/c713a5a0bb8daa411c27f0647755fed9b5efff47/packaging/lodge/app.json), [`packaging/lodge/frostmail.service`](https://github.com/frostyard/frostmail/blob/c713a5a0bb8daa411c27f0647755fed9b5efff47/packaging/lodge/frostmail.service), [`packaging/lodge/frostmail.socket`](https://github.com/frostyard/frostmail/blob/c713a5a0bb8daa411c27f0647755fed9b5efff47/packaging/lodge/frostmail.socket), [`packaging/lodge/stage.sh`](https://github.com/frostyard/frostmail/blob/c713a5a0bb8daa411c27f0647755fed9b5efff47/packaging/lodge/stage.sh)
- [`dev/nsl/provision.sh`](https://github.com/frostyard/frostmail/blob/c713a5a0bb8daa411c27f0647755fed9b5efff47/dev/nsl/provision.sh)
- [`cmd/mailctl/account.go`](https://github.com/frostyard/frostmail/blob/c713a5a0bb8daa411c27f0647755fed9b5efff47/cmd/mailctl/account.go), [`cmd/mailctl/signin.go`](https://github.com/frostyard/frostmail/blob/c713a5a0bb8daa411c27f0647755fed9b5efff47/cmd/mailctl/signin.go), [`cmd/mailctl/show.go`](https://github.com/frostyard/frostmail/blob/c713a5a0bb8daa411c27f0647755fed9b5efff47/cmd/mailctl/show.go), [`cmd/mailctl/list.go`](https://github.com/frostyard/frostmail/blob/c713a5a0bb8daa411c27f0647755fed9b5efff47/cmd/mailctl/list.go)
- No Flatpak and no cask: [`apps.json`](https://github.com/frostyard/flatpak-index/blob/404aa05424b42093eed3e33e823216cf5569c570/apps.json) in the Flatpak index at `404aa05424b42093eed3e33e823216cf5569c570`, and the tap's [`Casks`](https://github.com/frostyard/homebrew-tap/tree/7b7cd158e7e40599ff767f61a272435f84d2da41/Casks) at `7b7cd158e7e40599ff767f61a272435f84d2da41`.
- No APT package: the Frostyard APT index [`Packages`](https://repository.frostyard.org/debian/dists/trixie/main/binary-amd64/Packages) for trixie on amd64, checked 2026-10-22. It lists `frostyard-chairlift`, `frostyard-chairlift-system-integration`, and `frostyard-intuneme`.
- lodge commit [`c3c37b4fcf9880ae4f5f1ea365e89b8bc0b6cf00`](https://github.com/frostyard/lodge/tree/c3c37b4fcf9880ae4f5f1ea365e89b8bc0b6cf00): [`README.md`](https://github.com/frostyard/lodge/blob/c3c37b4fcf9880ae4f5f1ea365e89b8bc0b6cf00/README.md)
