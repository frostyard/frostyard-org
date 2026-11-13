---
title: Firn
description: "Reinstall a Frostyard image from a saved Firn recipe, and move a version 1 recipe to version 2 before 2026-12-30."
follows:
  repo: frostyard/firn
  tag: v0.12.0
---

Firn is the Frostyard installer. It installs a bootc image from one TOML file,
the recipe. The terminal wizard and the graphical installer both write a
recipe, and you can run the same install again from it without a wizard. This
guide follows Firn v0.12.0. The full documentation is on the
[Firn documentation site](https://frostyard.github.io/firn/).

For a first install, follow
[Install, update, and roll back](/docs/images/install-update/).

From v0.12.0, the graphical installer draws in the Frostyard look, light or
dark. It follows the desktop's text size and high-contrast setting, but not its
accent color. The commands and recipes on this page do not change. See
[The graphical installer](https://frostyard.github.io/firn/guides/graphical-installer/).

## Keep the recipe

When you install with a wizard, Firn saves the recipe you reviewed as
`recipe.toml` in a private directory below `/run/firn`. It then shows the
`firn install --confirm` command that repeats the install. That command names
your target disk and the full path of the saved recipe. Write it down.

The recipe stays there only until the installer environment reboots. Copy
`recipe.toml` to other storage before you reboot.

The wizard puts your disk passphrase, your MOK password, and the user's
password in files in the same directory. The recipe names them by path, in
`passphrase_file`, `mok_password_file`, and `password_file`. A copied recipe
works only where each of those files exists again at its path. Each one must
be a regular file that is not readable by everyone.

## Reinstall from a recipe

Boot the installer ISO and open a console. Run each command on the machine you
install.

1. Check the recipe against the schema and this machine:

   ```bash
   firn validate recipe.toml
   ```

   Firn fails on any error in the recipe. It does not touch a disk.

2. Run the preflight:

   ```bash
   firn install --dry-run recipe.toml
   ```

   The preflight changes no disk and needs no confirmation. `-n` is the
   short form of `--dry-run`.

3. Install. The value of `--confirm` must match `[target].disk` in the recipe
   exactly:

   ```bash
   firn install --confirm /dev/nvme0n1 recipe.toml
   ```

   Replace `/dev/nvme0n1` with the disk your recipe names. Firn erases that
   disk. If the recipe makes a recovery key, Firn prints it in the console.
   Copy it before you close the console.

Firn runs one install at a time. If another install runs on the machine, Firn
does not start and touches nothing.

A recipe can name the disk by a `/dev/disk/by-id/` path. Then give
`--confirm` the same path, as the recipe writes it.

To install another machine, or to change a choice, edit the recipe. The
[recipe reference](https://frostyard.github.io/firn/reference/recipe/)
lists every field, and
[Headless install with a recipe](https://frostyard.github.io/firn/guides/headless-install/)
has the full steps.

Firn detects Secure Boot, a TPM, and UEFI on its own. In a VM, or when the
detection is wrong, set them with `--secure-boot`, `--tpm`, and `--uefi`. Each
takes `auto`, `on`, or `off`. For a script, add `--json-progress`: Firn then
writes each progress event as one JSON line, as
[Progress events](https://frostyard.github.io/firn/reference/progress/)
describes. That output contains the recovery key, if the recipe makes one.
Keep it out of ordinary logs.

## Version 1 recipes stop working on 2026-12-30

Each recipe sets its schema in a `version` field. The wizard writes
`version = 2`.
Firn accepts a bootc recipe with `version = 1`, with a warning, until
2026-12-30. From 2026-12-30 00:00 UTC, Firn rejects it before it changes a
disk, with this error:

```text
bootc recipe version 1 is no longer accepted on and after 2026-12-30; validate the bootc fields, then change only version to 2; no conversion was performed
```

Firn never converts a recipe for you. Move each saved version 1 recipe before
the cutoff:

1. Check that the recipe has `family = "bootc"` under `[image]`. Firn does not
   install A/B recipes. Do not convert one to bootc.
2. On the installer medium you will use, validate the recipe:

   ```bash
   firn validate recipe.toml
   ```

   Before the cutoff, Firn prints this warning and exits 0:

   ```text
   bootc recipe version 1 is deprecated and is rejected on and after 2026-12-30; validate the bootc fields, then change only version to 2
   ```

   Fix any other error it shows. Check that every file the recipe names
   exists on that medium.
3. Change only `version = 1` to `version = 2`. Change nothing else.
4. Validate again. The warning is gone.

The cutoff is built into Firn. No setting or environment variable moves it.
Firn v0.11.0 and later have it. An older Firn release without it keeps accepting version
1, and a Firn release before v0.6.0 cannot read version 2.

## See also

- [Install, update, and roll back](/docs/images/install-update/)
- [Firn documentation](https://frostyard.github.io/firn/)
- [Firn commands](https://frostyard.github.io/firn/reference/cli/)
- [The graphical installer](https://frostyard.github.io/firn/guides/graphical-installer/)
- [Recipe reference](https://frostyard.github.io/firn/reference/recipe/)
- [Progress events](https://frostyard.github.io/firn/reference/progress/)
- [Firn README](https://github.com/frostyard/firn/blob/main/README.md)

## Sources

Reviewed 2026-11-12 against Firn v0.12.0, commit
[`fa12545eef78dea25a4cb0b85b681c96fabbbf4e`](https://github.com/frostyard/firn/tree/fa12545eef78dea25a4cb0b85b681c96fabbbf4e),
released 2026-11-12. Earlier reviews: 2026-11-11 against Firn v0.11.1, commit
[`1427f44d0d559eebf484a6cb9a343e6c0d424d17`](https://github.com/frostyard/firn/tree/1427f44d0d559eebf484a6cb9a343e6c0d424d17),
and 2026-11-03 against Firn v0.11.0, commit
[`3e5007407e22fa24dd15c733f17be38d9dc4b446`](https://github.com/frostyard/firn/tree/3e5007407e22fa24dd15c733f17be38d9dc4b446).

- [Firn v0.12.0 release](https://github.com/frostyard/firn/releases/tag/v0.12.0): `firn-gui` draws in frostui's Frostyard look ([firn#150](https://github.com/frostyard/firn/pull/150), [`docs/adr/0022-draw-the-graphical-installer-with-frostui.md`](https://github.com/frostyard/firn/blob/fa12545eef78dea25a4cb0b85b681c96fabbbf4e/docs/adr/0022-draw-the-graphical-installer-with-frostui.md), Accepted; [`site/content/guides/graphical-installer.md`](https://github.com/frostyard/firn/blob/fa12545eef78dea25a4cb0b85b681c96fabbbf4e/site/content/guides/graphical-installer.md)). No file under `cmd/` or `internal/` changes after v0.11.1. The graphical installer page answered HTTP 200 on 2026-11-12.
- [Firn v0.11.1 release](https://github.com/frostyard/firn/releases/tag/v0.11.1): the build moves to Go 1.27.4 for its security fixes ([firn#146](https://github.com/frostyard/firn/pull/146)), the documentation site ([firn#142](https://github.com/frostyard/firn/pull/142)), and `firn install` reads the common `--dry-run` (`-n`) flag from clix v0.5.0 ([firn#132](https://github.com/frostyard/firn/pull/132), a dependency update that the release notes do not list; [`cmd/firn/install.go`](https://github.com/frostyard/firn/blob/1427f44d0d559eebf484a6cb9a343e6c0d424d17/cmd/firn/install.go), [`cmd/firn/root.go`](https://github.com/frostyard/firn/blob/1427f44d0d559eebf484a6cb9a343e6c0d424d17/cmd/firn/root.go)).
- The documentation site, at v0.11.1: [`site/properdocs.yml`](https://github.com/frostyard/firn/blob/1427f44d0d559eebf484a6cb9a343e6c0d424d17/site/properdocs.yml) (`site_url: https://frostyard.github.io/firn/`), [`site/content/guides/headless-install.md`](https://github.com/frostyard/firn/blob/1427f44d0d559eebf484a6cb9a343e6c0d424d17/site/content/guides/headless-install.md) and [`site/content/reference/cli.md`](https://github.com/frostyard/firn/blob/1427f44d0d559eebf484a6cb9a343e6c0d424d17/site/content/reference/cli.md) (`--dry-run`, `-n`). Each linked page answered HTTP 200 on 2026-11-11.
- [`README.md`](https://github.com/frostyard/firn/blob/1427f44d0d559eebf484a6cb9a343e6c0d424d17/README.md) at v0.11.1 links the documentation site.
- [Firn v0.11.0 release](https://github.com/frostyard/firn/releases/tag/v0.11.0)
- [`README.md`](https://github.com/frostyard/firn/blob/3e5007407e22fa24dd15c733f17be38d9dc4b446/README.md)
- [`docs/specs/recipe-schema.md`](https://github.com/frostyard/firn/blob/3e5007407e22fa24dd15c733f17be38d9dc4b446/docs/specs/recipe-schema.md)
- [`docs/specs/progress-protocol.md`](https://github.com/frostyard/firn/blob/3e5007407e22fa24dd15c733f17be38d9dc4b446/docs/specs/progress-protocol.md)
- [`docs/design/architecture.md`](https://github.com/frostyard/firn/blob/3e5007407e22fa24dd15c733f17be38d9dc4b446/docs/design/architecture.md)
- [`docs/plans/roadmap.md`](https://github.com/frostyard/firn/blob/3e5007407e22fa24dd15c733f17be38d9dc4b446/docs/plans/roadmap.md)
- [`docs/adr/0016-bootc-only-recipe-contract.md`](https://github.com/frostyard/firn/blob/3e5007407e22fa24dd15c733f17be38d9dc4b446/docs/adr/0016-bootc-only-recipe-contract.md)
- [`docs/adr/0021-graphical-installer-separate-executable.md`](https://github.com/frostyard/firn/blob/3e5007407e22fa24dd15c733f17be38d9dc4b446/docs/adr/0021-graphical-installer-separate-executable.md)
