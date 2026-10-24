---
title: Install, update, and roll back
description: Install a Frostyard image with Firn, check and apply updates, roll back, and move from an nbc or A/B install.
---

This guide is the one procedure for every Frostyard image. Use it to install
with Firn, to check that updates arrive, to update by hand, to roll back, and
to leave an old nbc or A/B install. What each image ships stays on its own
page.

:::caution[Secure Boot is not production-ready yet]
Firn can install with Secure Boot on, but Frostyard does not yet claim
production Secure Boot support, signed updates, or signed rollback. Fresh-install
test results for Snow, Floe, and Sundog are still pending, and a normal Firn
install does not change that. An existing install cannot convert to the secure
layout in place.
:::

## Choose an image

Firn offers four images: [Snow](/docs/images/snow/),
[Snowfield](/docs/images/snowfield/), [Sundog](/docs/images/sundog/), and
[Floe](/docs/images/floe/). Each page says what the image is for and what it
ships. [Base](/docs/images/base/) is the shared foundation, not a choice. The
[documentation index](/docs/) lists everything else.

## Download and check Firn

Firn needs UEFI and erases the disk you pick. Use a target disk of at least
30 GiB, and a larger one if you can: applications, containers, Flatpaks,
homes, and updates all use disk space. Back up what you need, and read the
backup from another machine before you boot the installer.

1. Download the installer ISO:

   ```bash
   curl -fL \
     https://repository.frostyard.org/isos/native/v1/snosi-installer-latest-x86-64.iso \
     -o snosi-installer.iso
   ```

   The `native` in the address is an old folder name. It does not mean an A/B
   install. The file is saved as `snosi-installer.iso`.

2. Download the signed checksums and the signing key, and check the key's
   fingerprint:

   ```bash
   base=https://repository.frostyard.org/isos/native/v1

   curl -fL "$base/SHA256SUMS" -o SHA256SUMS
   curl -fL "$base/SHA256SUMS.gpg" -o SHA256SUMS.gpg
   curl -fL \
     https://raw.githubusercontent.com/frostyard/snosi/main/shared/native-ab/keys/import-pubring.gpg \
     -o snosi-native-update-pubring.gpg

   fingerprint="$(
     gpg --batch --show-keys --with-colons snosi-native-update-pubring.gpg |
       awk -F: '$1 == "fpr" { print $10; exit }'
   )"
   test "$fingerprint" = F37282A35CB6BDFEBFC8FE775A2EAC5C8216FD68
   ```

   The `test` command prints nothing and exits 0 when the fingerprint matches.

3. Check the signature, then check the ISO against it:

   ```bash
   gpgv --keyring ./snosi-native-update-pubring.gpg \
     SHA256SUMS.gpg SHA256SUMS
   expected="$(
     awk '$2 ~ /^snosi-installer_[0-9]{14}_x86-64\.iso$/ {
       print $1
       exit
     }' SHA256SUMS
   )"
   test -n "$expected"
   printf '%s  %s\n' "$expected" snosi-installer.iso |
     sha256sum -c -
   ```

   `gpgv` reports a good signature, and `sha256sum` prints
   `snosi-installer.iso: OK`. Stop if the fingerprint, the signature, or the
   checksum fails. Download the files again before you try once more.

## Write and boot the installer

Use a disk-imaging tool's Restore Disk Image operation, or write the ISO from
a Linux terminal. The target is the whole USB device, such as `/dev/sdb`, not
a partition such as `/dev/sdb1`.

1. Insert the USB drive and find it by size, model, and serial:

   ```bash
   lsblk -o NAME,PATH,SIZE,MODEL,SERIAL,TRAN,MOUNTPOINTS
   ```

   Your USB drive is in the list. Unmount every mounted partition on it.

2. Write the ISO:

   ```bash
   ISO=snosi-installer.iso
   DISK=/dev/sdX  # replace with the whole disposable USB device

   test -f "$ISO"
   test -b "$DISK"
   lsblk -o NAME,PATH,SIZE,MODEL,SERIAL,TRAN,MOUNTPOINTS "$DISK"
   sudo dd if="$ISO" of="$DISK" bs=4M status=progress conv=fsync
   sync
   ```

   The last `lsblk` shows the USB drive you expect, and `dd` ends with a
   byte count. `dd` overwrites the device for good, so stop if that `lsblk`
   shows any other drive.

3. Reboot and open the firmware's one-time boot menu. Pick the UEFI entry for
   the USB drive, not the disk you will install onto.

   Firn starts on its own as a terminal wizard.

## Install with Firn

Firn runs on the local display and on the serial console.

1. Pick the image you chose.
2. If the image or the optional applications must be downloaded, connect the
   network first. The installer has NetworkManager, so `nmcli` works from the
   console.
3. Pick the target disk. Firn lists each disk by path, model, serial, size,
   and transport. It refuses the installer drive, mounted or ambiguous disks,
   and disks too small for the image.
4. Pick the filesystem. Then choose encryption, TPM use, and MOK
   enrollment, as far as Firn offers them for your hardware. A TPM can open
   the disk on its own. Without a TPM, pick a passphrase or recovery-key mode.
5. Set the hostname, locale, timezone, and keyboard. Add SSH keys if you want
   them, create the first user, and choose system Flatpaks if you want them.
6. Read the recipe Firn shows. Type the exact path of the target disk to
   confirm the erase. A wrong path stops the install before anything is
   written.
7. Wait for the install to finish. Firn checks the image against the Frostyard
   Cosign key before it writes the disk. If Firn shows a recovery key, copy it
   to a password manager, to separate removable media, or to paper before you
   close the screen. If you lose both TPM access and the recovery key, you can
   lose the data on an encrypted disk.
8. Reboot and remove the USB drive.

   The new system starts. If you chose MOK enrollment, the blue MokManager
   screen comes first.

### Enroll the MOK

If Secure Boot is on and you chose MOK enrollment, MokManager appears on the
first boot:

1. Press a key before the countdown ends.
2. Choose **Enroll MOK**.
3. Choose **Continue**, then **Yes**.
4. Enter the one-time MOK password you set in Firn.

The machine reboots and starts Frostyard. Without the enrollment, the boot
stage that the MOK signs is not trusted while Secure Boot is on.

## After installation

Log in as the user you created. Check the system:

```bash
systemctl is-system-running
sudo bootc status
sudo snosi-update-status --check
systemctl list-timers bootc-update-stage.timer
```

- `systemctl is-system-running` prints `running`. It prints `degraded` when a
  unit failed: run `systemctl --failed`.
- `bootc status` names the image the machine follows. If it names none, see
  [Troubleshooting](#troubleshooting).
- `snosi-update-status --check` prints a `Registry:` line. It ends with
  `this machine is current` when no newer image is published.
- The timer is listed with its next run.

## How updates arrive

Every image runs `bootc-update-stage.timer`. It fires every hour, with a random
delay of up to 15 minutes. A run that the machine missed while it was off
starts at the next boot. Each run does this:

1. Prunes the Podman transfer cache, then pulls the image the machine follows.
2. Stops if the pulled image is already running or already staged.
3. Stops if the pulled image is the one you rolled back from. See
   [Roll back](#roll-back).
4. Stages the new version with bootc, and checks that bootc staged the image
   it pulled.

The staged version starts at your next normal reboot. The stager does not
force a reboot. Keep about twice the image size free in `/var`, because the
pull lands there first.

Check the state:

```bash
sudo snosi-update-status
sudo snosi-update-status --pkg-diff
journalctl -u bootc-update-stage.service
```

`snosi-update-status` needs root. Its output starts like this:

```text
Running:    snosi <version>
Following:  <image>
Last check: up to date (<time>)
```

The `Running:` line has your version, and `Following:` has the image you
installed. The `Last check:` line is one of:

| You see | It means |
| --- | --- |
| `up to date` | The running image is the published one. |
| `update to <version> staged` | A new version is staged. A `Staged:` line follows and ends with `reboot to apply`. |
| `published image equals the rollback deployment` | You rolled back, and no newer image is published yet. |
| `FAILED` | The last run failed. Read the journal command above. |
| `none recorded this boot` | The timer has not run since the boot. |

`--pkg-diff` lists the Debian package changes between the running and the
staged image. `--check` also queries the registry and compares versions.

You get the same news in two other places:

- On a login to a headless machine, the message of the day says
  `A system update is staged` and names the digest, or says the last check
  failed.
- On a desktop, a notification titled `System update ready` appears once for
  each staged update.

The check result lives in `/run/snosi`, so a reboot clears it until the next
run.

## Update now by hand

Run the stager yourself instead of waiting for the timer:

```bash
sudo systemctl start bootc-update-stage.service
sudo snosi-update-status
```

The first command returns when the pull and the staging are done. The second
shows `update to <version> staged` and a `Staged:` line. If it shows
`up to date`, there is nothing new.

Do not run `bootc upgrade` by hand. It does not pull a new image: it only
stages what is already in local storage, and it skips the update status record.

Then apply the update:

```bash
sudo systemctl reboot
```

After the reboot, `sudo bootc status` shows the new version as the booted
deployment.

## Roll back

Roll back to the previous version:

```bash
sudo bootc rollback
sudo systemctl reboot
```

After the reboot, `sudo bootc status` shows the previous version as the booted
deployment. Your data in `/var` (homes, Podman, the journal) is shared by all
versions, so a rollback keeps what you wrote after the update.

The updater does not stage the version you rolled back from again. The next
hourly run records `published image equals the rollback deployment` in
`snosi-update-status`. A headless login says an update is available but not
applied. The updater stages the next published image as usual.

`bootc rollback` does not change your system extensions. They stay in `/var`
and merge again on the older image. The next `updex features update` links the
newest version again, unless that version needs a newer image. An extension
built for a newer image can fail on an older one. If it does, roll it back,
stop its updates, or remove it, as in
[Roll back an extension](/docs/sysexts/manage/#roll-back).

## Move from an nbc or A/B install

Old nbc and native A/B installs got no new images or updates after
2026-09-30. An nbc host cannot convert to bootc in place: it has no bootc
deployment to adopt. You back up, install fresh with Firn, and restore.

The bootc install and single-hop updates are tested in QEMU/KVM. Update chains
of three or more hops, power loss during an update, and a two-week soak on
real hardware are not tested yet. Move one machine first, and keep its backup
for longer.

### Find out what you have

Run these on the host:

```bash
bootc status --format json | jq .spec.image
grep -o 'composefs=[^ ]*' /proc/cmdline
```

- A bootc install prints the image reference, and the second command prints
  a `composefs=` value.
- An nbc install prints `null`, and the second command prints nothing.

An old image can also show an end-of-life notice at login. If you have a
bootc install, you have nothing to move: stop here.

### Back up first

The reinstall erases the target disk. Save these to storage that is not the
target disk:

| What | Where | Note |
| --- | --- | --- |
| Your `/etc` changes | Archive `/etc`, or diff it against `/usr/etc` | On the new system, restore only the changes: hostname, NetworkManager profiles, your own config files. Do not copy the old `/etc` over the new one. |
| Machine identity (optional) | `/etc/ssh/ssh_host_*`, `/etc/machine-id` | Keep them only if you need the same SSH host keys or machine ID. Otherwise the first boot makes new ones. |
| Homes and app data | `/var/home`, and the data directories your services use | `/home` is a bind to `/var/home`. |
| Podman | Named volumes (`podman volume export`), the image list, Quadlet and systemd units | Images can be pulled again. Volumes cannot. |
| Tailscale | `/var/lib/tailscale` | With it, the node keeps its identity. Without it, run `tailscale up` and authorize the node again. |
| Himmelblau and Entra | `/var/lib/himmelblau`, and `/etc/himmelblau` if you changed it | Without them, join Entra again and enroll cached credentials again. |
| Enabled system extensions | `ls /etc/sysupdate.*` | Extensions start switched off. Write down which ones you enabled. |
| Other changes | Crontabs, timers you added, anything you installed by hand | A hand-installed package does not survive. Put it in a system extension or reinstall it. |

Read the backup from another machine before you go on.

Nothing on the host changes until the installer writes the disk, so you can
power off before that and lose nothing. After the write starts, there is no
way back to the old system on that disk. If you cannot accept that, image the
disk first, or install onto a replacement disk and keep the old disk.

### Reinstall and restore

1. Follow [Download and check Firn](#download-and-check-firn) through
   [Install with Firn](#install-with-firn). Pick a current image. Older
   variants such as `snowloaded` are not offered.
2. Restore the data in `/var`: homes into `/var/home`, Podman volumes, and
   app data. Keep the owners and UIDs the same as the users you created at
   install.
3. Restore your `/etc` changes only. Use `hostnamectl set-hostname`, `nmcli`,
   or a drop-in file in preference to a copied directory.
4. Restore `/var/lib/tailscale`, or run `tailscale up`. Restore or rejoin
   Himmelblau.
5. Enable your system extensions again with [Updex](/docs/tools/updex/). Then
   check them with `systemd-sysext status`.
6. Recreate your Podman workloads from the volumes and unit files, and pull the
   images.

Check that the host is migrated:

```bash
sudo bootc status
systemctl is-system-running
systemctl --failed
systemctl list-timers bootc-update-stage.timer
journalctl -u bootc-update-stage.service
```

`bootc status` shows an image reference, not `null`. `is-system-running`
prints `running`, and `--failed` lists 0 units. The timer shows a next run.
After its first run, the journal says the update was pulled or that there is
nothing to stage.

Last, check your workloads: login and home contents, Tailscale, Entra sign-in,
Podman services, and the merged extensions.

## Troubleshooting

| Symptom | Check | Fix |
| --- | --- | --- |
| `bootc status --format json \| jq .spec.image` prints `null` | The host is not managed by bootc. It is an old nbc or native A/B install. | See [Move from an nbc or A/B install](#move-from-an-nbc-or-ab-install). |
| The fingerprint, the signature, or the checksum fails | The download is damaged or is not the published one | Stop. Do not write the ISO. Download the files again. |
| `snosi-update-status` shows `Last check: FAILED` | `journalctl -u bootc-update-stage.service` | Check the network and the free space in `/var`, then [update by hand](#update-now-by-hand). |
| Staging fails for lack of space | Free space in `/var` against the image size | Free space or grow the disk. Keep about twice the image size free. |
| No update is staged | `systemctl list-timers bootc-update-stage.timer` | Wait for the next hourly run, or [update by hand](#update-now-by-hand). |
| `snosi-update-status` shows `published image equals the rollback deployment` | You rolled back, and no newer image is published | Nothing to fix. The updater waits for the next published image. |
| The machine does not trust the boot stage with Secure Boot on | The MOK enrollment | The MOK-signed stage is not trusted without the enrollment. See [Enroll the MOK](#enroll-the-mok). |

## See also

- [Install a Frostyard image](/install)
- [Snow](/docs/images/snow/)
- [Snowfield](/docs/images/snowfield/)
- [Sundog](/docs/images/sundog/)
- [Floe](/docs/images/floe/)
- [Base](/docs/images/base/)
- [Updex](/docs/tools/updex/)
- [nbc to bootc migration runbook](https://github.com/frostyard/snosi/blob/79ccc63ea44ce9309a837b9428e9b5d44290fada/docs/nbc-to-bootc-migration.md)
- [Bootc Secure Operations runbook](https://github.com/frostyard/snosi/blob/79ccc63ea44ce9309a837b9428e9b5d44290fada/docs/bootc-secure-operations.md)

## Sources

Reviewed 2026-10-23 against snosi commit
[`79ccc63ea44ce9309a837b9428e9b5d44290fada`](https://github.com/frostyard/snosi/tree/79ccc63ea44ce9309a837b9428e9b5d44290fada)
(tag `2026-10-22.4`).

- [`README.md`](https://github.com/frostyard/snosi/blob/79ccc63ea44ce9309a837b9428e9b5d44290fada/README.md)
- [`docs/installing.md`](https://github.com/frostyard/snosi/blob/79ccc63ea44ce9309a837b9428e9b5d44290fada/docs/installing.md)
- [`docs/nbc-to-bootc-migration.md`](https://github.com/frostyard/snosi/blob/79ccc63ea44ce9309a837b9428e9b5d44290fada/docs/nbc-to-bootc-migration.md)
- [`docs/2026-07-03-bootc-migration-record.md`](https://github.com/frostyard/snosi/blob/79ccc63ea44ce9309a837b9428e9b5d44290fada/docs/2026-07-03-bootc-migration-record.md)
- [`docs/bootc-secure-operations.md`](https://github.com/frostyard/snosi/blob/79ccc63ea44ce9309a837b9428e9b5d44290fada/docs/bootc-secure-operations.md)
- [`docs/adr/0015-retire-native-ab-images-and-nbc-installs.md`](https://github.com/frostyard/snosi/blob/79ccc63ea44ce9309a837b9428e9b5d44290fada/docs/adr/0015-retire-native-ab-images-and-nbc-installs.md)
- [`docs/adr/0018-remove-native-ab-and-nbc-lanes.md`](https://github.com/frostyard/snosi/blob/79ccc63ea44ce9309a837b9428e9b5d44290fada/docs/adr/0018-remove-native-ab-and-nbc-lanes.md)
- [`shared/native-ab/keys/import-pubring.gpg`](https://github.com/frostyard/snosi/blob/79ccc63ea44ce9309a837b9428e9b5d44290fada/shared/native-ab/keys/import-pubring.gpg)
- [`mkosi.images/base/mkosi.extra/usr/libexec/bootc-update-stage`](https://github.com/frostyard/snosi/blob/79ccc63ea44ce9309a837b9428e9b5d44290fada/mkosi.images/base/mkosi.extra/usr/libexec/bootc-update-stage)
- [`mkosi.images/base/mkosi.extra/usr/lib/systemd/system/bootc-update-stage.service`](https://github.com/frostyard/snosi/blob/79ccc63ea44ce9309a837b9428e9b5d44290fada/mkosi.images/base/mkosi.extra/usr/lib/systemd/system/bootc-update-stage.service)
- [`mkosi.images/base/mkosi.extra/usr/lib/systemd/system/bootc-update-stage.timer`](https://github.com/frostyard/snosi/blob/79ccc63ea44ce9309a837b9428e9b5d44290fada/mkosi.images/base/mkosi.extra/usr/lib/systemd/system/bootc-update-stage.timer)
- [`mkosi.images/base/mkosi.extra/usr/lib/systemd/system-preset/04-bootc-update.preset`](https://github.com/frostyard/snosi/blob/79ccc63ea44ce9309a837b9428e9b5d44290fada/mkosi.images/base/mkosi.extra/usr/lib/systemd/system-preset/04-bootc-update.preset)
- [`mkosi.images/base/mkosi.extra/usr/bin/snosi-update-status`](https://github.com/frostyard/snosi/blob/79ccc63ea44ce9309a837b9428e9b5d44290fada/mkosi.images/base/mkosi.extra/usr/bin/snosi-update-status)
- [`mkosi.images/base/mkosi.extra/usr/libexec/bootc-update-notify`](https://github.com/frostyard/snosi/blob/79ccc63ea44ce9309a837b9428e9b5d44290fada/mkosi.images/base/mkosi.extra/usr/libexec/bootc-update-notify)
- [`mkosi.images/base/mkosi.extra/etc/update-motd.d/86-bootc-update-staged`](https://github.com/frostyard/snosi/blob/79ccc63ea44ce9309a837b9428e9b5d44290fada/mkosi.images/base/mkosi.extra/etc/update-motd.d/86-bootc-update-staged)
- [snosi `docs/design/sysexts.md` at `9db7cde8`](https://github.com/frostyard/snosi/blob/9db7cde83454b92972887d3b1cf27a144a283201/docs/design/sysexts.md)
- [Updex ADR-0016](https://github.com/frostyard/updex/blob/37523f85816cb61d116cc33f2dcdaf32fb8ee1e3/docs/adr/0016-automatic-sysext-updates-apply-at-next-boot.md)
- [Murbella's review: extensions after `bootc rollback` (frostyard-org#27)](https://github.com/frostyard/frostyard-org/pull/27#pullrequestreview-5630385504)
