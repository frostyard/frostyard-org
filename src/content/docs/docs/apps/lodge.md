---
title: lodge
description: "lodge is the tailnet-only web shell that opens Notes, Mail, Read, and Porter from one address. Pre-release: it installs from a tarball."
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

lodge is pre-release. The latest release is v0.1.0. Each release attaches
`frostyard-lodge_X.Y.Z_amd64.deb`, which the lodge system extension installs.
On another host, you install lodge from the tarball that `make dist` builds. lodge v1 and its
inference layer are built.
[Frostnotes](/docs/apps/frostnotes/) as Notes and
[Frostmail](/docs/apps/frostmail/) as Mail run behind it.
[frostread](/docs/apps/frostread/) runs behind it as Read, since 2026-10-21.
[Porter](/docs/apps/porter/) runs beside them, since 2026-10-20.

lodge is optional for the desktop apps. Frostnotes works on its own as a
Flatpak. Frostmail and frostread follow the same rule when their Flatpaks
ship. You opt into lodge for each app, and nothing turns it on for you.
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
- [Packaging](https://github.com/frostyard/lodge/blob/main/packaging/README.md): build, install, first start, allow-lists, and agents on the host.
- [Install layout](https://github.com/frostyard/lodge/blob/main/docs/specs/app-contract.md#install-layout): where an app's files go.
- [MCP tokens and scope](https://github.com/frostyard/lodge/blob/main/docs/specs/app-contract.md#mcp-tokens-and-scope): what a token for an app lets an agent do.
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

Reviewed 2026-10-28.

- lodge v0.1.0 commit [`a43d3be1de45704e0514d51da4c4b32d575f7c6c`](https://github.com/frostyard/lodge/tree/a43d3be1de45704e0514d51da4c4b32d575f7c6c) on `main`.
- [`README.md`](https://github.com/frostyard/lodge/blob/a43d3be1de45704e0514d51da4c4b32d575f7c6c/README.md)
- [`packaging/README.md`](https://github.com/frostyard/lodge/blob/a43d3be1de45704e0514d51da4c4b32d575f7c6c/packaging/README.md), [`packaging/install.sh`](https://github.com/frostyard/lodge/blob/a43d3be1de45704e0514d51da4c4b32d575f7c6c/packaging/install.sh), [`packaging/tmpfiles.d/lodge.conf`](https://github.com/frostyard/lodge/blob/a43d3be1de45704e0514d51da4c4b32d575f7c6c/packaging/tmpfiles.d/lodge.conf)
- [`Makefile`](https://github.com/frostyard/lodge/blob/a43d3be1de45704e0514d51da4c4b32d575f7c6c/Makefile)
- [`internal/store/store.go`](https://github.com/frostyard/lodge/blob/a43d3be1de45704e0514d51da4c4b32d575f7c6c/internal/store/store.go)
- [`docs/specs/app-contract.md`](https://github.com/frostyard/lodge/blob/a43d3be1de45704e0514d51da4c4b32d575f7c6c/docs/specs/app-contract.md), [`docs/specs/lodge-http.md`](https://github.com/frostyard/lodge/blob/a43d3be1de45704e0514d51da4c4b32d575f7c6c/docs/specs/lodge-http.md), [`docs/specs/inference.md`](https://github.com/frostyard/lodge/blob/a43d3be1de45704e0514d51da4c4b32d575f7c6c/docs/specs/inference.md)
- [`docs/design/overview.md`](https://github.com/frostyard/lodge/blob/a43d3be1de45704e0514d51da4c4b32d575f7c6c/docs/design/overview.md), [`docs/plans/0001-roadmap.md`](https://github.com/frostyard/lodge/blob/a43d3be1de45704e0514d51da4c4b32d575f7c6c/docs/plans/0001-roadmap.md)
- core commit [`28e7847642a05214415af6d8d2ddf7f3033682d5`](https://github.com/frostyard/core/tree/28e7847642a05214415af6d8d2ddf7f3033682d5): [`docs/adr/0058-ship-suite-desktop-apps-as-flatpaks-and-services-as-sysexts.md`](https://github.com/frostyard/core/blob/28e7847642a05214415af6d8d2ddf7f3033682d5/docs/adr/0058-ship-suite-desktop-apps-as-flatpaks-and-services-as-sysexts.md) (Status: Accepted), Context; [`docs/plans/0010-suite-packaging.md`](https://github.com/frostyard/core/blob/28e7847642a05214415af6d8d2ddf7f3033682d5/docs/plans/0010-suite-packaging.md) (Phase 3; Phase 4, lodge's host on Floe, is deferred)
- frostmail commit [`df106558209fad29c63983710a1a646557064dd4`](https://github.com/frostyard/frostmail/tree/df106558209fad29c63983710a1a646557064dd4): [`docs/plans/0011-m8-mail-in-lodge.md`](https://github.com/frostyard/frostmail/blob/df106558209fad29c63983710a1a646557064dd4/docs/plans/0011-m8-mail-in-lodge.md)
- Suite rule: core [`docs/adr/0062-make-desktop-suite-apps-standalone-flatpaks-with-opt-in-lodge.md`](https://github.com/frostyard/core/blob/4d340b939fccab2ecb7f0be5dbf9e7ab7c03963c/docs/adr/0062-make-desktop-suite-apps-standalone-flatpaks-with-opt-in-lodge.md) (Accepted 2026-10-27) at `4d340b939fccab2ecb7f0be5dbf9e7ab7c03963c`.
- snosi PR [snosi#1169](https://github.com/frostyard/snosi/pull/1169), merged 2026-10-28, adds the notesd and maild extensions.
- snosi PR [snosi#1173](https://github.com/frostyard/snosi/pull/1173), merged 2026-10-28 (merge commit [`0ede646cd878f82e91b891d9c3f6eba77227573b`](https://github.com/frostyard/snosi/tree/0ede646cd878f82e91b891d9c3f6eba77227573b)), adds the lodge, readd, and porterd extensions.
- core commit [`cd2720e0c55d08f3ba8f28a3b55dd5796a5c425a`](https://github.com/frostyard/core/tree/cd2720e0c55d08f3ba8f28a3b55dd5796a5c425a): [`docs/plans/0010-suite-packaging.md`](https://github.com/frostyard/core/blob/cd2720e0c55d08f3ba8f28a3b55dd5796a5c425a/docs/plans/0010-suite-packaging.md) (Phase 2: the `.deb` is not registered with apt-publisher)
- [`packaging/nfpm.yaml`](https://github.com/frostyard/lodge/blob/a43d3be1de45704e0514d51da4c4b32d575f7c6c/packaging/nfpm.yaml) (the description says "Built for Snosi's sysext")
