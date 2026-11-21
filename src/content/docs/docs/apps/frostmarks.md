---
title: frostmarks
description: Keep bookmarks on your own machine and import a browser's bookmarks.
follows:
  repo: frostyard/frostmarks
  tag: v0.2.0
---

Use frostmarks to store and search bookmarks by folder. Run it on its own
with a local daemon and CLI, or add it to [lodge](/docs/apps/lodge/) for a web
interface. The latest release is v0.2.0.

## Install or update the local commands

On a Unix host with Go 1.27.4 or later, install both commands:

```bash
go install github.com/frostyard/frostmarks/cmd/frostmarksd@v0.2.0
go install github.com/frostyard/frostmarks/cmd/marksctl@v0.2.0
```

Find them in `GOBIN`, or in `$(go env GOPATH)/bin` if `GOBIN` is unset. Put
that directory on your `PATH`. Upgrade both commands together. If the old
daemon is running, stop it and start the new binary with the same settings.

```bash
frostmarksd
```

It prints `frostmarksd: serving on <path>` when ready. The default socket is
`$XDG_RUNTIME_DIR/frostmarks.sock`. In another terminal, run
`marksctl list-folders`. A new store returns no folders.

## Install or update on lodge

On an amd64 Debian or Ubuntu lodge host, download
`frostyard-frostmarks_0.2.0_amd64.deb` from the
[v0.2.0 release](https://github.com/frostyard/frostmarks/releases/tag/v0.2.0).
Check its attestation before installing or upgrading:

```bash
gh attestation verify frostyard-frostmarks_0.2.0_amd64.deb --repo frostyard/frostmarks
```

When it passes, follow [Run on lodge](https://frostyard.github.io/frostmarks/guides/lodge/)
for the install and first start, or the upgrade and service restart. Use the
v0.2.0 filename in place of the example filename in that guide.

## Import browser bookmarks

v0.2.0 adds `marksctl import`. Export your bookmarks as a Netscape HTML
bookmark file, then preview the import while the daemon runs:

```bash
marksctl import bookmarks.html -folder /imported -dry-run
```

It lists what it would add, skip, or refuse, without writing anything. When
that looks right, import the file:

```bash
marksctl import bookmarks.html -folder /imported
```

Check the counts at the end. The import keeps the folder tree under
`/imported` and skips a URL that is already in the same folder. See
[Import your bookmarks](https://frostyard.github.io/frostmarks/guides/import/)
for browser export steps and limits.

## Sources

- [frostmarks v0.2.0 release](https://github.com/frostyard/frostmarks/releases/tag/v0.2.0).
- [Go module](https://github.com/frostyard/frostmarks/blob/v0.2.0/go.mod), [import command](https://github.com/frostyard/frostmarks/blob/v0.2.0/cmd/marksctl/import.go), and [lodge guide](https://github.com/frostyard/frostmarks/blob/v0.2.0/site/content/guides/lodge.md).
