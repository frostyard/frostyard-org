---
title: Updex
description: "Manage Frostyard system extensions with Updex: list, enable, update, roll back, and remove them."
---

Updex downloads, verifies, installs, updates, rolls back, and removes system
extension images. Every Frostyard bootc image ships it as the
`frostyard-updex` package. This guide follows Updex v2.1.3.

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
| Turn off automatic updates | `sudo systemctl mask --now updex-update.timer` | [Automatic updates](#automatic-updates) |

`features check` and `features list` show a `RUNNING` and a `LINKED` version.
`RUNNING` is the version merged now. `LINKED` is the version the next boot
merges. When they differ, the output ends with a `PENDING REBOOT:` line.

A Frostyard image ships each extension as a feature in
`/usr/lib/sysupdate.<name>.d/`, switched off. Limit a `features` command to
one extension with `--component=<name>`.

## Automatic updates

A Frostyard image enables `updex-update.timer`. It runs
`updex features update --no-refresh`, which downloads, verifies, and links new
versions. They take effect at the next boot. To turn automatic updates off on
the whole host, and keep them off across image updates, run
`sudo systemctl mask --now updex-update.timer`. To stop one extension, run
`sudo updex features disable <name>`. See
[Automatic updates](/docs/sysexts/manage/#automatic-updates) for the schedule
and the checks.

On a system without the Frostyard image, the package ships the timer switched
off. Turn it on with `sudo updex daemon enable`. Preview the change first with
`sudo updex --dry-run daemon enable`.

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

When another enabled feature still needs a transfer, `disable --now` keeps it
and prints `kept: still active through feature(s) <name>`.

## Install Updex on another system

On a Frostyard image, Updex is already installed. It updates and rolls back
with the image. Follow [Install and update an image](/docs/images/install-update/).

On another system, download the package for your system from the [Updex
releases page](https://github.com/frostyard/updex/releases/latest), and check
it before you install it. The [Updex README](https://github.com/frostyard/updex/blob/v2.1.3/README.md#installation) lists
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
catalogs](https://github.com/frostyard/updex/blob/v2.1.3/README.md#sysext-catalogs) and [Unsigned
catalogs](https://github.com/frostyard/updex/blob/v2.1.3/README.md#unsigned-catalogs) for the file format, the checks,
and the upgrade notes.

## Reference

- [Features and components](https://github.com/frostyard/updex/blob/v2.1.3/README.md#features-and-components): every
  `features` command, the refresh warning, the minimum image version, and the
  operation lock.
- [Automatic updates](https://github.com/frostyard/updex/blob/v2.1.3/README.md#automatic-updates): the timer, its
  schedule, and its status output.
- [Global flags](https://github.com/frostyard/updex/blob/v2.1.3/README.md#global-flags): `--json`, `--dry-run`,
  `--no-refresh`, and the others.
- [JSON output](https://github.com/frostyard/updex/blob/v2.1.3/README.md#json-output): the result format for scripts.
- [Rollback](https://github.com/frostyard/updex/blob/v2.1.3/docs/design/overview.md#rollback-adr-0016): the record, the
  hold, and the vacuum.
- [Minimum image version](https://github.com/frostyard/updex/blob/v2.1.3/docs/design/overview.md#minimum-image-version-adr-0016):
  how a revision that needs a newer image stays unlinked.
- [Running and linked versions](https://github.com/frostyard/updex/blob/v2.1.3/docs/design/overview.md#status-running-and-linked-adr-0016):
  the `RUNNING` and `LINKED` columns.
- [Auto-update daemon](https://github.com/frostyard/updex/blob/v2.1.3/docs/design/overview.md#auto-update-daemon): the
  units and the daemon commands.

## Troubleshooting

| Symptom | Check | Fix |
| --- | --- | --- |
| `updex features list` shows no features | `updex components` | If no component is listed and no `sysupdate.d/` directory in `/etc`, `/run`, `/usr/local/lib`, or `/usr/lib` has definition files, Updex found none. Check the image version. |
| `features check` shows `UPDATE=error` | The command output and the network | Check the network and the published manifest. The command exits non-zero. Do not read the row as up to date. |
| `another updex operation is running` | Another `updex` command or the timer | Wait, then run the command again. Only one Updex operation that changes state runs at a time. |
| `updex-update.service` shows `failed` | `journalctl -u updex-update.service` | A run that no update source answered exits 0 and logs `no update source is reachable; skipping this run`. A partial failure, a source that answered with an error, or a verification failure fails the unit until the next good run. |
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

Reviewed 2026-10-30.

- Updex v2.1.3 commit [`2661e987faac986f2594d1d9bbbadf1bf3053f5b`](https://github.com/frostyard/updex/tree/2661e987faac986f2594d1d9bbbadf1bf3053f5b)
- [Updex v2.1.3 release](https://github.com/frostyard/updex/releases/tag/v2.1.3)
- [`README.md`](https://github.com/frostyard/updex/blob/2661e987faac986f2594d1d9bbbadf1bf3053f5b/README.md)
- [`docs/design/overview.md`](https://github.com/frostyard/updex/blob/2661e987faac986f2594d1d9bbbadf1bf3053f5b/docs/design/overview.md)
- [`docs/adr/0007-daemon-stages-never-activates.md`](https://github.com/frostyard/updex/blob/2661e987faac986f2594d1d9bbbadf1bf3053f5b/docs/adr/0007-daemon-stages-never-activates.md)
- [`docs/adr/0014-local-catalog-signature-policy.md`](https://github.com/frostyard/updex/blob/2661e987faac986f2594d1d9bbbadf1bf3053f5b/docs/adr/0014-local-catalog-signature-policy.md)
- [`docs/adr/0015-detect-merged-sysexts-from-hierarchy-metadata.md`](https://github.com/frostyard/updex/blob/2661e987faac986f2594d1d9bbbadf1bf3053f5b/docs/adr/0015-detect-merged-sysexts-from-hierarchy-metadata.md)
- [`docs/adr/0016-automatic-sysext-updates-apply-at-next-boot.md`](https://github.com/frostyard/updex/blob/2661e987faac986f2594d1d9bbbadf1bf3053f5b/docs/adr/0016-automatic-sysext-updates-apply-at-next-boot.md)
- [`docs/adr/0017-apply-the-feature-activation-rule-in-every-feature-path.md`](https://github.com/frostyard/updex/blob/2661e987faac986f2594d1d9bbbadf1bf3053f5b/docs/adr/0017-apply-the-feature-activation-rule-in-every-feature-path.md)
- [`docs/adr/0018-skip-an-update-run-when-every-source-is-unreachable.md`](https://github.com/frostyard/updex/blob/2661e987faac986f2594d1d9bbbadf1bf3053f5b/docs/adr/0018-skip-an-update-run-when-every-source-is-unreachable.md)
- [`cmd/updex/features.go`](https://github.com/frostyard/updex/blob/2661e987faac986f2594d1d9bbbadf1bf3053f5b/cmd/updex/features.go)
- [`cmd/updex/features_run.go`](https://github.com/frostyard/updex/blob/2661e987faac986f2594d1d9bbbadf1bf3053f5b/cmd/updex/features_run.go)
- [`cmd/updex/daemon.go`](https://github.com/frostyard/updex/blob/2661e987faac986f2594d1d9bbbadf1bf3053f5b/cmd/updex/daemon.go)
- [`cmd/updex/catalog.go`](https://github.com/frostyard/updex/blob/2661e987faac986f2594d1d9bbbadf1bf3053f5b/cmd/updex/catalog.go)
- [`updex/features.go`](https://github.com/frostyard/updex/blob/2661e987faac986f2594d1d9bbbadf1bf3053f5b/updex/features.go)
- [`updex/install.go`](https://github.com/frostyard/updex/blob/2661e987faac986f2594d1d9bbbadf1bf3053f5b/updex/install.go)
- [`updex/rollback.go`](https://github.com/frostyard/updex/blob/2661e987faac986f2594d1d9bbbadf1bf3053f5b/updex/rollback.go)
- [`updex/daemon.go`](https://github.com/frostyard/updex/blob/2661e987faac986f2594d1d9bbbadf1bf3053f5b/updex/daemon.go)
- [`updex/catalog.go`](https://github.com/frostyard/updex/blob/2661e987faac986f2594d1d9bbbadf1bf3053f5b/updex/catalog.go)
- [Updex v2.0.4 release](https://github.com/frostyard/updex/releases/tag/v2.0.4)
- [Updex PR #445: detect merged images from systemd-sysext hierarchy metadata](https://github.com/frostyard/updex/pull/445)
- snosi commit [`b2858ca0222814c395cf8248db98f3e096d57dc9`](https://github.com/frostyard/snosi/tree/b2858ca0222814c395cf8248db98f3e096d57dc9): [`mkosi.images/base/mkosi.conf`](https://github.com/frostyard/snosi/blob/b2858ca0222814c395cf8248db98f3e096d57dc9/mkosi.images/base/mkosi.conf), [`mkosi.images/base/mkosi.extra/usr/lib/systemd/system-preset/05-updex.preset`](https://github.com/frostyard/snosi/blob/b2858ca0222814c395cf8248db98f3e096d57dc9/mkosi.images/base/mkosi.extra/usr/lib/systemd/system-preset/05-updex.preset), [`mkosi.images/base/mkosi.extra/usr/lib/sysupdate.docker.d/docker.feature`](https://github.com/frostyard/snosi/blob/b2858ca0222814c395cf8248db98f3e096d57dc9/mkosi.images/base/mkosi.extra/usr/lib/sysupdate.docker.d/docker.feature), [`docs/design/sysexts.md`](https://github.com/frostyard/snosi/blob/b2858ca0222814c395cf8248db98f3e096d57dc9/docs/design/sysexts.md)
