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

At your first login, ChairLift's
[first-login setup](/docs/tools/chairlift/#first-login-setup) opens. It sets
the light or dark style and offers Flatpak apps to install for your user. After
you finish it, it does not open again. If you finished SNOW First Setup on an
older Snow image, it does not open at all.

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

## Problems

Snow checks itself for problems 3 to 8 minutes after boot, then about every
hour. It records:

- a system service that failed
- an image update that could not be staged
- a system-extension update that failed
- a boot into an older image
- an encrypted disk that the TPM opened only after a retry, or that needed a
  passphrase or the recovery key
- an integrity error
- a crash of a system program
- a problem that a Frostyard system service recorded

The records stay on this computer.

To see them, open [ChairLift](/docs/tools/chairlift/) and select Problems.
The page comes with ChairLift v0.14.0.
Each row says what happened and when. Expand a row for a hint, the details,
and the Copy details and Dismiss buttons. A dismissed problem shows again if
it happens again. The page also lists crashes of your own programs and
problems that Frostyard apps recorded in the last 90 days. ChairLift sends
nothing until you turn reporting on.

To read the system list in a terminal:

```bash
snosi-health --list
```

Each line shows when the problem was last seen, its kind, a short summary,
and how many times it was seen. With no problems, it prints
`No problems recorded` and the time of the last check. If the command is
missing, the image is older than this feature: let it update, then reboot.

If ChairLift has no Problems page, the image may carry a ChairLift older
than v0.14.0: let it update, then reboot. On an image with ChairLift v0.14.0
or later, ChairLift hides the page when `/etc/chairlift/config.yml`
turns off all 3 of its groups, or when it shows a configuration error. Fix
the file and restart ChairLift.

### Send problem reports

From ChairLift v0.15.0, the Problems page has a **Send problem reports**
switch. It is off until you turn it on, and each user decides for themselves.
*Ask each time* shows you each report before it goes. *Send automatically*
sends without asking. *Sent reports* lists the 50 newest reports
it sent. Crash records stay
on this computer. The image gets ChairLift v0.15.0 with the next image release.
The first-run setup can also show a Reporting step, with the switch off.

If there is no switch, the image may carry a ChairLift older than v0.15.0
(let it update, then reboot), or `/etc/chairlift/config.yml` turns off `problems_reporting_group`.
Read what a report holds and how to have one deleted in
[Problem reports](/privacy/problem-reports/). Read how ChairLift decides what
to send in [ChairLift ADR-0015](https://github.com/frostyard/chairlift/blob/e3e434a2843512c99538c08070bafd1c965eb7f8/docs/adr/0015-problems-page-and-opt-in-reporting.md).

A crash keeps no core file. The journal keeps the crash entry. It has a stack
trace only when the core is 1 GiB or smaller. To keep core files while you
debug a crash, set `Storage=external` in
`/etc/systemd/coredump.conf.d/90-debug.conf`:

```ini
[Coredump]
Storage=external
```

The image sets `Storage=none` in `50-snosi.conf`, and the file that sorts last
wins. Give your file a name that sorts after `50-snosi.conf`.

Apply it before you reproduce the crash:

```bash
sudo systemctl reload systemd-coredumpd.service
```

If that service is not running, there is nothing to reload: each crash then
reads the file. A reboot also applies it.

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
integration, `frostyard-chairlift` with its first-login setup, the Snow
Plymouth theme, the hotedge and Logo Menu GNOME extensions, and the Bazaar companion
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
- First-login setup, reviewed 2026-11-05 against snosi commit [`770f9a3c82c4bb7348f6c477fce08febf25554af`](https://github.com/frostyard/snosi/tree/770f9a3c82c4bb7348f6c477fce08febf25554af) ([snosi#1224](https://github.com/frostyard/snosi/pull/1224)): [`docs/adr/0028-first-login-runs-chairlift-first-run.md`](https://github.com/frostyard/snosi/blob/770f9a3c82c4bb7348f6c477fce08febf25554af/docs/adr/0028-first-login-runs-chairlift-first-run.md), [`shared/snow/tree/etc/xdg/autostart/org.frostyard.ChairLift.FirstRun.desktop`](https://github.com/frostyard/snosi/blob/770f9a3c82c4bb7348f6c477fce08febf25554af/shared/snow/tree/etc/xdg/autostart/org.frostyard.ChairLift.FirstRun.desktop), [`shared/snow/tree/usr/share/snow/first-run/apps.json`](https://github.com/frostyard/snosi/blob/770f9a3c82c4bb7348f6c477fce08febf25554af/shared/snow/tree/usr/share/snow/first-run/apps.json), [`shared/packages/snow/mkosi.conf`](https://github.com/frostyard/snosi/blob/770f9a3c82c4bb7348f6c477fce08febf25554af/shared/packages/snow/mkosi.conf)

The Problems section was reviewed 2026-11-05 against snosi commit
[`b6e5e0769c605b920686c12bc7f0962caac10586`](https://github.com/frostyard/snosi/tree/b6e5e0769c605b920686c12bc7f0962caac10586) and ChairLift release v0.14.0
commit [`54124831081796ffdadd4e10644fdc20719bf723`](https://github.com/frostyard/chairlift/tree/54124831081796ffdadd4e10644fdc20719bf723)
([release](https://github.com/frostyard/chairlift/releases/tag/v0.14.0)).

- [`docs/adr/0029-snosi-health-records-problems.md`](https://github.com/frostyard/snosi/blob/b6e5e0769c605b920686c12bc7f0962caac10586/docs/adr/0029-snosi-health-records-problems.md)
- [`docs/integration-contracts.md`](https://github.com/frostyard/snosi/blob/b6e5e0769c605b920686c12bc7f0962caac10586/docs/integration-contracts.md)
- [`mkosi.images/base/mkosi.extra/usr/bin/snosi-health`](https://github.com/frostyard/snosi/blob/b6e5e0769c605b920686c12bc7f0962caac10586/mkosi.images/base/mkosi.extra/usr/bin/snosi-health)
- [`mkosi.images/base/mkosi.extra/usr/lib/systemd/system/snosi-health.timer`](https://github.com/frostyard/snosi/blob/b6e5e0769c605b920686c12bc7f0962caac10586/mkosi.images/base/mkosi.extra/usr/lib/systemd/system/snosi-health.timer)
- [`mkosi.images/base/mkosi.extra/usr/lib/systemd/system/snosi-health.service`](https://github.com/frostyard/snosi/blob/b6e5e0769c605b920686c12bc7f0962caac10586/mkosi.images/base/mkosi.extra/usr/lib/systemd/system/snosi-health.service)
- [`shared/bootc-secure/mkosi.conf`](https://github.com/frostyard/snosi/blob/b6e5e0769c605b920686c12bc7f0962caac10586/shared/bootc-secure/mkosi.conf)
- [`shared/bootc-secure/tree/usr/lib/systemd/coredump.conf.d/50-snosi.conf`](https://github.com/frostyard/snosi/blob/b6e5e0769c605b920686c12bc7f0962caac10586/shared/bootc-secure/tree/usr/lib/systemd/coredump.conf.d/50-snosi.conf)
- systemd v262 [`man/coredump.conf.xml`](https://github.com/systemd/systemd/blob/v262/man/coredump.conf.xml) (drop-in order, `ProcessSizeMax=`, reloading `systemd-coredumpd.service`)
- [ChairLift `README.md`](https://github.com/frostyard/chairlift/blob/54124831081796ffdadd4e10644fdc20719bf723/README.md)
- [ChairLift `docs/adr/0015-problems-page-and-opt-in-reporting.md`](https://github.com/frostyard/chairlift/blob/54124831081796ffdadd4e10644fdc20719bf723/docs/adr/0015-problems-page-and-opt-in-reporting.md)
- [ChairLift `docs/specs/problems-page.md`](https://github.com/frostyard/chairlift/blob/54124831081796ffdadd4e10644fdc20719bf723/docs/specs/problems-page.md)
- [ChairLift `config.yml`](https://github.com/frostyard/chairlift/blob/54124831081796ffdadd4e10644fdc20719bf723/config.yml)
- [ChairLift `CONFIG.md`](https://github.com/frostyard/chairlift/blob/54124831081796ffdadd4e10644fdc20719bf723/CONFIG.md)
- [ChairLift `internal/views/pageview/problems.go`](https://github.com/frostyard/chairlift/blob/54124831081796ffdadd4e10644fdc20719bf723/internal/views/pageview/problems.go)

The reporting part was reviewed 2026-11-05 against ChairLift release v0.15.0
commit [`e3e434a2843512c99538c08070bafd1c965eb7f8`](https://github.com/frostyard/chairlift/tree/e3e434a2843512c99538c08070bafd1c965eb7f8)
([release](https://github.com/frostyard/chairlift/releases/tag/v0.15.0)).

- [ChairLift `docs/adr/0015-problems-page-and-opt-in-reporting.md`](https://github.com/frostyard/chairlift/blob/e3e434a2843512c99538c08070bafd1c965eb7f8/docs/adr/0015-problems-page-and-opt-in-reporting.md)
- [ChairLift `docs/specs/problem-reporting.md`](https://github.com/frostyard/chairlift/blob/e3e434a2843512c99538c08070bafd1c965eb7f8/docs/specs/problem-reporting.md)
- [ChairLift `internal/views/pageview/reporting.go`](https://github.com/frostyard/chairlift/blob/e3e434a2843512c99538c08070bafd1c965eb7f8/internal/views/pageview/reporting.go)
- [ChairLift `internal/window/firstrun_reporting.go`](https://github.com/frostyard/chairlift/blob/e3e434a2843512c99538c08070bafd1c965eb7f8/internal/window/firstrun_reporting.go)
