---
title: Updex
description: "Manage Frostyard system extensions with Updex: list, enable, update, roll back, and remove them."
---

Updex downloads, verifies, installs, updates, rolls back, and removes system
extension images. Every Frostyard bootc image ships it as the
`frostyard-updex` package. This guide follows Updex v2.1.0.

## Check your version

Show the version, the build commit, the build date, and the builder:

```bash
updex --version
```

## Everyday commands

Run the commands that change the system with `sudo`. [Manage system
extensions](/docs/sysexts/manage/) walks through each one on a Frostyard
image.

| To do this | Run | Steps |
| --- | --- | --- |
| List the features | `updex features list` | [Find an extension](/docs/sysexts/manage/#find-an-extension) |
| Enable a feature and download it | `sudo updex features enable <name> --now` | [Enable an extension](/docs/sysexts/manage/#enable-an-extension) |
| See what you can update to | `updex features check` | [Update](/docs/sysexts/manage/#update) |
| Install the newest versions | `sudo updex features update` | [Update](/docs/sysexts/manage/#update) |
| Go back to the previous version | `sudo updex features rollback <name>` | [Roll back](/docs/sysexts/manage/#roll-back) |
| Stop updates, or remove an extension | `sudo updex features disable <name>` | [Stop updates or remove](/docs/sysexts/manage/#stop-updates-or-remove) |
| Update on a schedule | `sudo updex daemon enable` | [Automatic updates](#automatic-updates) |

`features check` and `features list` show a `RUNNING` and a `LINKED` version.
`RUNNING` is the version merged now. `LINKED` is the version the next boot
merges. When they differ, the output ends with a `PENDING REBOOT:` line.

A Frostyard image ships each extension as a feature in
`/usr/lib/sysupdate.<name>.d/`, switched off. Limit a `features` command to
one extension with `--component=<name>`.

## Automatic updates

The `frostyard-updex` package ships `updex-update.timer` and
`updex-update.service` in `/usr/lib/systemd/system`, switched off. Turn the
timer on:

```bash
sudo updex daemon enable
```

With the packaged units, Updex writes no unit file. It enables and starts the
timer. The timer runs `updex features update --no-refresh` every 6 hours,
with a random delay of up to 1 hour. A run downloads, verifies, and links the
new version. The new version takes effect at the next boot. A host on battery
skips a run.

Preview the change first with `sudo updex --dry-run daemon enable`. Nothing
changes. Check the timer and its runs:

```bash
updex daemon status
journalctl -u updex-update.service
```

Turn the timer off with `sudo updex daemon disable`. To keep it off on the
whole host across image updates, run `sudo systemctl mask updex-update.timer`.
To stop one extension, run `sudo updex features disable <name>`. See
[Automatic updates](/docs/sysexts/manage/#automatic-updates) for the steps.

## Roll back an extension

Link the previous staged version:

```bash
sudo updex features rollback <name>
```

The rollback takes effect at the next boot. Add `--now` to apply it with a
`systemd-sysext refresh`, and `--to VERSION` to pick the version. Updex then
holds the feature until a newer version is published. Delete the hold with
`sudo updex features rollback --clear <name>`. See [Roll
back](/docs/sysexts/manage/#roll-back) for the steps and the rules.

A rollback of the image with `bootc rollback` is separate. See [Roll back the
image](/docs/images/install-update/#roll-back).

## Stop updates or remove

Stop updates and keep the extension merged:

```bash
sudo updex features disable <name>
```

Remove it now, then reboot:

```bash
sudo updex features disable <name> --now --force
```

Updex v2.0.4 and later refuse to remove a merged extension without `--force`:

```text
Extension docker (version 5+29.9.1-1~debian.13~trixie) is active. Removing requires --force and a reboot to take effect.
```

## Install Updex on another system

On a Frostyard image, Updex is already installed. It updates and rolls back
with the image. Follow [Install and update an image](/docs/images/install-update/).

On another system, download the package for your system from the [Updex
releases page](https://github.com/frostyard/updex/releases/latest), and check
it before you install it. The [Updex README](https://github.com/frostyard/updex/blob/v2.1.0/README.md#installation) lists
the artifacts and the checks. The host needs systemd with `systemd-sysext`,
and commands that change the system need root.

## Catalogs

Frostyard extensions need no catalog: each image ships them as features. The
[extension catalog page](/docs/sysexts/) lists them. An Updex catalog is a
third-party source of extensions. Updex ships none, and a Frostyard image
configures none.

Add a catalog with a `.catalog` file in `/etc/updex/catalogs.d/`, then run
`updex catalog list` and `sudo updex catalog add <repo>/<name>`. A catalog
sysext needs a GPG-signed `SHA256SUMS` by default. `AllowUnsigned=yes` in one
`.catalog` file lets that catalog's own `Verify=` decide. See [Sysext
catalogs](https://github.com/frostyard/updex/blob/v2.1.0/README.md#sysext-catalogs) and [Unsigned
catalogs](https://github.com/frostyard/updex/blob/v2.1.0/README.md#unsigned-catalogs) for the file format, the checks,
and the upgrade notes.

## Reference

- [Features and components](https://github.com/frostyard/updex/blob/v2.1.0/README.md#features-and-components): every
  `features` command, the refresh warning, the minimum image version, and the
  operation lock.
- [Automatic updates](https://github.com/frostyard/updex/blob/v2.1.0/README.md#automatic-updates): the timer, its
  schedule, and its status output.
- [Global flags](https://github.com/frostyard/updex/blob/v2.1.0/README.md#global-flags): `--json`, `--dry-run`,
  `--no-refresh`, and the others.
- [JSON output](https://github.com/frostyard/updex/blob/v2.1.0/README.md#json-output): the result format for scripts.
- [Rollback](https://github.com/frostyard/updex/blob/v2.1.0/docs/design/overview.md#rollback-adr-0016): the record, the
  hold, and the vacuum.
- [Minimum image version](https://github.com/frostyard/updex/blob/v2.1.0/docs/design/overview.md#minimum-image-version-adr-0016):
  how a revision that needs a newer image stays unlinked.
- [Running and linked versions](https://github.com/frostyard/updex/blob/v2.1.0/docs/design/overview.md#status-running-and-linked-adr-0016):
  the `RUNNING` and `LINKED` columns.
- [Auto-update daemon](https://github.com/frostyard/updex/blob/v2.1.0/docs/design/overview.md#auto-update-daemon): the
  units and the daemon commands.

## Troubleshooting

| Symptom | Check | Fix |
| --- | --- | --- |
| `updex features list` shows no features | `updex components` | If no component is listed and `/etc/sysupdate.d/` is empty, Updex found no definition files. Check the image version. |
| `features check` shows `UPDATE=error` | The command output and the network | Check the network and the published manifest. The command exits non-zero. Do not read the row as up to date. |
| `another updex operation is running` | Another `updex` command or the timer | Wait, then run the command again. Only one Updex operation that changes state runs at a time. |
| `updex-update.service` shows `failed` | `journalctl -u updex-update.service` | A run on an offline host fails. The unit stays `failed` until the next good run. |
| A catalog command says no catalogs are configured | `ls /etc/updex/catalogs.d/` | Create a `<name>.catalog` file with `SiteURL`. |

See [Manage system extensions](/docs/sysexts/manage/#troubleshooting) for the
rollback, hold, and image-version rows.

## See also

- [System extension catalog](/docs/sysexts/)
- [Manage system extensions](/docs/sysexts/manage/)
- [Docker system extension](/docs/sysexts/docker/)
- [Incus system extension](/docs/sysexts/incus/)
- [Tailscale system extension](/docs/sysexts/tailscale/)
- [Snow image](/docs/images/snow/)

## Sources

Reviewed 2026-10-24.

- Updex v2.1.0 commit [`37523f85816cb61d116cc33f2dcdaf32fb8ee1e3`](https://github.com/frostyard/updex/tree/37523f85816cb61d116cc33f2dcdaf32fb8ee1e3)
- [Updex v2.1.0 release](https://github.com/frostyard/updex/releases/tag/v2.1.0)
- [`README.md`](https://github.com/frostyard/updex/blob/37523f85816cb61d116cc33f2dcdaf32fb8ee1e3/README.md)
- [`docs/design/overview.md`](https://github.com/frostyard/updex/blob/37523f85816cb61d116cc33f2dcdaf32fb8ee1e3/docs/design/overview.md)
- [`docs/adr/0007-daemon-stages-never-activates.md`](https://github.com/frostyard/updex/blob/37523f85816cb61d116cc33f2dcdaf32fb8ee1e3/docs/adr/0007-daemon-stages-never-activates.md)
- [`docs/adr/0014-local-catalog-signature-policy.md`](https://github.com/frostyard/updex/blob/37523f85816cb61d116cc33f2dcdaf32fb8ee1e3/docs/adr/0014-local-catalog-signature-policy.md)
- [`docs/adr/0015-detect-merged-sysexts-from-hierarchy-metadata.md`](https://github.com/frostyard/updex/blob/37523f85816cb61d116cc33f2dcdaf32fb8ee1e3/docs/adr/0015-detect-merged-sysexts-from-hierarchy-metadata.md)
- [`docs/adr/0016-automatic-sysext-updates-apply-at-next-boot.md`](https://github.com/frostyard/updex/blob/37523f85816cb61d116cc33f2dcdaf32fb8ee1e3/docs/adr/0016-automatic-sysext-updates-apply-at-next-boot.md)
- [`cmd/updex/features.go`](https://github.com/frostyard/updex/blob/37523f85816cb61d116cc33f2dcdaf32fb8ee1e3/cmd/updex/features.go)
- [`cmd/updex/features_run.go`](https://github.com/frostyard/updex/blob/37523f85816cb61d116cc33f2dcdaf32fb8ee1e3/cmd/updex/features_run.go)
- [`cmd/updex/daemon.go`](https://github.com/frostyard/updex/blob/37523f85816cb61d116cc33f2dcdaf32fb8ee1e3/cmd/updex/daemon.go)
- [`cmd/updex/catalog.go`](https://github.com/frostyard/updex/blob/37523f85816cb61d116cc33f2dcdaf32fb8ee1e3/cmd/updex/catalog.go)
- [`updex/features.go`](https://github.com/frostyard/updex/blob/37523f85816cb61d116cc33f2dcdaf32fb8ee1e3/updex/features.go)
- [`updex/install.go`](https://github.com/frostyard/updex/blob/37523f85816cb61d116cc33f2dcdaf32fb8ee1e3/updex/install.go)
- [`updex/rollback.go`](https://github.com/frostyard/updex/blob/37523f85816cb61d116cc33f2dcdaf32fb8ee1e3/updex/rollback.go)
- [`updex/daemon.go`](https://github.com/frostyard/updex/blob/37523f85816cb61d116cc33f2dcdaf32fb8ee1e3/updex/daemon.go)
- [`updex/catalog.go`](https://github.com/frostyard/updex/blob/37523f85816cb61d116cc33f2dcdaf32fb8ee1e3/updex/catalog.go)
- [Updex v2.0.4 release](https://github.com/frostyard/updex/releases/tag/v2.0.4)
- [Updex PR #445: detect merged images from systemd-sysext hierarchy metadata](https://github.com/frostyard/updex/pull/445)
- snosi commit [`9db7cde83454b92972887d3b1cf27a144a283201`](https://github.com/frostyard/snosi/tree/9db7cde83454b92972887d3b1cf27a144a283201): [`mkosi.images/base/mkosi.conf`](https://github.com/frostyard/snosi/blob/9db7cde83454b92972887d3b1cf27a144a283201/mkosi.images/base/mkosi.conf)
- snosi commit [`96d663b3c7025fbbeeda5987cc521b524fd1721c`](https://github.com/frostyard/snosi/tree/96d663b3c7025fbbeeda5987cc521b524fd1721c): [`mkosi.images/base/mkosi.conf`](https://github.com/frostyard/snosi/blob/96d663b3c7025fbbeeda5987cc521b524fd1721c/mkosi.images/base/mkosi.conf), [`mkosi.images/base/mkosi.extra/usr/lib/sysupdate.docker.d/docker.feature`](https://github.com/frostyard/snosi/blob/96d663b3c7025fbbeeda5987cc521b524fd1721c/mkosi.images/base/mkosi.extra/usr/lib/sysupdate.docker.d/docker.feature), [`docs/design/sysexts.md`](https://github.com/frostyard/snosi/blob/96d663b3c7025fbbeeda5987cc521b524fd1721c/docs/design/sysexts.md)
