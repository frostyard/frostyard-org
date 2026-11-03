---
title: Firn
description: "Reinstall a Frostyard image from a saved Firn recipe, and move a version 1 recipe to version 2 before 2026-12-30."
---

Firn is the Frostyard installer. It installs a bootc image from one TOML file,
the recipe. The terminal wizard and the graphical installer both write a
recipe, and you can run the same install again from it without a wizard. This
guide follows Firn v0.11.0. The full documentation is in the
[Firn repository](https://github.com/frostyard/firn/blob/3e5007407e22fa24dd15c733f17be38d9dc4b446/docs/README.md).

For a first install, follow
[Install, update, and roll back](/docs/images/install-update/).

## Keep the recipe

When you install with a wizard, Firn saves the recipe you reviewed as
`recipe.toml` in a private directory below `/run/firn`. It then shows the
command that repeats the install:

```bash
firn install --confirm /dev/nvme0n1 recipe.toml
```

The command names your target disk and the full path of the saved recipe.

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

   The preflight changes no disk and needs no confirmation.

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
[recipe schema](https://github.com/frostyard/firn/blob/3e5007407e22fa24dd15c733f17be38d9dc4b446/docs/specs/recipe-schema.md)
lists every field.

Firn detects Secure Boot, a TPM, and UEFI on its own. In a VM, or when the
detection is wrong, set them with `--secure-boot`, `--tpm`, and `--uefi`. Each
takes `auto`, `on`, or `off`. For a script, add `--json-progress`: Firn then
writes each progress event as one JSON line, as the
[progress protocol](https://github.com/frostyard/firn/blob/3e5007407e22fa24dd15c733f17be38d9dc4b446/docs/specs/progress-protocol.md)
describes.

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
Firn v0.11.0 has it. An older Firn release without it keeps accepting version
1, and a Firn release before v0.6.0 cannot read version 2.

## See also

- [Install, update, and roll back](/docs/images/install-update/)
- [Firn README](https://github.com/frostyard/firn/blob/3e5007407e22fa24dd15c733f17be38d9dc4b446/README.md)
- [Recipe schema](https://github.com/frostyard/firn/blob/3e5007407e22fa24dd15c733f17be38d9dc4b446/docs/specs/recipe-schema.md)
- [Progress protocol](https://github.com/frostyard/firn/blob/3e5007407e22fa24dd15c733f17be38d9dc4b446/docs/specs/progress-protocol.md)

## Sources

Reviewed 2026-11-03 against Firn v0.11.0, commit
[`3e5007407e22fa24dd15c733f17be38d9dc4b446`](https://github.com/frostyard/firn/tree/3e5007407e22fa24dd15c733f17be38d9dc4b446).

- [Firn v0.11.0 release](https://github.com/frostyard/firn/releases/tag/v0.11.0)
- [`README.md`](https://github.com/frostyard/firn/blob/3e5007407e22fa24dd15c733f17be38d9dc4b446/README.md)
- [`docs/specs/recipe-schema.md`](https://github.com/frostyard/firn/blob/3e5007407e22fa24dd15c733f17be38d9dc4b446/docs/specs/recipe-schema.md)
- [`docs/specs/progress-protocol.md`](https://github.com/frostyard/firn/blob/3e5007407e22fa24dd15c733f17be38d9dc4b446/docs/specs/progress-protocol.md)
- [`docs/design/architecture.md`](https://github.com/frostyard/firn/blob/3e5007407e22fa24dd15c733f17be38d9dc4b446/docs/design/architecture.md)
- [`docs/plans/roadmap.md`](https://github.com/frostyard/firn/blob/3e5007407e22fa24dd15c733f17be38d9dc4b446/docs/plans/roadmap.md)
- [`docs/adr/0016-bootc-only-recipe-contract.md`](https://github.com/frostyard/firn/blob/3e5007407e22fa24dd15c733f17be38d9dc4b446/docs/adr/0016-bootc-only-recipe-contract.md)
- [`docs/adr/0021-graphical-installer-separate-executable.md`](https://github.com/frostyard/firn/blob/3e5007407e22fa24dd15c733f17be38d9dc4b446/docs/adr/0021-graphical-installer-separate-executable.md)
