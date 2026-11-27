---
title: Frostnotes
description: Keep plain Markdown notes in your own folder. Use the Frostnotes Flatpak to index and optionally sync them through a hub you host.
follows:
  repo: frostyard/frostnotes
  tag: v0.9.0
---

Keep your Markdown notes in a folder you own and edit them with Obsidian or
another editor. Frostnotes indexes your notes and can sync them through a hub
you host. You do not need a hub for local use.

## Status

Frostnotes is pre-release. The latest release is v0.9.0. The Linux Flatpak
includes `notesd` and `notesctl`. It has no desktop window or app-grid entry.

The release attaches `frostyard-notesd_0.9.0_amd64.deb` for a lodge host. It
contains `notesd`, `notesctl`, systemd units, user setup, and the React web app
for Notes in lodge. The `.deb` does not install a desktop editor.

On Frostyard images, the [notesd system extension](/docs/sysexts/notesd/) is
the separate server package. The system extension can trail the latest release.
Check the [catalog](/docs/sysexts/) for published extension versions.

The hub moved behind lodge on 2026-10-26. Notes inside lodge is done: the hub
runs as lodge's Notes app. The 7-day sync trial's daily checks were not recorded,
so the trial is not verified in full. See the [Notes in lodge plan](https://github.com/frostyard/frostnotes/blob/main/docs/plans/0006-m4-notes-inside-lodge.md).

## Install

Follow the [Frostyard Flatpak install steps](https://github.com/frostyard/flatpak-index/blob/main/README.md#install)
for `org.frostyard.Frostnotes`, including the per-user Flathub setup for the
runtime. Run `flatpak run org.frostyard.Frostnotes` from a terminal. It starts
`notesd` and prints its status rather than opening an editor.

Use `flatpak run --command=notesctl org.frostyard.Frostnotes status` to check
the daemon and its vaults. See [Flatpak setup](https://github.com/frostyard/frostnotes/blob/main/docs/design/app.md#the-flatpak)
to register a folder, pair with a hub, or change background startup.

The Flatpak does not read data from a host `notesd` installation. If you are
moving from one, follow [Moving from a host notesd](https://github.com/frostyard/frostnotes/blob/main/docs/design/app.md#operational-notes)
in order. The Flatpak joins the hub as a new device.

### Install the hub on lodge's host

No published lodge release can load the Notes editor from the Frostnotes v0.8.0
`.deb` yet. Do not upgrade `notesd` on lodge's host to v0.8.0 until a lodge
release adds WebAssembly support.

The v0.9.0 package returns to the React web app. Upgrade compatibility with
published lodge releases has not been verified here. For how a hub works, see
[The hub behind lodge](https://github.com/frostyard/frostnotes/blob/main/docs/design/hub.md).

## Documentation

- [Frostnotes project](https://github.com/frostyard/frostnotes) and [release history](https://github.com/frostyard/frostnotes/releases).
- [Development](https://github.com/frostyard/frostnotes/blob/main/docs/development.md): build the daemon, CLI, or web app from source.
- [Vaults and versions](https://github.com/frostyard/frostnotes/blob/main/docs/design/vault.md#versions): how writes are saved and how to restore a version.
- [Pairing and sessions](https://github.com/frostyard/frostnotes/blob/main/docs/design/sync.md#pairing-and-sessions): how devices connect to a hub.
- [Obsidian Bases subset](https://github.com/frostyard/frostnotes/blob/main/docs/specs/bases.md) and [MCP queries](https://github.com/frostyard/frostnotes/blob/main/docs/specs/mcp.md#queries): query notes from the CLI or an agent.

## Limits

- There is no graph view or base view in the apps yet. Queries support only
  the documented Obsidian Bases subset.
- `notesd` indexes notes over 10 MB by name only.
- Back up `~/.var/app/org.frostyard.Frostnotes/` before you install a newer
  Flatpak. For a build from source, back up `$XDG_DATA_HOME/frostnotes`.
  An older `notesd` refuses to open a database with a newer schema. For
  example, v0.6.0 cannot open the database after v0.7.0 has run.

## See also

- [lodge](/docs/apps/lodge/)
- [Frostmail](/docs/apps/frostmail/)
- [Porter](/docs/apps/porter/)
- [nsl](/docs/tools/nsl/)

## Sources

- [Frostnotes v0.9.0 release](https://github.com/frostyard/frostnotes/releases/tag/v0.9.0), published 2026-11-26, and [README at the release commit](https://github.com/frostyard/frostnotes/blob/b5c482ba0d91122cacce0523a7dad04a4fa9b863/README.md).
- [Frostyard Flatpak catalog](https://frostyard.github.io/flatpak-index/index/static): `org.frostyard.Frostnotes` v0.9.0, OCI digest `sha256:a296e87b2a04c2128699bf34afa38ac68b92da684003a35bfae02091523547c2`. The [launcher](https://github.com/frostyard/frostnotes/blob/b5c482ba0d91122cacce0523a7dad04a4fa9b863/packaging/flatpak/frostnotes.sh) starts `notesd` and prints its status.
- [Server .deb](https://github.com/frostyard/frostnotes/releases/download/v0.9.0/frostyard-notesd_0.9.0_amd64.deb): SHA-256 `20ccddf20c81e81109d2561e0652fa67579036ba2e4b6c95da41d4d35eeab988`. Both packages attest to the same release commit. [Frostnotes #293](https://github.com/frostyard/frostnotes/pull/293) restores the React web app.
- The v0.8.0 warning concerns that release's [WebAssembly editor](https://github.com/frostyard/frostnotes/releases/tag/v0.8.0) and the [lodge v0.6.1 app-frame policy](https://github.com/frostyard/lodge/blob/v0.6.1/internal/gateway/headers.go#L59-L78). [Lodge #116](https://github.com/frostyard/lodge/pull/116) adds WebAssembly support after v0.6.1.
- [The v0.7.0 migration](https://github.com/frostyard/frostnotes/blob/83fb2a5ff5c3adf4e60048ab7a5ff7d0e49600b4/internal/store/migrations/0007_sync_pushes_refused.sql) and [the newer-schema check in v0.9.0](https://github.com/frostyard/frostnotes/blob/b5c482ba0d91122cacce0523a7dad04a4fa9b863/internal/store/store.go).
