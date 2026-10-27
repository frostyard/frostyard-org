---
title: Snow
description: Install, update, and roll back Snow, the Frostyard GNOME desktop image.
---

Snow is Frostyard's GNOME desktop. It is a Debian Trixie bootc/composefs
image for x86-64 machines with UEFI, built from the same Base as the other
Frostyard images. You install it with Firn.

The system lives in a read-only `/usr` that updates as one piece, and you can
roll back to the previous version. Image and system-extension applications
live under `/usr`. Your homes, Flatpak data, containers, and update state live
under `/var`.

:::caution[Secure Boot is not production-ready yet]
Firn can install with Secure Boot on, but Frostyard does not yet claim
production Secure Boot support, signed updates, or signed rollback.
Snow, Floe, and Sundog have passed fresh installs in a lab VM, but that is
not hardware qualification. A normal Firn install does not make Secure Boot
production-ready, and neither does a working `bootc rollback`. The secure layout
also needs signed secure N/N+1/N+2 release images and hardware test results
that are not published yet. An existing install cannot convert to the secure
layout in place.
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
3. Boot the stick. In Firn, pick the bootc Snow product, review the recipe
   Firn builds, and confirm the exact target disk.
4. If Firn shows a recovery key, store it somewhere other than this disk
   before you continue.
5. If Secure Boot is on, enroll the MOK when asked. Without it, the
   MOK-signed boot stage is not trusted while Secure Boot is enforced.

The `native` in the ISO address is an old folder name. It does not mean an
A/B install.

## First boot

Log in at the GDM screen with the user you created in Firn. Firn can install
the chosen core Flatpak set as part of the recipe; if yours included it, the
apps are already there. The image itself carries only the list.

Check that the system is healthy:

```bash
systemctl is-system-running
sudo bootc status
sudo snosi-update-status --check
systemctl list-timers bootc-update-stage.timer
```

`bootc status` shows the booted and staged deployments, and names the image
it follows. If it shows `null` instead, see
[Troubleshooting](#troubleshooting). `snosi-update-status --check` tells you
whether a newer image is published. The timer is listed with its next run.

Install applications as Flatpaks or as [system extensions](/docs/sysexts/docker/).
Do not install APT packages into `/usr`: an image update does not keep them.
The package lists in the build are not a package manager you can add to.

## Updates and rollback

Updates are automatic. Every hour, `bootc-update-stage.timer` checks for a
new image, pulls it with Podman, and stages it. The new version starts at your
next normal reboot. The stager does not force a reboot.

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

Snow is Base plus the bootc runtime, the bootc security setup, the Snow
desktop, a kernel, and the image output format.

| Layer | What you get |
| --- | --- |
| Base | Debian Trixie userspace, systemd, the hourly update stager, Updex, and the system-extension definitions |
| Bootc runtime | `bootc`, `libostree-1-1`, and the packages OCI bootc needs |
| Desktop | GNOME Shell, GDM, Nautilus, Ptyxis, PipeWire, CUPS, Flatpak, and the desktop integration packages |
| Kernel | `linux-image-amd64/forky` for now, with most firmware and Mesa from `trixie-backports` |
| Core Flatpak set | Bazaar, Mission Center, Extension Manager, DistroShelf, and a set of GNOME apps. The image carries the list and an OCI label; Firn installs the apps when the recipe includes the core set. |
| Containers | Podman and Distrobox, plus `systemd-container` and the Frostyard Intune integration |

The table shows the main layers only. Snow also carries Homebrew
integration, `frostyard-chairlift`, `snow-first-setup`, the Snow Plymouth
theme, the hotedge and Logo Menu GNOME extensions, and the Bazaar companion
build.

Snow uses the `linux-image-amd64/forky` kernel until the Trixie backports
kernel is complete. The build file for it is still called `backports`; the
name is out of date. Mesa and most firmware come from `trixie-backports`,
pinned in the same file. If you build Snow yourself, do not add second, unpinned copies
of them to the Snow package list.

The core Flatpak list is fixed at build time, and each build checks that the
image's copy matches it. Flathub may no longer offer every app on the list
when you install.

## Choose Snow

Choose Snow for a GNOME desktop. Do not use it as a server;
[Floe](/docs/images/floe/) is the server image. The other products are:

- Snowfield: GNOME for Microsoft Surface devices. It is untested on
  representative Surface hardware; its hardware gate was waived for catalog
  inclusion.
- Sundog: KDE Plasma, bootc only.
- Floe: a headless server.

Base is the shared foundation, not a fifth installer choice. Snow has the
Trixie userspace with a newer kernel. No per-product application test list
exists yet.

## Troubleshooting

| Symptom | Check | Fix |
| --- | --- | --- |
| `bootc status` shows `spec.image: null` | The host is not managed by bootc. It is most likely an old nbc or native A/B install. | See [Moving from an nbc or A/B install](#moving-from-an-nbc-or-ab-install). |
| No update is staged | `systemctl list-timers bootc-update-stage.timer` and `journalctl -u bootc-update-stage.service` | Wait for the hourly run. Check the network and the free space in `/var`. |
| Staging fails for lack of space | Compare the free space in `/var` with the image size | Free space or grow the disk. The updater needs room for the download, the new version, and the previous one. |
| Secure Boot or TPM does not behave as you expect | `bootc status` and the firmware settings | Check the firmware settings, then read the [Bootc Secure Operations runbook](https://github.com/frostyard/snosi/blob/b2858ca0222814c395cf8248db98f3e096d57dc9/docs/bootc-secure-operations.md). Secure Boot is not production-ready yet. |
| You need to know how Snowfield behaves on a Surface | The Snowfield page and installer notes | Snowfield is a different image and is untested on Surface hardware. Snow results do not carry over. |

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
- [Docker system extension](/docs/sysexts/docker/)
- [Incus system extension](/docs/sysexts/incus/)
- [Tailscale system extension](/docs/sysexts/tailscale/)
- [nbc to bootc migration runbook](https://github.com/frostyard/snosi/blob/b2858ca0222814c395cf8248db98f3e096d57dc9/docs/nbc-to-bootc-migration.md)
- [Bootc Secure Operations runbook](https://github.com/frostyard/snosi/blob/b2858ca0222814c395cf8248db98f3e096d57dc9/docs/bootc-secure-operations.md)

## Sources

Reviewed 2026-10-27 against snosi commit
[`b2858ca0222814c395cf8248db98f3e096d57dc9`](https://github.com/frostyard/snosi/tree/b2858ca0222814c395cf8248db98f3e096d57dc9).

- [`README.md`](https://github.com/frostyard/snosi/blob/b2858ca0222814c395cf8248db98f3e096d57dc9/README.md)
- [`mkosi.profiles/snow/mkosi.conf`](https://github.com/frostyard/snosi/blob/b2858ca0222814c395cf8248db98f3e096d57dc9/mkosi.profiles/snow/mkosi.conf)
- [`shared/composition/snow/mkosi.conf`](https://github.com/frostyard/snosi/blob/b2858ca0222814c395cf8248db98f3e096d57dc9/shared/composition/snow/mkosi.conf)
- [`shared/packages/snow/mkosi.conf`](https://github.com/frostyard/snosi/blob/b2858ca0222814c395cf8248db98f3e096d57dc9/shared/packages/snow/mkosi.conf)
- [`shared/packages/bootc/mkosi.conf`](https://github.com/frostyard/snosi/blob/b2858ca0222814c395cf8248db98f3e096d57dc9/shared/packages/bootc/mkosi.conf)
- [`shared/kernel/backports/mkosi.conf`](https://github.com/frostyard/snosi/blob/b2858ca0222814c395cf8248db98f3e096d57dc9/shared/kernel/backports/mkosi.conf)
- [`mkosi.images/base/mkosi.conf`](https://github.com/frostyard/snosi/blob/b2858ca0222814c395cf8248db98f3e096d57dc9/mkosi.images/base/mkosi.conf)
- [`flatpaks/snow.json`](https://github.com/frostyard/snosi/blob/b2858ca0222814c395cf8248db98f3e096d57dc9/flatpaks/snow.json)
- [`flatpaks/core-flatpaks.py`](https://github.com/frostyard/snosi/blob/b2858ca0222814c395cf8248db98f3e096d57dc9/flatpaks/core-flatpaks.py)
- [`shared/composition/core-flatpaks.postoutput`](https://github.com/frostyard/snosi/blob/b2858ca0222814c395cf8248db98f3e096d57dc9/shared/composition/core-flatpaks.postoutput)
- [`mkosi.images/base/mkosi.extra/usr/libexec/bootc-update-stage`](https://github.com/frostyard/snosi/blob/b2858ca0222814c395cf8248db98f3e096d57dc9/mkosi.images/base/mkosi.extra/usr/libexec/bootc-update-stage)
- [`docs/installing.md`](https://github.com/frostyard/snosi/blob/b2858ca0222814c395cf8248db98f3e096d57dc9/docs/installing.md)
- [`docs/bootc-secure-operations.md`](https://github.com/frostyard/snosi/blob/b2858ca0222814c395cf8248db98f3e096d57dc9/docs/bootc-secure-operations.md)
- [`docs/nbc-to-bootc-migration.md`](https://github.com/frostyard/snosi/blob/b2858ca0222814c395cf8248db98f3e096d57dc9/docs/nbc-to-bootc-migration.md)
- [`mkosi.images/base/mkosi.extra/usr/lib/systemd/system-preset/05-updex.preset`](https://github.com/frostyard/snosi/blob/b2858ca0222814c395cf8248db98f3e096d57dc9/mkosi.images/base/mkosi.extra/usr/lib/systemd/system-preset/05-updex.preset)
- [`docs/design/sysexts.md`](https://github.com/frostyard/snosi/blob/b2858ca0222814c395cf8248db98f3e096d57dc9/docs/design/sysexts.md)
