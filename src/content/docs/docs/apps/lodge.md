---
title: lodge
description: "Build lodge from source and install it on a Debian 13 host: the tailnet web shell for Notes, Mail, Read, and Porter. Pre-release: there is no package yet."
---

lodge is a web shell for Frostyard's own apps. One address on your tailnet
opens Notes, Mail, Read, and the assistant [Porter](/docs/apps/porter/). A
quick switcher moves between them, and each app stays loaded in its frame. You
set lodge up once, on one host, and then add apps to it.

- lodge is the only process on the network. It joins your tailnet as a
  node of its own, `lodge`, and signs browsers in by their tailnet identity.
  Allow-lists of logins and devices decide who gets in. There are no
  passwords and no cookies, and nothing is on the public internet.
- Apps are daemons behind it. Each one runs as its own system user on a
  Unix socket that only lodge can reach. lodge serves each app's web files
  itself and tells the daemon who is calling.
- Agents get a scoped token for each app, at `/mcp/<app>`.
- Untrusted bytes, such as mail parts and attachments, come from a second
  node, `lodge-content`, under a sandbox policy.
- One inference layer routes the apps' model requests to a local model or
  to the providers you configure, and holds every credential.

lodge is pre-release. The repository has no release, and lodge is not yet
available as a package, a Flatpak, or a system extension. You build it from
source with the steps below.

## Status

Working now:

- lodge v1: the two tailnet nodes, the gateway, `lodgectl`, the shell, and a
  hand install from a tarball and a script.
- The inference layer. A provider is any OpenAI-compatible server, your
  ChatGPT plan, or your GitHub Copilot plan.
- Agent endpoints at `/mcp/<app>`, and a local agent socket for agents on
  lodge's own host.

Behind lodge: [Frostnotes](/docs/apps/frostnotes/) as Notes and
[Frostmail](/docs/apps/frostmail/) as Mail, both still moving in, and
[frostread](/docs/apps/frostread/) as Read. [Porter](/docs/apps/porter/) runs
beside them as the companion. lodge and all four run together in trial use on
one host.

Not checked yet: lodge on a phone and in Chrome's PDF viewer, and the
companion on a phone and a desktop.

Not yet available: a release, a package, a Flatpak, and a system extension.
Frostyard has a proposed plan to ship `lodge` and each app's daemon as a
system extension for Frostyard images, built on Snosi, with Floe as the server
image. It is not built.

## Before you start

You need:

- A Debian 13 host with systemd. lodge and every app it hosts share this one
  host, because they meet on Unix sockets.
- Go 1.27, `make`, and `git`, on the machine where you build.
- An x86-64 build machine with [nsl](/docs/tools/nsl/). The shell builds only
  in an nsl machine. For an arm64 host, build the package with
  `make dist DIST_ARCH=arm64`.
- A tailnet, and access to its admin console to make an auth key.

Install lodge on a Debian 13 host, not on a Frostyard image. The installer
always writes the shell's files to `/usr/share/lodge`, whatever `PREFIX` you
choose, and `/usr` is read-only on a Frostyard image.

## Build the package

Clone the repository. lodge has no release tags, so you build `main`. If a
step fails, read the repository's README: `main` can change.

```bash
git clone https://github.com/frostyard/lodge
cd lodge
```

Create the build machine, from the repository root:

```bash
nsl create lodge --distro debian:13
nsl run -m lodge --root bash dev/nsl/provision.sh "$(id -un)"
```

The script installs the Node toolchain in the machine. Re-running it is safe.
The machine's name matters: `make` builds the frontends in the machine named
`lodge`.

Build the shell, then the package:

```bash
make shell-build
make dist
```

`shell-build` writes `shell/dist`. `dist` prints
`dist/lodge-VERSION-linux-amd64.tar.gz: unpack it on the host and run sudo ./lodge-VERSION-linux-amd64/packaging/install.sh`.
If you run `make dist` first, it stops with `shell/dist is not built: run make shell-build (nsl)`.

## Install lodge

Copy the tarball to the host. Unpack it and run the installer:

```bash
tar -xzf lodge-VERSION-linux-amd64.tar.gz
sudo ./lodge-VERSION-linux-amd64/packaging/install.sh
```

It prints `install.sh: installing lodge into / (binaries in /usr/bin)`, and at
the end `install.sh: done. Next, on this host:` with the steps below.

The installer puts `lodge` and `lodgectl` in `/usr/bin`, the unit in
`/usr/lib/systemd/system`, the `sysusers.d` and `tmpfiles.d` entries in
`/usr/lib`, an example configuration at `/etc/lodge/config.example.json`, and
the shell's files in `/usr/share/lodge/shell/`. Run as root on the host, it also
creates the `lodge` user and its directories, reloads systemd, and restarts
lodge if it already runs.

To put the binaries somewhere else, add `PREFIX=/opt/lodge` to the command:

```bash
sudo ./lodge-VERSION-linux-amd64/packaging/install.sh PREFIX=/opt/lodge
```

The binaries go in `/opt/lodge/bin`, and the units and the `sysusers.d` and
`tmpfiles.d` entries go under `/etc`.

### Give lodge a key

Make a tagged, pre-approved auth key in your tailnet's admin console. Create
`/etc/lodge/lodge.env`, owned by root with mode 0600, with one line:

```text
TS_AUTHKEY=tskey-auth-…
```

The first start reads `TS_AUTHKEY` and `TS_AUTHKEY_CONTENT` from this file.
Never commit it.

`lodge-content` uses `TS_AUTHKEY_CONTENT` when it is set, else `TS_AUTHKEY`.
One key for both nodes must be reusable. With a one-off key, add a second
one-off key as `TS_AUTHKEY_CONTENT`.

Without a key, start lodge anyway and log each node in from the URL that
`sudo lodgectl status` shows. Open that URL yourself, right away: it claims
the node for whoever opens it first.

### Start lodge and allow yourself in

Start lodge:

```bash
sudo systemctl enable --now lodge
sudo lodgectl status
```

`status` prints a table with the columns `KIND`, `NAME`, `STATE`, and
`DETAIL`. You see a `node` row for `lodge` and one for `lodge-content`, each
`up`. A node that is not up says `needs login`, with its URL, or
`needs approval`.

Later starts need no key: remove the `TS_AUTHKEY` line from
`/etc/lodge/lodge.env` now. lodge keeps its node state in
`/var/lib/lodge/tailnet/`.

A browser gets in only when its login and its device are both on the
allow-lists. Allow yourself and your phone:

```bash
sudo lodgectl allow login alice@example.com
sudo lodgectl allow node PHONE
```

Each command prints what it did, such as `allow login alice@example.com`.
`LOGIN` is a tailnet login. `NODE` is a node's ID, or a peer's name.

In your tailnet's policy, tag both nodes. Grant port 443 on that tag only to
the devices that use lodge and to the tagged nodes of agents. Never allow a
node that forwards for others: a subnet router, a node running
`tailscale serve`, or a proxy.

Open `https://lodge.<tailnet>.ts.net/` from an allowed device. You see lodge's
shell. To lock a device out, run `sudo lodgectl disallow node NODE`: its
sessions close at once.

## Add an app

Each app has its own steps:

- [Frostnotes](/docs/apps/frostnotes/#the-web-app-in-lodge), as `notes`
- [Frostmail](/docs/apps/frostmail/#frostmail-and-lodge), as `mail`
- [frostread](/docs/apps/frostread/), as `read`
- [Porter](/docs/apps/porter/), as `porter`

All of them install the same way. An app's files go here:

| What | Where |
| --- | --- |
| manifest | `/usr/share/lodge/apps/<id>/app.json` |
| web files | `/usr/share/lodge/apps/<id>/web/` |
| app socket | `/run/lodge/apps/<id>.sock`, made by a systemd socket unit |
| the app's state | its own, such as `/var/lib/<user>/` |

Each app runs as its own system user. That user is in the group `lodge-apps`,
and never in the group `lodge`.

To write your own app, copy the files in `packaging/app-template/`: a socket
unit, a service, and a `sysusers.d` entry. Replace `example` with your app's
id. The installer's tarball carries them too.

Tell lodge about a new app, then check it:

```bash
sudo lodgectl reload
sudo lodgectl apps
```

`reload` rereads the manifests and the configuration, and prints the same table
as `apps`. It has the columns `ID`, `NAME`, `VERSION`, `KEY`, `STATE`, `FLAGS`,
and `REASON`. A working app is `up`. An app with a broken manifest is
`disabled`, and `REASON` says why. The other apps keep running.

## Agents and tokens

An agent reaches one app through its own endpoint, `/mcp/<app>`, with a scoped
token. lodge issues and checks the tokens. The app decides what a scope means.

Issue a token for an agent that runs elsewhere on your tailnet:

```bash
sudo lodgectl token issue NAME --app ID --scope SCOPE
```

It prints the token once, alone, on stdout, and on stderr how to add it to
Claude Code. A token works for one app only, and only over your tailnet. These
are scopes the apps use:

| App | Scope | Meaning |
| --- | --- | --- |
| `notes` | `vault=ID` | read one vault; add `;write` to let the token write |
| `mail` | `account=*;write` | mail, drafts, flags, and moves; add `;send` only for an agent that may send |
| `read` | `read` | read; `read;write` also saves, marks read, and stars |

Add the token to Claude Code for your user only. Never use `--scope project`,
which writes the token into the repository's `.mcp.json`:

```bash
claude mcp add --transport http notes https://lodge.TAILNET.ts.net/mcp/notes --header "Authorization: Bearer TOKEN"
```

To cut an agent off, revoke its token:

```bash
sudo lodgectl token revoke NAME
```

It prints `revoked NAME`, and the token's open streams close at once.
`sudo lodgectl tokens` lists every token with its app, scope, and last use.

### Agents on lodge's host

An agent on the same host, such as Porter, does not use the tailnet. It uses a
local socket, `/run/lodge/agent.sock`, so its calls never leave the host. To
add one:

1. Put its system user in the group `lodge-agents`.
2. Add the user's name to `agents` in `/etc/lodge/config.json`. The list holds
   at most 16 users. `root` and `lodge` are refused.
3. Run `sudo lodgectl reload`.
4. Issue its tokens with `--agent USER`:

   ```bash
   sudo lodgectl token issue NAME --app ID --scope SCOPE --agent USER
   ```

A token issued with `--agent` works only on that socket, from that user. A
token without it works only on the tailnet. So a token copied off the host is
useless, and one agent cannot use another's. `sudo lodgectl status` shows an
`agents` row with the socket and the users it admits. The steps for
[Porter](/docs/apps/porter/#install-porter) and
[frostread](/docs/apps/frostread/#install-on-lodges-host) show the whole
sequence.

## Inference providers

The apps never hold model keys. They ask lodge, which picks a provider.
Without a configuration, lodge has no models.

Copy the example and edit it:

```bash
sudo cp /etc/lodge/config.example.json /etc/lodge/config.json
```

`/etc/lodge/config.json` is root's, mode 0644, and holds no secrets. This is the
example:

```json
{
  "agents": [],
  "inference": {
    "providers": {
      "home": { "type": "openai", "baseURL": "http://MODEL_HOST/v1", "slots": 4, "home": true }
    },
    "aliases": {
      "local": { "provider": "home", "model": "MODEL" },
      "fast": { "provider": "home", "model": "MODEL" },
      "smart": { "provider": "home", "model": "MODEL" }
    }
  }
}
```

Replace `MODEL_HOST` and `MODEL` with your server and its model. An app asks for
an alias, `local`, `fast`, or `smart`, and lodge swaps in the provider's model.

- A provider's `type` is `openai` for any OpenAI-compatible server, `codex` for
  your ChatGPT plan, or `copilot` for your GitHub Copilot plan.
- `slots` is how many requests the provider runs at once.
- `home: true` marks a provider on your own hardware. `local` must map to one.
- To narrow an app, add `"apps": { "mail": ["local", "fast"] }`. An app that is
  not listed may use every alias.

Set a provider's key from stdin, never on the command line:

```bash
read -rs KEY && printf '%s\n' "$KEY" | sudo lodgectl provider key home; unset KEY
```

It prints `key set for provider home`. An empty input removes the key. Then
reload:

```bash
sudo lodgectl reload
sudo lodgectl status
```

`status` adds a `provider` row for each provider: `available`, with its type
and slots, or `unavailable`, with the reason. A provider that lodge cannot
reach shows as unavailable, and requests to its aliases fail at once. A
configuration that breaks a rule is refused whole: `status` shows an
`inference` row that says `refused`, with the reason, and the apps have no
aliases until a reload succeeds.

`sudo lodgectl provider models NAME` lists the models a provider offers.
`sudo lodgectl usage` sums the inference use per app and alias.

A `codex` provider has a sign-in instead of a key. On a computer with a
browser, run `lodgectl provider login NAME`. Then, on lodge's host, import the
login file it wrote, which `sudo lodgectl provider import NAME` reads from
stdin. A `copilot` provider starts with `lodgectl provider login NAME --copilot`,
which signs in to GitHub on any computer and writes a file for the GitHub
token. Run `lodgectl` with no arguments to see all the options.

## lodgectl

`lodgectl` talks to lodge on a local socket that only root can open, so run it
as `sudo lodgectl …`. Add `--json` before the command for JSON output.

| Command | What it does |
| --- | --- |
| `status` | lodge's nodes, apps, sessions, providers, and agent socket |
| `apps` | each app's manifest, state, and reason |
| `reload` | rereads the manifests and the configuration |
| `logins`, `nodes` | the allowed logins or nodes |
| `allow login LOGIN`, `allow node NODE` | allows one |
| `disallow login LOGIN`, `disallow node NODE` | removes one and closes its sessions |
| `tokens` | the MCP tokens |
| `token issue NAME --app ID --scope SCOPE [--agent USER]` | prints a new token once |
| `token revoke NAME` | revokes one and closes its streams |
| `sessions` | the live sessions |
| `session end ID` | closes one |
| `usage [--since YYYY-MM-DD]` | inference use per app and alias |
| `provider key NAME` | sets an inference provider's key from stdin |
| `provider login NAME` | signs a `codex` provider in to your ChatGPT plan |
| `provider login NAME --copilot` | signs in to GitHub for a `copilot` provider |
| `provider import NAME` | imports a login file from stdin, on lodge's host |
| `provider models NAME` | the models a provider offers |
| `version` | `lodgectl`'s version |

If you lose a phone, remove it from your tailnet or run
`sudo lodgectl disallow node NODE`. If a token ends up in the wrong hands, run
`sudo lodgectl token revoke NAME`.

## Remove

These steps follow the install layout. They are not tested yet.

Remove each app first: [Frostnotes](/docs/apps/frostnotes/),
[Frostmail](/docs/apps/frostmail/), [frostread](/docs/apps/frostread/#remove),
and [Porter](/docs/apps/porter/#remove). Then stop lodge and delete its files:

```bash
sudo systemctl disable --now lodge
sudo rm /usr/bin/lodge /usr/bin/lodgectl
sudo rm /usr/lib/systemd/system/lodge.service /usr/lib/sysusers.d/lodge.conf /usr/lib/tmpfiles.d/lodge.conf
sudo rm -rf /usr/share/lodge /run/lodge
```

If you installed with `PREFIX=/opt/lodge`, the binaries are in
`/opt/lodge/bin`, and the unit and the `sysusers.d` and `tmpfiles.d` entries
are under `/etc`.

Two directories stay. `/var/lib/lodge` holds the node keys, the tokens, and the
sessions. `/etc/lodge` holds the configuration and `lodge.env`. Delete them only
if you do not want them back.

In your tailnet's admin console, delete the machines `lodge` and
`lodge-content`.

`systemd-sysusers` never deletes a user or a group. To remove the user, run
`sudo userdel lodge`. This is optional.

## Limits

- lodge and its apps share one host.
- Phones get no notifications from lodge. lodge registers no service worker,
  so a notification reaches only a page that is open.
- Sign-in is by tailnet identity alone. A browser must be on your tailnet,
  with its login and its device on the allow-lists.
- Each app decides what its token scopes mean. lodge does not read them.

## See also

- [Frostnotes](/docs/apps/frostnotes/), [Frostmail](/docs/apps/frostmail/),
  [frostread](/docs/apps/frostread/), and [Porter](/docs/apps/porter/): the
  apps that run behind lodge
- [nsl](/docs/tools/nsl/): the machine that builds the shell
- [lodge repository](https://github.com/frostyard/lodge)

## Sources

Reviewed 2026-10-23.

- lodge commit [`b6aaa95d8d62840f21b17e77c820a976bee18032`](https://github.com/frostyard/lodge/tree/b6aaa95d8d62840f21b17e77c820a976bee18032) on `main`. There is no release.
- [`README.md`](https://github.com/frostyard/lodge/blob/b6aaa95d8d62840f21b17e77c820a976bee18032/README.md)
- [`Makefile`](https://github.com/frostyard/lodge/blob/b6aaa95d8d62840f21b17e77c820a976bee18032/Makefile)
- [`docs/README.md`](https://github.com/frostyard/lodge/blob/b6aaa95d8d62840f21b17e77c820a976bee18032/docs/README.md)
- [`docs/design/overview.md`](https://github.com/frostyard/lodge/blob/b6aaa95d8d62840f21b17e77c820a976bee18032/docs/design/overview.md)
- [`docs/plans/0001-roadmap.md`](https://github.com/frostyard/lodge/blob/b6aaa95d8d62840f21b17e77c820a976bee18032/docs/plans/0001-roadmap.md)
- [`docs/specs/app-contract.md`](https://github.com/frostyard/lodge/blob/b6aaa95d8d62840f21b17e77c820a976bee18032/docs/specs/app-contract.md)
- [`docs/specs/inference.md`](https://github.com/frostyard/lodge/blob/b6aaa95d8d62840f21b17e77c820a976bee18032/docs/specs/inference.md)
- [`docs/specs/lodge-http.md`](https://github.com/frostyard/lodge/blob/b6aaa95d8d62840f21b17e77c820a976bee18032/docs/specs/lodge-http.md)
- [`packaging/README.md`](https://github.com/frostyard/lodge/blob/b6aaa95d8d62840f21b17e77c820a976bee18032/packaging/README.md)
- [`packaging/install.sh`](https://github.com/frostyard/lodge/blob/b6aaa95d8d62840f21b17e77c820a976bee18032/packaging/install.sh)
- [`packaging/config.example.json`](https://github.com/frostyard/lodge/blob/b6aaa95d8d62840f21b17e77c820a976bee18032/packaging/config.example.json)
- [`packaging/systemd/lodge.service`](https://github.com/frostyard/lodge/blob/b6aaa95d8d62840f21b17e77c820a976bee18032/packaging/systemd/lodge.service)
- [`packaging/app-template/example.service`](https://github.com/frostyard/lodge/blob/b6aaa95d8d62840f21b17e77c820a976bee18032/packaging/app-template/example.service), [`packaging/app-template/example.socket`](https://github.com/frostyard/lodge/blob/b6aaa95d8d62840f21b17e77c820a976bee18032/packaging/app-template/example.socket), [`packaging/app-template/example.sysusers.conf`](https://github.com/frostyard/lodge/blob/b6aaa95d8d62840f21b17e77c820a976bee18032/packaging/app-template/example.sysusers.conf)
- [`dev/nsl/provision.sh`](https://github.com/frostyard/lodge/blob/b6aaa95d8d62840f21b17e77c820a976bee18032/dev/nsl/provision.sh)
- [`cmd/lodgectl/main.go`](https://github.com/frostyard/lodge/blob/b6aaa95d8d62840f21b17e77c820a976bee18032/cmd/lodgectl/main.go)
- No release: the repository's [releases page](https://github.com/frostyard/lodge/releases), checked 2026-10-23.
- frostyard/core commit [`d55b259c57c636169e9a86f89ce808b075a1bf3c`](https://github.com/frostyard/core/tree/d55b259c57c636169e9a86f89ce808b075a1bf3c): [`docs/adr/0057-run-first-party-apps-behind-lodge.md`](https://github.com/frostyard/core/blob/d55b259c57c636169e9a86f89ce808b075a1bf3c/docs/adr/0057-run-first-party-apps-behind-lodge.md), and [`docs/adr/0058-ship-suite-desktop-apps-as-flatpaks-and-services-as-sysexts.md`](https://github.com/frostyard/core/blob/d55b259c57c636169e9a86f89ce808b075a1bf3c/docs/adr/0058-ship-suite-desktop-apps-as-flatpaks-and-services-as-sysexts.md) (Proposed)
