---
title: Updex
description: "Manage Frostyard system extensions with Updex: list features, enable them, update them, and remove them."
---

Updex downloads, verifies, installs, and removes system extension images on a
Frostyard image. Every Frostyard bootc image ships it as the
`frostyard-updex` package. This guide follows Updex v2.0.6.

## Check your version

Show the version, the build commit, the build date, and the builder:

```bash
updex --version
```

This guide follows v2.0.6. An older version can lack a command, remove an
extension without the `--force` check, or print the old `disable` hint.

## Install, update, and roll back Updex

On a Frostyard image, Updex is already installed. The base image ships it as
the `frostyard-updex` package. Updex updates with the image, and it rolls back
with the image. Follow [Install and update an image](/docs/images/install-update/)
to update, and [roll back the image](/docs/images/install-update/#roll-back) to
go back.

On another system, download the latest CLI package from the
[Updex releases page](https://github.com/frostyard/updex/releases/latest):

| System | Release artifact |
| --- | --- |
| Debian or Ubuntu | `frostyard-updex_<version>_amd64.deb` or `frostyard-updex_<version>_arm64.deb` |
| Fedora or RHEL | `frostyard-updex-<version>-1.x86_64.rpm` or `frostyard-updex-<version>-1.aarch64.rpm` |
| Alpine | `frostyard-updex_<version>_x86_64.apk` or `frostyard-updex_<version>_aarch64.apk` |
| Other Linux | `updex_<version>_linux_amd64.tar.gz` or `updex_<version>_linux_arm64.tar.gz` |

Download `checksums.txt` from the same release. Check the artifact before you
install it:

```bash
sha256sum --ignore-missing --check checksums.txt
gh attestation verify <downloaded-artifact> --repo frostyard/updex
```

The first command prints `OK` for the artifact. The second needs the
[GitHub CLI](https://cli.github.com/) and prints that verification
succeeded. The checksum detects a damaged download. The attestation ties the
artifact to a tagged release that the Updex repository built. The host needs
systemd with `systemd-sysext`, and commands that change the system need root.

This guide has no steps to update or roll back an Updex that you installed
this way.

## Features and components

A feature is a named group of transfers that you can enable or disable. A
transfer names one extension image, its source, and its target. A component is
a named directory of transfer and feature files: `sysupdate.<name>.d/`.

Updex reads the legacy `sysupdate.d/` directory and every component it finds
under `/etc`, `/run`, `/usr/local/lib`, and `/usr/lib`, in that order. A
Frostyard image puts each extension in `/usr/lib/sysupdate.<name>.d/`, and
ships its feature with `Enabled=false`.

List the components:

```bash
updex components
```

The table lists each component, the highest-priority directory that provides
it, and its feature count.

List the features:

```bash
updex features list
```

The table lists each feature, its description, its enabled state, its origin,
and its transfers. The `CATALOG` column shows `image:<id>` for a feature from
the image, `local:etc` for a file in `/etc`, or a catalog name.

Limit a command to one component:

```bash
updex features list --component=docker
```

`--component` applies to every `features` subcommand. Without it, Updex uses
the union of the legacy directory and every component. `--component` and `-C`
cannot be used together.

Enable and disable write one drop-in. For a component it is
`/etc/sysupdate.<name>.d/<feature>.feature.d/00-updex.conf`; for the legacy
directory it is `/etc/sysupdate.d/<feature>.feature.d/00-updex.conf`. The file
sets `Enabled=true` or `Enabled=false`. A drop-in that sorts after `00-`
overrides it.

## Enable a feature

Enable a feature for the next update:

```bash
sudo updex features enable <name>
```

Replace `<name>` with a feature name from `updex features list`. Updex writes
the drop-in and prints `Feature '<name>' enabled.` The command does not
download the image.

Enable it and download it now:

```bash
sudo updex features enable <name> --now
```

Updex writes the drop-in, downloads the image, checks its SHA256 hash and,
when the transfer requires it, the GPG signature, creates the link, and runs
`systemd-sysext refresh`. The output lists the downloaded files.

Check the merge:

```bash
systemd-sysext status
```

The output lists the merged extension.

If the refresh fails, Updex exits non-zero. The output has `sysext refresh
failed` and says to run `systemd-sysext refresh` or reboot. The image is in
place. Finish the merge:

```bash
sudo systemd-sysext refresh
```

Then run `systemd-sysext status` again.

## Check and update

Check for updates. The command changes nothing:

```bash
updex features check
```

The table has rows only for enabled features that have transfers. Each row
names the feature, the component, the current version, the newest version, and
`UPDATE`. `UPDATE` shows `yes`, `no`, or `error`. An `error` row means Updex
could not fetch or verify the manifest. The command exits non-zero. Do not read
an `error` row as `no`.

Install the newest versions:

```bash
sudo updex features update
```

Updex downloads and verifies each new image, updates the link, removes old
versions, and refreshes the merge. The status column shows `downloaded` or
`up to date`. The refresh swaps `/usr` under running services.

Stage the update and activate it at the next boot instead:

```bash
sudo updex --no-refresh features update
```

Updex downloads, verifies, and links the image, and does not refresh. The row
shows `downloaded`. With `--json`, the result has `next_action_message` set to
`Reboot required to activate changes`. The new version runs after you reboot,
or after the next `systemd-sysext refresh`. A refresh activates
every staged update.

`features check` compares the newest version with the version that the link
`/var/lib/extensions/<name>.raw` points to. If the link still names an older
staged image, the row shows an update. `features update` then points the link
at the newest staged image without a new download. Updex prints
`Linked staged version <version>`, and the row shows `up to date`. With
`--json`, the result has `next_action_message` set to
`Reboot required to activate changes`.

Keep old versions:

```bash
sudo updex features update --no-vacuum
```

The command keeps older versions instead of removing them. Without the option,
Updex keeps the number of versions that the transfer sets in `InstancesMax`
(2 by default).

Preview an update without a change:

```bash
sudo updex --dry-run features update
```

The command prints `[DRY RUN]` and `would download` where it would change
something. A dry run of a command that changes state still needs root.

## Roll back an extension

Updex v2.0.6 has no rollback command. A link that you change by hand lasts only
until the next `updex features update`, which links the newest version again.
Follow [Manage system extensions](/docs/sysexts/manage/#roll-back) for the
steps.

To keep the version you run, stop future updates:

```bash
sudo updex features disable <name>
```

Updex prints `Its extensions stay installed and merged. Run 'updex features
disable <name> --now' to remove them.` The image and the link stay in place.

To remove the extension, run `sudo updex features disable <name> --now --force`
and reboot. [Stop updates or remove](#stop-updates-or-remove) has the details.

Planned: `updex features rollback <name> [--to VERSION] [--now]` is accepted
but not released. It will link the newest staged version older than the linked
one, or `VERSION`. It will refuse when that image is not on disk. It will record
the rejected version in `/var/lib/updex/rollback/<name>`, so updates skip it
until a newer version is published. It will take effect at the next boot, or
with `--now`. `updex features rollback --clear <name>` will delete the record.
The vacuum will then also keep the linked version, the merged version, and a
rejected version.

## Automatic updates

Turn on the daily timer:

```bash
sudo updex daemon enable
```

Updex writes `/etc/systemd/system/updex-update.timer` and
`/etc/systemd/system/updex-update.service`, then enables and starts the timer.
The timer runs daily with a random delay of up to 1 hour. It runs
`/usr/bin/updex features update --no-refresh`. New versions are downloaded and
staged, and the link is updated. Nothing is activated until the next
`systemd-sysext refresh` or reboot. A refresh activates every staged update:
yours, or one that another Updex command runs, for example `features update` or
`features enable --now`.

Check the timer:

```bash
updex daemon status
```

The output shows `installed`, `Enabled`, `Active`, and `Schedule`.

Turn it off:

```bash
sudo updex daemon disable
```

The command stops the timer, disables it, and removes both unit files.

Preview either command first with `--dry-run`:

```bash
sudo updex --dry-run daemon enable
```

The output starts with `[DRY RUN] Would install`. Updex writes no unit file and
runs no `systemctl` command. Updex v2.0.4 and older ignore `--dry-run` here and
make the change.

`daemon enable` does not write over an existing `updex-update.timer` or
`updex-update.service`. Run `updex daemon disable` first to reinstall the
units.

Planned: the `frostyard-updex` package will ship `updex-update.timer` and
`updex-update.service` in `/usr/lib/systemd/system/`, and Frostyard images will
enable the timer. It will run `updex features update --no-refresh` every 6
hours with a random delay of up to 1 hour, only on AC power. A new version will
take effect at the next boot. To opt out of the whole host, run
`systemctl mask updex-update.timer`. To opt out of one extension, run
`updex features disable <name>`. Check a run with
`journalctl -u updex-update.service` and `updex daemon status`.
`features check` and `features list` will show `RUNNING` and `LINKED` versions.
This is not released: v2.0.6 has no packaged timer.

## Stop updates or remove

Stop future updates and keep the extension merged:

```bash
sudo updex features disable <name>
```

Updex writes `Enabled=false` in the drop-in. It does not unmerge the
extension. The image and the link stay in place. The output says
`Its extensions stay installed and merged. Run 'updex features disable <name> --now' to remove them.`

Remove the extension now:

```bash
sudo updex features disable <name> --now --force
```

Updex unmerges all extensions on the host, removes the image files and the
link, and then refreshes the merge. The output prints `Extensions unmerged.`,
lists the removed files, and prints
`Warning: Reboot required for changes to take effect.` Reboot when the
command finishes.

From v2.0.4, Updex refuses to remove a merged extension without `--force`:

```text
Extension docker (version 5+29.9.1-1~debian.13~trixie) is active. Removing requires --force and a reboot to take effect.
```

On systemd older than 258, the version reads `unknown`. If Updex cannot read
the merged state, the component reads `merge state unknown` and Updex also
refuses. On a Frostyard image, Updex v2.0.3 and older do not refuse: they
remove the extension at once. `updex catalog remove` has the same check.

If the refresh at the end fails, the remaining extensions stay unmerged. Run
`sudo systemd-sysext refresh`, or reboot.

## Catalogs

Frostyard extensions do not need a catalog: each image ships them as features.
The [extension catalog page](/docs/sysexts/) lists them. An Updex catalog is a
third-party source of extensions.

Updex ships no catalogs, and a Frostyard image configures none. Add a catalog
with a file in `/etc/updex/catalogs.d/`:

```ini
# /etc/updex/catalogs.d/fedora.catalog
[Catalog]
SiteURL=https://extensions.fcos.fr/fedora
ListURL=https://api.github.com/repos/fedora-sysexts/fedora/contents/
```

`SiteURL` is required. `ListURL` is optional and supplies `catalog list` and
`catalog search`. Without a `.catalog` file, a catalog command fails and tells
you to create one in `/etc/updex/catalogs.d/`.

Browse and install:

```bash
updex catalog list
updex catalog search zoxide
sudo updex catalog add fedora/zoxide
```

`catalog list` shows each sysext, its catalog, and whether it is installed and
enabled. `catalog search` finds names that contain the term. `catalog add`
writes the published transfer and feature files in
`/etc/sysupdate.catalog-<repo>.d/` (or in the component that the `.catalog`
file sets with `Component=`), enables the feature, and downloads the
image. Use a bare `<name>` when it is unambiguous across the catalogs.

Remove a catalog sysext:

```bash
sudo updex catalog remove zoxide
```

The command disables the feature, unmerges the extension, deletes the image
files and the link, and deletes the generated files. Files that `catalog add`
writes start with a marker that names the catalog. `catalog remove` deletes
only files with that marker, and only its own `00-updex.conf` drop-in, so your
drop-ins stay.

A catalog sysext needs a GPG-signed `SHA256SUMS` by default. `AllowUnsigned=yes`
in one `.catalog` file lets that catalog's own `Verify=` decide:

```ini
[Catalog]
SiteURL=https://example.com/sysexts
ListURL=https://api.github.com/repos/example/sysexts/contents/
AllowUnsigned=yes
```

The setting applies to sysexts that you add while it is on. For a sysext that
you added before, run `sudo updex catalog add <repo>/<name>` again.

What it still protects: HTTPS on the transfer, and a SHA256 check on every
image. What it loses: the checksum does not authenticate the publisher. A
person who can replace both the image and `SHA256SUMS` at the site can serve a
different image. `AllowUnsigned=yes` cannot be used with `AllowInsecure=yes`.
The catalog file fails to load.

Listings are cached for 60 minutes. Add `--no-cache` to `catalog list` or
`catalog search` to query the catalog directly.

Upgrade notes. A transfer made by v2.0.0 keeps the catalog's `Verify=false`.
Add `AllowUnsigned=yes` to its catalog, and run `catalog add` again only if the
catalog `SiteURL` changed. A transfer made by v2.0.1 or v2.0.2 has no
`Verify=` line. Neither has a transfer made by v2.0.3 or later before the
catalog set `AllowUnsigned=yes`. Add `AllowUnsigned=yes`, then run
`catalog add` again for the sysext.

## Global flags

| Flag | What it does |
| --- | --- |
| `-C, --definitions <path>` | Read `.transfer` and `.feature` files from one directory. It bypasses component discovery and cannot be used with `--component`. |
| `--verify` | Force GPG verification of `SHA256SUMS`. |
| `--no-refresh` | Skip `systemd-sysext refresh` after an install, update, or removal. After `disable --now` or `catalog remove`, every extension stays unmerged until a refresh or reboot. |
| `--json` | Print JSON. |
| `-n, --dry-run` | Preview changes. It changes nothing. A command that changes state still needs root. |
| `-v, --verbose` | Print debug output. |
| `-s, --silent` | Suppress progress output. With `--json`, the final result is still printed. |

## Troubleshooting

| Symptom | Check | Fix |
| --- | --- | --- |
| `updex features list` shows no features | `updex components` | If no component is listed and `/etc/sysupdate.d/` is empty, Updex found no definition files. Check the image version. |
| `features check` shows `UPDATE=error` | The command output and the network | Check the network and the published manifest. The command exits non-zero. Do not read the row as up to date. |
| `enable --now` exits non-zero after the download | The output shows `sysext refresh failed` | Run `sudo systemd-sysext refresh`, or reboot, then check `systemd-sysext status`. |
| `disable --now` refuses with `is active` | The refusal names the extension and its version | Add `--force`, then reboot. |
| `daemon enable` says the timer is installed | `updex daemon status` | Run `sudo updex daemon disable`, then enable it again. |
| `catalog list` says no catalogs configured | `ls /etc/updex/catalogs.d/` | Create a `<name>.catalog` file with `SiteURL` and, for listings, `ListURL`. |
| `catalog add` fails with a signature error | The catalog's `Verify=` and `AllowUnsigned` | Provide `SHA256SUMS.gpg`, or set `AllowUnsigned=yes` for that catalog if it publishes unsigned checksums. |

## See also

- [System extension catalog](/docs/sysexts/)
- [Docker system extension](/docs/sysexts/docker/)
- [Incus system extension](/docs/sysexts/incus/)
- [Tailscale system extension](/docs/sysexts/tailscale/)
- [Snow image](/docs/images/snow/)
- [Updex v2.0.6 command reference](https://github.com/frostyard/updex/blob/c8c16f61ef0076dc4ba12fd96163bfde6f4a9c93/README.md)

## Sources

Reviewed 2026-10-23.

- Updex v2.0.6 commit [`c8c16f61ef0076dc4ba12fd96163bfde6f4a9c93`](https://github.com/frostyard/updex/tree/c8c16f61ef0076dc4ba12fd96163bfde6f4a9c93)
- [`README.md`](https://github.com/frostyard/updex/blob/c8c16f61ef0076dc4ba12fd96163bfde6f4a9c93/README.md)
- [`docs/specs/config-reference.md`](https://github.com/frostyard/updex/blob/c8c16f61ef0076dc4ba12fd96163bfde6f4a9c93/docs/specs/config-reference.md)
- [`docs/design/overview.md`](https://github.com/frostyard/updex/blob/c8c16f61ef0076dc4ba12fd96163bfde6f4a9c93/docs/design/overview.md)
- [`docs/adr/0003-catalog-ownership-marker.md`](https://github.com/frostyard/updex/blob/c8c16f61ef0076dc4ba12fd96163bfde6f4a9c93/docs/adr/0003-catalog-ownership-marker.md)
- [`docs/adr/0004-single-updex-drop-in.md`](https://github.com/frostyard/updex/blob/c8c16f61ef0076dc4ba12fd96163bfde6f4a9c93/docs/adr/0004-single-updex-drop-in.md)
- [`docs/adr/0007-daemon-stages-never-activates.md`](https://github.com/frostyard/updex/blob/c8c16f61ef0076dc4ba12fd96163bfde6f4a9c93/docs/adr/0007-daemon-stages-never-activates.md)
- [`docs/adr/0014-local-catalog-signature-policy.md`](https://github.com/frostyard/updex/blob/c8c16f61ef0076dc4ba12fd96163bfde6f4a9c93/docs/adr/0014-local-catalog-signature-policy.md)
- [`docs/adr/0015-detect-merged-sysexts-from-hierarchy-metadata.md`](https://github.com/frostyard/updex/blob/c8c16f61ef0076dc4ba12fd96163bfde6f4a9c93/docs/adr/0015-detect-merged-sysexts-from-hierarchy-metadata.md)
- [`cmd/updex-cli/main.go`](https://github.com/frostyard/updex/blob/c8c16f61ef0076dc4ba12fd96163bfde6f4a9c93/cmd/updex-cli/main.go)
- [`config/transfer.go`](https://github.com/frostyard/updex/blob/c8c16f61ef0076dc4ba12fd96163bfde6f4a9c93/config/transfer.go)
- [`catalog/cache.go`](https://github.com/frostyard/updex/blob/c8c16f61ef0076dc4ba12fd96163bfde6f4a9c93/catalog/cache.go)
- [`cmd/updex/root.go`](https://github.com/frostyard/updex/blob/c8c16f61ef0076dc4ba12fd96163bfde6f4a9c93/cmd/updex/root.go)
- [`cmd/updex/features.go`](https://github.com/frostyard/updex/blob/c8c16f61ef0076dc4ba12fd96163bfde6f4a9c93/cmd/updex/features.go)
- [`cmd/updex/components.go`](https://github.com/frostyard/updex/blob/c8c16f61ef0076dc4ba12fd96163bfde6f4a9c93/cmd/updex/components.go)
- [`cmd/updex/daemon.go`](https://github.com/frostyard/updex/blob/c8c16f61ef0076dc4ba12fd96163bfde6f4a9c93/cmd/updex/daemon.go)
- [`cmd/updex/catalog.go`](https://github.com/frostyard/updex/blob/c8c16f61ef0076dc4ba12fd96163bfde6f4a9c93/cmd/updex/catalog.go)
- [`cmd/updex/features_run.go`](https://github.com/frostyard/updex/blob/c8c16f61ef0076dc4ba12fd96163bfde6f4a9c93/cmd/updex/features_run.go)
- [`updex/features.go`](https://github.com/frostyard/updex/blob/c8c16f61ef0076dc4ba12fd96163bfde6f4a9c93/updex/features.go)
- [`updex/install.go`](https://github.com/frostyard/updex/blob/c8c16f61ef0076dc4ba12fd96163bfde6f4a9c93/updex/install.go)
- [`updex/catalog.go`](https://github.com/frostyard/updex/blob/c8c16f61ef0076dc4ba12fd96163bfde6f4a9c93/updex/catalog.go)
- [`updex/daemon.go`](https://github.com/frostyard/updex/blob/c8c16f61ef0076dc4ba12fd96163bfde6f4a9c93/updex/daemon.go)
- [`sysext/manager.go`](https://github.com/frostyard/updex/blob/c8c16f61ef0076dc4ba12fd96163bfde6f4a9c93/sysext/manager.go)
- [`systemd/manager.go`](https://github.com/frostyard/updex/blob/c8c16f61ef0076dc4ba12fd96163bfde6f4a9c93/systemd/manager.go)
- [`systemd/unit.go`](https://github.com/frostyard/updex/blob/c8c16f61ef0076dc4ba12fd96163bfde6f4a9c93/systemd/unit.go)
- [Updex v2.0.6 release](https://github.com/frostyard/updex/releases/tag/v2.0.6)
- [`docs/adr/0016-automatic-sysext-updates-apply-at-next-boot.md`](https://github.com/frostyard/updex/blob/a4603c026ca77eb02e82baf07a80466c053d7e3c/docs/adr/0016-automatic-sysext-updates-apply-at-next-boot.md) (updex commit `a4603c026ca77eb02e82baf07a80466c053d7e3c`, planned)
- [Updex PR #454: `disable` hint](https://github.com/frostyard/updex/pull/454)
- [Updex PR #456: `check` and `update` follow the link](https://github.com/frostyard/updex/pull/456)
- [Updex v2.0.5 release](https://github.com/frostyard/updex/releases/tag/v2.0.5)
- [Updex v2.0.4 release](https://github.com/frostyard/updex/releases/tag/v2.0.4)
- [Updex issue #451: `daemon` commands ignore `--dry-run`](https://github.com/frostyard/updex/issues/451)
- [Updex PR #452: honour `--dry-run` in `daemon enable` and `daemon disable`](https://github.com/frostyard/updex/pull/452)
- [Updex PR #445: detect merged images from systemd-sysext hierarchy metadata](https://github.com/frostyard/updex/pull/445)
- snosi commit [`9db7cde83454b92972887d3b1cf27a144a283201`](https://github.com/frostyard/snosi/tree/9db7cde83454b92972887d3b1cf27a144a283201): [`mkosi.images/base/mkosi.conf`](https://github.com/frostyard/snosi/blob/9db7cde83454b92972887d3b1cf27a144a283201/mkosi.images/base/mkosi.conf)
- snosi commit [`96d663b3c7025fbbeeda5987cc521b524fd1721c`](https://github.com/frostyard/snosi/tree/96d663b3c7025fbbeeda5987cc521b524fd1721c): [`mkosi.images/base/mkosi.conf`](https://github.com/frostyard/snosi/blob/96d663b3c7025fbbeeda5987cc521b524fd1721c/mkosi.images/base/mkosi.conf), [`mkosi.images/base/mkosi.extra/usr/lib/sysupdate.docker.d/docker.feature`](https://github.com/frostyard/snosi/blob/96d663b3c7025fbbeeda5987cc521b524fd1721c/mkosi.images/base/mkosi.extra/usr/lib/sysupdate.docker.d/docker.feature), [`docs/design/sysexts.md`](https://github.com/frostyard/snosi/blob/96d663b3c7025fbbeeda5987cc521b524fd1721c/docs/design/sysexts.md)
