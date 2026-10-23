---
title: Porter
description: "Build Porter from source and add it to lodge: the assistant that reads your mail, calendar, tasks, notes, and feeds, and drafts but never sends. Pre-release: there is no package yet."
---

Porter is your assistant inside [lodge](/docs/apps/lodge/). You talk to it in a
chat panel beside whatever app you are in. It reads your mail, calendar, tasks,
and notes through their MCP endpoints, and your feeds from
[frostread](/docs/apps/frostread/), read-only. It drafts but never sends. It
keeps its memory and its scheduled prompts, called routines, as notes in your
vault, and it thinks through lodge's inference layer. You have one continuous
thread with it, on every device.

Porter is pre-release. The repository has no release, and there is no package
yet. You build it from source with the steps below.

## Status

Working now, in trial use on the same host as lodge:

- Chat in the companion panel, with the thread, context chips, and action
  cards.
- Routines, with Activity and Approvals in the full app.
- Reading from frostread, read-only.

Two checks are still open: chat on a phone and a desktop, and a week of
scheduled briefs. Reading from frostread has passed its check: a brief lists new
items by source, and chat answers questions about your feeds.

Planned: a GitHub manager, with tools to read issues, pull requests, and
notifications, and to draft comments and reviews. It is not built. Posting stays
with you.

There is no package yet. Frostyard has a proposed plan to ship `porterd` as a
system extension. See [lodge](/docs/apps/lodge/#status).

## Before you start

You need:

- [lodge](/docs/apps/lodge/), running on a Debian 13 host, with an inference
  alias named `local`. Porter's chat and routines use `local` unless you set
  another alias in its configuration.
- The apps Porter reads: [Frostnotes](/docs/apps/frostnotes/) as `notes`,
  [Frostmail](/docs/apps/frostmail/) as `mail`, and
  [frostread](/docs/apps/frostread/) as `read`. Porter needs a notes vault for
  its memory and routines. A missing app only drops its tools.
- Go 1.27, `make`, and `git`, and the nsl machine named `lodge` from lodge's
  steps, because the web bundle builds there. See [nsl](/docs/tools/nsl/).

## Install Porter

Porter runs as lodge's `porter` app, on lodge's host. Clone the repository and
build. It has no release tags, so you build `main`. If a step fails, read the
repository's README: `main` can change.

```bash
git clone https://github.com/frostyard/porter
cd porter
make web-build
make lodge-package
```

`web-build` builds the bundle in the nsl machine into `build/web`.
`lodge-package` builds `porterd` and stages the app under `build/lodge-root`:

- `usr/local/bin/porterd`
- `usr/share/lodge/apps/porter/`, with `app.json` and the web files
- `usr/lib/systemd/system/frostporter.socket` and `frostporter.service`
- `usr/lib/sysusers.d/frostporter.conf`

Set `LODGE_DESTDIR` to stage somewhere else. The command refuses an empty path
and `/`.

### Copy the app to the host

If you built on another machine, copy `build/lodge-root` to lodge's host. Then
replace Porter's own directory and copy the staged `usr/` over the host's:

```bash
sudo rm -rf /usr/share/lodge/apps/porter
sudo cp -r build/lodge-root/usr/. /usr/
```

Use `cp -r`, not `-a`: the files must be owned by root. The first command
touches only Porter's directory.

### Create the user and start the socket

The `sysusers.d` entry makes the user `frostporter`, in the groups
`lodge-apps` and `lodge-agents`:

```bash
sudo systemd-sysusers /usr/lib/sysusers.d/frostporter.conf
id frostporter
sudo systemctl daemon-reload
sudo systemctl enable --now frostporter.socket frostporter.service
```

`id` lists `lodge-apps` and `lodge-agents` among the groups. Until you set
tokens below, the log of `frostporter.service` warns `no token for an app` for
each app.

### Write the configuration

Write `/etc/porter/porter.json`. It holds no secret, and every field is
optional:

```json
{
  "owner": "Your Name",
  "time_zone": "America/New_York",
  "lodge_url": "https://lodge.TAILNET.ts.net"
}
```

Use your own name and zone. Porter refuses unknown keys.

| Field | What it does |
| --- | --- |
| `owner` | your name, for the system prompt |
| `time_zone` | an IANA zone for your dates; the host's zone when empty |
| `chat_alias` | the inference alias for chat; `local` when empty |
| `routine_alias` | the alias routines use by default; `local` when empty |
| `apps` | the lodge apps Porter reaches; `["notes", "mail", "read"]` when empty |
| `lodge_url` | lodge's own `https` address, with no path |

Use lodge's own address for `lodge_url`, as `sudo lodgectl status` shows it, not
the host's name. Without it, links to mail in notes that Porter writes do not
work.

### Let Porter reach the apps

Name `frostporter` in `agents` in `/etc/lodge/config.json`. If the list has
other users, such as `frostread`, add Porter to it:

```json
{ "agents": ["frostporter"] }
```

Reload lodge, which also picks up Porter's manifest:

```bash
sudo lodgectl reload
sudo lodgectl status
```

`status` shows an `agents` row that is `listening`, with `frostporter` among the
agents.

### Issue the tokens

Porter needs one token for each app, issued for the agent socket and for the
user `frostporter` only. Each command pipes the token, which lodge shows once,
straight into `porterd`, which stores it in `/var/lib/frostporter/tokens/` with
mode 0600. Use your vault's ID, from
[Frostnotes](/docs/apps/frostnotes/#agents-over-mcp):

```bash
sudo lodgectl token issue porter-notes --app notes --scope 'vault=ID;write=Porter/;except=Porter/Routines/;daily' --agent frostporter | sudo -u frostporter porterd token set notes
sudo lodgectl token issue porter-mail --app mail --scope 'account=*;write' --agent frostporter | sudo -u frostporter porterd token set mail
sudo lodgectl token issue porter-read --app read --scope read --agent frostporter | sudo -u frostporter porterd token set read
```

Each `porterd` prints `porterd: APP's token is set; restart porterd to use it`.
The scopes decide the limits:

- The notes token lets Porter read the whole vault, write only under `Porter/`
  and never in `Porter/Routines/`, and append to today's daily note.
- The mail token never has `;send`, so Porter cannot send mail.
- The read token never has `;write`.

Restart Porter, then check it:

```bash
sudo systemctl restart frostporter.service
sudo lodgectl apps
```

The table shows `porter`, key `p`, with the flag `companion`, and the state
`up`. An app without a token is left out of Porter's tools. An app that is down
drops out until it is back, and the thread says so once.

## Use Porter

Open lodge. On a wide window, the companion button on the rail opens Porter in a
panel beside your app. On a narrow one, the button on the bar opens a
full-height sheet. The default shortcut is Ctrl+Shift+Backquote, the key left of
`1`. To open the full app, press Ctrl+Backquote for the switcher, then `p`. The
full app has the same thread, plus Activity and Approvals.

Ask it something, such as `what is new in my feeds?`. It looks the answer up
with its tools, and shows each tool call as a card: what it did, with a link
and an undo where the app has one.

- One thread: Porter never starts a new chat. Each request carries a
  rolling summary of the older thread and the recent turns. A tool searches the
  whole thread, so nothing that was summarized away is lost.
- Context chips: When the app beside Porter reports what is on screen, such
  as a note or a message, the thread shows a chip like "About: Plan.md". Dismiss
  it to change topic.
- Memory: `Porter/Memory.md` in your vault holds what you asked Porter to keep.
  Porter adds to it only when you ask, and suggests an addition in one line when
  it notices something. Edit it like any note.
- Capture: ask Porter to capture something. It shows the text it would add, and
  appends it to today's daily note only after you confirm. It never edits text
  that is already there.
- Other people's words are data: Mail, articles, and notes that others wrote
  are never instructions. Porter mentions an instruction in one when it matters,
  and does not act on it.
- No invention: In a draft, a gap such as an unknown time becomes a
  placeholder like `[time?]` for you to fill in.

## Routines

A routine is work Porter does on a schedule: a note with a schedule in its
frontmatter and a prompt as its body. You write it in Frostnotes, and Porter
reads it. Porter itself cannot write a routine.

Put the note directly in `Porter/Routines/` in the vault that Porter's notes
token names. A file in a subfolder is not a routine. The note's name, without
`.md`, is the routine's name. This one writes a weekly review every Sunday:

```markdown
---
schedule: "0 18 * * 0"
output: "Porter/Reviews/{{week}}.md"
thinking: true
---
Write my weekly review, about two screens, in this order:

1. **My open loops:** mail I haven't answered in over three days, overdue
   or undated tasks, and unchecked items in this week's daily notes.
2. **Others' open loops:** mail I sent with no reply in five days.
3. **This week:** the notes I created, as one list.
4. **Next week:** events that need preparation, and any double-booking.

Link every item.
```

The frontmatter takes these fields:

| Field | Required | What it does |
| --- | --- | --- |
| `schedule` | yes | five cron fields: minute, hour, day of month, month, day of week, in `timezone` |
| `timezone` | no | an IANA zone; Porter's configured zone by default |
| `output` | no | a note path ending in `.md`, under `Porter/` and not under `Porter/Routines/` |
| `thinking` | no | whether the model thinks before it answers; `false` by default |
| `model` | no | an inference alias; Porter's `routine_alias` by default |
| `enabled` | no | `false` keeps the routine without running it; `true` by default |

In `output`, `{{date}}` becomes the run's date as `YYYY-MM-DD`, `{{week}}`
becomes its ISO week as `YYYY-Www`, and `{{weekday}}` becomes its weekday's
English name. The body is the prompt, from 1 to 16,384 bytes.

You see the result in the thread. Each run posts one line there, linking to the
output note, with cards for the drafts it wrote and the actions it proposes.
The full app's Activity tab records each run. With no `output`, the answer is
the thread line itself.

How routines run:

- Porter lists `Porter/Routines/` every minute and rereads a note that changed,
  so a new or edited routine needs no restart.
- A routine that is invalid never runs. That covers frontmatter that does not
  parse, an unknown field or a bad value, an `output` outside `Porter/`, and an
  empty body. Activity lists it with the reason.
- A routine never overlaps itself. If a run is still going at the next time,
  that time is skipped.
- If Porter was down when a routine was due, it runs the routine once at start,
  when the missed time is under 6 hours old.
- A run ends as failed after 10 minutes or 40 tool calls, and writes no output
  note.
- If lodge's model is unavailable, Porter retries a run every 15 minutes for up
  to 2 hours.
- Porter replaces an output note only when its frontmatter names the same
  routine. Otherwise it writes beside it, with ` (2)` before `.md`.

A run gets the system prompt, `Porter/Memory.md`, and the routine's body, but
not the thread. Its inference requests are `background`.

## What Porter can and cannot do

| Action | In chat | In a routine |
| --- | --- | --- |
| Read mail, calendar, tasks, notes, and feeds | yes | yes |
| Draft a mail reply or message | yes | yes |
| Write notes under `Porter/`, outside `Porter/Routines/` | yes | yes |
| Flag or move mail, create or complete a task, set a reminder | when you ask | an approval card |
| Append to today's daily note | after you confirm | an approval card |
| Remember something | only when you ask | not offered |
| Send, forward, or invite | never | never |
| Save, mark read, or star in Read | never | never |

The apps offer agents no delete tool, so Porter deletes nothing. When you ask,
it can move mail to Trash, as any move. A routine never
deletes, flags, moves, or completes anything on its own.

An approval card shows the action with its full arguments. It runs, as your
action, only when you tap Approve. The full app lists every approval.

Porter's tokens enforce the limits, and no prompt widens them. The apps refuse
anything outside a token's scope. On top of that, Porter never offers a tool
whose name says it sends, posts, forwards, or invites. In Read, it offers only
the four read tools: `list_sources`, `list_unread`, `search`, and `read_item`.

## Update

Porter has no releases, so you move to a newer `main`. A running `porterd`
cannot be copied over. Its socket starts the service again on the next
connection, so stop both:

```bash
sudo systemctl stop frostporter.socket frostporter.service
```

lodge shows `porter` as `down` while it is stopped.

Then pull, build, and copy, as in [Install Porter](#install-porter):

```bash
cd porter
git pull
make web-build
make lodge-package
sudo rm -rf /usr/share/lodge/apps/porter
sudo cp -r build/lodge-root/usr/. /usr/
sudo systemctl daemon-reload
sudo systemctl start frostporter.socket frostporter.service
sudo lodgectl reload
```

This keeps `/etc/porter`, the tokens in `/var/lib/frostporter`, and the memory
and routines in your vault. When it starts, `porterd` adds the column
`last_success` to the `routines` table of an older thread database, and marks a
reply that a stop left unfinished as done.

Check it:

```bash
sudo lodgectl apps
```

`porter` is `up`, with its new version.

## Roll back

Stop `porterd` and its socket, and check out the earlier commit:

```bash
sudo systemctl stop frostporter.socket frostporter.service
git checkout COMMIT
```

Build and copy with the update's steps, from `make web-build` to
`sudo systemctl daemon-reload`. Then start both and reload lodge:

```bash
sudo systemctl start frostporter.socket frostporter.service
sudo lodgectl reload
```

An older `porterd` reads a thread database that a newer one opened, so Porter
needs no backup step. The thread database keeps no schema version. Its one
migration adds the `last_success` column, and nothing removes it. While the
older build runs, `last_success` does not change. After the next update, it
shows the last success before the roll back.

## Remove

These steps follow the install layout. They are not tested yet.

Stop Porter and revoke its tokens:

```bash
sudo systemctl disable --now frostporter.service frostporter.socket
sudo lodgectl tokens
sudo lodgectl token revoke porter-notes
sudo lodgectl token revoke porter-mail
sudo lodgectl token revoke porter-read
```

`tokens` lists every token, so you can check the names. Each `revoke` prints
`revoked NAME`.

Remove `frostporter` from `agents` in `/etc/lodge/config.json`. Then delete the
app's files and reload:

```bash
sudo rm -rf /usr/share/lodge/apps/porter
sudo rm /usr/local/bin/porterd /usr/lib/systemd/system/frostporter.socket /usr/lib/systemd/system/frostporter.service /usr/lib/sysusers.d/frostporter.conf
sudo systemctl daemon-reload
sudo lodgectl reload
```

`porter` no longer shows in `sudo lodgectl apps`.

Porter's thread and tokens stay in `/var/lib/frostporter`, and its
configuration in `/etc/porter`. To delete them, run
`sudo rm -rf /var/lib/frostporter /etc/porter`. Your memory and routines are
notes in your vault, and stay there. `systemd-sysusers` never deletes a user;
`sudo userdel frostporter` is optional.

## Limits

- Porter answers when it finishes. Each step is one request and is not streamed,
  so you see a tool's card as it completes and the answer when it is whole.
- A turn ends at 40 tool calls.
- Porter cannot create or change calendar events. Mail gives agents no event
  writes.
- Porter cannot notify you while lodge is closed.
- A model can say it did something without a tool call. Porter checks each
  answer's claims against its cards. If a claim has no card, it asks the model
  once more, and then says that nothing was done.
- A summary of the older thread can drop or blur detail. Search the thread, or
  ask Porter to remember what must not be lost.

## See also

- [lodge](/docs/apps/lodge/): the shell Porter runs in, its tokens, and its
  inference providers
- [Frostnotes](/docs/apps/frostnotes/), [Frostmail](/docs/apps/frostmail/), and
  [frostread](/docs/apps/frostread/): the apps Porter reads
- [nsl](/docs/tools/nsl/): the machine that builds the web bundle
- [Porter repository](https://github.com/frostyard/porter)

## Sources

Reviewed 2026-10-23.

- Porter commit [`8e43e43d001d6daecdcfba77e48c0134f4f4d273`](https://github.com/frostyard/porter/tree/8e43e43d001d6daecdcfba77e48c0134f4f4d273) on `main`. There is no release.
- [`README.md`](https://github.com/frostyard/porter/blob/8e43e43d001d6daecdcfba77e48c0134f4f4d273/README.md)
- [`Makefile`](https://github.com/frostyard/porter/blob/8e43e43d001d6daecdcfba77e48c0134f4f4d273/Makefile)
- [`docs/README.md`](https://github.com/frostyard/porter/blob/8e43e43d001d6daecdcfba77e48c0134f4f4d273/docs/README.md)
- [`docs/design/overview.md`](https://github.com/frostyard/porter/blob/8e43e43d001d6daecdcfba77e48c0134f4f4d273/docs/design/overview.md)
- [`docs/plans/0001-roadmap.md`](https://github.com/frostyard/porter/blob/8e43e43d001d6daecdcfba77e48c0134f4f4d273/docs/plans/0001-roadmap.md)
- [`docs/specs/routines.md`](https://github.com/frostyard/porter/blob/8e43e43d001d6daecdcfba77e48c0134f4f4d273/docs/specs/routines.md)
- [`docs/adr/0003-porter-is-a-lodge-app-that-owns-no-data.md`](https://github.com/frostyard/porter/blob/8e43e43d001d6daecdcfba77e48c0134f4f4d273/docs/adr/0003-porter-is-a-lodge-app-that-owns-no-data.md), [`docs/adr/0004-porter-drafts-and-the-owner-sends.md`](https://github.com/frostyard/porter/blob/8e43e43d001d6daecdcfba77e48c0134f4f4d273/docs/adr/0004-porter-drafts-and-the-owner-sends.md), [`docs/adr/0005-memory-and-routines-live-in-the-vault.md`](https://github.com/frostyard/porter/blob/8e43e43d001d6daecdcfba77e48c0134f4f4d273/docs/adr/0005-memory-and-routines-live-in-the-vault.md), [`docs/adr/0006-one-continuous-thread.md`](https://github.com/frostyard/porter/blob/8e43e43d001d6daecdcfba77e48c0134f4f4d273/docs/adr/0006-one-continuous-thread.md), [`docs/adr/0007-porter-reads-frostread-read-only.md`](https://github.com/frostyard/porter/blob/8e43e43d001d6daecdcfba77e48c0134f4f4d273/docs/adr/0007-porter-reads-frostread-read-only.md)
- [`packaging/lodge/app.json`](https://github.com/frostyard/porter/blob/8e43e43d001d6daecdcfba77e48c0134f4f4d273/packaging/lodge/app.json), [`packaging/lodge/frostporter.service`](https://github.com/frostyard/porter/blob/8e43e43d001d6daecdcfba77e48c0134f4f4d273/packaging/lodge/frostporter.service), [`packaging/lodge/frostporter.socket`](https://github.com/frostyard/porter/blob/8e43e43d001d6daecdcfba77e48c0134f4f4d273/packaging/lodge/frostporter.socket), [`packaging/lodge/sysusers.d-frostporter.conf`](https://github.com/frostyard/porter/blob/8e43e43d001d6daecdcfba77e48c0134f4f4d273/packaging/lodge/sysusers.d-frostporter.conf), [`packaging/lodge/stage.sh`](https://github.com/frostyard/porter/blob/8e43e43d001d6daecdcfba77e48c0134f4f4d273/packaging/lodge/stage.sh)
- [`cmd/porterd/main.go`](https://github.com/frostyard/porter/blob/8e43e43d001d6daecdcfba77e48c0134f4f4d273/cmd/porterd/main.go), [`internal/config/config.go`](https://github.com/frostyard/porter/blob/8e43e43d001d6daecdcfba77e48c0134f4f4d273/internal/config/config.go), [`internal/tools/classify.go`](https://github.com/frostyard/porter/blob/8e43e43d001d6daecdcfba77e48c0134f4f4d273/internal/tools/classify.go)
- No release: the repository's [releases page](https://github.com/frostyard/porter/releases), checked 2026-10-23.
- lodge commit [`b6aaa95d8d62840f21b17e77c820a976bee18032`](https://github.com/frostyard/lodge/tree/b6aaa95d8d62840f21b17e77c820a976bee18032): [`docs/specs/app-contract.md`](https://github.com/frostyard/lodge/blob/b6aaa95d8d62840f21b17e77c820a976bee18032/docs/specs/app-contract.md), [`docs/specs/shell.md`](https://github.com/frostyard/lodge/blob/b6aaa95d8d62840f21b17e77c820a976bee18032/docs/specs/shell.md), [`docs/design/overview.md`](https://github.com/frostyard/lodge/blob/b6aaa95d8d62840f21b17e77c820a976bee18032/docs/design/overview.md)
- frostyard/core commit [`d55b259c57c636169e9a86f89ce808b075a1bf3c`](https://github.com/frostyard/core/tree/d55b259c57c636169e9a86f89ce808b075a1bf3c): [`docs/adr/0058-ship-suite-desktop-apps-as-flatpaks-and-services-as-sysexts.md`](https://github.com/frostyard/core/blob/d55b259c57c636169e9a86f89ce808b075a1bf3c/docs/adr/0058-ship-suite-desktop-apps-as-flatpaks-and-services-as-sysexts.md) (Proposed)
- porter commit [`ee5c558663791cf7a43a099fc227c8f2a4a14a80`](https://github.com/frostyard/porter/tree/ee5c558663791cf7a43a099fc227c8f2a4a14a80) for the update and roll back steps: [`packaging/lodge/stage.sh`](https://github.com/frostyard/porter/blob/ee5c558663791cf7a43a099fc227c8f2a4a14a80/packaging/lodge/stage.sh), [`internal/thread/store.go`](https://github.com/frostyard/porter/blob/ee5c558663791cf7a43a099fc227c8f2a4a14a80/internal/thread/store.go), [`docs/design/overview.md`](https://github.com/frostyard/porter/blob/ee5c558663791cf7a43a099fc227c8f2a4a14a80/docs/design/overview.md)
