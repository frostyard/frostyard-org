---
title: Snowfield
description: Install, update, and roll back Snowfield, the Frostyard GNOME desktop image for Microsoft Surface devices.
---

Snowfield is Frostyard's GNOME desktop for Microsoft Surface devices. It is a
Debian Trixie bootc/composefs image for x86-64 machines with UEFI, built from
the same Base as the other Frostyard images. It has the Snow desktop and the
linux-surface kernel.

Snowfield is untested on representative Surface hardware. Its hardware gate
was waived for catalog inclusion, not passed.

The system lives in a read-only `/usr` that updates as one piece, and you can
roll back to the previous version. Image and system-extension applications
live under `/usr`. Your homes, Flatpak data, containers, and update state live
under `/var`.

:::caution[Secure Boot is not production-ready yet]
Firn can install with Secure Boot on, but Frostyard does not yet claim
production Secure Boot support, signed updates, or signed rollback.
Snow, Floe, and Sundog have passed fresh installs in a lab VM, but that is
not hardware qualification. A normal Firn install does not make Secure Boot
production-ready, and neither does a working `bootc rollback`. The secure layout also needs signed secure N/N+1/N+2 release
images and hardware test results that are not published yet. An existing
install cannot convert to the secure layout in place.
:::

## Install

Firn is the installer. It needs UEFI and erases the disk you pick. It works
with or without Secure Boot, TPM 2.0, and disk encryption, and asks you about
each one. Use a disk of at least 30 GiB, and more if you plan to keep
Flatpaks, containers, and several updates. The installer runs from RAM and
needs at least 4.5 GiB of memory.

1. Download the installer and its checksums:
   - [Installer ISO](https://repository.frostyard.org/isos/native/v1/snosi-installer-latest-x86-64.iso)
   - [SHA256SUMS](https://repository.frostyard.org/isos/native/v1/SHA256SUMS)
   - [SHA256SUMS.gpg](https://repository.frostyard.org/isos/native/v1/SHA256SUMS.gpg)
2. Check the signing key's fingerprint and the ISO, then write the ISO to a
   USB stick. The
   [installation guide](https://github.com/frostyard/snosi/blob/b2858ca0222814c395cf8248db98f3e096d57dc9/docs/installing.md)
   has the exact `gpgv` and `sha256sum` commands and the commands to write the
   stick. Read its warning on picking the right device.
3. Boot the stick. In Firn, pick the bootc Snowfield product, review the
   recipe Firn builds, and confirm the exact target disk.
4. If Firn shows a recovery key, store it somewhere other than this disk
   before you continue.
5. If Secure Boot is on, enroll the MOK when asked. Without it, the
   MOK-signed boot stage is not trusted while Secure Boot is enforced.
   Snowfield needs no other key: the linux-surface kernel boots inside the
   Frostyard-signed image.

The `native` in the ISO address is an old folder name. It does not mean an
A/B install.

## First boot

Log in at the GDM screen with the user you created in Firn. Snowfield has the
same desktop as Snow, so the [Snow page](/docs/images/snow/#first-boot) covers
the session. Firn can install the chosen core Flatpak set as part of the
recipe; Snowfield uses Snow's list. The image carries the list at
`/usr/share/frostyard/snowfield.core-flatpaks.json`. If yours included it, the
apps are already there.

Check that the system is healthy:

```bash
systemctl is-system-running
sudo bootc status
sudo snosi-update-status --check
systemctl list-timers bootc-update-stage.timer
```

`bootc status` shows the booted and staged deployments, and names the image
it follows. If it shows `null` instead, see [Troubleshooting](#troubleshooting).
`snosi-update-status --check` tells you whether a newer image is published.
The timer is listed with its next run.

Install applications as Flatpaks or as [system extensions](/docs/sysexts/docker/).
Do not install APT packages into `/usr`: an image update does not keep them.
The package lists in the build are not a package manager you can add to.

## Updates and rollback

Updates are automatic. Every hour, `bootc-update-stage.timer` checks for a
new image, pulls it with Podman, and stages it. The timer adds a random delay
of up to 15 minutes. The new version starts at your next normal reboot. The
stager does not force a reboot.

Enabled [system extensions](/docs/sysexts/) update on their own. A new version is staged and starts at the next boot. See [Automatic updates](/docs/sysexts/manage/#automatic-updates).

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

Homes and container data in `/var` are shared by all versions, so a rollback
keeps them. After a rollback, the updater does not stage the version you
rolled back from again. It waits for the next published image.

Keep about twice the image size free in `/var`. The updater pulls each new
image into `/var` before it stages it.

## What ships

Snowfield is Base plus the bootc runtime, the bootc security setup, Snow's
desktop composition, the linux-surface kernel, and the image output format.

| Layer | What you get |
| --- | --- |
| Base | Debian Trixie userspace, systemd, the hourly update stager, Updex, and the system-extension definitions |
| Bootc runtime | `bootc`, `libostree-1-1`, and the packages OCI bootc needs |
| Desktop | Snow's GNOME desktop: GNOME Shell, GDM, Nautilus, Ptyxis, PipeWire, CUPS, Flatpak, and the desktop integration packages |
| Kernel | `linux-image-surface`, `linux-headers-surface`, `libwacom-surface`, and `iptsd` |
| Core Flatpak set | Snow's list: the Bazaar App Store, MissionCenter, Extension Manager, DistroShelf, and a set of GNOME apps |
| Containers | Podman and Distrobox, plus `systemd-container` and the Frostyard Intune integration |

The table shows the main layers only. Snowfield reuses Snow's composition, so
it also carries Homebrew integration, `frostyard-chairlift`,
`snow-first-setup`, the Snow Plymouth theme, the hotedge and Logo Menu GNOME
extensions, and the Bazaar companion build. The
[Snow page](/docs/images/snow/#what-ships) lists them.

### The Surface kernel

Snowfield swaps Snow's kernel for the Surface kernel. Its extra packages are
`linux-image-surface`, `linux-headers-surface`, `libwacom-surface`, and
`iptsd`.

The Surface packages come from the linux-surface Debian repository at
`https://pkg.surfacelinux.com/debian`: suite `release`, component `main`,
architecture amd64, signed by the linux-surface keyring.

The rest of the hardware stack is the same as Snow's. Most firmware and Mesa
come from `trixie-backports`, which is pinned at priority 100. The kernel
fragment also lists a few firmware packages with no pin, such as
`firmware-linux-free`, `atmel-firmware`, and `bluez-firmware`. If you build
Snowfield yourself, do not add unpinned copies of the pinned packages to the
package list.

## Choose Snowfield

Choose Snowfield for a Microsoft Surface device when you want the Snow
desktop on it. For the same desktop on other hardware, use
[Snow](/docs/images/snow/). The other products are:

- Snow: the general-purpose GNOME desktop.
- Sundog: KDE Plasma, bootc only.
- Floe: a headless server.

Base is the shared foundation, not a fifth installer choice. Snowfield has the
Trixie userspace with the Surface kernel.

## Troubleshooting

| Symptom | Check | Fix |
| --- | --- | --- |
| `bootc status` shows `spec.image: null` | The host is not managed by bootc. It is most likely an old nbc or native A/B install. | See [Moving from an nbc or A/B install](#moving-from-an-nbc-or-ab-install). |
| No update is staged | `systemctl list-timers bootc-update-stage.timer` and `journalctl -u bootc-update-stage.service` | Wait for the hourly run. Check the network and the free space in `/var`. |
| Staging fails for lack of space | Compare the free space in `/var` with the image size | Free space or grow the disk. The updater needs room for the download, the new version, and the previous one. |
| Secure Boot or TPM does not behave as you expect | `bootc status` and the firmware settings | Check the firmware settings, then read the [Bootc Secure Operations runbook](https://github.com/frostyard/snosi/blob/b2858ca0222814c395cf8248db98f3e096d57dc9/docs/bootc-secure-operations.md). Secure Boot is not production-ready yet. |

## Moving from an nbc or A/B install

Old nbc and native A/B installs get no new images or updates after
2026-09-30. There is no in-place conversion. Back up, install fresh with
Firn, and restore your data.

The
[migration runbook](https://github.com/frostyard/snosi/blob/b2858ca0222814c395cf8248db98f3e096d57dc9/docs/nbc-to-bootc-migration.md)
lists what to save: your `/etc` changes, homes, Podman volumes, and
`/var/lib/tailscale` if you use Tailscale. Check the backup from another
machine before you erase the disk.

## See also

- [Install a Frostyard image](/install)
- [Install, update, and roll back](/docs/images/install-update/)
- [Snow image](/docs/images/snow/)
- [Docker system extension](/docs/sysexts/docker/)
- [Incus system extension](/docs/sysexts/incus/)
- [Tailscale system extension](/docs/sysexts/tailscale/)
- [nbc to bootc migration runbook](https://github.com/frostyard/snosi/blob/b2858ca0222814c395cf8248db98f3e096d57dc9/docs/nbc-to-bootc-migration.md)
- [Bootc Secure Operations runbook](https://github.com/frostyard/snosi/blob/b2858ca0222814c395cf8248db98f3e096d57dc9/docs/bootc-secure-operations.md)

## Sources

Reviewed 2026-10-27 against snosi commit
[`b2858ca0222814c395cf8248db98f3e096d57dc9`](https://github.com/frostyard/snosi/tree/b2858ca0222814c395cf8248db98f3e096d57dc9).

- [`README.md`](https://github.com/frostyard/snosi/blob/b2858ca0222814c395cf8248db98f3e096d57dc9/README.md)
- [`mkosi.profiles/snowfield/mkosi.conf`](https://github.com/frostyard/snosi/blob/b2858ca0222814c395cf8248db98f3e096d57dc9/mkosi.profiles/snowfield/mkosi.conf)
- [`shared/kernel/surface/mkosi.conf`](https://github.com/frostyard/snosi/blob/b2858ca0222814c395cf8248db98f3e096d57dc9/shared/kernel/surface/mkosi.conf)
- [`shared/composition/snow/mkosi.conf`](https://github.com/frostyard/snosi/blob/b2858ca0222814c395cf8248db98f3e096d57dc9/shared/composition/snow/mkosi.conf)
- [`shared/packages/snow/mkosi.conf`](https://github.com/frostyard/snosi/blob/b2858ca0222814c395cf8248db98f3e096d57dc9/shared/packages/snow/mkosi.conf)
- [`mkosi.sandbox/etc/apt/sources.list.d/linux-surface.sources`](https://github.com/frostyard/snosi/blob/b2858ca0222814c395cf8248db98f3e096d57dc9/mkosi.sandbox/etc/apt/sources.list.d/linux-surface.sources)
- [`mkosi.sandbox/etc/apt/preferences.d/backports`](https://github.com/frostyard/snosi/blob/b2858ca0222814c395cf8248db98f3e096d57dc9/mkosi.sandbox/etc/apt/preferences.d/backports)
- [`shared/packages/bootc/mkosi.conf`](https://github.com/frostyard/snosi/blob/b2858ca0222814c395cf8248db98f3e096d57dc9/shared/packages/bootc/mkosi.conf)
- [`shared/bootc-secure/mkosi.conf`](https://github.com/frostyard/snosi/blob/b2858ca0222814c395cf8248db98f3e096d57dc9/shared/bootc-secure/mkosi.conf)
- [`shared/outformat/image/mkosi.conf`](https://github.com/frostyard/snosi/blob/b2858ca0222814c395cf8248db98f3e096d57dc9/shared/outformat/image/mkosi.conf)
- [`mkosi.images/base/mkosi.conf`](https://github.com/frostyard/snosi/blob/b2858ca0222814c395cf8248db98f3e096d57dc9/mkosi.images/base/mkosi.conf)
- [`flatpaks/snow.json`](https://github.com/frostyard/snosi/blob/b2858ca0222814c395cf8248db98f3e096d57dc9/flatpaks/snow.json)
- [`flatpaks/core-flatpaks.py`](https://github.com/frostyard/snosi/blob/b2858ca0222814c395cf8248db98f3e096d57dc9/flatpaks/core-flatpaks.py)
- [`shared/composition/core-flatpaks.finalize`](https://github.com/frostyard/snosi/blob/b2858ca0222814c395cf8248db98f3e096d57dc9/shared/composition/core-flatpaks.finalize)
- [`mkosi.images/base/mkosi.extra/usr/libexec/bootc-update-stage`](https://github.com/frostyard/snosi/blob/b2858ca0222814c395cf8248db98f3e096d57dc9/mkosi.images/base/mkosi.extra/usr/libexec/bootc-update-stage)
- [`mkosi.images/base/mkosi.extra/usr/lib/systemd/system/bootc-update-stage.timer`](https://github.com/frostyard/snosi/blob/b2858ca0222814c395cf8248db98f3e096d57dc9/mkosi.images/base/mkosi.extra/usr/lib/systemd/system/bootc-update-stage.timer)
- [`docs/installing.md`](https://github.com/frostyard/snosi/blob/b2858ca0222814c395cf8248db98f3e096d57dc9/docs/installing.md)
- [`docs/bootc-secure-operations.md`](https://github.com/frostyard/snosi/blob/b2858ca0222814c395cf8248db98f3e096d57dc9/docs/bootc-secure-operations.md)
- [`docs/nbc-to-bootc-migration.md`](https://github.com/frostyard/snosi/blob/b2858ca0222814c395cf8248db98f3e096d57dc9/docs/nbc-to-bootc-migration.md)
- [`docs/design/overview.md`](https://github.com/frostyard/snosi/blob/b2858ca0222814c395cf8248db98f3e096d57dc9/docs/design/overview.md)
- [`docs/design/testing.md`](https://github.com/frostyard/snosi/blob/b2858ca0222814c395cf8248db98f3e096d57dc9/docs/design/testing.md)
- [`mkosi.images/base/mkosi.extra/usr/lib/systemd/system-preset/05-updex.preset`](https://github.com/frostyard/snosi/blob/b2858ca0222814c395cf8248db98f3e096d57dc9/mkosi.images/base/mkosi.extra/usr/lib/systemd/system-preset/05-updex.preset)
- [`docs/design/sysexts.md`](https://github.com/frostyard/snosi/blob/b2858ca0222814c395cf8248db98f3e096d57dc9/docs/design/sysexts.md)
