---
title: Snow
description: The Frostyard general-purpose GNOME desktop image, its composition, installation, updates, and support limits.
---

Snow is Frostyard's general-purpose GNOME workstation. It is a Debian Trixie
bootc/composefs image built by snosi for x86-64 UEFI machines. The supported
installer is Firn, and the image follows the shared Base composition rather
than a separate package universe.

## Purpose and support boundary

Snow is the desktop choice when you want a GNOME workstation with an immutable
`/usr`, atomic deployments, and optional `/usr` system extensions for
application payloads. Image and system-extension applications live under
`/usr`. User homes, Flatpak data, container stores, and update state live under
`/var`.

The product facts below describe the pinned build configuration. They are not
a published artifact manifest, and they are not a test report.

:::caution[No production secure-boot or signed-rollback claim]
Fresh-install evidence for Snow, Floe, and Sundog is pending. Fixture coverage
does not establish production Secure Boot support, signed update evidence, or
signed rollback evidence. An ordinary Firn install is not that evidence. The
secure path also requires authorized signed secure N/N+1/N+2 artifacts and
hardware results that the current sources withhold.
See [`README.md`](https://github.com/frostyard/snosi/blob/5b610e3db1017e0ccc9a5dabc10b841e80c1d2e5/README.md)
and [`docs/bootc-secure-operations.md`](https://github.com/frostyard/snosi/blob/5b610e3db1017e0ccc9a5dabc10b841e80c1d2e5/docs/bootc-secure-operations.md).
:::

## What ships

The Snow profile depends on Base and includes the bootc runtime, the bootc
security composition, the Snow payload, the kernel fragment, and the image
output format. The build configuration is
[`mkosi.profiles/snow/mkosi.conf`](https://github.com/frostyard/snosi/blob/5b610e3db1017e0ccc9a5dabc10b841e80c1d2e5/mkosi.profiles/snow/mkosi.conf).

| Layer | What the pinned build composes | Evidence |
| --- | --- | --- |
| Base | Debian Trixie userspace, systemd, bootc, the hourly update stager, Updex, and the system-extension transfer definitions | [`mkosi.images/base/mkosi.conf`](https://github.com/frostyard/snosi/blob/5b610e3db1017e0ccc9a5dabc10b841e80c1d2e5/mkosi.images/base/mkosi.conf) |
| Desktop | GNOME Shell, GDM, Nautilus, Ptyxis, PipeWire, CUPS, Flatpak, and the desktop integration packages | [`shared/packages/snow/mkosi.conf`](https://github.com/frostyard/snosi/blob/5b610e3db1017e0ccc9a5dabc10b841e80c1d2e5/shared/packages/snow/mkosi.conf) |
| Kernel | `linux-image-amd64/forky` as a temporary selection, with firmware and Mesa packages from `trixie-backports` | [`shared/kernel/backports/mkosi.conf`](https://github.com/frostyard/snosi/blob/5b610e3db1017e0ccc9a5dabc10b841e80c1d2e5/shared/kernel/backports/mkosi.conf) |
| Core Flatpak set | Bazaar, Mission Center, Extension Manager, DistroShelf, and a set of GNOME applications. The image ships the list and the OCI label; Firn installs the payloads when the recipe selects the core set. | [`flatpaks/snow.json`](https://github.com/frostyard/snosi/blob/5b610e3db1017e0ccc9a5dabc10b841e80c1d2e5/flatpaks/snow.json), [`flatpaks/core-flatpaks.py`](https://github.com/frostyard/snosi/blob/5b610e3db1017e0ccc9a5dabc10b841e80c1d2e5/flatpaks/core-flatpaks.py) |
| Containers | Podman and Distrobox, plus `systemd-container` and the Frostyard Intune integration | [`shared/packages/snow/mkosi.conf`](https://github.com/frostyard/snosi/blob/5b610e3db1017e0ccc9a5dabc10b841e80c1d2e5/shared/packages/snow/mkosi.conf) |

The kernel fragment is named `backports`, but the pinned file currently selects
`linux-image-amd64/forky` while the Trixie backports kernel chain is
incomplete. Treat the executable package selection as current and the fragment
name as historical. The same fragment pins Mesa and firmware from
`trixie-backports`; do not add unpinned duplicates to the Snow package set.

The core Flatpak list is a JSON manifest in the source, not a live store
listing. The build checks that the image's on-disk file matches the manifest.
It does not prove that every listed Flatpak is available from Flathub at
install time.

## Choose Snow

Snow is the GNOME desktop. The current product line also has Snowfield (GNOME
for Surface devices, with representative hardware testing still pending),
Sundog (KDE Plasma, bootc only), and Floe (headless server). Base is the shared
foundation and is not a fifth installer choice. See the
[snosi installation guide](https://github.com/frostyard/snosi/blob/5b610e3db1017e0ccc9a5dabc10b841e80c1d2e5/docs/installing.md).

Snow's build uses the Trixie userspace with a newer kernel selection. The
pinned sources do not publish a per-product application test matrix, so use the
image page and the installer picker together: choose Snow for a GNOME desktop,
not for a server role.

## Install

Firn is the supported installer. It requires UEFI, erases the selected target
disk, and supports machines with or without Secure Boot, TPM 2.0, or disk
encryption by making each choice explicit. Use at least 30 GiB, and more when
you plan to keep Flatpaks, containers, and updates.

- [Installer ISO](https://repository.frostyard.org/isos/native/v1/snosi-installer-latest-x86-64.iso)
- [SHA256SUMS](https://repository.frostyard.org/isos/native/v1/SHA256SUMS)
- [SHA256SUMS.gpg](https://repository.frostyard.org/isos/native/v1/SHA256SUMS.gpg)
- [Complete installation guide](https://github.com/frostyard/snosi/blob/5b610e3db1017e0ccc9a5dabc10b841e80c1d2e5/docs/installing.md)

The `native` segment in the ISO URL is a retained publication namespace, not an
A/B installer choice. Verify the signing-key fingerprint and the ISO before
writing media. The maintained guide gives the exact `gpgv` and `sha256sum`
checks, the device-identification warning, and the Firn wizard steps. This page
does not repeat the disk-writing commands.

During installation, select the bootc Snow product, review the generated
recipe, and confirm the exact target-disk path. If Firn displays a recovery key,
store it outside the installed disk before you continue. A missing MOK
enrollment leaves the MOK-signed stage untrusted while Secure Boot is enforced.

## First boot and use

The desktop session is GDM-based. Firn has already created the first user.
Firn can install the chosen core Flatpak set as part of the recipe. The image
ships the core-set list and OCI label, not the Flatpak payloads.

Use read-only status checks first:

```bash
systemctl is-system-running
sudo bootc status
sudo snosi-update-status --check
systemctl list-timers bootc-update-stage.timer
```

These are the post-install checks in the maintained
[installation guide](https://github.com/frostyard/snosi/blob/5b610e3db1017e0ccc9a5dabc10b841e80c1d2e5/docs/installing.md).
`bootc status` should name the followed image, not `null`. `bootc status`
reports the deployment and staged state; `snosi-update-status --check` reports
whether a newer published image is available.

For application payloads, prefer the image's own tools and the documented
system extensions. Do not add host-level APT packages to an immutable `/usr`
tree: they do not survive an image update as a supported layer. The Base and
Snow package sets are build inputs, not a package-manager contract.

## Updates and rollback

Published bootc images run `bootc-update-stage.timer` hourly. The stager pulls
the followed image with Podman, stages it with `bootc switch --transport
containers-storage`, and leaves it for the next natural reboot. It does not
force a reboot. The timer and its preset are in the Base image:
[`bootc-update-stage.timer`](https://github.com/frostyard/snosi/blob/5b610e3db1017e0ccc9a5dabc10b841e80c1d2e5/mkosi.images/base/mkosi.extra/usr/lib/systemd/system/bootc-update-stage.timer)
and
[`04-bootc-update.preset`](https://github.com/frostyard/snosi/blob/5b610e3db1017e0ccc9a5dabc10b841e80c1d2e5/mkosi.images/base/mkosi.extra/usr/lib/systemd/system-preset/04-bootc-update.preset).

To return to the previous deployment:

```bash
sudo bootc rollback
sudo systemctl reboot
```

`/var` is shared across deployments, so homes and container data survive a
rollback. A rollback also changes the followed image reference; the updater
will not re-stage the deployment you rolled away from. The migration runbook
documents this behavior and the disk-headroom requirement: the updater pulls a
new image into `/var` before staging it, so keep roughly twice the image size
free in `/var`.

The secure path is separate. The pinned sources say update and rollback remain
unproven for the signed secure layout, and existing installations cannot be
converted in place to that layout. Do not treat `bootc rollback` as evidence
that signed secure rollback is supported.

## Special cases and troubleshooting

| Symptom | Check | Next action |
| --- | --- | --- |
| `bootc status` shows `spec.image: null` | The host is not bootc-managed; it is likely an nbc or native A/B install | Back up, perform a fresh Firn install, and restore state. There is no in-place conversion. |
| No update is staged | `systemctl list-timers bootc-update-stage.timer` and `journalctl -u bootc-update-stage.service` | Wait for the hourly run. Check that the host has network access and free space in `/var`. |
| Staging fails with no space | Compare free `/var` space with the image size | Free space or enlarge the disk. The updater needs room for the pull, the deployment, and the previous deployment. |
| Secure Boot or TPM behavior is unclear | `bootc status`, firmware state, and the secure-operations runbook | Do not claim production secure support. The fresh-install and lifecycle evidence gates are still pending. |
| Snowfield hardware behavior is needed | The product page and installer notes | Snowfield is a different image and its representative hardware install is untested. Do not generalize Snow results to it. |

Legacy nbc and native A/B hosts receive no new images or updates after
2026-09-30. The migration path is a backup, a fresh bootc install with Firn, and
a state restore. The pinned
[migration runbook](https://github.com/frostyard/snosi/blob/5b610e3db1017e0ccc9a5dabc10b841e80c1d2e5/docs/nbc-to-bootc-migration.md)
lists what to capture, including `/etc` deltas, homes, Podman volumes, and
`/var/lib/tailscale` when Tailscale is in use. Verify the backup from another
machine before wiping the target disk.

## See also

- [Install a Frostyard image](/install)
- [Docker system extension](/docs/sysexts/docker/)
- [Incus system extension](/docs/sysexts/incus/)
- [Tailscale system extension](/docs/sysexts/tailscale/)
- [nbc to bootc migration runbook](https://github.com/frostyard/snosi/blob/5b610e3db1017e0ccc9a5dabc10b841e80c1d2e5/docs/nbc-to-bootc-migration.md)
- [Bootc Secure Operations runbook](https://github.com/frostyard/snosi/blob/5b610e3db1017e0ccc9a5dabc10b841e80c1d2e5/docs/bootc-secure-operations.md)

## Sources

Reviewed 2026-10-22 against snosi commit
[`5b610e3db1017e0ccc9a5dabc10b841e80c1d2e5`](https://github.com/frostyard/snosi/tree/5b610e3db1017e0ccc9a5dabc10b841e80c1d2e5).

- [`README.md`](https://github.com/frostyard/snosi/blob/5b610e3db1017e0ccc9a5dabc10b841e80c1d2e5/README.md)
- [`mkosi.profiles/snow/mkosi.conf`](https://github.com/frostyard/snosi/blob/5b610e3db1017e0ccc9a5dabc10b841e80c1d2e5/mkosi.profiles/snow/mkosi.conf)
- [`shared/composition/snow/mkosi.conf`](https://github.com/frostyard/snosi/blob/5b610e3db1017e0ccc9a5dabc10b841e80c1d2e5/shared/composition/snow/mkosi.conf)
- [`shared/packages/snow/mkosi.conf`](https://github.com/frostyard/snosi/blob/5b610e3db1017e0ccc9a5dabc10b841e80c1d2e5/shared/packages/snow/mkosi.conf)
- [`shared/kernel/backports/mkosi.conf`](https://github.com/frostyard/snosi/blob/5b610e3db1017e0ccc9a5dabc10b841e80c1d2e5/shared/kernel/backports/mkosi.conf)
- [`mkosi.images/base/mkosi.conf`](https://github.com/frostyard/snosi/blob/5b610e3db1017e0ccc9a5dabc10b841e80c1d2e5/mkosi.images/base/mkosi.conf)
- [`flatpaks/snow.json`](https://github.com/frostyard/snosi/blob/5b610e3db1017e0ccc9a5dabc10b841e80c1d2e5/flatpaks/snow.json)
- [`flatpaks/core-flatpaks.py`](https://github.com/frostyard/snosi/blob/5b610e3db1017e0ccc9a5dabc10b841e80c1d2e5/flatpaks/core-flatpaks.py)
- [`shared/composition/core-flatpaks.postoutput`](https://github.com/frostyard/snosi/blob/5b610e3db1017e0ccc9a5dabc10b841e80c1d2e5/shared/composition/core-flatpaks.postoutput)
- [`mkosi.images/base/mkosi.extra/usr/libexec/bootc-update-stage`](https://github.com/frostyard/snosi/blob/5b610e3db1017e0ccc9a5dabc10b841e80c1d2e5/mkosi.images/base/mkosi.extra/usr/libexec/bootc-update-stage)
- [`docs/installing.md`](https://github.com/frostyard/snosi/blob/5b610e3db1017e0ccc9a5dabc10b841e80c1d2e5/docs/installing.md)
- [`docs/bootc-secure-operations.md`](https://github.com/frostyard/snosi/blob/5b610e3db1017e0ccc9a5dabc10b841e80c1d2e5/docs/bootc-secure-operations.md)
- [`docs/nbc-to-bootc-migration.md`](https://github.com/frostyard/snosi/blob/5b610e3db1017e0ccc9a5dabc10b841e80c1d2e5/docs/nbc-to-bootc-migration.md)
