---
title: Porter
description: "Porter is the owner's assistant inside lodge: a chat panel that reads your apps and drafts but never sends. Pre-release: the only package is a `.deb` of the daemon for lodge."
---

Porter is a personal assistant that runs inside [lodge](/docs/apps/lodge/).
You talk to it in a chat panel beside whatever app you are in. You need it if
you run lodge and want an assistant that works across your apps.

- It reads your mail, calendar, tasks, and notes through their MCP endpoints.
- It drafts, and never sends. You send.
- It keeps its memory and its scheduled prompts (routines) as notes in your
  vault.
- It thinks through lodge's inference layer.
- It reads [frostread](/docs/apps/frostread/) read-only, and it keeps one
  continuous thread.

Porter has no desktop app, and none is planned. No Porter Flatpak ships. Porter
works only behind lodge: you need lodge, Tailscale, and the other apps on
lodge.

## Status

Porter is pre-release. The latest release is v0.1.0. Each release attaches
one package, `frostyard-porterd_X.Y.Z_amd64.deb`, for lodge's host. On a
Frostyard image, the [porterd system extension](/docs/sysexts/porterd/)
installs it. Chat, routines, and reading from frostread are built and run on
lodge's host, as lodge's `porter` app. The GitHub manager, the next planned
phase, is not built.

## Install

Porter runs as lodge's `porter` app, on lodge's host. You need
[lodge](/docs/apps/lodge/), an inference alias that lodge routes to a model,
and the apps Porter reads. The web bundle builds in an
[nsl](/docs/tools/nsl/) machine, and `make lodge-package` stages the app, with
`porterd` in `usr/bin`. lodge's own host keeps `porterd` in `/opt/lodge/bin`, so
do not extract the staged tree onto `/` there. The
[operational notes](https://github.com/frostyard/porter/blob/main/docs/design/overview.md#operational-notes)
cover the configuration, the tokens, and the agent socket. Step 5 of lodge's
[packaging README](https://github.com/frostyard/lodge/blob/main/packaging/README.md)
covers agents on lodge's host.

## Update and roll back

On a Frostyard image, Updex updates and rolls back the porterd system
extension.
[Update, roll back, and remove](/docs/sysexts/porterd/#update-roll-back-and-remove)
has the steps, with the backup to take first. The release `.deb` is built for
that extension, and it is not in the Frostyard APT repository. To check a
download, run
`gh attestation verify frostyard-porterd_X.Y.Z_amd64.deb --repo frostyard/porter`.

On lodge's own host, which is installed by hand, follow
[Update](https://github.com/frostyard/porter/blob/main/README.md#update) and
[Roll back](https://github.com/frostyard/porter/blob/main/README.md#roll-back)
in the README. The Update steps take a rollback archive before the new build
goes in.

## Documentation

- [README](https://github.com/frostyard/porter/blob/main/README.md): what Porter is and what is built.
- [Design overview](https://github.com/frostyard/porter/blob/main/docs/design/overview.md): how Porter works and what it reaches.
- [Operational notes](https://github.com/frostyard/porter/blob/main/docs/design/overview.md#operational-notes): configuration, tokens, dependencies, and logs.
- [Limits](https://github.com/frostyard/porter/blob/main/README.md#limits): what Porter does not do, and what can go wrong.
- [Routines](https://github.com/frostyard/porter/blob/main/docs/specs/routines.md): how to write a routine.
- [ADR-0004](https://github.com/frostyard/porter/blob/main/docs/adr/0004-porter-drafts-and-the-owner-sends.md): Porter drafts and the owner sends.
- [ADR-0005](https://github.com/frostyard/porter/blob/main/docs/adr/0005-memory-and-routines-live-in-the-vault.md): memory and routines live in the vault.
- [ADR-0006](https://github.com/frostyard/porter/blob/main/docs/adr/0006-one-continuous-thread.md): one continuous thread.
- [ADR-0007](https://github.com/frostyard/porter/blob/main/docs/adr/0007-porter-reads-frostread-read-only.md): Porter reads frostread read-only.
- [Roadmap](https://github.com/frostyard/porter/blob/main/docs/plans/0001-roadmap.md): what is built and what comes next.

## See also

- [lodge](/docs/apps/lodge/)
- [Frostnotes](/docs/apps/frostnotes/)
- [Frostmail](/docs/apps/frostmail/)
- [frostread](/docs/apps/frostread/)
- [nsl](/docs/tools/nsl/)

## Sources

Reviewed 2026-10-28.

- Porter v0.1.0 commit [`a56337d0f2cec26f660b651fa3c8003ed19d22bd`](https://github.com/frostyard/porter/tree/a56337d0f2cec26f660b651fa3c8003ed19d22bd)
- [`README.md`](https://github.com/frostyard/porter/blob/a56337d0f2cec26f660b651fa3c8003ed19d22bd/README.md)
- [`docs/design/overview.md`](https://github.com/frostyard/porter/blob/a56337d0f2cec26f660b651fa3c8003ed19d22bd/docs/design/overview.md), [`docs/plans/0001-roadmap.md`](https://github.com/frostyard/porter/blob/a56337d0f2cec26f660b651fa3c8003ed19d22bd/docs/plans/0001-roadmap.md), [`docs/specs/routines.md`](https://github.com/frostyard/porter/blob/a56337d0f2cec26f660b651fa3c8003ed19d22bd/docs/specs/routines.md)
- [`docs/adr/0004-porter-drafts-and-the-owner-sends.md`](https://github.com/frostyard/porter/blob/a56337d0f2cec26f660b651fa3c8003ed19d22bd/docs/adr/0004-porter-drafts-and-the-owner-sends.md), [`docs/adr/0005-memory-and-routines-live-in-the-vault.md`](https://github.com/frostyard/porter/blob/a56337d0f2cec26f660b651fa3c8003ed19d22bd/docs/adr/0005-memory-and-routines-live-in-the-vault.md), [`docs/adr/0006-one-continuous-thread.md`](https://github.com/frostyard/porter/blob/a56337d0f2cec26f660b651fa3c8003ed19d22bd/docs/adr/0006-one-continuous-thread.md), [`docs/adr/0007-porter-reads-frostread-read-only.md`](https://github.com/frostyard/porter/blob/a56337d0f2cec26f660b651fa3c8003ed19d22bd/docs/adr/0007-porter-reads-frostread-read-only.md)
- lodge commit [`a43d3be1de45704e0514d51da4c4b32d575f7c6c`](https://github.com/frostyard/lodge/tree/a43d3be1de45704e0514d51da4c4b32d575f7c6c): [`packaging/README.md`](https://github.com/frostyard/lodge/blob/a43d3be1de45704e0514d51da4c4b32d575f7c6c/packaging/README.md)
- Suite rule: core [`docs/adr/0062-make-desktop-suite-apps-standalone-flatpaks-with-opt-in-lodge.md`](https://github.com/frostyard/core/blob/4d340b939fccab2ecb7f0be5dbf9e7ab7c03963c/docs/adr/0062-make-desktop-suite-apps-standalone-flatpaks-with-opt-in-lodge.md) (Accepted 2026-10-27) at `4d340b939fccab2ecb7f0be5dbf9e7ab7c03963c`.
- snosi PR [snosi#1173](https://github.com/frostyard/snosi/pull/1173), merged 2026-10-28, adds the lodge, readd, and porterd extensions.
- core commit [`cd2720e0c55d08f3ba8f28a3b55dd5796a5c425a`](https://github.com/frostyard/core/tree/cd2720e0c55d08f3ba8f28a3b55dd5796a5c425a): [`docs/plans/0010-suite-packaging.md`](https://github.com/frostyard/core/blob/cd2720e0c55d08f3ba8f28a3b55dd5796a5c425a/docs/plans/0010-suite-packaging.md) (Phase 2: the `.deb` is not registered with apt-publisher)
- [`packaging/nfpm.yaml`](https://github.com/frostyard/porter/blob/a56337d0f2cec26f660b651fa3c8003ed19d22bd/packaging/nfpm.yaml) (the description says "Built for Snosi's sysext")
