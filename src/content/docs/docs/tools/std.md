---
title: std
description: Use std for shared Go packages for progress reporting and local app problem records.
follows:
  repo: frostyard/std
  tag: v0.5.1
---

Use std for shared Go packages for progress reporting and local app problem records.
The latest release is v0.5.1. v0.5.1 fixes canonical corrections encoding and keeps the docs link checker from treating link-shaped text in inline code as a real link.

## Add or upgrade the Go module

Use Go 1.27.4 or later. From your project's module directory, run:

```bash
go get github.com/frostyard/std@v0.5.1
go list -m github.com/frostyard/std
```

Check that `go list` shows `github.com/frostyard/std v0.5.1`. If your module
already uses std, the same command updates the dependency. See the
[Go package reference](https://pkg.go.dev/github.com/frostyard/std@v0.5.1)
for the API.

## Sources

- [std v0.5.1 release](https://github.com/frostyard/std/releases/tag/v0.5.1).
- [Go module](https://github.com/frostyard/std/blob/v0.5.1/go.mod) and [README](https://github.com/frostyard/std/blob/v0.5.1/README.md).
