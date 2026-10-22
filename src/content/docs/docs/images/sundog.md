---
title: Sundog
description: Install, update, and roll back Sundog, the Frostyard KDE Plasma desktop image.
---

Sundog is Frostyard's KDE Plasma desktop. It is a Debian Trixie bootc/composefs
image for x86-64 machines with UEFI, built from the same Base as the other
Frostyard images. Plasma on Wayland is the only desktop session it offers.
Sundog ships only as a bootc image. You install it with Firn.

The system lives in a read-only `/usr` that updates as one piece, and you can
roll back to the previous version. Image and system-extension applications
live under `/usr`. Your homes, Flatpak data, containers, and update state live
under `/var`. Sundog has its own core Flatpak set.

:::caution[Secure Boot is not production-ready yet]
Firn can install with Secure Boot on, but Frostyard does not yet claim
production Secure Boot support, signed updates, or signed rollback.
Fresh-install test results for Snow, Floe, and Sundog are still pending. A
normal Firn install does not change that, and neither does a working
`bootc rollback`. The secure layout also needs signed secure N/N+1/N+2 release
images and hardware test results that are not published yet. An existing
install cannot convert to the secure layout in place.
:::

## Install

Firn is the installer. It needs UEFI and erases the disk you pick. It works
with or without Secure Boot, TPM 2.0, and disk encryption, and asks you about
each one. Use a disk of at least 30 GiB, and more if you plan to keep
Flatpaks, containers, and several updates.

1. Download the installer and its checksums:
   - [Installer ISO](https://repository.frostyard.org/isos/native/v1/snosi-installer-latest-x86-64.iso)
   - [SHA256SUMS](https://repository.frostyard.org/isos/native/v1/SHA256SUMS)
   - [SHA256SUMS.gpg](https://repository.frostyard.org/isos/native/v1/SHA256SUMS.gpg)
2. Check the signing key's fingerprint and the ISO, then write the ISO to a
   USB stick. The
   [installation guide](https://github.com/frostyard/snosi/blob/e5d0597f5b53ddddfa7a35ff6f706b094f20f76b/docs/installing.md)
   has the exact `gpgv` and `sha256sum` commands and the commands to write the
   stick. Read its warning on picking the right device.
3. Boot the stick. In Firn, pick the bootc Sundog product, review the recipe
   Firn builds, and confirm the exact target disk.
4. If Firn shows a recovery key, store it somewhere other than this disk
   before you continue.
5. If Secure Boot is on, enroll the MOK when asked. Without it, the
   MOK-signed boot stage is not trusted while Secure Boot is enforced.

The `native` in the ISO address is an old folder name. It does not mean an
A/B install.

## First boot

Sundog starts at the SDDM login screen with the Breeze theme. Log in with the
user you created in Firn. Plasma on Wayland is the only session the image
offers; it has no Plasma X11 session. Discover lists Flatpak applications
only.

Firn can install the chosen core Flatpak set as part of the recipe; Sundog
uses its own list. If yours included it, the apps are already there.

Check that the system is healthy:

```bash
systemctl is-system-running
sudo bootc status
sudo snosi-update-status --check
systemctl list-timers bootc-update-stage.timer
```

`bootc status` shows the booted and staged deployments, and names the image
it follows.
`snosi-update-status --check` tells you whether a newer image is published.
The timer is listed with its next run.

Install applications as Flatpaks or as
[system extensions](/docs/sysexts/docker/). Do not install APT packages into
`/usr`: an image update does not keep them. The package lists in the build are
not a package manager you can add to.

## Updates and rollback

Updates are automatic. Every hour, `bootc-update-stage.timer` checks for a
new image, pulls it with Podman, and stages it. The timer adds a random delay
of up to 15 minutes. The new version starts at your next normal reboot. The
stager does not force a reboot.

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

Sundog is Base plus the bootc runtime, the bootc security setup, the KDE
composition, the backports kernel, and the image output format.

| Layer | What you get |
| --- | --- |
| Base | Debian Trixie userspace, systemd, the hourly update stager, Updex, and the system-extension definitions |
| Bootc runtime | `bootc`, `libostree-1-1`, and the packages OCI bootc needs |
| Desktop | Plasma 6 on Wayland with `kde-plasma-desktop`, `kwin-wayland`, SDDM, and the KDE applications below |
| Kernel | `linux-image-amd64/forky` for now, with most firmware and Mesa from `trixie-backports` |
| Core Flatpak set | Gwenview, Haruna, KCalc, KCharSelect, Okular, Skanpage, Weather, Kontainer, Bazaar, MissionCenter, Elisa, Filelight, KRDC, and KClock |
| Containers | Podman, Distrobox, and Buildah, plus `systemd-container` and the Frostyard Intune integration |

The image carries its Flatpak list at
`/usr/share/frostyard/sundog.core-flatpaks.json`.

### Desktop packages

The image carries these KDE packages:

- Plasma and the session: `kde-plasma-desktop`, `kwin-wayland`, `sddm`,
  `sddm-theme-breeze`, `plasma-nm`, `plasma-pa`, `kscreen`, `powerdevil`,
  `polkit-kde-agent-1`, `libpam-kwallet5`, `xdg-desktop-portal-kde`, and
  `qt6-wayland`.
- Applications: `dolphin`, `dolphin-plugins`, `kio-extras`, `kio-fuse`,
  `ark`, `kate`, `konsole`, `kde-spectacle`, `kdeconnect`, and `khelpcenter`.
- System tools: `plasma-systemmonitor`, `ksystemstats`, `kinfocenter`,
  `plasma-thunderbolt`, `kwalletmanager`, `kmenuedit`, `keditbookmarks`, and
  `kde-config-screenlocker`.
- Appearance, input, and previews: `breeze-gtk-theme`, `kde-config-gtk-style`,
  `xsettingsd`, `sonnet6-plugins`, `hunspell-en-us`, `fcitx5`,
  `kde-config-fcitx5`, `fcitx5-frontend-gtk3`, `fcitx5-frontend-gtk4`,
  `fcitx5-frontend-qt6`, `ffmpegthumbs`, `kdegraphics-thumbnailers`,
  `qt6-image-formats-plugins`, and `kimageformat6-plugins`.
- Flatpak: `flatpak`, `plasma-discover-backend-flatpak`, and
  `kde-config-flatpak`.
- Printing and scanning: `cups`, `print-manager`,
  `system-config-printer-udev`, and `libsane1`.
- Hardware and power: `pipewire`, `pipewire-audio`, `bluez`, `bluedevil`,
  `bolt`, `tuned`, `tuned-ppd`, `upower`, `systemd-zram-generator`, and
  `switcheroo-control`.
- Boot: `plymouth`, `plymouth-label`, and `plymouth-theme-breeze`.

Gwenview, Okular, KCalc, and Skanpage are Flatpaks, not packages in the image.

### Services and settings

- `sddm.service` is the display manager. The image links
  `/usr/lib/systemd/system/display-manager.service` to it, so SDDM starts on
  every boot.
- `/etc/sddm.conf.d/10-sundog.conf` sets the Breeze theme and
  `RememberLastSession=true`.
- `/etc/plymouth/plymouthd.conf` sets the Breeze Plymouth theme,
  `ShowDelay=0`, and `DeviceTimeout=8`.
- The user preset `90-sundog.preset` disables `bazaar.service` and
  `podman.service`. The Podman API socket stays available.
- tmpfiles rules create `/var/lib/sddm` with mode 0750 for user `sddm`, and
  `/var/lib/tuned`.
- The image removes the Plasma X11 session descriptor, so Plasma on Wayland is
  the only session.
- Discover has only its Flatpak backend. The build removes the PackageKit
  backend plugin, and fails if the plugin is not there.
- Flathub is configured as on Snow, from the same repository descriptor.
- Sundog reuses the shared tree that Floe carries. That adds the persistent
  journal drop-in `10-sundog-bootc-persistent.conf`, the Homebrew setup and
  update units, zram, and the presets that turn off the APT daily timers. The
  image removes `/usr/share/floe`.

## Choose Sundog

Choose Sundog for a KDE Plasma desktop on Wayland. For GNOME, use
[Snow](/docs/images/snow/). The other products are:

- Snow: the general-purpose GNOME desktop.
- Snowfield: GNOME for Microsoft Surface devices. It is untested on
  representative Surface hardware; its hardware gate was waived for catalog
  inclusion.
- Floe: a headless server.

Base is the shared foundation, not a fifth installer choice. Sundog has the
Trixie userspace with a newer kernel.

## Troubleshooting

| Symptom | Check | Fix |
| --- | --- | --- |
| No update is staged | `systemctl list-timers bootc-update-stage.timer` and `journalctl -u bootc-update-stage.service` | Wait for the hourly run. Check the network and the free space in `/var`. |
| Staging fails for lack of space | Compare the free space in `/var` with the image size | Free space or grow the disk. The updater needs room for the download, the new version, and the previous one. |
| Discover shows no system packages | That is how Sundog ships: Discover has only its Flatpak backend | Install Flatpaks from Discover, or install host software as a system extension. |
| A KDE application you expect is missing | The core Flatpak set | Install it as a Flatpak. Gwenview, Okular, KCalc, and Skanpage are Flatpaks. |
| Secure Boot or TPM does not behave as you expect | `bootc status` and the firmware settings | Check the firmware settings, then read the [Bootc Secure Operations runbook](https://github.com/frostyard/snosi/blob/e5d0597f5b53ddddfa7a35ff6f706b094f20f76b/docs/bootc-secure-operations.md). Secure Boot is not production-ready yet. |

## See also

- [Install a Frostyard image](/install)
- [Snow image](/docs/images/snow/)
- [Docker system extension](/docs/sysexts/docker/)
- [Incus system extension](/docs/sysexts/incus/)
- [Tailscale system extension](/docs/sysexts/tailscale/)
- [Bootc Secure Operations runbook](https://github.com/frostyard/snosi/blob/e5d0597f5b53ddddfa7a35ff6f706b094f20f76b/docs/bootc-secure-operations.md)

## Sources

Reviewed 2026-10-22 against snosi commit
[`e5d0597f5b53ddddfa7a35ff6f706b094f20f76b`](https://github.com/frostyard/snosi/tree/e5d0597f5b53ddddfa7a35ff6f706b094f20f76b).

- [`README.md`](https://github.com/frostyard/snosi/blob/e5d0597f5b53ddddfa7a35ff6f706b094f20f76b/README.md)
- [`mkosi.profiles/sundog/mkosi.conf`](https://github.com/frostyard/snosi/blob/e5d0597f5b53ddddfa7a35ff6f706b094f20f76b/mkosi.profiles/sundog/mkosi.conf)
- [`shared/composition/sundog/mkosi.conf`](https://github.com/frostyard/snosi/blob/e5d0597f5b53ddddfa7a35ff6f706b094f20f76b/shared/composition/sundog/mkosi.conf)
- [`shared/packages/sundog/mkosi.conf`](https://github.com/frostyard/snosi/blob/e5d0597f5b53ddddfa7a35ff6f706b094f20f76b/shared/packages/sundog/mkosi.conf)
- [`shared/sundog/scripts/postinstall/sundog.postinst.chroot`](https://github.com/frostyard/snosi/blob/e5d0597f5b53ddddfa7a35ff6f706b094f20f76b/shared/sundog/scripts/postinstall/sundog.postinst.chroot)
- [`shared/sundog/tree/etc/sddm.conf.d/10-sundog.conf`](https://github.com/frostyard/snosi/blob/e5d0597f5b53ddddfa7a35ff6f706b094f20f76b/shared/sundog/tree/etc/sddm.conf.d/10-sundog.conf)
- [`shared/sundog/tree/etc/plymouth/plymouthd.conf`](https://github.com/frostyard/snosi/blob/e5d0597f5b53ddddfa7a35ff6f706b094f20f76b/shared/sundog/tree/etc/plymouth/plymouthd.conf)
- [`shared/sundog/tree/usr/lib/systemd/user-preset/90-sundog.preset`](https://github.com/frostyard/snosi/blob/e5d0597f5b53ddddfa7a35ff6f706b094f20f76b/shared/sundog/tree/usr/lib/systemd/user-preset/90-sundog.preset)
- [`shared/sundog/tree/usr/lib/tmpfiles.d/sddm.conf`](https://github.com/frostyard/snosi/blob/e5d0597f5b53ddddfa7a35ff6f706b094f20f76b/shared/sundog/tree/usr/lib/tmpfiles.d/sddm.conf)
- [`shared/sundog/tree/usr/lib/tmpfiles.d/tuned.conf`](https://github.com/frostyard/snosi/blob/e5d0597f5b53ddddfa7a35ff6f706b094f20f76b/shared/sundog/tree/usr/lib/tmpfiles.d/tuned.conf)
- [`shared/floe/tree/usr/lib/systemd/system/journald.conf.d/10-floe-bootc-persistent.conf`](https://github.com/frostyard/snosi/blob/e5d0597f5b53ddddfa7a35ff6f706b094f20f76b/shared/floe/tree/usr/lib/systemd/system/journald.conf.d/10-floe-bootc-persistent.conf)
- [`shared/floe/tree/usr/lib/systemd/system/brew-setup.service`](https://github.com/frostyard/snosi/blob/e5d0597f5b53ddddfa7a35ff6f706b094f20f76b/shared/floe/tree/usr/lib/systemd/system/brew-setup.service)
- [`shared/floe/tree/usr/lib/systemd/system/brew-update.timer`](https://github.com/frostyard/snosi/blob/e5d0597f5b53ddddfa7a35ff6f706b094f20f76b/shared/floe/tree/usr/lib/systemd/system/brew-update.timer)
- [`shared/floe/tree/usr/lib/systemd/system/brew-upgrade.timer`](https://github.com/frostyard/snosi/blob/e5d0597f5b53ddddfa7a35ff6f706b094f20f76b/shared/floe/tree/usr/lib/systemd/system/brew-upgrade.timer)
- [`shared/floe/tree/usr/lib/systemd/zram-generator.conf`](https://github.com/frostyard/snosi/blob/e5d0597f5b53ddddfa7a35ff6f706b094f20f76b/shared/floe/tree/usr/lib/systemd/zram-generator.conf)
- [`shared/floe/tree/usr/lib/systemd/system-preset/00-apt.preset`](https://github.com/frostyard/snosi/blob/e5d0597f5b53ddddfa7a35ff6f706b094f20f76b/shared/floe/tree/usr/lib/systemd/system-preset/00-apt.preset)
- [`shared/kernel/backports/mkosi.conf`](https://github.com/frostyard/snosi/blob/e5d0597f5b53ddddfa7a35ff6f706b094f20f76b/shared/kernel/backports/mkosi.conf)
- [`shared/packages/bootc/mkosi.conf`](https://github.com/frostyard/snosi/blob/e5d0597f5b53ddddfa7a35ff6f706b094f20f76b/shared/packages/bootc/mkosi.conf)
- [`shared/bootc-secure/mkosi.conf`](https://github.com/frostyard/snosi/blob/e5d0597f5b53ddddfa7a35ff6f706b094f20f76b/shared/bootc-secure/mkosi.conf)
- [`shared/outformat/image/mkosi.conf`](https://github.com/frostyard/snosi/blob/e5d0597f5b53ddddfa7a35ff6f706b094f20f76b/shared/outformat/image/mkosi.conf)
- [`mkosi.images/base/mkosi.conf`](https://github.com/frostyard/snosi/blob/e5d0597f5b53ddddfa7a35ff6f706b094f20f76b/mkosi.images/base/mkosi.conf)
- [`flatpaks/sundog.json`](https://github.com/frostyard/snosi/blob/e5d0597f5b53ddddfa7a35ff6f706b094f20f76b/flatpaks/sundog.json)
- [`flatpaks/core-flatpaks.py`](https://github.com/frostyard/snosi/blob/e5d0597f5b53ddddfa7a35ff6f706b094f20f76b/flatpaks/core-flatpaks.py)
- [`shared/composition/core-flatpaks.finalize`](https://github.com/frostyard/snosi/blob/e5d0597f5b53ddddfa7a35ff6f706b094f20f76b/shared/composition/core-flatpaks.finalize)
- [`mkosi.images/base/mkosi.extra/usr/libexec/bootc-update-stage`](https://github.com/frostyard/snosi/blob/e5d0597f5b53ddddfa7a35ff6f706b094f20f76b/mkosi.images/base/mkosi.extra/usr/libexec/bootc-update-stage)
- [`mkosi.images/base/mkosi.extra/usr/lib/systemd/system/bootc-update-stage.timer`](https://github.com/frostyard/snosi/blob/e5d0597f5b53ddddfa7a35ff6f706b094f20f76b/mkosi.images/base/mkosi.extra/usr/lib/systemd/system/bootc-update-stage.timer)
- [`docs/installing.md`](https://github.com/frostyard/snosi/blob/e5d0597f5b53ddddfa7a35ff6f706b094f20f76b/docs/installing.md)
- [`docs/bootc-secure-operations.md`](https://github.com/frostyard/snosi/blob/e5d0597f5b53ddddfa7a35ff6f706b094f20f76b/docs/bootc-secure-operations.md)
- [`docs/nbc-to-bootc-migration.md`](https://github.com/frostyard/snosi/blob/e5d0597f5b53ddddfa7a35ff6f706b094f20f76b/docs/nbc-to-bootc-migration.md)
- [`docs/design/overview.md`](https://github.com/frostyard/snosi/blob/e5d0597f5b53ddddfa7a35ff6f706b094f20f76b/docs/design/overview.md)
- [`docs/design/sysexts.md`](https://github.com/frostyard/snosi/blob/e5d0597f5b53ddddfa7a35ff6f706b094f20f76b/docs/design/sysexts.md)
- [`docs/design/testing.md`](https://github.com/frostyard/snosi/blob/e5d0597f5b53ddddfa7a35ff6f706b094f20f76b/docs/design/testing.md)
- [`docs/adr/0016-name-kde-bootc-product-sundog.md`](https://github.com/frostyard/snosi/blob/e5d0597f5b53ddddfa7a35ff6f706b094f20f76b/docs/adr/0016-name-kde-bootc-product-sundog.md)
