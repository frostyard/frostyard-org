---
title: Manage system extensions
description: "Find, enable, check, update, roll back, and remove a system extension on a Frostyard bootc image."
---

A system extension is an EROFS image that adds files to `/usr` only. Every
Frostyard bootc image carries a definition for each extension in the catalog,
switched off. The extension itself is not in the image: Updex turns it on and
downloads it. This guide covers the whole lifecycle of one extension: find it,
enable it, check it, update it, roll it back, and remove it.

## Before you start

You need:

- Root access to enable, update, and remove an extension. Checks that change
  nothing run without `sudo`.
- Network access to `https://repository.frostyard.org/ext/`.
- Free space in `/var` for the download and the installed image.

This guide follows Updex v2.1.0. Check your version:

```bash
updex --version
```

The output shows the version. An older Updex can lack a command or print
different messages.

## Find an extension

See what Updex found:

```bash
updex components
updex features list
```

The first table lists each component, the source directory that provides it,
and its feature count. The second lists each feature, its description, its
enabled state, its origin, and its transfers.

Limit a command to one component:

```bash
updex features list --component=docker
```

The table lists only the Docker feature.

The [extension catalog](/docs/sysexts/) lists every published extension. Your
image ships its definitions in `/usr/lib/sysupdate.<name>.d/`, and it can
enable only the features it has files for. If `updex features list` does not show an
extension, your image cannot enable it.

## Enable an extension

Enable a feature for the next update:

```bash
sudo updex features enable <name>
```

Replace `<name>` with a feature name from `updex features list`. The output
says `Feature '<name>' enabled.` and then
`Run 'updex features update' to download extensions.` The command writes one
drop-in, `/etc/sysupdate.<name>.d/<name>.feature.d/00-updex.conf`, which sets
`Enabled=true`. It does not download the image.

Enable it and download it now:

```bash
sudo updex features enable <name> --now
```

The output says `Feature '<name>' enabled.` and lists the downloaded files.
With `--now`, Updex writes the drop-in, downloads the image, checks its SHA256
hash against the signed manifest, creates the link, and runs
`systemd-sysext refresh`.

## Check that it works

Check the merge:

```bash
systemd-sysext status
```

The output lists the merged extensions. `<name>` is in the list.

The live link is `/var/lib/extensions/<name>.raw`. It points to the chosen
image file in `/var/lib/extensions.d/`, named
`<name>_<version>_<os>_<arch>.raw`. The transfer file sets
`CurrentSymlink=<name>.raw`, which would put a second link in
`/var/lib/extensions.d/`. Updex deletes that one on install.

If the extension has a service, check it with the unit name from its page:

```bash
systemctl status <name>.service
```

The unit is active. The extension ships a preset that enables the service and a
`multi-user.target.d/10-<name>.conf` drop-in with `Upholds=`. The drop-in is
new to systemd after the post-merge `daemon-reload`, so it starts the service
when `multi-user.target` activates. A preset alone would not work: at boot, PID
1 scans unit files before the extension is merged.

A merge does not prove that setup completed. At boot, `reload-sysext.service`
runs `systemd-sysusers`, `systemd-tmpfiles --create --graceful`, and
`systemctl daemon-reload` after the merge. After an interactive `--now` merge,
they may not have run yet. If a user, a group, or a file in `/etc` is missing,
reboot and check again.

Frostyard transfers set `Verify=true`. Updex reads `SHA256SUMS` from the
transfer's source and checks the detached signature in `SHA256SUMS.gpg` against
the systemd keyring. Only then does it trust the hashes in that file, and it
checks the downloaded image against its hash. A missing signature or a bad one
stops the command, and no image is installed.

The base image ships the Frostyard repository key at
`/usr/lib/systemd/import-pubring.gpg`. Updex uses the first of these files
that exists: `/etc/systemd/import-pubring.gpg`, then
`/usr/lib/systemd/import-pubring.gpg`. If you create the `/etc` file, it must
also hold the Frostyard key, or every Frostyard download fails verification.

If `enable --now` exits with a refresh error (`refresh_error` in JSON), the
download worked but the merge did not. Run `sudo systemd-sysext refresh`, or
reboot.

## Update

See what you can update to. This changes nothing:

```bash
updex features check
```

The table has a row for each enabled feature that has transfers, with the
current version, the running and linked versions, the newest version, and
`UPDATE`. `UPDATE` shows `yes`, `no`, or `error`. An `error` row means Updex
could not fetch or verify the manifest, and the command exits non-zero. Do not
read an error row as `no`.

The current version is the one that the link
`/var/lib/extensions/<name>.raw` points to. If the newest image is already on
disk but the link names an older one, `UPDATE` shows `yes`.

`RUNNING` is the version merged now. `LINKED` is the version that the next
boot merges. `features list` shows both columns too. When they differ, the
output ends with a `PENDING REBOOT:` line: the update is linked and waits for
a reboot.

Install the newest versions:

```bash
sudo updex features update
```

Each row shows the status `downloaded` or `up to date`. Updex downloads and
verifies each new image, switches the link, removes old versions, and refreshes
the merge.

If the newest image is already on disk and only the link names an older one,
Updex downloads nothing. It repoints the link and prints
`Linked staged version <version>`. The row shows `linked`. The host now has a
newer version linked than the one it runs. Reboot to run it, or run
`sudo systemd-sysext refresh`. With `--json`, the result has
`next_action_message`: `Reboot required to activate changes`.

Take the update at the next boot instead of now:

```bash
sudo updex features update --no-refresh
```

Updex downloads, verifies, and links the new version, but does not run
`systemd-sysext refresh`. Nothing changes in the running system. The new
version runs after the next reboot. `--no-refresh` is a global flag: the
timer below uses it too.

Keep old versions:

```bash
sudo updex features update --no-vacuum
```

Without the option, Updex keeps the number of versions that the transfer sets
in `InstancesMax`, which is 2 by default. It also keeps the linked image, the
merged image, and a version that a rollback rejected.

Preview an update without a change:

```bash
sudo updex --dry-run features update
```

The output starts with `[DRY RUN]` and shows `would download` where it would
change something.

A refresh swaps `/usr` under the running system, and a service can restart.
Stop or drain workloads first if a restart would hurt them.

### An extension that needs a newer image

A new revision can need a newer base image. Updex then links nothing for that
feature, keeps the old link, and keeps the downloaded image. The row shows
`not linked: needs image >= <value>`. This is not an error, and the command
exits 0.

Update the image. [Install and update an image](/docs/images/install-update/)
has the steps. The next Updex run links the staged revision. After a queued
`bootc rollback`, Updex checks the revision against the rollback image.
See [Minimum image version](https://github.com/frostyard/updex/blob/v2.1.0/docs/design/overview.md#minimum-image-version-adr-0016)
for the rules.

### Automatic updates

The `frostyard-updex` package ships `updex-update.timer` and
`updex-update.service` in `/usr/lib/systemd/system`, switched off. Turn the
timer on:

```bash
sudo updex daemon enable
```

With the packaged units, Updex writes no unit file. It enables and starts the
timer. The output says `Auto-update daemon enabled.`,
`Using the units shipped by the package; no unit file was written.`, and
`Reboot required to activate downloaded extensions.`

The timer runs `updex features update --no-refresh` every 6 hours, with a
random delay of up to 1 hour. A run missed while the host was off happens at
the next boot. A run downloads, verifies, and links the new version. It never
activates it: the new version runs after the next reboot. The service skips a
run while the host is on battery. A host without a battery always runs.

Preview the change first. Nothing changes:

```bash
sudo updex --dry-run daemon enable
```

Check the timer:

```bash
updex daemon status
```

The output shows `Enabled`, `Active`, `Source`, `Schedule`, `Next run`, and
`Last run`. The run log is in the journal:

```bash
journalctl -u updex-update.service
```

A run on an offline host fails, and the unit shows `failed` until the next
good run.

Turn the timer off:

```bash
sudo updex daemon disable
```

The output says `Auto-update daemon disabled.` The package keeps its units, and
an image update can enable the timer again. To keep the whole host from
updating on a schedule, mask the timer. The mask survives image updates:

```bash
sudo systemctl mask updex-update.timer
```

To stop one extension, run `sudo updex features disable <name>`. See [Automatic
updates](https://github.com/frostyard/updex/blob/v2.1.0/README.md#automatic-updates) for the schedule, the lock, and the
other details.

## Roll back

Go back to the previous version of an extension:

```bash
sudo updex features rollback <name>
```

Updex links the newest staged version that is older than the linked one. The
rollback takes effect at the next boot. To apply it now with a
`systemd-sysext refresh`, add `--now`. To pick the version, add
`--to VERSION`. If the older version is not on disk, the command fails and
changes nothing.

Updex records the rejected version in `/var/lib/updex/rollback/<name>`. While
the record exists, `updex features update` and the timer leave the extension
alone. The row shows `held by rollback: rejected <version>`, and the command
exits 0. When a newer version is published, the next update links it and
deletes the record. To let updates link the newest version again now, delete
the record:

```bash
sudo updex features rollback --clear <name>
```

The command changes no link. By default Updex keeps the two newest versions on
disk (`InstancesMax`), plus the linked, the merged, and the rejected version.
`--no-vacuum` keeps all of them. Your data in `/var` stays. See
[Rollback](https://github.com/frostyard/updex/blob/v2.1.0/docs/design/overview.md#rollback-adr-0016) for the rules.

An image rollback with `bootc rollback` does not roll back extensions. The
links and the images are in `/var`, which every image version shares, so the
older image merges the same extension versions at its next boot. An extension
is built against the image it was made for. A newer extension can fail on an
older image. If one does, roll the extension back too, stop its updates, or
remove it. While a `bootc rollback` is queued, Updex checks new revisions
against the rollback image, so a revision that needs a newer image stays
unlinked.

## Stop updates or remove

Stop future updates and keep the extension merged:

```bash
sudo updex features disable <name>
```

The output says `Feature '<name>' disabled.` Updex writes `Enabled=false` in
the drop-in. It does not unmerge the extension. The image and the link stay, so
the extension keeps running, now and after every reboot. The output also
says `Its extensions stay installed and merged. Run 'updex features disable <name> --now' to remove them.`

Remove the extension now:

```bash
sudo updex features disable <name> --now --force
```

The output says `Feature '<name>' disabled.` and `Extensions unmerged.`, lists
the removed files, and ends with
`Warning: Reboot required for changes to take effect.` Updex unmerges all
extensions on the host, removes the image files and the link, and then merges
the rest again. Reboot when the command finishes.

Updex refuses to remove a merged extension without `--force`:

```text
Extension <name> (version <version>) is active. Removing requires --force and a reboot to take effect.
```

The version is the merged one. On systemd older than 258 it reads `unknown`. If
Updex cannot read the merged state, it also refuses, and names the component
with `merge state unknown`. `<name>` is the transfer name, the same as the
feature name for Frostyard extensions.

An extension cannot provide files in `/etc` or `/var`. Your data in `/var` and
your changes in `/etc` stay after a removal.

If the refresh at the end fails, the remaining extensions stay unmerged. Run
`sudo systemd-sysext refresh`, or reboot.

## How extensions are built

An extension is an EROFS overlay (`Format=sysext`, `Overlay=yes`) on its build
base: Base, or for desktop applications gui-base (Base plus the GUI libraries
that every desktop image ships). It holds only what that build base does not
have. A desktop-application extension needs those GUI libraries, so it is
meant for Snow, Snowfield, and Sundog, not Floe.

- The payload is `/usr` only. A package that installs to `/opt` is relocated to
  `/usr/lib/<package>` with `/usr/bin` symlinks, because `/opt` is a bind mount
  to `/var/opt` and a file there would be shadowed.
- Default files for `/etc` stay in `/usr/share/factory/etc`, and `tmpfiles.d`
  copies them into `/etc` at boot, only when the file is missing. A build
  captures only the paths its rules name.
- The file is `<name>_<version>_<os>_<arch>.raw.zst`. `%w` matches your OS
  version and `%a` your architecture. The transfer also accepts `.raw.xz`,
  `.raw.gz`, and `.raw`. Updex stores the image decompressed, as `.raw`. A
  file that an older Updex installed can keep a `.raw.zst` name. Its content
  is decompressed, and it works.
- The version comes from the image's key package (`KEYPACKAGE`). A Debian epoch
  `5:1.2.3` becomes `5+1.2.3` in the file name.
- `SYSEXT_REVISION=N` appends `+rN` to the version, for a content fix at the
  same package version.
- The image is a delta against the build base it was built on. A later Base that
  stops shipping a package the delta left out can break the merged extension.
- Each build checks the paths in `mkosi.images/<name>/required-paths.txt`. A
  build that is missing one fails.
- Each build also fails if the payload has files under `/opt`, a private key,
  or a file that Base owns.

## Troubleshooting

| Symptom | Check | Fix |
| --- | --- | --- |
| `updex features list` shows no features | `updex components` | If no component is listed, Updex found no definition files. Check that your image ships `/usr/lib/sysupdate.<name>.d/`. |
| `features check` shows `UPDATE=yes` but `features update` downloads nothing | The output of `features update` says `Linked staged version <version>` | The image was already on disk. Updex repointed the link. Reboot to run the new version. |
| You want the old version back | `ls /var/lib/extensions.d/` | Run `sudo updex features rollback <name>`, then reboot. See [Roll back](#roll-back). |
| `features rollback` fails with `version <version> of <name> is not on disk` | `ls /var/lib/extensions.d/` | Updex rolls back only to a staged image. Pick a version from the list with `--to`, or remove the extension. |
| `features update` shows `held by rollback: rejected <version>` | `ls /var/lib/updex/rollback/` | A rollback holds the extension until a newer version is published. To update now, run `sudo updex features rollback --clear <name>`. |
| `features update` shows `not linked: needs image >= <value>` | `bootc status` | The revision needs a newer base image. Update the image. The next run links it. |
| `another updex operation is running` | Another `updex` command or the timer | Wait, then run the command again. Only one operation that changes state runs at a time. |
| `features check` shows `UPDATE=error` | The command output and the network | Check the network and the published manifest. The command exits non-zero. Do not read the row as up to date. |
| `enable --now` exits non-zero after the download | The output shows `sysext refresh failed` | Run `sudo systemd-sysext refresh`, or reboot, then check `systemd-sysext status`. |
| A service is not active after `enable --now` | `systemctl status <name>.service` and `systemd-sysext status` | Reboot, so that `reload-sysext.service` runs the setup, then check again. |
| `disable --now` refuses with `is active` | The refusal names the extension and its version | Add `--force`, then reboot. |
| A signature check fails | The command output | Check the network and the published manifest. The publisher must provide `SHA256SUMS.gpg`. Never turn verification off. |
| Every Frostyard download fails verification | `ls /etc/systemd/import-pubring.gpg` | If the file exists, Updex uses it instead of the image's key. Add the Frostyard key to it, or remove it. |
| `updex-update.service` shows `failed` | `journalctl -u updex-update.service` | A run on an offline host fails. The unit stays `failed` until the next good run. |
| The timer never runs | `updex daemon status` | If it shows `Masked: yes`, run `sudo systemctl unmask updex-update.timer`. If `Enabled` is false, run `sudo updex daemon enable`. |

## See also

- [System extension catalog](/docs/sysexts/)
- [Updex](/docs/tools/updex/)
- [Docker system extension](/docs/sysexts/docker/)
- [Incus system extension](/docs/sysexts/incus/)
- [Tailscale system extension](/docs/sysexts/tailscale/)

## Sources

Reviewed 2026-10-24. snosi commit
[`e5d0597f5b53ddddfa7a35ff6f706b094f20f76b`](https://github.com/frostyard/snosi/tree/e5d0597f5b53ddddfa7a35ff6f706b094f20f76b);
Updex v2.1.0 commit
[`37523f85816cb61d116cc33f2dcdaf32fb8ee1e3`](https://github.com/frostyard/updex/tree/37523f85816cb61d116cc33f2dcdaf32fb8ee1e3).

- [`docs/design/sysexts.md`](https://github.com/frostyard/snosi/blob/e5d0597f5b53ddddfa7a35ff6f706b094f20f76b/docs/design/sysexts.md)
- [`docs/adr/0004-sysext-authoring-rules.md`](https://github.com/frostyard/snosi/blob/e5d0597f5b53ddddfa7a35ff6f706b094f20f76b/docs/adr/0004-sysext-authoring-rules.md)
- [`mkosi.images/base/mkosi.conf`](https://github.com/frostyard/snosi/blob/e5d0597f5b53ddddfa7a35ff6f706b094f20f76b/mkosi.images/base/mkosi.conf)
- [`mkosi.images/base/mkosi.extra/usr/lib/systemd/system/reload-sysext.service`](https://github.com/frostyard/snosi/blob/e5d0597f5b53ddddfa7a35ff6f706b094f20f76b/mkosi.images/base/mkosi.extra/usr/lib/systemd/system/reload-sysext.service)
- [`mkosi.images/base/mkosi.extra/usr/lib/sysupdate.docker.d/docker.transfer`](https://github.com/frostyard/snosi/blob/e5d0597f5b53ddddfa7a35ff6f706b094f20f76b/mkosi.images/base/mkosi.extra/usr/lib/sysupdate.docker.d/docker.transfer)
- [`mkosi.images/base/mkosi.extra/usr/lib/sysupdate.docker.d/docker.feature`](https://github.com/frostyard/snosi/blob/e5d0597f5b53ddddfa7a35ff6f706b094f20f76b/mkosi.images/base/mkosi.extra/usr/lib/sysupdate.docker.d/docker.feature)
- [`mkosi.images/docker/mkosi.extra/usr/lib/systemd/system/multi-user.target.d/10-docker.conf`](https://github.com/frostyard/snosi/blob/e5d0597f5b53ddddfa7a35ff6f706b094f20f76b/mkosi.images/docker/mkosi.extra/usr/lib/systemd/system/multi-user.target.d/10-docker.conf)
- [`mkosi.images/docker/mkosi.extra/usr/lib/systemd/system-preset/20-docker.preset`](https://github.com/frostyard/snosi/blob/e5d0597f5b53ddddfa7a35ff6f706b094f20f76b/mkosi.images/docker/mkosi.extra/usr/lib/systemd/system-preset/20-docker.preset)
- [`mkosi.images/docker/required-paths.txt`](https://github.com/frostyard/snosi/blob/e5d0597f5b53ddddfa7a35ff6f706b094f20f76b/mkosi.images/docker/required-paths.txt)
- [`shared/sysext/postoutput/sysext-postoutput.sh`](https://github.com/frostyard/snosi/blob/e5d0597f5b53ddddfa7a35ff6f706b094f20f76b/shared/sysext/postoutput/sysext-postoutput.sh)
- [`shared/sysext/finalize/sysext-required-paths.sh`](https://github.com/frostyard/snosi/blob/e5d0597f5b53ddddfa7a35ff6f706b094f20f76b/shared/sysext/finalize/sysext-required-paths.sh)
- [`README.md`](https://github.com/frostyard/updex/blob/37523f85816cb61d116cc33f2dcdaf32fb8ee1e3/README.md)
- [`docs/design/overview.md`](https://github.com/frostyard/updex/blob/37523f85816cb61d116cc33f2dcdaf32fb8ee1e3/docs/design/overview.md)
- [`docs/specs/config-reference.md`](https://github.com/frostyard/updex/blob/37523f85816cb61d116cc33f2dcdaf32fb8ee1e3/docs/specs/config-reference.md)
- [`docs/adr/0007-daemon-stages-never-activates.md`](https://github.com/frostyard/updex/blob/37523f85816cb61d116cc33f2dcdaf32fb8ee1e3/docs/adr/0007-daemon-stages-never-activates.md)
- [`docs/adr/0015-detect-merged-sysexts-from-hierarchy-metadata.md`](https://github.com/frostyard/updex/blob/37523f85816cb61d116cc33f2dcdaf32fb8ee1e3/docs/adr/0015-detect-merged-sysexts-from-hierarchy-metadata.md)
- [`docs/adr/0016-automatic-sysext-updates-apply-at-next-boot.md`](https://github.com/frostyard/updex/blob/37523f85816cb61d116cc33f2dcdaf32fb8ee1e3/docs/adr/0016-automatic-sysext-updates-apply-at-next-boot.md)
- [`cmd/updex/components.go`](https://github.com/frostyard/updex/blob/37523f85816cb61d116cc33f2dcdaf32fb8ee1e3/cmd/updex/components.go)
- [`cmd/updex/features.go`](https://github.com/frostyard/updex/blob/37523f85816cb61d116cc33f2dcdaf32fb8ee1e3/cmd/updex/features.go)
- [`cmd/updex/features_run.go`](https://github.com/frostyard/updex/blob/37523f85816cb61d116cc33f2dcdaf32fb8ee1e3/cmd/updex/features_run.go)
- [`cmd/updex/daemon.go`](https://github.com/frostyard/updex/blob/37523f85816cb61d116cc33f2dcdaf32fb8ee1e3/cmd/updex/daemon.go)
- [`updex/features.go`](https://github.com/frostyard/updex/blob/37523f85816cb61d116cc33f2dcdaf32fb8ee1e3/updex/features.go)
- [`updex/install.go`](https://github.com/frostyard/updex/blob/37523f85816cb61d116cc33f2dcdaf32fb8ee1e3/updex/install.go)
- [`updex/rollback.go`](https://github.com/frostyard/updex/blob/37523f85816cb61d116cc33f2dcdaf32fb8ee1e3/updex/rollback.go)
- [`updex/daemon.go`](https://github.com/frostyard/updex/blob/37523f85816cb61d116cc33f2dcdaf32fb8ee1e3/updex/daemon.go)
- [`updex/list.go`](https://github.com/frostyard/updex/blob/37523f85816cb61d116cc33f2dcdaf32fb8ee1e3/updex/list.go)
- [`manifest/gpg.go`](https://github.com/frostyard/updex/blob/37523f85816cb61d116cc33f2dcdaf32fb8ee1e3/manifest/gpg.go)
- [`sysext/manager.go`](https://github.com/frostyard/updex/blob/37523f85816cb61d116cc33f2dcdaf32fb8ee1e3/sysext/manager.go)
- [`systemd/unit.go`](https://github.com/frostyard/updex/blob/37523f85816cb61d116cc33f2dcdaf32fb8ee1e3/systemd/unit.go)
- [Updex v2.1.0 release](https://github.com/frostyard/updex/releases/tag/v2.1.0)
- [`mkosi.images/gui-base/mkosi.conf`](https://github.com/frostyard/snosi/blob/e5d0597f5b53ddddfa7a35ff6f706b094f20f76b/mkosi.images/gui-base/mkosi.conf)
- [`mkosi.images/vscode/mkosi.conf`](https://github.com/frostyard/snosi/blob/e5d0597f5b53ddddfa7a35ff6f706b094f20f76b/mkosi.images/vscode/mkosi.conf)
- [`shared/sysext/finalize/sysext-usr-only.sh`](https://github.com/frostyard/snosi/blob/e5d0597f5b53ddddfa7a35ff6f706b094f20f76b/shared/sysext/finalize/sysext-usr-only.sh)
- [`shared/sysext/finalize/sysext-no-private-keys.sh`](https://github.com/frostyard/snosi/blob/e5d0597f5b53ddddfa7a35ff6f706b094f20f76b/shared/sysext/finalize/sysext-no-private-keys.sh)
- [`shared/sysext/finalize/sysext-no-base-owned.sh`](https://github.com/frostyard/snosi/blob/e5d0597f5b53ddddfa7a35ff6f706b094f20f76b/shared/sysext/finalize/sysext-no-base-owned.sh)
- [`shared/sysext/base-owned-paths.txt`](https://github.com/frostyard/snosi/blob/e5d0597f5b53ddddfa7a35ff6f706b094f20f76b/shared/sysext/base-owned-paths.txt)
- [Updex PR #128: decompressed target file names](https://github.com/frostyard/updex/pull/128)
- [Murbella's review: extensions after `bootc rollback` (frostyard-org#27)](https://github.com/frostyard/frostyard-org/pull/27#pullrequestreview-5630385504)
