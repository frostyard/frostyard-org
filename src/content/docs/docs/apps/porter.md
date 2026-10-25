---
title: Porter
description: "Porter is the owner's assistant inside lodge: a chat panel that reads your apps and drafts but never sends. Pre-release: there is no package yet."
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

## Status

Porter is pre-release. The repository has no release, and there is no
package. Chat, routines, and reading from frostread are built and run on
lodge's host, as lodge's `porter` app. The GitHub manager, the next planned
phase, is not built.

## Install

Porter runs as lodge's `porter` app, on lodge's host. You need
[lodge](/docs/apps/lodge/), an inference alias that lodge routes to a model,
and the apps Porter reads. The web bundle builds in an
[nsl](/docs/tools/nsl/) machine, and `make lodge-package` stages the app. The
[operational notes](https://github.com/frostyard/porter/blob/main/docs/design/overview.md#operational-notes)
cover the configuration, the tokens, and the agent socket. Step 5 of lodge's
[packaging README](https://github.com/frostyard/lodge/blob/main/packaging/README.md)
covers agents on lodge's host.

## Documentation

- [README](https://github.com/frostyard/porter/blob/main/README.md): what Porter is and what is built.
- [Design overview](https://github.com/frostyard/porter/blob/main/docs/design/overview.md): how Porter works and what it reaches.
- [Operational notes](https://github.com/frostyard/porter/blob/main/docs/design/overview.md#operational-notes): configuration, tokens, dependencies, and logs.
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

Reviewed 2026-10-25.

- Porter commit [`275b5aa25d0ffc0e99101c18f2d9b71efa27a5fe`](https://github.com/frostyard/porter/tree/275b5aa25d0ffc0e99101c18f2d9b71efa27a5fe) on `main`. There is no release.
- [`README.md`](https://github.com/frostyard/porter/blob/275b5aa25d0ffc0e99101c18f2d9b71efa27a5fe/README.md)
- [`docs/design/overview.md`](https://github.com/frostyard/porter/blob/275b5aa25d0ffc0e99101c18f2d9b71efa27a5fe/docs/design/overview.md), [`docs/plans/0001-roadmap.md`](https://github.com/frostyard/porter/blob/275b5aa25d0ffc0e99101c18f2d9b71efa27a5fe/docs/plans/0001-roadmap.md), [`docs/specs/routines.md`](https://github.com/frostyard/porter/blob/275b5aa25d0ffc0e99101c18f2d9b71efa27a5fe/docs/specs/routines.md)
- [`docs/adr/0004-porter-drafts-and-the-owner-sends.md`](https://github.com/frostyard/porter/blob/275b5aa25d0ffc0e99101c18f2d9b71efa27a5fe/docs/adr/0004-porter-drafts-and-the-owner-sends.md), [`docs/adr/0005-memory-and-routines-live-in-the-vault.md`](https://github.com/frostyard/porter/blob/275b5aa25d0ffc0e99101c18f2d9b71efa27a5fe/docs/adr/0005-memory-and-routines-live-in-the-vault.md), [`docs/adr/0006-one-continuous-thread.md`](https://github.com/frostyard/porter/blob/275b5aa25d0ffc0e99101c18f2d9b71efa27a5fe/docs/adr/0006-one-continuous-thread.md), [`docs/adr/0007-porter-reads-frostread-read-only.md`](https://github.com/frostyard/porter/blob/275b5aa25d0ffc0e99101c18f2d9b71efa27a5fe/docs/adr/0007-porter-reads-frostread-read-only.md)
- lodge commit [`ecded651e597faddd58cb1670099d11439e2e895`](https://github.com/frostyard/lodge/tree/ecded651e597faddd58cb1670099d11439e2e895): [`packaging/README.md`](https://github.com/frostyard/lodge/blob/ecded651e597faddd58cb1670099d11439e2e895/packaging/README.md)
