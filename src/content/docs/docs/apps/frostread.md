---
title: frostread
description: "Build frostread from source and add it to lodge as Read: a tailnet-only feed reader and read-later list. Pre-release: there is no package yet."
---

frostread is a feed reader and a read-later list that only your tailnet can
reach. It runs behind [lodge](/docs/apps/lodge/), where lodge shows it as the
app Read. You subscribe to feeds, save links, read articles with nothing
loaded from the web, and save an article as a note in
[Frostnotes](/docs/apps/frostnotes/). Agents, such as
[Porter](/docs/apps/porter/), read it at `/mcp/read`.

frostread is pre-release. The repository has no release, and there is no
package yet. You build it from source with the steps below.

## Status

Working now:

- The daemon, `readd`, and its command-line client, `readctl`.
- The web app in lodge, with unread, starred, later, archive, and all views,
  and full-text search.
- Save as a note, MCP for agents, save from your phone, and a daily sweep that
  removes files nothing uses.

It runs on one host with lodge, in trial use. The check of the phone bookmarklet
in iOS Safari is not done yet.

There is no package yet. Frostyard has a proposed plan to ship `readd` as a
system extension. See [lodge](/docs/apps/lodge/#status).

## Before you start

You need:

- [lodge](/docs/apps/lodge/), running on a Debian 13 host, and
  [Frostnotes](/docs/apps/frostnotes/) as lodge's `notes` app. Save as a note
  needs both.
- Go 1.27, `make`, and `git`, and the nsl machine named `lodge` from lodge's
  steps, because the web bundle builds there. See [nsl](/docs/tools/nsl/).
- Optionally, an OPML file of your subscriptions.

## Install on lodge's host

frostread runs as lodge's `read` app, on the same host as lodge and Frostnotes.
`LODGE` below is lodge's address, `lodge.<tailnet>.ts.net`.

Clone the repository. frostread has no release tags, so you build `main`. If a
step fails, read the repository's README: `main` can change.

```bash
git clone https://github.com/frostyard/frostread
cd frostread
```

### Build and copy

The web bundle builds in the nsl machine. `lodge-package` stages `readd`,
`readctl`, the manifest, the bundle, the units, and the `sysusers.d` entry under
`build/lodge-root`:

```bash
make web-build
make lodge-package
```

`lodge-package` refuses to stage into `/`, so copy the staged `usr/` over the
host's. If you built on another machine, copy `build/lodge-root` to lodge's host
first. The first command replaces Read's own directory and nothing else:

```bash
sudo rm -rf /usr/share/lodge/apps/read
sudo cp -r build/lodge-root/usr/. /usr/
```

Use `cp -r`, not `-a`: the files must be owned by root.

### Create the user and start the socket

The `sysusers.d` entry makes the user `frostread`, with its home at
`/var/lib/frostread`, in the groups `lodge-apps` and `lodge-agents`:

```bash
sudo systemd-sysusers /usr/lib/sysusers.d/frostread.conf
id frostread
sudo systemctl daemon-reload
sudo systemctl enable --now frostread.socket frostread.service
```

`id` lists `lodge-apps` and `lodge-agents` among the groups. The service is
enabled too, so the poller runs from boot and does not wait for lodge's first
request.

On a host whose clock is UTC, give `readd` your own time zone. Saved notes are
dated, and article pages show their day, in that zone. Create
`/etc/systemd/system/frostread.service.d/tz.conf`:

```ini
[Service]
Environment=TZ=America/New_York
```

Use your own zone in place of `America/New_York`. Then run
`sudo systemctl daemon-reload` and `sudo systemctl restart frostread.service`.

### Write the configuration

Write `/etc/frostread/frostread.json`, owned by root with mode 0644. It holds no
secret. `notes_vault` is the ID of the vault that Frostnotes serves:

```json
{
  "poll_interval": "20m",
  "lodge_url": "https://LODGE",
  "notes_folder": "Reading/",
  "notes_vault": 1
}
```

Replace `1` with your vault's ID, which `vault list` shows in
[Frostnotes](/docs/apps/frostnotes/#agents-over-mcp), and `LODGE` with lodge's
address. The file is optional, and `readd` refuses an unknown key. All the
fields are in [Configuration](#configuration).

### Let frostread reach notes

Save as a note calls Frostnotes' MCP through lodge's agent socket. Add
`frostread` to `agents` in `/etc/lodge/config.json`. The list holds at most 16
system users. If Porter is already on it, add `frostread` beside it:

```json
{ "agents": ["frostread"] }
```

Reload lodge, which also picks up Read's manifest:

```bash
sudo lodgectl reload
sudo lodgectl status
```

`status` shows an `agents` row that is `listening`, with `frostread` among the
agents.

### Issue Read's notes token

Issue a token for the agent socket and for the user `frostread` only, scoped to
one folder. lodge shows it once. Pipe it straight into `readctl`, which writes it
to `/var/lib/frostread/tokens/notes` with mode 0600:

```bash
sudo lodgectl token issue frostread-notes --app notes --scope 'vault=1;write=Reading/' --agent frostread | sudo -u frostread readctl notes-token
```

`readctl` prints `the notes token is set`. Use your vault's ID in place of `1`.
`readctl` talks to `readd`'s private socket, which admits only frostread's own
processes. So every `readctl` command runs as `sudo -u frostread`.

### Subscribe to feeds

Import an OPML file, and check the app:

```bash
sudo -u frostread readctl import feeds.opml
sudo -u frostread readctl status
sudo -u frostread readctl sources
```

`import` prints `added N, skipped M`. `status` prints `readd` and its version,
then `save as a note: yes, vault 1, folder Reading/`. `sources` lists each
source with its ID, its unread count, its title, and its address.

Open `https://LODGE/read/` from an allowed device. You see Read, with your
sources in a column.

## Use Read

- Sources: add a feed by its address, or by a page that links to one. Read
  finds the feed and polls it at once. RSS, Atom, and JSON Feed work. You can
  also import and export OPML. Each source polls about every 20 minutes, with a
  conditional request and a backoff that grows after each failed poll. A failed
  poll shows its error on the source, and the app stays up.
- Views: unread, starred, later, archive, and all. Press `j` and `k` to move,
  `s` to star, `m` to toggle read, `e` to archive, `o` to open the original, and
  `/` to search.
- Read later: save a link from the app, with `readctl save URL`, or from an agent
  with a `read;write` token. Saving the same address twice gives the same item.
- Articles: Read extracts the main content, sanitizes it, fetches the images
  into its own store, and inlines them, so your browser loads nothing from the
  web. It keeps the original bytes as sent. Each item has a permanent address,
  `/read/item/ID`.
- Search: full text, across titles, authors, and text.

### Save from your phone

A bookmarklet opens Read's save page with the page's address and title. You see
both, and Read saves only when you tap Save. It needs no token, and it is made
for iOS Safari. To install it, open "Save from your phone" in Read's sidebar, which is
the route `/read/bookmarklet`, and follow its steps for iOS Safari or a desktop
browser.

### Save as a note

Open an article and use the reader's "Save as note" button. Read writes the
article into Frostnotes under `Reading/`, as Markdown with frontmatter and a
link back to the article. The button then reads "Open in Notes". If you move the
note, Read finds it again. If you delete it, the button goes back to "Save as
note".

From the command line, `readctl note ITEM_ID` prints `saved` with the note's
path, and then its route in notes.

## readctl

```
readctl [--socket PATH] COMMAND [ARGS]
```

Run each command as `sudo -u frostread readctl …`. The socket is
`/run/frostread/readctl.sock`, or `--socket`, or `READ_SOCKET`. A command exits
with 0 on success, and with 1 and a message on stderr on an error.

| Command | What it does |
| --- | --- |
| `save URL` | saves a link to read later |
| `add FEED_URL` | subscribes, finding the feed from a page |
| `sources` | lists sources with their unread counts |
| `note ITEM_ID` | saves the article as a note, and prints its path and route |
| `note-status ITEM_ID` | prints where the item's note is: `present`, `moved`, `missing`, or `unreachable` |
| `import FILE.opml` | imports the file's outlines; `-` reads stdin |
| `export` | writes OPML to stdout |
| `poll [SOURCE_ID]` | polls every source now, or one |
| `search QUERY` | searches titles, authors, and text |
| `sweep [-dry-run]` | removes unused files now; `-dry-run` only reports |
| `notes-token` | reads the notes token from stdin and sets it |
| `status` | prints the version and whether save as a note is ready |

## Agents

Agents reach Read at `/mcp/read` with a scoped token. The scope is exactly
`read` or `read;write`. Any other scope is refused at `initialize`.

Issue a token for an agent on your tailnet:

```bash
sudo lodgectl token issue NAME --app read --scope read
```

For an agent on lodge's host, add `--agent USER`. See
[lodge](/docs/apps/lodge/#agents-and-tokens).

| Tool | Scope | What it does |
| --- | --- | --- |
| `list_sources` | `read` | each source's ID, title, site address, and unread count |
| `list_unread` | `read` | unread items, newest first; takes `source_id`, `since`, and `limit` |
| `search` | `read` | matching items, with snippets |
| `read_item` | `read` | an item's title, dates, states, and extracted text, up to 60,000 characters |
| `save_url` | `read;write` | saves an address |
| `mark_read` | `read;write` | marks 1 to 200 items read or unread |
| `star` | `read;write` | stars or unstars an item |

No tool deletes anything. Article text from the web is data, not instructions,
and `read_item` says so in a line before the text.

## Configuration

`/etc/frostread/frostread.json`, or the file that `READ_CONFIG` names:

| Field | Default | What it does |
| --- | --- | --- |
| `poll_interval` | `20m` | how often each source polls, from `15m` to `24h` |
| `lodge_url` | empty | lodge's `https` address with no path, for links in notes |
| `notes_folder` | `Reading/` | where notes go; a relative path that ends in `/` |
| `notes_vault` | 0 | the ID of the vault; save as a note needs it |
| `blob_sweep` | `on` | `on`, `dry-run` (the schedule only logs), or `off` (`readctl sweep` still works) |
| `blob_grace_days` | 7 | how long a file has no use before the sweep removes it, from 1 to 365 |

frostread keeps its data in `/var/lib/frostread`: the database
`frostread.db`, the stored article bodies and images in `blobs/`, and
`tokens/notes`. The database must be on a local disk. To back it up, stop
`readd` and snapshot the directory, or snapshot it while `readd` runs. The sweep runs 10
minutes after start and then every 24 hours.

## Limits

- Read fetches only public addresses. It refuses `localhost`, names that end in
  `.local`, `.internal`, `.home.arpa`, or `.ts.net`, and private, loopback,
  link-local, and tailnet addresses. A feed or page on your home network cannot
  be read. A refused address answers: "Read does not fetch addresses inside your
  network".
- A feed, a page, and an image are each capped at 10 MiB, and the images of one
  item at 40 MiB. A larger body is an error. A request takes at most 30 seconds,
  with at most 5 redirects, and uses no proxy from the environment.
- Save from your phone needs the bookmarklet. Read has no share target, because
  that needs a service worker, which lodge does not register.
- Read keeps no highlights or notes on an article yet, and it has no summaries.
- An old note that you moved out of `Reading/`, and that has no `read_item`
  marker, is not found again.
- To restore an old database, restore its `blobs/` directory from the same
  snapshot. After the grace period, the sweep has removed files that the old
  database names, and those items show a missing image or original.

## See also

- [lodge](/docs/apps/lodge/): the shell Read runs in, and its tokens
- [Frostnotes](/docs/apps/frostnotes/): where Read saves notes
- [Porter](/docs/apps/porter/): the assistant that reads your feeds
- [Frostmail](/docs/apps/frostmail/): the mail app from the same project
- [nsl](/docs/tools/nsl/): the machine that builds the web bundle
- [frostread repository](https://github.com/frostyard/frostread)

## Sources

Reviewed 2026-10-23.

- frostread commit [`1075112dbdf0dc726bcf57bbd7e3d26cd9fcfc10`](https://github.com/frostyard/frostread/tree/1075112dbdf0dc726bcf57bbd7e3d26cd9fcfc10) on `main`. There is no release.
- [`README.md`](https://github.com/frostyard/frostread/blob/1075112dbdf0dc726bcf57bbd7e3d26cd9fcfc10/README.md)
- [`Makefile`](https://github.com/frostyard/frostread/blob/1075112dbdf0dc726bcf57bbd7e3d26cd9fcfc10/Makefile)
- [`docs/README.md`](https://github.com/frostyard/frostread/blob/1075112dbdf0dc726bcf57bbd7e3d26cd9fcfc10/docs/README.md)
- [`docs/design/overview.md`](https://github.com/frostyard/frostread/blob/1075112dbdf0dc726bcf57bbd7e3d26cd9fcfc10/docs/design/overview.md)
- [`docs/plans/0001-roadmap.md`](https://github.com/frostyard/frostread/blob/1075112dbdf0dc726bcf57bbd7e3d26cd9fcfc10/docs/plans/0001-roadmap.md)
- [`docs/specs/api.md`](https://github.com/frostyard/frostread/blob/1075112dbdf0dc726bcf57bbd7e3d26cd9fcfc10/docs/specs/api.md)
- [`docs/adr/0003-the-fetcher-reaches-only-public-addresses.md`](https://github.com/frostyard/frostread/blob/1075112dbdf0dc726bcf57bbd7e3d26cd9fcfc10/docs/adr/0003-the-fetcher-reaches-only-public-addresses.md), [`docs/adr/0004-save-as-note-goes-through-notes-mcp-on-the-agent-socket.md`](https://github.com/frostyard/frostread/blob/1075112dbdf0dc726bcf57bbd7e3d26cd9fcfc10/docs/adr/0004-save-as-note-goes-through-notes-mcp-on-the-agent-socket.md), [`docs/adr/0005-articles-are-extracted-sanitized-and-kept-as-sent.md`](https://github.com/frostyard/frostread/blob/1075112dbdf0dc726bcf57bbd7e3d26cd9fcfc10/docs/adr/0005-articles-are-extracted-sanitized-and-kept-as-sent.md), [`docs/adr/0006-save-from-another-page-through-a-confirm-page-a-bookmarklet-opens.md`](https://github.com/frostyard/frostread/blob/1075112dbdf0dc726bcf57bbd7e3d26cd9fcfc10/docs/adr/0006-save-from-another-page-through-a-confirm-page-a-bookmarklet-opens.md), [`docs/adr/0007-a-daily-mark-and-scan-sweep-removes-orphaned-blobs-after-a-grace-period.md`](https://github.com/frostyard/frostread/blob/1075112dbdf0dc726bcf57bbd7e3d26cd9fcfc10/docs/adr/0007-a-daily-mark-and-scan-sweep-removes-orphaned-blobs-after-a-grace-period.md)
- [`packaging/lodge/app.json`](https://github.com/frostyard/frostread/blob/1075112dbdf0dc726bcf57bbd7e3d26cd9fcfc10/packaging/lodge/app.json), [`packaging/lodge/frostread.service`](https://github.com/frostyard/frostread/blob/1075112dbdf0dc726bcf57bbd7e3d26cd9fcfc10/packaging/lodge/frostread.service), [`packaging/lodge/frostread.socket`](https://github.com/frostyard/frostread/blob/1075112dbdf0dc726bcf57bbd7e3d26cd9fcfc10/packaging/lodge/frostread.socket), [`packaging/lodge/sysusers.d-frostread.conf`](https://github.com/frostyard/frostread/blob/1075112dbdf0dc726bcf57bbd7e3d26cd9fcfc10/packaging/lodge/sysusers.d-frostread.conf), [`packaging/lodge/stage.sh`](https://github.com/frostyard/frostread/blob/1075112dbdf0dc726bcf57bbd7e3d26cd9fcfc10/packaging/lodge/stage.sh)
- [`cmd/readctl/main.go`](https://github.com/frostyard/frostread/blob/1075112dbdf0dc726bcf57bbd7e3d26cd9fcfc10/cmd/readctl/main.go), [`web/src/lib/keys.ts`](https://github.com/frostyard/frostread/blob/1075112dbdf0dc726bcf57bbd7e3d26cd9fcfc10/web/src/lib/keys.ts)
- No release: the repository's [releases page](https://github.com/frostyard/frostread/releases), checked 2026-10-23.
- lodge commit [`b6aaa95d8d62840f21b17e77c820a976bee18032`](https://github.com/frostyard/lodge/tree/b6aaa95d8d62840f21b17e77c820a976bee18032): [`docs/design/overview.md`](https://github.com/frostyard/lodge/blob/b6aaa95d8d62840f21b17e77c820a976bee18032/docs/design/overview.md), [`docs/plans/0001-roadmap.md`](https://github.com/frostyard/lodge/blob/b6aaa95d8d62840f21b17e77c820a976bee18032/docs/plans/0001-roadmap.md)
- frostyard/core commit [`d55b259c57c636169e9a86f89ce808b075a1bf3c`](https://github.com/frostyard/core/tree/d55b259c57c636169e9a86f89ce808b075a1bf3c): [`docs/adr/0058-ship-suite-desktop-apps-as-flatpaks-and-services-as-sysexts.md`](https://github.com/frostyard/core/blob/d55b259c57c636169e9a86f89ce808b075a1bf3c/docs/adr/0058-ship-suite-desktop-apps-as-flatpaks-and-services-as-sysexts.md) (Proposed)
