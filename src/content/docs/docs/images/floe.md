---
title: Floe
description: Install, update, and roll back Floe, the Frostyard headless server image.
---

Floe is Frostyard's headless server image. It is a Debian Trixie
bootc/composefs image for x86-64 machines with UEFI, built from the same Base
as the other Frostyard images, and it ships Podman. Use it for containers and
services on a machine that has no desktop.

The system lives in a read-only `/usr` that updates as one piece, and you can
roll back to the previous version. Your homes, container storage, and service
data live under `/var`. Floe has no core Flatpak set.

:::caution[Secure Boot is not production-ready yet]
Firn can install with Secure Boot on, but Frostyard does not yet claim
production Secure Boot support, signed updates, or signed rollback.
Fresh-install test results for Floe, Snow, and Sundog are still pending. A
normal Firn install does not change that, and neither does a working
`bootc rollback`. Production support also needs signed secure N/N+1/N+2
release artifacts and Firn-native update and recovery support. An existing
install cannot convert to the secure layout in place.
:::

## Install

Firn is the installer. It needs UEFI and erases the disk you pick. It works
with or without Secure Boot, TPM 2.0, and disk encryption, and asks you about
each one. Use a disk of at least 30 GiB, and more for container images,
volumes, and several updates.

1. Download the installer and its checksums:
   - [Installer ISO](https://repository.frostyard.org/isos/native/v1/snosi-installer-latest-x86-64.iso)
   - [SHA256SUMS](https://repository.frostyard.org/isos/native/v1/SHA256SUMS)
   - [SHA256SUMS.gpg](https://repository.frostyard.org/isos/native/v1/SHA256SUMS.gpg)
2. Check the signing key's fingerprint and the ISO, then write the ISO to a
   USB stick. The
   [installation guide](https://github.com/frostyard/snosi/blob/96d663b3c7025fbbeeda5987cc521b524fd1721c/docs/installing.md)
   has the exact `gpgv` and `sha256sum` commands and the commands to write the
   stick. Read its warning on picking the right device.
3. Boot the stick. In Firn, pick the bootc Floe product, review the recipe
   Firn builds, and confirm the exact target disk.
4. If Firn shows a recovery key, store it somewhere other than this disk
   before you continue.
5. If Secure Boot is on, enroll the MOK when asked. Without it, the
   MOK-signed boot stage is not trusted while Secure Boot is enforced.

The `native` in the ISO address is an old folder name. It does not mean an
A/B install.

## First boot

Floe starts without a desktop. Log in on the console as the user you created
in Firn, or over SSH. SSH is on by default: add your key in Firn.

Check that the system is healthy:

```bash
systemctl is-system-running
sudo bootc status
sudo snosi-update-status --check
systemctl list-timers bootc-update-stage.timer
```

`systemctl is-system-running` prints `running` when every unit has
started, and `degraded` when a unit failed.
`bootc status` shows the booted and staged deployments, and names the image it
follows. If it shows `null`, see [Troubleshooting](#troubleshooting).
`snosi-update-status --check` tells you whether a newer image is published.
The timer is listed with its next run.

Install workloads as containers or as [system extensions](/docs/sysexts/docker/).
Do not install APT packages into `/usr`: an image update does not keep them.
The image turns off the APT daily update and upgrade timers and services.

## Updates and rollback

Updates are automatic. Every hour, `bootc-update-stage.timer` checks the
followed image, pulls it with Podman, and stages a new version. The timer
adds a random delay of up to 15 minutes. The new version starts at your next
normal reboot. The stager does not force a reboot.

The stager runs the bootc commands itself. You do not need to run them. On
the first staged update, while the host does not yet follow the image from
`containers-storage`, it runs `bootc switch --transport containers-storage`.
From then on, in steady state, it runs `bootc upgrade`, because a second
`bootc switch` to the same image would do nothing. Both paths verify the
staged digest before they report success.

To go back to the previous version:

```bash
sudo bootc rollback
sudo systemctl reboot
```

Homes, container storage, and service data in `/var` are shared by all
versions, so a rollback keeps them. After a rollback, the updater does not
stage the version you rolled back from again. It waits for the next published
image.

Keep about twice the image size free in `/var`. The updater pulls each new
image into `/var` before it stages it.

## What ships

Floe is Base plus the bootc runtime, the bootc security setup, the server
packages, a kernel, and the image output format.

| Layer | What you get |
| --- | --- |
| Base | Debian Trixie userspace, systemd, the hourly update stager, Updex, and the system-extension definitions |
| Bootc runtime | `bootc`, `libostree-1-1`, and the packages OCI bootc needs |
| Server tools | `systemd-container` for `systemd-nspawn` and `systemd-vmspawn`, `tuned`, `tuned-ppd`, `dbus-broker`, and `locales-all` |
| Containers | `podman`, `distrobox`, `buildah`, `crun`, `fuse-overlayfs`, `slirp4netns`, `passt`, and `criu` |
| Networking | `NetworkManager`, OpenSSH, mDNS with `avahi-daemon`, IPv4 forwarding, the BBR congestion control, and larger inotify limits |
| Kernel | `linux-image-amd64/forky` for now, with most firmware and Mesa from `trixie-backports` |
| Homebrew | `brew-setup.service`, `brew-update.timer`, `brew-upgrade.timer`, `bbrew-helper`, and the CLI bundle at `/usr/share/floe/bundles/cli.Brewfile` |
| Logs | A journal that keeps its logs on disk across reboots |
| Core Flatpak set | None |

Floe uses the `linux-image-amd64/forky` kernel until the Trixie backports
kernel is complete. The build file for it is still called `backports`; the
name is out of date. Most firmware and Mesa come from `trixie-backports`,
pinned in the same file.

SSH, mDNS (Avahi), and `tuned` run by default. The image ships no enablement
links in `/etc`; the presets enable these services at first boot.

`brew-setup.service` unpacks the Homebrew archive to `/var/home/linuxbrew` at
first boot. The two brew timers update and upgrade an installed Homebrew.
`bbrew-helper` installs `bbrew` when it is absent, then runs it. The CLI
bundle lists the recommended command-line tools.

The initramfs includes the LVM, crypt, and bootc composefs modules, plus
FIDO2, TPM2, PKCS#11, and PCR phase modules for encrypted disks.

## Choose Floe

Choose Floe for a headless server that runs containers and services. It has
no desktop, no graphical session, and no core Flatpak set. Do not use it as a
workstation. The other products are:

- Snow: the general-purpose GNOME desktop.
- Snowfield: GNOME for Microsoft Surface devices. It is untested on
  representative Surface hardware; its hardware gate was waived for catalog
  inclusion.
- Sundog: KDE Plasma, bootc only.

Base is the shared foundation, not a fifth installer choice. Floe has the
Trixie userspace with a newer kernel.

## Run containers and extensions

Podman, Distrobox, and Buildah are in the image. `systemd-container` adds
`systemd-nspawn` and `systemd-vmspawn`, and Base ships the QEMU runtime that
`systemd-vmspawn` uses.

Every image ships each system extension switched off. Floe creates
`/var/lib/extensions` for merged extensions. The
[extension catalog](/docs/sysexts/) lists every extension and the Updex steps.
Three extensions have a guide:

- [Docker system extension](/docs/sysexts/docker/)
- [Incus system extension](/docs/sysexts/incus/)
- [Tailscale system extension](/docs/sysexts/tailscale/)

## Troubleshooting

| Symptom | Check | Fix |
| --- | --- | --- |
| `bootc status` shows `spec.image: null` | The host is not managed by bootc. It is most likely an old nbc or native A/B install. | See [Moving from an nbc or A/B install](#moving-from-an-nbc-or-ab-install). |
| `sudo snosi-update-status` says `published image equals the rollback deployment` | You rolled back, and no newer image is published yet | Nothing to fix. The updater holds until a newer image is published. |
| No update is staged | `systemctl list-timers bootc-update-stage.timer` and `journalctl -u bootc-update-stage.service` | Wait for the hourly run. Check the network and the free space in `/var`. |
| Staging fails for lack of space | Compare the free space in `/var` with the image size | Free space or grow the disk. The updater needs room for the download, the new version, and the previous one. |
| A unit fails at boot | `systemctl --failed` | Read the unit's log with `journalctl -u <unit>`, then correct the service or its configuration. |
| Secure Boot or TPM does not behave as you expect | `bootc status` and the firmware settings | Check the firmware settings, then read the [Bootc Secure Operations runbook](https://github.com/frostyard/snosi/blob/96d663b3c7025fbbeeda5987cc521b524fd1721c/docs/bootc-secure-operations.md). Secure Boot is not production-ready yet. |

## Moving from an nbc or A/B install

Old nbc and native A/B installs get no new images or updates after
2026-09-30. There is no in-place conversion. Back up, install fresh with
Firn, and restore your data.

The
[migration runbook](https://github.com/frostyard/snosi/blob/96d663b3c7025fbbeeda5987cc521b524fd1721c/docs/nbc-to-bootc-migration.md)
lists what to save: your `/etc` changes, homes, Podman volumes,
`/var/lib/tailscale` if you use Tailscale, and `/var/lib/himmelblau` and
`/etc/himmelblau` if you use Himmelblau. Record which system extensions you
enabled, so you can enable them again. Check the backup from another machine
before you erase the disk.

## See also

- [Install a Frostyard image](/install)
- [Install, update, and roll back](/docs/images/install-update/)
- [Snow image](/docs/images/snow/)
- [Docker system extension](/docs/sysexts/docker/)
- [Incus system extension](/docs/sysexts/incus/)
- [Tailscale system extension](/docs/sysexts/tailscale/)
- [nbc to bootc migration runbook](https://github.com/frostyard/snosi/blob/96d663b3c7025fbbeeda5987cc521b524fd1721c/docs/nbc-to-bootc-migration.md)
- [Bootc Secure Operations runbook](https://github.com/frostyard/snosi/blob/96d663b3c7025fbbeeda5987cc521b524fd1721c/docs/bootc-secure-operations.md)

## Sources

Reviewed 2026-10-22 against snosi commit
[`96d663b3c7025fbbeeda5987cc521b524fd1721c`](https://github.com/frostyard/snosi/tree/96d663b3c7025fbbeeda5987cc521b524fd1721c).

- [`README.md`](https://github.com/frostyard/snosi/blob/96d663b3c7025fbbeeda5987cc521b524fd1721c/README.md)
- [`mkosi.profiles/floe/mkosi.conf`](https://github.com/frostyard/snosi/blob/96d663b3c7025fbbeeda5987cc521b524fd1721c/mkosi.profiles/floe/mkosi.conf)
- [`shared/composition/floe/mkosi.conf`](https://github.com/frostyard/snosi/blob/96d663b3c7025fbbeeda5987cc521b524fd1721c/shared/composition/floe/mkosi.conf)
- [`shared/packages/floe/mkosi.conf`](https://github.com/frostyard/snosi/blob/96d663b3c7025fbbeeda5987cc521b524fd1721c/shared/packages/floe/mkosi.conf)
- [`shared/packages/bootc/mkosi.conf`](https://github.com/frostyard/snosi/blob/96d663b3c7025fbbeeda5987cc521b524fd1721c/shared/packages/bootc/mkosi.conf)
- [`shared/bootc-secure/mkosi.conf`](https://github.com/frostyard/snosi/blob/96d663b3c7025fbbeeda5987cc521b524fd1721c/shared/bootc-secure/mkosi.conf)
- [`shared/kernel/backports/mkosi.conf`](https://github.com/frostyard/snosi/blob/96d663b3c7025fbbeeda5987cc521b524fd1721c/shared/kernel/backports/mkosi.conf)
- [`mkosi.images/base/mkosi.conf`](https://github.com/frostyard/snosi/blob/96d663b3c7025fbbeeda5987cc521b524fd1721c/mkosi.images/base/mkosi.conf)
- [`shared/floe/tree/usr/lib/systemd/system-preset/00-apt.preset`](https://github.com/frostyard/snosi/blob/96d663b3c7025fbbeeda5987cc521b524fd1721c/shared/floe/tree/usr/lib/systemd/system-preset/00-apt.preset)
- [`shared/floe/tree/usr/lib/systemd/system-preset/01-homebrew.preset`](https://github.com/frostyard/snosi/blob/96d663b3c7025fbbeeda5987cc521b524fd1721c/shared/floe/tree/usr/lib/systemd/system-preset/01-homebrew.preset)
- [`shared/scripts/build/brew.chroot`](https://github.com/frostyard/snosi/blob/96d663b3c7025fbbeeda5987cc521b524fd1721c/shared/scripts/build/brew.chroot)
- [`shared/floe/tree/usr/lib/systemd/system/brew-setup.service`](https://github.com/frostyard/snosi/blob/96d663b3c7025fbbeeda5987cc521b524fd1721c/shared/floe/tree/usr/lib/systemd/system/brew-setup.service)
- [`shared/floe/tree/usr/lib/systemd/system/brew-update.timer`](https://github.com/frostyard/snosi/blob/96d663b3c7025fbbeeda5987cc521b524fd1721c/shared/floe/tree/usr/lib/systemd/system/brew-update.timer)
- [`shared/floe/tree/usr/lib/systemd/system/brew-upgrade.timer`](https://github.com/frostyard/snosi/blob/96d663b3c7025fbbeeda5987cc521b524fd1721c/shared/floe/tree/usr/lib/systemd/system/brew-upgrade.timer)
- [`shared/floe/tree/usr/bin/bbrew-helper`](https://github.com/frostyard/snosi/blob/96d663b3c7025fbbeeda5987cc521b524fd1721c/shared/floe/tree/usr/bin/bbrew-helper)
- [`shared/floe/tree/usr/share/floe/bundles/cli.Brewfile`](https://github.com/frostyard/snosi/blob/96d663b3c7025fbbeeda5987cc521b524fd1721c/shared/floe/tree/usr/share/floe/bundles/cli.Brewfile)
- [`shared/floe/tree/usr/lib/sysctl.d/70-networking.conf`](https://github.com/frostyard/snosi/blob/96d663b3c7025fbbeeda5987cc521b524fd1721c/shared/floe/tree/usr/lib/sysctl.d/70-networking.conf)
- [`shared/floe/tree/usr/lib/sysctl.d/80-inotify`](https://github.com/frostyard/snosi/blob/96d663b3c7025fbbeeda5987cc521b524fd1721c/shared/floe/tree/usr/lib/sysctl.d/80-inotify)
- [`shared/floe/tree/usr/lib/systemd/system/journald.conf.d/10-floe-bootc-persistent.conf`](https://github.com/frostyard/snosi/blob/96d663b3c7025fbbeeda5987cc521b524fd1721c/shared/floe/tree/usr/lib/systemd/system/journald.conf.d/10-floe-bootc-persistent.conf)
- [`shared/floe/tree/usr/lib/dracut/dracut.conf.d/20-tpm-luks.conf`](https://github.com/frostyard/snosi/blob/96d663b3c7025fbbeeda5987cc521b524fd1721c/shared/floe/tree/usr/lib/dracut/dracut.conf.d/20-tpm-luks.conf)
- [`shared/floe/tree/usr/lib/dracut/dracut.conf.d/30-bootc-standard.conf`](https://github.com/frostyard/snosi/blob/96d663b3c7025fbbeeda5987cc521b524fd1721c/shared/floe/tree/usr/lib/dracut/dracut.conf.d/30-bootc-standard.conf)
- [`shared/floe/tree/var/lib/extensions/.keep`](https://github.com/frostyard/snosi/blob/96d663b3c7025fbbeeda5987cc521b524fd1721c/shared/floe/tree/var/lib/extensions/.keep)
- [`shared/scripts/common-postinst.sh`](https://github.com/frostyard/snosi/blob/96d663b3c7025fbbeeda5987cc521b524fd1721c/shared/scripts/common-postinst.sh)
- [`flatpaks/core-flatpaks.py`](https://github.com/frostyard/snosi/blob/96d663b3c7025fbbeeda5987cc521b524fd1721c/flatpaks/core-flatpaks.py)
- [`shared/composition/core-flatpaks.finalize`](https://github.com/frostyard/snosi/blob/96d663b3c7025fbbeeda5987cc521b524fd1721c/shared/composition/core-flatpaks.finalize)
- [`mkosi.images/base/mkosi.extra/usr/libexec/bootc-update-stage`](https://github.com/frostyard/snosi/blob/96d663b3c7025fbbeeda5987cc521b524fd1721c/mkosi.images/base/mkosi.extra/usr/libexec/bootc-update-stage)
- [`docs/adr/0002-ship-no-enablement-symlinks-in-etc.md`](https://github.com/frostyard/snosi/blob/96d663b3c7025fbbeeda5987cc521b524fd1721c/docs/adr/0002-ship-no-enablement-symlinks-in-etc.md)
- [`mkosi.images/base/mkosi.extra/usr/libexec/preset-reconcile`](https://github.com/frostyard/snosi/blob/96d663b3c7025fbbeeda5987cc521b524fd1721c/mkosi.images/base/mkosi.extra/usr/libexec/preset-reconcile)
- [`mkosi.images/base/mkosi.extra/usr/bin/snosi-update-status`](https://github.com/frostyard/snosi/blob/96d663b3c7025fbbeeda5987cc521b524fd1721c/mkosi.images/base/mkosi.extra/usr/bin/snosi-update-status)
- [`mkosi.images/base/mkosi.extra/usr/lib/systemd/system/bootc-update-stage.timer`](https://github.com/frostyard/snosi/blob/96d663b3c7025fbbeeda5987cc521b524fd1721c/mkosi.images/base/mkosi.extra/usr/lib/systemd/system/bootc-update-stage.timer)
- [`docs/design/sysexts.md`](https://github.com/frostyard/snosi/blob/96d663b3c7025fbbeeda5987cc521b524fd1721c/docs/design/sysexts.md)
- [`docs/installing.md`](https://github.com/frostyard/snosi/blob/96d663b3c7025fbbeeda5987cc521b524fd1721c/docs/installing.md)
- [`docs/bootc-secure-operations.md`](https://github.com/frostyard/snosi/blob/96d663b3c7025fbbeeda5987cc521b524fd1721c/docs/bootc-secure-operations.md)
- [`docs/nbc-to-bootc-migration.md`](https://github.com/frostyard/snosi/blob/96d663b3c7025fbbeeda5987cc521b524fd1721c/docs/nbc-to-bootc-migration.md)
- [`docs/design/overview.md`](https://github.com/frostyard/snosi/blob/96d663b3c7025fbbeeda5987cc521b524fd1721c/docs/design/overview.md)
- [`docs/design/testing.md`](https://github.com/frostyard/snosi/blob/96d663b3c7025fbbeeda5987cc521b524fd1721c/docs/design/testing.md)
