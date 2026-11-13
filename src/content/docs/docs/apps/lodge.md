---
title: lodge
description: "lodge is the tailnet-only web shell that opens Notes, Mail, Read, and Porter from one address. Pre-release: it installs from a tarball."
follows:
  repo: frostyard/lodge
  tag: v0.3.0
---

lodge is a web shell for Frostyard's own apps. One address on your tailnet
opens Notes, Mail, Read, and the assistant [Porter](/docs/apps/porter/). A
quick switcher moves between them, and each app stays loaded in its frame.
You need it to use those apps in a browser on your tailnet, and to run Read
and Porter.

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

lodge is pre-release. The latest release is v0.3.0. Each release attaches
`frostyard-lodge_X.Y.Z_amd64.deb`, which the lodge system extension installs.
The system extension can trail the latest release. The [catalog](/docs/sysexts/) lists the version it ships.
On another host, you install lodge from the tarball that `make dist` builds. lodge v1 and its
inference layer are built.
[Frostnotes](/docs/apps/frostnotes/) as Notes and
[Frostmail](/docs/apps/frostmail/) as Mail run behind it.
[frostread](/docs/apps/frostread/) runs behind it as Read, since 2026-10-21.
[Porter](/docs/apps/porter/) runs beside them, since 2026-10-20.

v0.2.0 adds unread counts. An app can report a count of things you have not seen, such as unread mail. lodge shows it on the app's rail button, in the app's row of the switcher, and as a sum on the home-screen icon. The design, ADR-0020, is Proposed.

v0.2.1 is a patch release: a security fix in a dependency, and dependency updates. It does not change lodge's behavior, its app contract, or its configuration.

v0.3.0 makes dim text easier to read. The secondary and tertiary text colours now reach a contrast of 4.5:1 on every surface, in light and dark. lodge also builds with Go 1.27.4, for its security fixes. v0.3.0 does not change lodge's app contract or its configuration.

lodge is optional for the desktop apps. Frostnotes, Frostmail, and frostread
work on their own as Flatpaks. You opt into lodge for each app, and nothing turns it on for you.
Frostnotes can sync with the hub in lodge. Frostmail can use the `maild`
behind lodge as its backend. The server side stays as this page says.

Frostyard ships lodge and its app daemons as system extensions for Frostyard
images: [lodge](/docs/sysexts/lodge/), [notesd](/docs/sysexts/notesd/),
[maild](/docs/sysexts/maild/), [readd](/docs/sysexts/readd/), and
[porterd](/docs/sysexts/porterd/).

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

- [README](https://github.com/frostyard/lodge/blob/main/README.md): what lodge is and the current status.
- [Documentation index](https://github.com/frostyard/lodge/blob/main/docs/README.md): the decisions, designs, specs, and plans.
- [Packaging](https://github.com/frostyard/lodge/blob/main/packaging/README.md): build, install, first start, allow-lists, and agents on the host.
- [Install layout](https://github.com/frostyard/lodge/blob/main/docs/specs/app-contract.md#install-layout): where an app's files go.
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
- [frostread](/docs/apps/frostread/)
- [Porter](/docs/apps/porter/)
- [nsl](/docs/tools/nsl/)

## Sources

Reviewed 2026-11-11.

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
- `https://repository.frostyard.org/ext/lodge/SHA256SUMS`, checked 2026-11-11, lists 0.1.0 and 0.2.1. [snosi#1257](https://github.com/frostyard/snosi/pull/1257), merged 2026-11-09 (merge commit `5e9d69d31552dce8040b5c3233b8a266b2156f4f`), pins lodge 0.2.1 and maild 0.5.0.
- core commit [`28e7847642a05214415af6d8d2ddf7f3033682d5`](https://github.com/frostyard/core/tree/28e7847642a05214415af6d8d2ddf7f3033682d5): [`docs/adr/0058-ship-suite-desktop-apps-as-flatpaks-and-services-as-sysexts.md`](https://github.com/frostyard/core/blob/28e7847642a05214415af6d8d2ddf7f3033682d5/docs/adr/0058-ship-suite-desktop-apps-as-flatpaks-and-services-as-sysexts.md) (Status: Accepted), Context; [`docs/plans/0010-suite-packaging.md`](https://github.com/frostyard/core/blob/28e7847642a05214415af6d8d2ddf7f3033682d5/docs/plans/0010-suite-packaging.md) (Phase 3; Phase 4, lodge's host on Floe, is deferred)
- frostmail commit [`df106558209fad29c63983710a1a646557064dd4`](https://github.com/frostyard/frostmail/tree/df106558209fad29c63983710a1a646557064dd4): [`docs/plans/0011-m8-mail-in-lodge.md`](https://github.com/frostyard/frostmail/blob/df106558209fad29c63983710a1a646557064dd4/docs/plans/0011-m8-mail-in-lodge.md)
- Suite rule: core [`docs/adr/0062-make-desktop-suite-apps-standalone-flatpaks-with-opt-in-lodge.md`](https://github.com/frostyard/core/blob/4d340b939fccab2ecb7f0be5dbf9e7ab7c03963c/docs/adr/0062-make-desktop-suite-apps-standalone-flatpaks-with-opt-in-lodge.md) (Accepted 2026-10-27) at `4d340b939fccab2ecb7f0be5dbf9e7ab7c03963c`.
- The standalone Flatpaks of Frostnotes, Frostmail, and frostread: flatpak-index [`README.md`](https://github.com/frostyard/flatpak-index/blob/0886d3caf7f02d23d19bcc779c7e7d2feb1935a6/README.md) at `0886d3caf7f02d23d19bcc779c7e7d2feb1935a6`, section What it publishes.
- snosi PR [snosi#1169](https://github.com/frostyard/snosi/pull/1169), merged 2026-10-28, adds the notesd and maild extensions.
- snosi PR [snosi#1173](https://github.com/frostyard/snosi/pull/1173), merged 2026-10-28 (merge commit [`0ede646cd878f82e91b891d9c3f6eba77227573b`](https://github.com/frostyard/snosi/tree/0ede646cd878f82e91b891d9c3f6eba77227573b)), adds the lodge, readd, and porterd extensions.
- core commit [`cd2720e0c55d08f3ba8f28a3b55dd5796a5c425a`](https://github.com/frostyard/core/tree/cd2720e0c55d08f3ba8f28a3b55dd5796a5c425a): [`docs/plans/0010-suite-packaging.md`](https://github.com/frostyard/core/blob/cd2720e0c55d08f3ba8f28a3b55dd5796a5c425a/docs/plans/0010-suite-packaging.md) (Phase 2: the `.deb` is not registered with apt-publisher)
- [`packaging/nfpm.yaml`](https://github.com/frostyard/lodge/blob/bd6fa7b391d08ce0de44d80a875e4a386e415985/packaging/nfpm.yaml) (the description says "Built for Snosi's sysext")
