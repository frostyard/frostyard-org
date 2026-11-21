---
title: clix
description: Use clix to build a Go command-line tool with shared flags, JSON output, and progress reporting.
follows:
  repo: frostyard/clix
  tag: v0.5.1
---

Use clix to build a Go command-line tool with shared flags, JSON output, and progress reporting.
The latest release is v0.5.1. v0.5.1 fixes how the baseline tools encode the canonical corrections data to match JavaScript’s `JSON.stringify`.

## Add or upgrade the Go module

Use Go 1.27.4 or later. From your project's module directory, run:

```bash
go get github.com/frostyard/clix@v0.5.1
go list -m github.com/frostyard/clix
```

Check that `go list` shows `github.com/frostyard/clix v0.5.1`. If your module
already uses clix, the same command updates the dependency. See the
[Go package reference](https://pkg.go.dev/github.com/frostyard/clix@v0.5.1)
for the API.

## Sources

- [clix v0.5.1 release](https://github.com/frostyard/clix/releases/tag/v0.5.1).
- [Go module](https://github.com/frostyard/clix/blob/v0.5.1/go.mod) and [README](https://github.com/frostyard/clix/blob/v0.5.1/README.md).
