---
title: Frostnotes
description: "Build Frostnotes from source, run notesd, register a vault, and use notesctl, sync, and MCP. Pre-release: there is no installer yet."
---

Frostnotes is a notes app in the spirit of Obsidian. Your notes are plain
markdown files with YAML frontmatter, in a folder you own. A daemon, `notesd`,
watches the folder and keeps a search index. You reach it with `notesctl`, a
desktop app, a web app inside [lodge](https://github.com/frostyard/lodge), or
an agent over MCP.

Frostnotes is pre-release. The repository has no release, and Frostnotes is
not in the Frostyard APT repository, the Frostyard Flatpak remote, or the
Frostyard Homebrew tap. You build it from source with the steps below.

## Status

Working now:

- The vault: `notesd` scans and watches your folders, and indexes full text,
  links, backlinks, tags, and properties. `notesctl` and MCP work against it.
- Sync through a hub, and the desktop app. Both are built and in trial use.

In progress: notes inside lodge. `notesd` runs as lodge's `notes` app, with the
web app and the agent endpoint.

Planned: a graph view and queries (Obsidian Bases files), then packaging: a
Flatpak, a hub container image and systemd unit, and Frostyard APT packages.
Later: Windows and macOS desktop builds, Canvas, and a mobile app.

## Before you start

You need:

- Go 1.27, `make`, and `git`.
- A folder of markdown notes. An Obsidian vault works as it is.
- For the desktop app: an x86-64 host with [nsl](/docs/tools/nsl/).
- For sync and the web app: a machine that runs lodge.

## Build and start notesd

Frostnotes has no release tags, so you build `main`. If a step fails, read the
repository's README: `main` can change.

Clone the repository and build:

```bash
git clone https://github.com/frostyard/frostnotes
cd frostnotes
make build
```

`build/notesd` and `build/notesctl` now exist.

Start the daemon in a terminal of its own, and leave it running:

```bash
build/notesd
```

`notesd` is one daemon for each user. Press Ctrl-C to stop it. The repository
has no user service for it yet.

In another terminal, check that it answers:

```bash
build/notesctl hello
```

It prints `notesd`, its version, and `(protocol 1)`.

## Register a vault

Register your notes folder as a vault:

```bash
build/notesctl vault add ~/Notes
```

It prints `added vault 1` with the vault's name and path. Registering never
writes to the folder. To start a new vault, add `--create`: it makes the
folder first, and its parent must exist.

Search it:

```bash
build/notesctl search quince
```

Each matching note is listed with its path and a snippet, with the match
between `**` marks. `notesd` watches the folder, so a note you edit in another
program shows up in search without a restart.

List and read notes:

```bash
build/notesctl ls
build/notesctl cat Projects/plan.md
```

`ls` takes an optional folder, `--tag`, and `--prop KEY=VALUE`. `cat` prints
the note exactly as stored. `notesctl backlinks PATH` lists the notes that link
to one. With more than one vault, add `--vault NAME` to each command.

Create a note:

```bash
printf '# Ideas\n' | build/notesctl write Inbox/ideas.md --create
```

It prints `created Inbox/ideas.md` and the note's hash. Changing a note you
have already read needs `--base HASH`, the hash of the content you started from.
`notesctl mv PATH TO` and `notesctl rm PATH` move and delete notes.

`notesd` keeps its index and version history in `$XDG_DATA_HOME/frostnotes`,
which must be on a local disk. The vault itself can be anywhere, a network
share included. The notes are the source of truth: the index is derived and
can be rebuilt.

## Open an Obsidian vault

Register the vault as above. `notesd` reads Obsidian's settings for daily
notes, templates, link format, and property types from the vault's `.obsidian`
folder, until Frostnotes has settings of its own in `.frostnotes/`. It writes
`.frostnotes/` only when you change a setting. Wikilinks, embeds, tags,
callouts, and properties work as in Obsidian, and links resolve by Obsidian's
rules.

`notesd` skips every dot-folder: `.obsidian/`, `.git/`, `.trash/`, and
`.stfolder/` are not notes.

## Versions and revert

Every write is kept as a version for 30 days: yours, an agent's, and an edit
made by another program. The newest version of a note is kept however old it
is.

List a note's versions, newest first:

```bash
build/notesctl versions Projects/plan.md
```

Each line has the version's ID, its time, its source (`editor`, `outside`,
`agent`, or `sync`), the author, a short hash, and the path.

Restore one. `revert` needs the note's current hash as its base, which
`cat --json` prints:

```bash
build/notesctl cat --json Projects/plan.md
build/notesctl revert Projects/plan.md VERSION --base HASH
```

It prints `reverted Projects/plan.md to version`, with the version and the new
hash. A deleted note needs no `--base`: `revert` brings it back.

Every write names the version it changes. If the note changed since, `notesd`
merges the two three ways. Where both sides changed the same text, the newer
side stands and your content is kept as a conflict version, so nothing you
typed is lost.

## Sync with a hub

Each device syncs with a self-hosted hub: a `notesd` in a hub role that keeps
every revision and merges edits made at the same time. You get no conflict
copies. A device that cannot reach the hub keeps working and pushes when the
hub returns.

A hub runs on lodge's machine as lodge's `notes` app, as the system user
`frostnotes`. The repository ships the service and socket units, a `sysusers.d`
entry, and the lodge manifest in `packaging/`. It has no package for them, so
you install lodge and set the hub up by hand. The unit runs
`/usr/bin/notesd -lodge`, keeps its data in `/var/lib/frostnotes`, and needs a
vault folder that the `frostnotes` user can write.

On the hub, register the vault and serve it. Name the socket, because `sudo`
does not pass `XDG_RUNTIME_DIR`:

```bash
sudo -u frostnotes notesctl --socket /run/frostnotes/notesd.sock vault add /path/to/notes
sudo -u frostnotes notesctl --socket /run/frostnotes/notesd.sock hub serve
```

`hub serve` prints `serving` with the vault's name. With more than one vault,
add `--vault`.

On each device, register the local copy of the vault with `vault add`, then pair
with the hub and sync it. `NAME` is the hub's name for the vault. With more than
one local vault, add `--vault`:

```bash
build/notesctl hub join https://lodge.TAILNET.ts.net/device/notes NAME
```

It prints `approve this device on the hub: notesctl hub approve CODE`. The code
has 8 characters and lasts 10 minutes. Approve it on the hub:

```bash
sudo -u frostnotes notesctl --socket /run/frostnotes/notesd.sock hub approve CODE
```

The device then prints `syncing`, with the vault and its state. A device
refuses a hub address that is not `https://`, except on loopback.

Check a vault against its hub:

```bash
build/notesctl sync status
build/notesctl sync verify
```

`sync verify` prints `ok:` and the number of files that match the hub. On the
hub, `sudo -u frostnotes notesctl --socket /run/frostnotes/notesd.sock hub devices`
lists paired devices, and the same command with `hub revoke ID` ends one
device's sync. That device keeps its own copy of the vault.

`notesctl history PATH` lists a note's revisions on the hub. The hub keeps every
revision's record, and thins the content: every revision for 30 days, then the
last of each day for a year, then the last of each month.

Sync has these limits:

- Each device needs its own copy of a vault. Two devices that share one folder,
  such as a network share mounted on two machines, push each other's changes.
- A hub serves one person's devices. Every paired device can join every vault
  the hub serves.
- Empty folders do not sync. `.frostnotes/`, hidden paths, and ignored paths
  stay on the device.
- Files that are not text, and files over 10 MB, do not merge: the later push
  wins, and the other stays in the hub's log.

## The desktop app

The desktop app is a Tauri window with a CodeMirror 6 editor. It has live
preview and a source mode, a reading view, tabs and splits, a file tree, a
quick switcher, a command palette, search, backlinks and outgoing links, an
outline, properties, version history, a merge view, daily notes, and
templates. It uses Obsidian's default shortcuts. You can open or create a
vault from the app. It is a sibling of [Frostmail](/docs/apps/frostmail/) and
looks like it.

There is no install package for the app yet. To run it, build it in an nsl
machine, from the repository root:

```bash
nsl create frostnotes --distro debian:13
nsl run -m frostnotes --root bash dev/nsl/provision.sh "$(id -un)"
make app-run
```

`make app-run` builds `notesd` and the app, then starts them together in the
machine. That `notesd` is its own: it keeps its data under `/var/tmp/frostnotes`
in the machine, apart from any `notesd` on your host. `make app-build` alone
builds the app into `build/frostnotes-app`. The app runs inside the nsl machine.

Live preview is still growing. Tables, nested lists, and embeds are the hard
cases, and source mode shows the exact text of any note.

## The web app in lodge

[lodge](https://github.com/frostyard/lodge) is Frostyard's web shell for its
own apps. It is the only process on your tailnet: it signs browsers in by their
tailnet identity, and `notesd` listens only on a socket that lodge can open.
The web app is the same interface as the desktop app, with Obsidian's phone
layout on a narrow screen: drawers, a bottom bar, a tab switcher, and an
editing toolbar.

`make web-build` builds the web app in the nsl machine, and `make lodge-app`
lays out `build/lodge/apps/notes` with its manifest and web files. Copy that
folder to `/usr/share/lodge/apps/notes` on lodge's machine.

## Agents over MCP

Agents search, read, and write notes through MCP.

For a local agent, `notesctl mcp` serves one vault over stdin and stdout. This
adds it to Claude Code:

```bash
claude mcp add frostnotes -- "$PWD/build/notesctl" mcp
```

Add `--read-only` after `mcp` to offer only the tools that read.

| Tool | What it does | Writes |
| --- | --- | --- |
| `search_notes` | Full-text search | No |
| `read_note` | A note's text, properties, tags, and hash | No |
| `list_notes` | Notes by folder, tag, or property | No |
| `get_backlinks` | The notes that link to one | No |
| `create_note` | Makes a note | Yes |
| `edit_note` | Replaces text, appends, prepends, or sets properties | Yes |
| `append_to_daily_note` | Adds text to a day's note | Yes |

Each agent write is a version attributed to the MCP client, and `notesctl
revert` undoes it. Every result of a read tool tells the agent that text from
notes is data, not instructions.

Through lodge, an agent reaches `https://lodge.TAILNET.ts.net/mcp/notes` with a
scoped token. You issue one in lodge, with the vault's ID from
`sudo -u frostnotes notesctl --socket /run/frostnotes/notesd.sock vault list`:

```bash
sudo lodgectl token issue NAME --app notes --scope 'vault=ID'
```

Add `;write` to the scope to let the token write. A scope can limit writes to
folders: `'vault=ID;write=Porter/;except=Porter/Routines/;daily'` lets an agent
write under `Porter/`, except in `Porter/Routines/`, and append to today's daily
note. Then add the token to Claude Code, for your user only. Never use
`--scope project`, which writes the token into the repository's `.mcp.json`:

```bash
claude mcp add --transport http notes https://lodge.TAILNET.ts.net/mcp/notes --header "Authorization: Bearer TOKEN"
```

## Update

Frostnotes has no releases, so you move to a newer `main`. Back up the database
first, because `notesd` applies new migrations when it starts, and an earlier
build cannot open the result. Stop `notesd` with Ctrl-C, then copy `notesd.db`
with its `-wal` and `-shm` files out of `$XDG_DATA_HOME/frostnotes`:

```bash
mkdir -p ~/frostnotes-backup
cp "${XDG_DATA_HOME:-$HOME/.local/share}"/frostnotes/notesd.db* ~/frostnotes-backup/
```

Then pull, build, and start it again:

```bash
cd frostnotes
git pull
make build
build/notesd
```

In another terminal, check it:

```bash
build/notesctl hello
```

It prints `notesd`, its version, and `(protocol 1)`. `notesd` applies the pending
migrations in order when it starts. Your vault files do not change.

`notesd` records a checksum for each migration that it applies. If a database
applied another text of a migration (a database from before M2), `notesd`
refuses to start and names the database and the migration. Move that database
aside, with its `-wal` and `-shm` files, and start `notesd` again. It makes a
new one. The new database has no local versions and no sync state. A synced
vault syncs again from its hub, and your files stay.

To update the desktop app, run `make app-run` again.

### On lodge's host

To update the web app and `notesd` that run as lodge's `notes` app, stop the
socket and the service. Back up the data first: copy `notesd.db` and its `-wal`
and `-shm` files out of `/var/lib/frostnotes`.

```bash
sudo systemctl stop frostnotes-lodge.socket frostnotes.service
```

Pull, build, and replace the files. `make lodge-app` runs `make web-build`
itself. Replace the binaries with `install`, not `cp`:

```bash
cd frostnotes
git pull
make build
make lodge-app
sudo install -m 0755 build/notesd build/notesctl /usr/bin/
sudo rm -rf /usr/share/lodge/apps/notes
sudo cp -r build/lodge/apps/notes /usr/share/lodge/apps/notes
sudo systemctl start frostnotes-lodge.socket frostnotes.service
sudo lodgectl reload
```

lodge shows `notes` as `down` while it is stopped. A new web build takes effect
on the next page load. A changed manifest takes effect after `lodgectl reload`.

Update the `notesd` that serves the app and its web build together. The app's
handshake, `rpc.hello`, refuses only a different protocol major, so it does not
catch every pair that does not match.

## Roll back

A database downgrade is not supported. To roll back across a migration, restore
the copy you made before the update. Changes after that copy are lost. Without
a copy, move the database aside, as in [Update](#update): the vault files are
the source of truth, and you lose the local versions and the sync state.

Check out the earlier commit in your clone, then run the same build and start
steps:

```bash
git checkout COMMIT
make build
build/notesd
```

To restore the copy, stop `notesd` first, and copy the files back into
`$XDG_DATA_HOME/frostnotes`. `notesd` stops on a database that is newer than
itself, with `database schema N is newer than this notesd (M)`. On lodge's host,
use the same steps with the update's stop and start commands, and
`/var/lib/frostnotes`, and the files must be owned by `frostnotes`.

To undo a change to one note, not to the software, see
[Versions and revert](#versions-and-revert).

## Remove

To forget a vault, run:

```bash
build/notesctl vault rm ID
```

The vault's index, version history, and sync state go. Its files stay.

To remove Frostnotes, press Ctrl-C in the `notesd` terminal and delete the
cloned repository. Deleting `$XDG_DATA_HOME/frostnotes` also removes every
vault's version history and sync state. A synced vault then syncs again from
its hub.

## Limits

- There is no graph view or query view yet. Ctrl+G opens nothing.
- The desktop app builds for Linux only.
- A note over 10 MB is indexed by name, and the API neither reads nor writes it.

## See also

- [Frostmail](/docs/apps/frostmail/): the mail app from the same project
- [nsl](/docs/tools/nsl/): the machine that builds the app
- [Frostnotes repository](https://github.com/frostyard/frostnotes)
- [lodge](/docs/apps/lodge/)

## Sources

Reviewed 2026-10-22.

- Frostnotes commit [`1b63ff73c0d91e121000e38ca718b58adfe7b930`](https://github.com/frostyard/frostnotes/tree/1b63ff73c0d91e121000e38ca718b58adfe7b930) on `main`. There is no release.
- [`README.md`](https://github.com/frostyard/frostnotes/blob/1b63ff73c0d91e121000e38ca718b58adfe7b930/README.md)
- [`Makefile`](https://github.com/frostyard/frostnotes/blob/1b63ff73c0d91e121000e38ca718b58adfe7b930/Makefile)
- [`docs/README.md`](https://github.com/frostyard/frostnotes/blob/1b63ff73c0d91e121000e38ca718b58adfe7b930/docs/README.md)
- [`docs/design/overview.md`](https://github.com/frostyard/frostnotes/blob/1b63ff73c0d91e121000e38ca718b58adfe7b930/docs/design/overview.md)
- [`docs/design/vault.md`](https://github.com/frostyard/frostnotes/blob/1b63ff73c0d91e121000e38ca718b58adfe7b930/docs/design/vault.md)
- [`docs/design/sync.md`](https://github.com/frostyard/frostnotes/blob/1b63ff73c0d91e121000e38ca718b58adfe7b930/docs/design/sync.md)
- [`docs/design/hub.md`](https://github.com/frostyard/frostnotes/blob/1b63ff73c0d91e121000e38ca718b58adfe7b930/docs/design/hub.md)
- [`docs/design/app.md`](https://github.com/frostyard/frostnotes/blob/1b63ff73c0d91e121000e38ca718b58adfe7b930/docs/design/app.md)
- [`docs/specs/mcp.md`](https://github.com/frostyard/frostnotes/blob/1b63ff73c0d91e121000e38ca718b58adfe7b930/docs/specs/mcp.md)
- [`docs/specs/lodge-app.md`](https://github.com/frostyard/frostnotes/blob/1b63ff73c0d91e121000e38ca718b58adfe7b930/docs/specs/lodge-app.md)
- [`docs/specs/ui.md`](https://github.com/frostyard/frostnotes/blob/1b63ff73c0d91e121000e38ca718b58adfe7b930/docs/specs/ui.md)
- [`docs/plans/0002-roadmap.md`](https://github.com/frostyard/frostnotes/blob/1b63ff73c0d91e121000e38ca718b58adfe7b930/docs/plans/0002-roadmap.md)
- [`docs/adr/0024-the-app-opens-and-creates-vaults-and-a-window-switches-between-them.md`](https://github.com/frostyard/frostnotes/blob/1b63ff73c0d91e121000e38ca718b58adfe7b930/docs/adr/0024-the-app-opens-and-creates-vaults-and-a-window-switches-between-them.md)
- [`packaging/lodge/app.json`](https://github.com/frostyard/frostnotes/blob/1b63ff73c0d91e121000e38ca718b58adfe7b930/packaging/lodge/app.json), [`packaging/systemd/frostnotes.service`](https://github.com/frostyard/frostnotes/blob/1b63ff73c0d91e121000e38ca718b58adfe7b930/packaging/systemd/frostnotes.service), [`packaging/systemd/frostnotes-lodge.socket`](https://github.com/frostyard/frostnotes/blob/1b63ff73c0d91e121000e38ca718b58adfe7b930/packaging/systemd/frostnotes-lodge.socket), [`packaging/sysusers.d/frostnotes.conf`](https://github.com/frostyard/frostnotes/blob/1b63ff73c0d91e121000e38ca718b58adfe7b930/packaging/sysusers.d/frostnotes.conf)
- [`scripts/dev-app.sh`](https://github.com/frostyard/frostnotes/blob/1b63ff73c0d91e121000e38ca718b58adfe7b930/scripts/dev-app.sh)
- [`dev/nsl/provision.sh`](https://github.com/frostyard/frostnotes/blob/1b63ff73c0d91e121000e38ca718b58adfe7b930/dev/nsl/provision.sh)
- [`cmd/notesd/main.go`](https://github.com/frostyard/frostnotes/blob/1b63ff73c0d91e121000e38ca718b58adfe7b930/cmd/notesd/main.go)
- [`cmd/notesctl/vault.go`](https://github.com/frostyard/frostnotes/blob/1b63ff73c0d91e121000e38ca718b58adfe7b930/cmd/notesctl/vault.go), [`cmd/notesctl/notes.go`](https://github.com/frostyard/frostnotes/blob/1b63ff73c0d91e121000e38ca718b58adfe7b930/cmd/notesctl/notes.go), [`cmd/notesctl/write.go`](https://github.com/frostyard/frostnotes/blob/1b63ff73c0d91e121000e38ca718b58adfe7b930/cmd/notesctl/write.go), [`cmd/notesctl/hub.go`](https://github.com/frostyard/frostnotes/blob/1b63ff73c0d91e121000e38ca718b58adfe7b930/cmd/notesctl/hub.go), [`cmd/notesctl/sync.go`](https://github.com/frostyard/frostnotes/blob/1b63ff73c0d91e121000e38ca718b58adfe7b930/cmd/notesctl/sync.go), [`cmd/notesctl/mcp.go`](https://github.com/frostyard/frostnotes/blob/1b63ff73c0d91e121000e38ca718b58adfe7b930/cmd/notesctl/mcp.go)
- No Flatpak and no cask: [`apps.json`](https://github.com/frostyard/flatpak-index/blob/404aa05424b42093eed3e33e823216cf5569c570/apps.json) in the Flatpak index at `404aa05424b42093eed3e33e823216cf5569c570`, and the tap's [`Casks`](https://github.com/frostyard/homebrew-tap/tree/7b7cd158e7e40599ff767f61a272435f84d2da41/Casks) at `7b7cd158e7e40599ff767f61a272435f84d2da41`.
- No APT package: the Frostyard APT index [`Packages`](https://repository.frostyard.org/debian/dists/trixie/main/binary-amd64/Packages) for trixie on amd64, checked 2026-10-22. It lists `frostyard-chairlift`, `frostyard-chairlift-system-integration`, and `frostyard-intuneme`.
- lodge commit [`c3c37b4fcf9880ae4f5f1ea365e89b8bc0b6cf00`](https://github.com/frostyard/lodge/tree/c3c37b4fcf9880ae4f5f1ea365e89b8bc0b6cf00): [`README.md`](https://github.com/frostyard/lodge/blob/c3c37b4fcf9880ae4f5f1ea365e89b8bc0b6cf00/README.md), [`docs/specs/app-contract.md`](https://github.com/frostyard/lodge/blob/c3c37b4fcf9880ae4f5f1ea365e89b8bc0b6cf00/docs/specs/app-contract.md)
- frostnotes commit [`4928e88ed6d5aa48be53ff7da6dbd16746a59fd0`](https://github.com/frostyard/frostnotes/tree/4928e88ed6d5aa48be53ff7da6dbd16746a59fd0) for the update and roll back steps: [`Makefile`](https://github.com/frostyard/frostnotes/blob/4928e88ed6d5aa48be53ff7da6dbd16746a59fd0/Makefile), [`internal/store/store.go`](https://github.com/frostyard/frostnotes/blob/4928e88ed6d5aa48be53ff7da6dbd16746a59fd0/internal/store/store.go), [`docs/design/vault.md`](https://github.com/frostyard/frostnotes/blob/4928e88ed6d5aa48be53ff7da6dbd16746a59fd0/docs/design/vault.md), [`docs/specs/lodge-app.md`](https://github.com/frostyard/frostnotes/blob/4928e88ed6d5aa48be53ff7da6dbd16746a59fd0/docs/specs/lodge-app.md), [`packaging/systemd/frostnotes.service`](https://github.com/frostyard/frostnotes/blob/4928e88ed6d5aa48be53ff7da6dbd16746a59fd0/packaging/systemd/frostnotes.service)
- lodge commit [`399f46dbb3adedb37f09b53708b3dee855118297`](https://github.com/frostyard/lodge/tree/399f46dbb3adedb37f09b53708b3dee855118297) for the update steps: [`docs/adr/0007-lodge-serves-every-apps-web-build-from-disk.md`](https://github.com/frostyard/lodge/blob/399f46dbb3adedb37f09b53708b3dee855118297/docs/adr/0007-lodge-serves-every-apps-web-build-from-disk.md)
- Frostnotes at the same commit: [`packaging/systemd/frostnotes-lodge.socket`](https://github.com/frostyard/frostnotes/blob/4928e88ed6d5aa48be53ff7da6dbd16746a59fd0/packaging/systemd/frostnotes-lodge.socket), [`packaging/sysusers.d/frostnotes.conf`](https://github.com/frostyard/frostnotes/blob/4928e88ed6d5aa48be53ff7da6dbd16746a59fd0/packaging/sysusers.d/frostnotes.conf), [`docs/plans/0004-m2-sync.md`](https://github.com/frostyard/frostnotes/blob/4928e88ed6d5aa48be53ff7da6dbd16746a59fd0/docs/plans/0004-m2-sync.md)
