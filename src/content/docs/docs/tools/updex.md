---
title: Updex
description: "Manage Frostyard system extensions with Updex: list, enable, update, roll back, and remove them."
follows:
  repo: frostyard/updex
  tag: v2.3.1
---

Updex downloads, verifies, installs, updates, rolls back, and removes system
extension images. Every Frostyard bootc image ships it as the
`frostyard-updex` package. This guide follows Updex v2.3.1.

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
| Update or check only some extensions | `sudo updex features update <name>...`, `updex features check <name>...` | [Naming features](https://github.com/frostyard/updex/blob/v2.3.1/docs/specs/cli-reference.md#naming-features) |
| Go back to the previous version | `sudo updex features rollback <name>` | [Roll back](/docs/sysexts/manage/#roll-back) |
| Stop updates, or remove an extension | `sudo updex features disable <name>` | [Stop updates or remove](/docs/sysexts/manage/#stop-updates-or-remove) |
| Turn off automatic updates | `sudo systemctl mask --now updex-update.timer` | [Automatic updates](#automatic-updates) |

`features check` and `features list` show a `RUNNING` and a `LINKED` version.
`RUNNING` is the version merged now. `LINKED` is the version the next boot
merges. When they differ, the output ends with a `PENDING REBOOT:` line.

A Frostyard image ships each extension as a feature in
`/usr/lib/sysupdate.<name>.d/`, switched off. Limit a `features` command to
one extension with `--component=<name>`.

From v2.2.0, `features update` and `features check` take feature names. With no name, they act on every enabled feature. Each name must be an enabled feature: an unknown, disabled, or masked name stops the command before it changes anything. The refresh after an update still activates the pending links of other features, and a warning lists them first. To skip the refresh, add `--no-refresh`; the new versions then take effect at the next boot.

## Automatic updates

A Frostyard image enables `updex-update.timer`. It runs
`updex features update --no-refresh`, which downloads, verifies, and links new
versions. They take effect at the next boot. To turn automatic updates off on
the whole host, and keep them off across image updates, run
`sudo systemctl mask --now updex-update.timer`. To stop one extension, run
`sudo updex features disable <name>`. See
[Automatic updates](/docs/sysexts/manage/#automatic-updates) for the schedule
and the checks.

From v2.3.0, each `updex features update` that is not a dry run writes its
result to `/var/lib/updex/last-run.json`. The timer's runs write it too, and it
stays after a reboot. A command with a feature name that Updex refuses writes
no record. `updex daemon status` shows the last record on a `Last update` line.
See [Automatic updates](/docs/sysexts/manage/#automatic-updates) for the output.

From v2.3.1, a Frostyard image also enables `updex-suite-switch.service`.
After you switch the image to a new Debian suite, for example from trixie to
forky, it links and merges the new suite's extension images at the first boot.
On other boots it does nothing. A failed run tries again 5 minutes later, at
most 3 times, and then stays failed until the next boot. Its log is
`journalctl -u updex-suite-switch.service`. Later `features update` runs
remove the old suite's images and keep the newest one, so a switch back needs
no download. See [What the vacuum
keeps](https://github.com/frostyard/updex/blob/v2.3.1/docs/specs/cli-reference.md#what-the-vacuum-keeps).

On a system without the Frostyard image, the package ships the timer switched
off. Turn it on with `sudo updex daemon enable`. Preview the change first with
`sudo updex --dry-run daemon enable`.

## Roll back an extension

Link the previous staged version:

```bash
sudo updex features rollback <name>
```

The rollback takes effect at the next boot. Add `--now` to apply it with a
refresh, and `--to VERSION` to pick the version. Updex then
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

From v2.3.1, `disable --now` also removes the images of other suites. It needs
`--force` when an image of another suite is merged.

## Install Updex on another system

On a Frostyard image, Updex is already installed. It updates and rolls back
with the image. Follow [Install and update an image](/docs/images/install-update/).

On another system, download the package for your system from the [Updex
releases page](https://github.com/frostyard/updex/releases/latest), and check
it before you install it. The [Updex CLI reference](https://github.com/frostyard/updex/blob/v2.3.1/docs/specs/cli-reference.md#install)
lists the artifacts and the checks. The host needs systemd with `systemd-sysext`,
and commands that change the system need root.

## Catalogs

Frostyard extensions need no catalog: each image ships them as features. The
[extension catalog page](/docs/sysexts/) lists them. An Updex catalog is a
third-party source of extensions. Updex ships none, and a Frostyard image
configures none.

Add a catalog with a `.catalog` file in `/etc/updex/catalogs.d/`, then run
`updex catalog list` and `sudo updex catalog add <repo>/<name>`. A catalog
sysext needs a GPG-signed `SHA256SUMS` by default. `AllowUnsigned=yes` in one
`.catalog` file lets that catalog's own `Verify=` decide. See
[Catalogs](https://github.com/frostyard/updex/blob/v2.3.1/docs/specs/cli-reference.md#catalogs)
and [Unsigned
catalogs](https://github.com/frostyard/updex/blob/v2.3.1/docs/specs/cli-reference.md#unsigned-catalogs)
for the commands and the checks. See [Catalog
files](https://github.com/frostyard/updex/blob/v2.3.1/docs/specs/config-reference.md#catalog-files-catalog)
for the file format, and [Signature policy for catalog
sysexts](https://github.com/frostyard/updex/blob/v2.3.1/docs/specs/config-reference.md#signature-policy-for-catalog-sysexts)
for the upgrade notes.

## Reference

- [CLI reference](https://github.com/frostyard/updex/blob/v2.3.1/docs/specs/cli-reference.md):
  every command, flag, and message.
- [Features and components](https://github.com/frostyard/updex/blob/v2.3.1/docs/specs/cli-reference.md#features-and-components):
  every `features` command. The sections after it cover the refresh warning,
  the minimum image version, and the operation lock.
- [Automatic updates](https://github.com/frostyard/updex/blob/v2.3.1/docs/specs/cli-reference.md#automatic-updates):
  the timer, its schedule, the suite-switch unit, and the status output.
- [Global flags](https://github.com/frostyard/updex/blob/v2.3.1/docs/specs/cli-reference.md#global-flags):
  `--json`, `--dry-run`, `--no-refresh`, and the others.
- [JSON output](https://github.com/frostyard/updex/blob/v2.3.1/docs/specs/cli-reference.md#json-output):
  the result format for scripts.
- [Configuration reference](https://github.com/frostyard/updex/blob/v2.3.1/docs/specs/config-reference.md):
  the `.transfer`, `.feature`, and `.catalog` files.
- [Rollback](https://github.com/frostyard/updex/blob/v2.3.1/docs/design/overview.md#rollback-adr-0016): the record, the
  hold, and the vacuum.
- [Minimum image version](https://github.com/frostyard/updex/blob/v2.3.1/docs/design/overview.md#minimum-image-version-adr-0016):
  how a revision that needs a newer image stays unlinked.
- [Running and linked versions](https://github.com/frostyard/updex/blob/v2.3.1/docs/design/overview.md#status-running-and-linked-adr-0016):
  the `RUNNING` and `LINKED` columns.
- [Auto-update daemon](https://github.com/frostyard/updex/blob/v2.3.1/docs/design/overview.md#auto-update-daemon): the
  units and the daemon commands.
- [Last-run record](https://github.com/frostyard/updex/blob/v2.3.1/docs/specs/last-run-record.md): the outcomes and error classes that `Last update` shows.

## Troubleshooting

| Symptom | Check | Fix |
| --- | --- | --- |
| `updex features list` shows no features | `updex components` | If no component is listed and no `sysupdate.d/` directory in `/etc`, `/run`, `/usr/local/lib`, or `/usr/lib` has definition files, Updex found none. Check the image version. |
| `features check` shows `UPDATE=error` | The command output and the network | Check the network and the published manifest. The command exits non-zero. Do not read the row as up to date. |
| `another updex operation is running` | Another `updex` command or the timer | Wait, then run the command again. Only one Updex operation that changes state runs at a time. |
| `updex-update.service` shows `failed` | `journalctl -u updex-update.service` | A run that no update source answered exits 0 and logs `no update source is reachable; skipping this run`. A partial failure, a source that answered with an error, or a verification failure fails the unit until the next good run. |
| The timer ran, but no version changed | `updex daemon status` | Read the `Last update` line. `skipped_busy`: another Updex operation ran. `skipped_unreachable`: no update source answered. The next run tries again. A feature line names the feature that failed and its error class. |
| A catalog command says no catalogs are configured | `ls /etc/updex/catalogs.d/` | Create a `<name>.catalog` file with `SiteURL`. |
| A `features` command fails with `specifier %w is empty: os-release has no VERSION_ID` | `grep VERSION_ID /etc/os-release` | The host's os-release has no `VERSION_ID`, as on Debian testing before its release, so Updex cannot pick the images of its suite. Fix the host's os-release or the transfer. From v2.3.1, `features update`, `check`, and `enable --now` stop with this error. `features list` shows it, and `disable` still works. |

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

Reviewed 2026-11-14.

- Updex v2.3.1 commit [`7aea0816be5745d285945eca03ed872661cc2b88`](https://github.com/frostyard/updex/tree/7aea0816be5745d285945eca03ed872661cc2b88), released 2026-11-14
- [Updex v2.3.1 release](https://github.com/frostyard/updex/releases/tag/v2.3.1)
- v2.3.1 [`README.md`](https://github.com/frostyard/updex/blob/7aea0816be5745d285945eca03ed872661cc2b88/README.md), [`docs/specs/cli-reference.md`](https://github.com/frostyard/updex/blob/7aea0816be5745d285945eca03ed872661cc2b88/docs/specs/cli-reference.md), [`docs/specs/config-reference.md`](https://github.com/frostyard/updex/blob/7aea0816be5745d285945eca03ed872661cc2b88/docs/specs/config-reference.md), and [`docs/design/overview.md`](https://github.com/frostyard/updex/blob/7aea0816be5745d285945eca03ed872661cc2b88/docs/design/overview.md)
- [Updex PR #510: shorten the README](https://github.com/frostyard/updex/pull/510), [PR #515: clean up other-suite images in vacuum and disable](https://github.com/frostyard/updex/pull/515), [PR #516: fail loud on an empty specifier and link the running suite at boot](https://github.com/frostyard/updex/pull/516), [PR #518: refuse the vacuum when `ProtectVersion=` has an empty specifier](https://github.com/frostyard/updex/pull/518), and [PR #519: retry a failed suite-switch run at boot](https://github.com/frostyard/updex/pull/519)
- [`docs/adr/0021-link-the-running-suites-images-at-boot-after-a-suite-switch.md`](https://github.com/frostyard/updex/blob/7aea0816be5745d285945eca03ed872661cc2b88/docs/adr/0021-link-the-running-suites-images-at-boot-after-a-suite-switch.md) and [`docs/adr/0022-retry-a-failed-suite-switch-run-at-boot.md`](https://github.com/frostyard/updex/blob/7aea0816be5745d285945eca03ed872661cc2b88/docs/adr/0022-retry-a-failed-suite-switch-run-at-boot.md)
- snosi commit [`26aa1de41fd08299a9e0422d42a73f9822d7c799`](https://github.com/frostyard/snosi/tree/26aa1de41fd08299a9e0422d42a73f9822d7c799): [`mkosi.images/base/mkosi.extra/usr/lib/systemd/system-preset/05-updex.preset`](https://github.com/frostyard/snosi/blob/26aa1de41fd08299a9e0422d42a73f9822d7c799/mkosi.images/base/mkosi.extra/usr/lib/systemd/system-preset/05-updex.preset) enables `updex-suite-switch.service`
- Updex v2.3.0 commit [`2b2def7e81b861e4465ef8f5e180693ed6acd1fc`](https://github.com/frostyard/updex/tree/2b2def7e81b861e4465ef8f5e180693ed6acd1fc)
- [Updex v2.3.0 release](https://github.com/frostyard/updex/releases/tag/v2.3.0)
- [`README.md`](https://github.com/frostyard/updex/blob/2b2def7e81b861e4465ef8f5e180693ed6acd1fc/README.md)
- [`docs/design/overview.md`](https://github.com/frostyard/updex/blob/2b2def7e81b861e4465ef8f5e180693ed6acd1fc/docs/design/overview.md)
- [`docs/adr/0007-daemon-stages-never-activates.md`](https://github.com/frostyard/updex/blob/2b2def7e81b861e4465ef8f5e180693ed6acd1fc/docs/adr/0007-daemon-stages-never-activates.md)
- [`docs/adr/0014-local-catalog-signature-policy.md`](https://github.com/frostyard/updex/blob/2b2def7e81b861e4465ef8f5e180693ed6acd1fc/docs/adr/0014-local-catalog-signature-policy.md)
- [`docs/adr/0015-detect-merged-sysexts-from-hierarchy-metadata.md`](https://github.com/frostyard/updex/blob/2b2def7e81b861e4465ef8f5e180693ed6acd1fc/docs/adr/0015-detect-merged-sysexts-from-hierarchy-metadata.md)
- [`docs/adr/0016-automatic-sysext-updates-apply-at-next-boot.md`](https://github.com/frostyard/updex/blob/2b2def7e81b861e4465ef8f5e180693ed6acd1fc/docs/adr/0016-automatic-sysext-updates-apply-at-next-boot.md)
- [`docs/adr/0017-apply-the-feature-activation-rule-in-every-feature-path.md`](https://github.com/frostyard/updex/blob/2b2def7e81b861e4465ef8f5e180693ed6acd1fc/docs/adr/0017-apply-the-feature-activation-rule-in-every-feature-path.md)
- [`docs/adr/0018-skip-an-update-run-when-every-source-is-unreachable.md`](https://github.com/frostyard/updex/blob/2b2def7e81b861e4465ef8f5e180693ed6acd1fc/docs/adr/0018-skip-an-update-run-when-every-source-is-unreachable.md)
- [`cmd/updex/features.go`](https://github.com/frostyard/updex/blob/2b2def7e81b861e4465ef8f5e180693ed6acd1fc/cmd/updex/features.go)
- [`cmd/updex/features_run.go`](https://github.com/frostyard/updex/blob/2b2def7e81b861e4465ef8f5e180693ed6acd1fc/cmd/updex/features_run.go)
- [`cmd/updex/daemon.go`](https://github.com/frostyard/updex/blob/2b2def7e81b861e4465ef8f5e180693ed6acd1fc/cmd/updex/daemon.go)
- [`cmd/updex/catalog.go`](https://github.com/frostyard/updex/blob/2b2def7e81b861e4465ef8f5e180693ed6acd1fc/cmd/updex/catalog.go)
- [`updex/features.go`](https://github.com/frostyard/updex/blob/2b2def7e81b861e4465ef8f5e180693ed6acd1fc/updex/features.go)
- [`updex/install.go`](https://github.com/frostyard/updex/blob/2b2def7e81b861e4465ef8f5e180693ed6acd1fc/updex/install.go)
- [`updex/rollback.go`](https://github.com/frostyard/updex/blob/2b2def7e81b861e4465ef8f5e180693ed6acd1fc/updex/rollback.go)
- [`updex/daemon.go`](https://github.com/frostyard/updex/blob/2b2def7e81b861e4465ef8f5e180693ed6acd1fc/updex/daemon.go)
- [`updex/catalog.go`](https://github.com/frostyard/updex/blob/2b2def7e81b861e4465ef8f5e180693ed6acd1fc/updex/catalog.go)
- [Updex v2.0.4 release](https://github.com/frostyard/updex/releases/tag/v2.0.4)
- [Updex PR #445: detect merged images from systemd-sysext hierarchy metadata](https://github.com/frostyard/updex/pull/445)
- [Updex PR #481: update or check only the named features](https://github.com/frostyard/updex/pull/481)
- [Updex v2.2.0 release](https://github.com/frostyard/updex/releases/tag/v2.2.0)
- [Updex PR #488: write a last-run record](https://github.com/frostyard/updex/pull/488) and [Updex PR #502: report it in daemon status](https://github.com/frostyard/updex/pull/502): [`docs/specs/last-run-record.md`](https://github.com/frostyard/updex/blob/2b2def7e81b861e4465ef8f5e180693ed6acd1fc/docs/specs/last-run-record.md), [`docs/adr/0020-write-a-machine-readable-last-run-record.md`](https://github.com/frostyard/updex/blob/2b2def7e81b861e4465ef8f5e180693ed6acd1fc/docs/adr/0020-write-a-machine-readable-last-run-record.md), and `printLastUpdate` in `cmd/updex/daemon.go`.
- snosi commit [`b2858ca0222814c395cf8248db98f3e096d57dc9`](https://github.com/frostyard/snosi/tree/b2858ca0222814c395cf8248db98f3e096d57dc9): [`mkosi.images/base/mkosi.conf`](https://github.com/frostyard/snosi/blob/b2858ca0222814c395cf8248db98f3e096d57dc9/mkosi.images/base/mkosi.conf), [`mkosi.images/base/mkosi.extra/usr/lib/systemd/system-preset/05-updex.preset`](https://github.com/frostyard/snosi/blob/b2858ca0222814c395cf8248db98f3e096d57dc9/mkosi.images/base/mkosi.extra/usr/lib/systemd/system-preset/05-updex.preset), [`mkosi.images/base/mkosi.extra/usr/lib/sysupdate.docker.d/docker.feature`](https://github.com/frostyard/snosi/blob/b2858ca0222814c395cf8248db98f3e096d57dc9/mkosi.images/base/mkosi.extra/usr/lib/sysupdate.docker.d/docker.feature), [`docs/design/sysexts.md`](https://github.com/frostyard/snosi/blob/b2858ca0222814c395cf8248db98f3e096d57dc9/docs/design/sysexts.md)
