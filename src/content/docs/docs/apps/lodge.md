---
title: lodge
description: "lodge is the tailnet-only web shell that opens Notes, Mail, Read, and Porter from one address. Pre-release: there is no package yet."
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

lodge is pre-release. The repository has no release, and there is no
package. lodge v1 and its inference layer are built.
[Frostnotes](/docs/apps/frostnotes/) as Notes and
[Frostmail](/docs/apps/frostmail/) as Mail run behind it.
[frostread](/docs/apps/frostread/) runs behind it as Read, since 2026-10-21.
[Porter](/docs/apps/porter/) runs beside them, since 2026-10-20.

Frostyard plans to ship lodge and the app daemons as system extensions for
Frostyard images. It is not built, and lodge's own host stays hand-installed.

## Install

Install lodge on a systemd host, such as Debian 13, not on a Frostyard image.
The install layout fixes `/usr/share/lodge`, and `/usr` is read-only on a
Frostyard image.

The apps lodge serves share its host, because they meet lodge on Unix
sockets. You build the shell in an [nsl](/docs/tools/nsl/) machine. The
[packaging README](https://github.com/frostyard/lodge/blob/main/packaging/README.md)
has the build, the install, the first start, and the allow-lists.

## Documentation

- [README](https://github.com/frostyard/lodge/blob/main/README.md): what lodge is and the current status.
- [Packaging](https://github.com/frostyard/lodge/blob/main/packaging/README.md): build, install, first start, allow-lists, and agents on the host.
- [Update](https://github.com/frostyard/lodge/blob/main/packaging/README.md#update) and [roll back](https://github.com/frostyard/lodge/blob/main/packaging/README.md#roll-back): a rollback archive first, then the new build, and how to go back.
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

Reviewed 2026-10-26.

- lodge commit [`57203300b0d1a109554ab15fd3ae354af41edb55`](https://github.com/frostyard/lodge/tree/57203300b0d1a109554ab15fd3ae354af41edb55) on `main`. There is no release.
- [`README.md`](https://github.com/frostyard/lodge/blob/57203300b0d1a109554ab15fd3ae354af41edb55/README.md)
- [`packaging/README.md`](https://github.com/frostyard/lodge/blob/57203300b0d1a109554ab15fd3ae354af41edb55/packaging/README.md), [`packaging/install.sh`](https://github.com/frostyard/lodge/blob/57203300b0d1a109554ab15fd3ae354af41edb55/packaging/install.sh), [`packaging/tmpfiles.d/lodge.conf`](https://github.com/frostyard/lodge/blob/57203300b0d1a109554ab15fd3ae354af41edb55/packaging/tmpfiles.d/lodge.conf)
- [`Makefile`](https://github.com/frostyard/lodge/blob/57203300b0d1a109554ab15fd3ae354af41edb55/Makefile)
- [`internal/store/store.go`](https://github.com/frostyard/lodge/blob/57203300b0d1a109554ab15fd3ae354af41edb55/internal/store/store.go)
- [`docs/specs/app-contract.md`](https://github.com/frostyard/lodge/blob/57203300b0d1a109554ab15fd3ae354af41edb55/docs/specs/app-contract.md), [`docs/specs/lodge-http.md`](https://github.com/frostyard/lodge/blob/57203300b0d1a109554ab15fd3ae354af41edb55/docs/specs/lodge-http.md), [`docs/specs/inference.md`](https://github.com/frostyard/lodge/blob/57203300b0d1a109554ab15fd3ae354af41edb55/docs/specs/inference.md)
- [`docs/design/overview.md`](https://github.com/frostyard/lodge/blob/57203300b0d1a109554ab15fd3ae354af41edb55/docs/design/overview.md), [`docs/plans/0001-roadmap.md`](https://github.com/frostyard/lodge/blob/57203300b0d1a109554ab15fd3ae354af41edb55/docs/plans/0001-roadmap.md)
- core commit [`28e7847642a05214415af6d8d2ddf7f3033682d5`](https://github.com/frostyard/core/tree/28e7847642a05214415af6d8d2ddf7f3033682d5): [`docs/adr/0058-ship-suite-desktop-apps-as-flatpaks-and-services-as-sysexts.md`](https://github.com/frostyard/core/blob/28e7847642a05214415af6d8d2ddf7f3033682d5/docs/adr/0058-ship-suite-desktop-apps-as-flatpaks-and-services-as-sysexts.md) (Status: Accepted, 2026-10-26), [`docs/plans/0010-suite-packaging.md`](https://github.com/frostyard/core/blob/28e7847642a05214415af6d8d2ddf7f3033682d5/docs/plans/0010-suite-packaging.md) (Phase 3; Phase 4 deferred 2026-10-23)
- frostmail commit [`d04963c366a30a4806e266a0fdaa48c1cbb7b609`](https://github.com/frostyard/frostmail/tree/d04963c366a30a4806e266a0fdaa48c1cbb7b609): [`docs/plans/0011-m8-mail-in-lodge.md`](https://github.com/frostyard/frostmail/blob/d04963c366a30a4806e266a0fdaa48c1cbb7b609/docs/plans/0011-m8-mail-in-lodge.md)
