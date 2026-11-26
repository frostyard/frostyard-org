---
title: lodge
description: "lodge is the tailnet-only web shell that opens Notes, Mail, and Porter from one address. Pre-release: it installs from a tarball."
follows:
  repo: frostyard/lodge
  tag: v0.6.1
---

lodge is a web shell for Frostyard's own apps. One address on your tailnet
opens Notes, Mail, and the assistant [Porter](/docs/apps/porter/). A
quick switcher moves between them, and each app stays loaded in its frame.
You need it to use those apps in a browser on your tailnet, and to run
Porter. The full user guide is on the
[lodge documentation site](https://frostyard.github.io/lodge/).

- lodge is the only process on the network. It joins your tailnet as a node
  of its own, `lodge`, and signs browsers in by their tailnet identity.
  Allow-lists of logins and devices decide who gets in. There are no
  passwords and no cookies, and nothing is on the public internet.
- Apps are daemons behind it. Each one runs as its own system user on a
  Unix socket that only lodge can reach.
- Agents get a scoped token for each app, at `/mcp/<app>`.
- Untrusted bytes, such as mail parts and attachments, come from a second
  node, `lodge-content`.
- One inference layer routes the apps' model requests to a local model or to
  the providers you configure. It holds every credential.

## Status

lodge is pre-release. The latest release is v0.6.1. It attaches
`frostyard-lodge_0.6.1_amd64.deb` with the lodge server, `lodgectl`, and the
web shell. The system extension can trail the latest release. Check
the [catalog](/docs/sysexts/) for published extension versions.
On another host, you install lodge from the tarball that `make dist` builds. lodge v1 and its
inference layer are built.
[Frostnotes](/docs/apps/frostnotes/) as Notes and
[Frostmail](/docs/apps/frostmail/) as Mail run behind it.
[Porter](/docs/apps/porter/) runs beside them, since 2026-10-20.

The Frostnotes v0.8.0 browser editor does not load under lodge v0.6.1.

## Remove frostread

frostread, the feed reader that ran behind lodge as Read, is retired since
2026-11-15. Its repository is archived. The articles it saved stay as notes in Frostnotes. A lodge that
still has frostread installed lists Read until you remove it. An image update
does not remove it.

On a Frostyard image, run `sudo updex features disable readd --now --force`,
then reboot. If Updex fails with `feature 'readd' not found`, your image no
longer ships readd, but systemd-sysext still merges it at each boot on trixie.
Remove its files instead:
`sudo rm -f /var/lib/extensions/readd.raw /var/lib/extensions.d/readd.raw /var/lib/extensions.d/readd_*`,
then reboot. Neither way deletes frostread's data in `/var/lib/frostread` or
its `frostread` user.
[readd (retired)](https://github.com/frostyard/snosi/blob/main/docs/design/sysexts.md#readd-retired)
has the details.

On another host, remove the `frostyard-readd` package, then run
`sudo lodgectl reload`.

## Release changes

v0.2.0 adds unread counts. An app can report a count of things you have not seen, such as unread mail. lodge shows it on the app's rail button, in the app's row of the switcher, and as a sum on the home-screen icon. The design, ADR-0020, is Proposed.

v0.2.1 is a patch release: a security fix in a dependency, and dependency updates. It does not change lodge's behavior, its app contract, or its configuration.

v0.3.0 makes dim text easier to read. The secondary and tertiary text colours now reach a contrast of 4.5:1 on every surface, in light and dark. lodge also builds with Go 1.27.4, for its security fixes. v0.3.0 does not change lodge's app contract or its configuration.

v0.4.0 to v0.5.1 add the parts that apps built on
[hearth](https://github.com/frostyard/hearth) use. An MCP client, such as an
agent, can sign in with OAuth 2.1, and an admin approves or narrows what it
may do on a consent page. One MCP gateway reaches those apps. An event
broker, NATS with JetStream, delivers app events to the clients that a grant
allows. From v0.5.0 the broker is on, unless the configuration turns it off.
The designs, ADR-0022,
ADR-0023, and ADR-0024, are Proposed. v0.4.0 and v0.5.1 each migrate the database, so an older lodge
cannot open it afterwards. Back up first, as [Limits](#limits) says. v0.5.1
holds each grant item for 1 major version of its app (for a version `0.y.z`,
1 minor version): after you update to
v0.5.1 or later, approve again each grant made before v0.5.1.

v0.5.2 is a patch release. It fixes event delivery: the broker keeps each
consumer's position across a restart, and a client that stays connected gets
a `resync` event when the stream drops events it has not read. v0.5.2 does not
migrate the database. Its first start can send each event subscription 1
`resync` event.

v0.6.0 adds *Agent access*, a link at the foot of lodge's rail and under the
apps in the switcher. It opens the grants page in a new tab. Every login sees
the link, but the page opens only for an admin. v0.6.0 does not migrate the
database.

v0.6.1 keeps a provider's inference queue when you reload without changing
its type or base URL. It passes the browser session's query string through
to the app and uses the same reserved app IDs in the client and shell.
It does not migrate the database.

lodge is optional for the desktop apps. Frostnotes and Frostmail work on
their own as Flatpaks. You opt into lodge for each app, and nothing turns it on for you.
Frostnotes can sync with the hub in lodge. Frostmail can use the `maild`
behind lodge as its backend. The server side stays as this page says.

Frostyard ships lodge and its app daemons as system extensions for Frostyard
images: [lodge](/docs/sysexts/lodge/), [notesd](/docs/sysexts/notesd/),
[maild](/docs/sysexts/maild/), and [porterd](/docs/sysexts/porterd/).

## Install

On a Frostyard image, enable the
[lodge system extension](/docs/sysexts/lodge/). On another systemd host, such
as Debian 13, install it from the tarball. The install layout fixes
`/usr/share/lodge`, and `/usr` is read-only on a Frostyard image.

The apps lodge serves share its host, because they meet lodge on Unix
sockets. You build the shell in an [nsl](/docs/tools/nsl/) machine. The
install writes only under `/usr`. Make the configuration directory yourself:
`sudo install -d -m 0755 /etc/lodge`. The example configuration is
`/usr/share/lodge/config.example.json`. The
[packaging README](https://github.com/frostyard/lodge/blob/main/packaging/README.md)
has the build, the install, the first start, and the allow-lists.

[Install lodge](https://frostyard.github.io/lodge/getting-started/install/)
on the lodge documentation site covers both ways and the first start.

## Update and roll back

On a Frostyard image, Updex updates and rolls back the lodge system extension.
[Update, roll back, and remove](/docs/sysexts/lodge/#update-roll-back-and-remove)
has the steps, with the backup to take first. The release `.deb` is built for
that extension, and it is not in the Frostyard APT repository. To check a
download, run
`gh attestation verify frostyard-lodge_X.Y.Z_amd64.deb --repo frostyard/lodge`.

On a host installed by hand with `PREFIX=/opt/lodge`, follow
[Update](https://github.com/frostyard/lodge/blob/main/packaging/README.md#update)
and [Roll back](https://github.com/frostyard/lodge/blob/main/packaging/README.md#roll-back)
in the packaging README. The Update steps take a rollback archive before the
new build goes in.

## Documentation

- [lodge documentation](https://frostyard.github.io/lodge/): the user guide.
- [Configure lodge](https://frostyard.github.io/lodge/guides/configure/): the configuration file, the allow-lists, tokens, and providers.
- [The apps it hosts](https://frostyard.github.io/lodge/guides/apps/): Notes, Mail, and Porter.
- [`lodgectl`](https://frostyard.github.io/lodge/reference/lodgectl/): the admin command.
- [README](https://github.com/frostyard/lodge/blob/main/README.md): what lodge is and the current status.
- [Documentation index](https://github.com/frostyard/lodge/blob/main/docs/README.md): the decisions, designs, specs, and plans.
- [Packaging](https://github.com/frostyard/lodge/blob/main/packaging/README.md): build, install, first start, allow-lists, and agents on the host.
- [Install layout](https://github.com/frostyard/lodge/blob/main/docs/specs/app-contract.md#install-layout): where an app's files go.
- [OAuth, consent, and grants](https://github.com/frostyard/lodge/blob/c3fe29ec096486dc59d436dff694a77c06951ab5/docs/specs/oauth.md): how an agent signs in, and what an admin approves.
- [MCP tokens and scope](https://github.com/frostyard/lodge/blob/main/docs/specs/app-contract.md#mcp-tokens-and-scope): what a token for an app lets an agent do.
- [Badges](https://github.com/frostyard/lodge/blob/main/docs/specs/shell.md#badges): the unread counts in the rail.
- [The agent socket](https://github.com/frostyard/lodge/blob/main/docs/specs/lodge-http.md#the-agent-socket): how agents on lodge's host connect.
- [Inference configuration](https://github.com/frostyard/lodge/blob/main/docs/specs/inference.md#configuration): providers and aliases.
- [The control socket and `lodgectl`](https://github.com/frostyard/lodge/blob/main/docs/specs/lodge-http.md#the-control-socket-and-lodgectl): the admin command.
- [Design overview](https://github.com/frostyard/lodge/blob/main/docs/design/overview.md): how the parts fit together.
- [Roadmap](https://github.com/frostyard/lodge/blob/main/docs/plans/0001-roadmap.md): what is built and what comes next.

## Limits

lodge applies database migrations at start and refuses a database that is
newer than itself. Back up `/var/lib/lodge` before you install a newer build.

## See also

- [Frostnotes](/docs/apps/frostnotes/)
- [Frostmail](/docs/apps/frostmail/)
- [Porter](/docs/apps/porter/)
- [nsl](/docs/tools/nsl/)

## Sources

Reviewed 2026-11-26.

- [lodge v0.6.1 release and Debian asset](https://github.com/frostyard/lodge/releases/tag/v0.6.1), [the queue, session, and app ID fixes](https://github.com/frostyard/lodge/pull/110), and the [tag comparison](https://github.com/frostyard/lodge/compare/v0.6.0...v0.6.1). `internal/store/migrations` is unchanged between the tags.

- lodge v0.6.0 commit [`338a708d451701a90ddf7afd299889cdc7edd620`](https://github.com/frostyard/lodge/tree/338a708d451701a90ddf7afd299889cdc7edd620), released 2026-11-17 ([release](https://github.com/frostyard/lodge/releases/tag/v0.6.0)): the *Agent access* link to the grants page ([lodge#98](https://github.com/frostyard/lodge/pull/98); [`site/content/guides/configure.md`](https://github.com/frostyard/lodge/blob/338a708d451701a90ddf7afd299889cdc7edd620/site/content/guides/configure.md)). `internal/store/migrations` is the same as at v0.5.2. The first start of v0.5.2 and its `resync` events: [`packaging/README.md`](https://github.com/frostyard/lodge/blob/338a708d451701a90ddf7afd299889cdc7edd620/packaging/README.md#update) (Update).
- lodge v0.5.2 commit [`d2cfffecda33f46187abc1e4ba3ce0ba320342df`](https://github.com/frostyard/lodge/tree/d2cfffecda33f46187abc1e4ba3ce0ba320342df), released 2026-11-17 ([release](https://github.com/frostyard/lodge/releases/tag/v0.5.2)): consumer positions kept across a start, and a `resync` for a gap that a pull on an open connection passed ([lodge#96](https://github.com/frostyard/lodge/pull/96); [`site/content/guides/configure.md`](https://github.com/frostyard/lodge/blob/d2cfffecda33f46187abc1e4ba3ce0ba320342df/site/content/guides/configure.md), Events for agents). `internal/store/migrations` is the same as at v0.5.1. Grants made before v0.5.1 need a new approval: [`packaging/README.md`](https://github.com/frostyard/lodge/blob/d2cfffecda33f46187abc1e4ba3ce0ba320342df/packaging/README.md#update) (Update) and [`docs/specs/oauth.md`](https://github.com/frostyard/lodge/blob/d2cfffecda33f46187abc1e4ba3ce0ba320342df/docs/specs/oauth.md#principals-clients-and-grants).
- lodge v0.5.1 commit [`c3fe29ec096486dc59d436dff694a77c06951ab5`](https://github.com/frostyard/lodge/tree/c3fe29ec096486dc59d436dff694a77c06951ab5), released 2026-11-17 ([release](https://github.com/frostyard/lodge/releases/tag/v0.5.1)): a grant item holds for 1 major version of its app ([lodge#94](https://github.com/frostyard/lodge/pull/94), migration `internal/store/migrations/0006_grant_majors.sql`). v0.5.0, commit [`42388fb4d385c7cdc1cc9e786156018e051277db`](https://github.com/frostyard/lodge/tree/42388fb4d385c7cdc1cc9e786156018e051277db), released 2026-11-16 ([release](https://github.com/frostyard/lodge/releases/tag/v0.5.0)): the MCP gateway for apps on hearth ([lodge#85](https://github.com/frostyard/lodge/pull/85)), and grant-driven event subscriptions with the broker on unless the configuration turns it off ([lodge#91](https://github.com/frostyard/lodge/pull/91)); [`packaging/README.md`](https://github.com/frostyard/lodge/blob/c3fe29ec096486dc59d436dff694a77c06951ab5/packaging/README.md#update) (`/run/lodge/nats.sock`, `/var/lib/lodge/jetstream`, the forward migration) and [`packaging/config.example.json`](https://github.com/frostyard/lodge/blob/c3fe29ec096486dc59d436dff694a77c06951ab5/packaging/config.example.json). v0.4.0, commit [`6e89346a8cbcd000550d138ebcb61c6af4dcf014`](https://github.com/frostyard/lodge/tree/6e89346a8cbcd000550d138ebcb61c6af4dcf014), released 2026-11-16 ([release](https://github.com/frostyard/lodge/releases/tag/v0.4.0)): the embedded NATS broker ([lodge#81](https://github.com/frostyard/lodge/pull/81)), and the OAuth 2.1 server with the consent and grants pages ([lodge#82](https://github.com/frostyard/lodge/pull/82), migration `0005_oauth.sql`). At v0.5.1: [`docs/specs/oauth.md`](https://github.com/frostyard/lodge/blob/c3fe29ec096486dc59d436dff694a77c06951ab5/docs/specs/oauth.md), [ADR-0022](https://github.com/frostyard/lodge/blob/c3fe29ec096486dc59d436dff694a77c06951ab5/docs/adr/0022-lodge-embeds-a-nats-broker-for-app-events.md), [ADR-0023](https://github.com/frostyard/lodge/blob/c3fe29ec096486dc59d436dff694a77c06951ab5/docs/adr/0023-lodge-issues-agent-access-through-oauth-and-a-consent-page.md) and [ADR-0024](https://github.com/frostyard/lodge/blob/c3fe29ec096486dc59d436dff694a77c06951ab5/docs/adr/0024-agents-reach-apps-on-hearth-through-one-mcp-gateway.md) (each Status: Proposed), and [`README.md`](https://github.com/frostyard/lodge/blob/c3fe29ec096486dc59d436dff694a77c06951ab5/README.md). `https://repository.frostyard.org/ext/lodge/SHA256SUMS`, checked 2026-11-16, lists up to 0.4.0.
- lodge `main` at commit [`78f5e20dafbfdf4294d14a97ecc3c27fa65aaf03`](https://github.com/frostyard/lodge/tree/78f5e20dafbfdf4294d14a97ecc3c27fa65aaf03), checked 2026-11-15, the previous review. [lodge#79](https://github.com/frostyard/lodge/pull/79) adds the user documentation site, [`site/properdocs.yml`](https://github.com/frostyard/lodge/blob/78f5e20dafbfdf4294d14a97ecc3c27fa65aaf03/site/properdocs.yml) (`site_url` `https://frostyard.github.io/lodge/`), and [`README.md`](https://github.com/frostyard/lodge/blob/78f5e20dafbfdf4294d14a97ecc3c27fa65aaf03/README.md) links it as its documentation. The site's home, Install, Configure lodge, The apps it hosts, and `lodgectl` pages answered HTTP 200 on 2026-11-15. Between v0.3.0 and this commit, `internal/store` does not change, and `packaging/README.md` only records the host update to v0.3.0.
- lodge v0.3.0 commit [`0e4a5bd00cc4ebdee9eb8577a8f18d859516c1c8`](https://github.com/frostyard/lodge/tree/0e4a5bd00cc4ebdee9eb8577a8f18d859516c1c8), released 2026-11-11 ([release](https://github.com/frostyard/lodge/releases/tag/v0.3.0)): [lodge#62](https://github.com/frostyard/lodge/pull/62) (the text tokens, `@frostyard/lodge-ui` 0.7.0, which the shell imports), [lodge#63](https://github.com/frostyard/lodge/pull/63) (Go 1.27.4), and 2 refactors. [`docs/adr/0021-the-text-tokens-reach-4-5-to-1-on-every-surface.md`](https://github.com/frostyard/lodge/blob/0e4a5bd00cc4ebdee9eb8577a8f18d859516c1c8/docs/adr/0021-the-text-tokens-reach-4-5-to-1-on-every-surface.md) (Accepted 2026-11-10) and [`ui/CHANGELOG.md`](https://github.com/frostyard/lodge/blob/0e4a5bd00cc4ebdee9eb8577a8f18d859516c1c8/ui/CHANGELOG.md). Between v0.2.1 and v0.3.0, `docs/specs/app-contract.md`, the inference spec and `packaging/` do not change. ADR-0020 is still Proposed at v0.3.0.
- lodge v0.2.1 commit [`74a31e4856b5e44da4567c53307cb83cf1354bf1`](https://github.com/frostyard/lodge/tree/74a31e4856b5e44da4567c53307cb83cf1354bf1), released 2026-11-09 ([release](https://github.com/frostyard/lodge/releases/tag/v0.2.1)): a patch release with no change to behavior, the app contract, or the configuration. [`docs/README.md`](https://github.com/frostyard/lodge/blob/74a31e4856b5e44da4567c53307cb83cf1354bf1/docs/README.md). No cookies: [`docs/specs/lodge-http.md`](https://github.com/frostyard/lodge/blob/74a31e4856b5e44da4567c53307cb83cf1354bf1/docs/specs/lodge-http.md) (identity from WhoIs alone; no response carries `Set-Cookie`).
- lodge v0.2.0 commit [`bd6fa7b391d08ce0de44d80a875e4a386e415985`](https://github.com/frostyard/lodge/tree/bd6fa7b391d08ce0de44d80a875e4a386e415985), released 2026-11-04 ([release](https://github.com/frostyard/lodge/releases/tag/v0.2.0)).
- [`README.md`](https://github.com/frostyard/lodge/blob/bd6fa7b391d08ce0de44d80a875e4a386e415985/README.md)
- [`packaging/README.md`](https://github.com/frostyard/lodge/blob/bd6fa7b391d08ce0de44d80a875e4a386e415985/packaging/README.md), [`packaging/install.sh`](https://github.com/frostyard/lodge/blob/bd6fa7b391d08ce0de44d80a875e4a386e415985/packaging/install.sh), [`packaging/tmpfiles.d/lodge.conf`](https://github.com/frostyard/lodge/blob/bd6fa7b391d08ce0de44d80a875e4a386e415985/packaging/tmpfiles.d/lodge.conf)
- [`Makefile`](https://github.com/frostyard/lodge/blob/bd6fa7b391d08ce0de44d80a875e4a386e415985/Makefile)
- [`internal/store/store.go`](https://github.com/frostyard/lodge/blob/bd6fa7b391d08ce0de44d80a875e4a386e415985/internal/store/store.go)
- [`docs/specs/app-contract.md`](https://github.com/frostyard/lodge/blob/bd6fa7b391d08ce0de44d80a875e4a386e415985/docs/specs/app-contract.md), [`docs/specs/lodge-http.md`](https://github.com/frostyard/lodge/blob/bd6fa7b391d08ce0de44d80a875e4a386e415985/docs/specs/lodge-http.md), [`docs/specs/inference.md`](https://github.com/frostyard/lodge/blob/bd6fa7b391d08ce0de44d80a875e4a386e415985/docs/specs/inference.md)
- [`docs/design/overview.md`](https://github.com/frostyard/lodge/blob/bd6fa7b391d08ce0de44d80a875e4a386e415985/docs/design/overview.md), [`docs/plans/0001-roadmap.md`](https://github.com/frostyard/lodge/blob/bd6fa7b391d08ce0de44d80a875e4a386e415985/docs/plans/0001-roadmap.md)
- [`docs/specs/shell.md`](https://github.com/frostyard/lodge/blob/bd6fa7b391d08ce0de44d80a875e4a386e415985/docs/specs/shell.md), [`docs/adr/0020-apps-report-an-unread-count-for-the-rail-in-their-health.md`](https://github.com/frostyard/lodge/blob/bd6fa7b391d08ce0de44d80a875e4a386e415985/docs/adr/0020-apps-report-an-unread-count-for-the-rail-in-their-health.md), and [lodge#45](https://github.com/frostyard/lodge/pull/45).
- `https://repository.frostyard.org/ext/lodge/SHA256SUMS`, checked 2026-11-15, lists 0.1.0, 0.2.1, and 0.3.0. [snosi#1257](https://github.com/frostyard/snosi/pull/1257), merged 2026-11-09 (merge commit `5e9d69d31552dce8040b5c3233b8a266b2156f4f`), pins lodge 0.2.1 and maild 0.5.0.
- core commit [`28e7847642a05214415af6d8d2ddf7f3033682d5`](https://github.com/frostyard/core/tree/28e7847642a05214415af6d8d2ddf7f3033682d5): [`docs/adr/0058-ship-suite-desktop-apps-as-flatpaks-and-services-as-sysexts.md`](https://github.com/frostyard/core/blob/28e7847642a05214415af6d8d2ddf7f3033682d5/docs/adr/0058-ship-suite-desktop-apps-as-flatpaks-and-services-as-sysexts.md) (Status: Accepted), Context; [`docs/plans/0010-suite-packaging.md`](https://github.com/frostyard/core/blob/28e7847642a05214415af6d8d2ddf7f3033682d5/docs/plans/0010-suite-packaging.md) (Phase 3; Phase 4, lodge's host on Floe, is deferred)
- frostmail commit [`df106558209fad29c63983710a1a646557064dd4`](https://github.com/frostyard/frostmail/tree/df106558209fad29c63983710a1a646557064dd4): [`docs/plans/0011-m8-mail-in-lodge.md`](https://github.com/frostyard/frostmail/blob/df106558209fad29c63983710a1a646557064dd4/docs/plans/0011-m8-mail-in-lodge.md)
- frostread is retired: lodge [lodge#80](https://github.com/frostyard/lodge/pull/80), merged 2026-11-15 (merge commit [`78f5e20dafbfdf4294d14a97ecc3c27fa65aaf03`](https://github.com/frostyard/lodge/tree/78f5e20dafbfdf4294d14a97ecc3c27fa65aaf03)): [`site/content/guides/apps.md`](https://github.com/frostyard/lodge/blob/78f5e20dafbfdf4294d14a97ecc3c27fa65aaf03/site/content/guides/apps.md) (the package, `lodgectl reload`), frostyard-org `src/content/docs/docs/sysexts/readd.mdx` at [`1937edbd5738d392882897da3c7bf53686f9fb2f`](https://github.com/frostyard/frostyard-org/blob/1937edbd5738d392882897da3c7bf53686f9fb2f/src/content/docs/docs/sysexts/readd.mdx#update-roll-back-and-remove) (remove readd with Updex, then reboot), and [`docs/plans/0001-roadmap.md`](https://github.com/frostyard/lodge/blob/78f5e20dafbfdf4294d14a97ecc3c27fa65aaf03/docs/plans/0001-roadmap.md) (the saved articles stay as notes).
- readd removal before and after the image update: [snosi#1314](https://github.com/frostyard/snosi/pull/1314) (the readd sysext is retired): snosi [`docs/design/sysexts.md`](https://github.com/frostyard/snosi/blob/main/docs/design/sysexts.md#readd-retired), section readd (retired). An image update does not remove the extension. After the host boots a base without `sysupdate.readd.d`, Updex no longer knows the feature: `updex features disable readd` fails with `feature 'readd' not found`, and systemd-sysext merges the last image at each trixie boot.
- Suite rule: core [`docs/adr/0062-make-desktop-suite-apps-standalone-flatpaks-with-opt-in-lodge.md`](https://github.com/frostyard/core/blob/4d340b939fccab2ecb7f0be5dbf9e7ab7c03963c/docs/adr/0062-make-desktop-suite-apps-standalone-flatpaks-with-opt-in-lodge.md) (Accepted 2026-10-27) at `4d340b939fccab2ecb7f0be5dbf9e7ab7c03963c`.
- The standalone Flatpaks of Frostnotes and Frostmail: flatpak-index [`README.md`](https://github.com/frostyard/flatpak-index/blob/0886d3caf7f02d23d19bcc779c7e7d2feb1935a6/README.md) at `0886d3caf7f02d23d19bcc779c7e7d2feb1935a6`, section What it publishes.
- snosi PR [snosi#1169](https://github.com/frostyard/snosi/pull/1169), merged 2026-10-28, adds the notesd and maild extensions.
- snosi PR [snosi#1173](https://github.com/frostyard/snosi/pull/1173), merged 2026-10-28 (merge commit [`0ede646cd878f82e91b891d9c3f6eba77227573b`](https://github.com/frostyard/snosi/tree/0ede646cd878f82e91b891d9c3f6eba77227573b)), adds the lodge, readd, and porterd extensions.
- core commit [`cd2720e0c55d08f3ba8f28a3b55dd5796a5c425a`](https://github.com/frostyard/core/tree/cd2720e0c55d08f3ba8f28a3b55dd5796a5c425a): [`docs/plans/0010-suite-packaging.md`](https://github.com/frostyard/core/blob/cd2720e0c55d08f3ba8f28a3b55dd5796a5c425a/docs/plans/0010-suite-packaging.md) (Phase 2: the `.deb` is not registered with apt-publisher)
- [`packaging/nfpm.yaml`](https://github.com/frostyard/lodge/blob/bd6fa7b391d08ce0de44d80a875e4a386e415985/packaging/nfpm.yaml) (the description says "Built for Snosi's sysext")
