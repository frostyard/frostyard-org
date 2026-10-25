---
title: lodge
description: "lodge is the tailnet-only web shell that opens Notes, Mail, Read, and Porter from one address. Pre-release: there is no package yet."
---

lodge is a web shell for Frostyard's own apps. One address on your tailnet
opens Notes, Mail, Read, and the assistant [Porter](/docs/apps/porter/). A
quick switcher moves between them, and each app stays loaded in its frame.
You need it if you want to run those apps.

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

Frostyard has a proposed plan to ship lodge and the app daemons as system
extensions. It is not built.

## Install

Install lodge on a Debian 13 host, not on a Frostyard image. The install
layout fixes `/usr/share/lodge`, and `/usr` is read-only on a Frostyard
image.

lodge needs a host with systemd. The apps it serves share that host, because
they meet lodge on Unix sockets. You build the shell in an [nsl](/docs/tools/nsl/)
machine. The
[packaging README](https://github.com/frostyard/lodge/blob/main/packaging/README.md)
has the build, the install, the first start, and the allow-lists.

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
newer than itself. Back up `/var/lib/lodge` before you build a newer `main`.

## See also

- [Frostnotes](/docs/apps/frostnotes/)
- [Frostmail](/docs/apps/frostmail/)
- [frostread](/docs/apps/frostread/)
- [Porter](/docs/apps/porter/)
- [nsl](/docs/tools/nsl/)

## Sources

Reviewed 2026-10-25.

- lodge commit [`ecded651e597faddd58cb1670099d11439e2e895`](https://github.com/frostyard/lodge/tree/ecded651e597faddd58cb1670099d11439e2e895) on `main`. There is no release.
- [`README.md`](https://github.com/frostyard/lodge/blob/ecded651e597faddd58cb1670099d11439e2e895/README.md)
- [`packaging/README.md`](https://github.com/frostyard/lodge/blob/ecded651e597faddd58cb1670099d11439e2e895/packaging/README.md), [`packaging/install.sh`](https://github.com/frostyard/lodge/blob/ecded651e597faddd58cb1670099d11439e2e895/packaging/install.sh), [`packaging/tmpfiles.d/lodge.conf`](https://github.com/frostyard/lodge/blob/ecded651e597faddd58cb1670099d11439e2e895/packaging/tmpfiles.d/lodge.conf)
- [`Makefile`](https://github.com/frostyard/lodge/blob/ecded651e597faddd58cb1670099d11439e2e895/Makefile)
- [`internal/store/store.go`](https://github.com/frostyard/lodge/blob/ecded651e597faddd58cb1670099d11439e2e895/internal/store/store.go)
- [`docs/specs/app-contract.md`](https://github.com/frostyard/lodge/blob/ecded651e597faddd58cb1670099d11439e2e895/docs/specs/app-contract.md), [`docs/specs/lodge-http.md`](https://github.com/frostyard/lodge/blob/ecded651e597faddd58cb1670099d11439e2e895/docs/specs/lodge-http.md), [`docs/specs/inference.md`](https://github.com/frostyard/lodge/blob/ecded651e597faddd58cb1670099d11439e2e895/docs/specs/inference.md)
- [`docs/design/overview.md`](https://github.com/frostyard/lodge/blob/ecded651e597faddd58cb1670099d11439e2e895/docs/design/overview.md), [`docs/plans/0001-roadmap.md`](https://github.com/frostyard/lodge/blob/ecded651e597faddd58cb1670099d11439e2e895/docs/plans/0001-roadmap.md)
- core commit [`e783a9acc3ba9aa767233a4620588252fc2c732f`](https://github.com/frostyard/core/tree/e783a9acc3ba9aa767233a4620588252fc2c732f): [`docs/adr/0058-ship-suite-desktop-apps-as-flatpaks-and-services-as-sysexts.md`](https://github.com/frostyard/core/blob/e783a9acc3ba9aa767233a4620588252fc2c732f/docs/adr/0058-ship-suite-desktop-apps-as-flatpaks-and-services-as-sysexts.md) (Status: Proposed)
