---
title: Base
description: The shared foundation of every Frostyard image, and why it is not an installer choice.
---

Base is the shared foundation of every Frostyard image. Snow, Snowfield,
Sundog, and Floe each build on it, then add a bootc runtime, their own
software, and a kernel. Base is not an installer choice: Firn offers only
Snow, Snowfield, Sundog, and Floe.

Every image gets the same update stager, the same status tool, and the same
system-extension definitions from Base. They behave the same on a desktop and
on a server.

:::caution[Secure Boot is not production-ready yet]
Base carries the update tools that every image uses, but Frostyard does not
yet claim production Secure Boot support, signed updates, or signed rollback.
Fresh-install test results for Snow, Floe, and Sundog are still pending. An
existing install cannot convert to the secure layout in place.
:::

## The layers

A Frostyard image is built in five layers. Each product profile includes them
in this order:

| Layer | What it adds |
| --- | --- |
| Base | Debian Trixie userspace, systemd, the update stager, Updex, and the system-extension definitions |
| Bootc runtime | `bootc`, `libostree-1-1`, the packages OCI bootc needs, and the bootc security setup |
| Product composition | The desktop or server payload, its services, and its core Flatpak list, when it has one |
| Kernel | The product's kernel, firmware, and Mesa |
| Output format | The directory output that mkosi writes |

The product profile selects the composition and the kernel. Snow and Floe use
the backports kernel, Snowfield uses the linux-surface kernel, and Sundog uses
the backports kernel with a KDE composition. The other layers are shared.

## What Base gives you

Base holds the parts that should work the same everywhere: the Debian Trixie
userspace, systemd, the update stager, the status tool, Updex, the
system-extension definitions, microcode and firmware updates, networking, and
the command-line tools.

The system keeps `/usr` immutable, manages `/etc` across deployments, and
keeps `/var` persistent. The image ships no service enablement links in
`/etc`. Presets create them at first boot.

Base builds as a directory image. The root build is not bootable, and it has
no installer entry.

## Updates

Every image runs the same stager. `bootc-update-stage.timer` fires every hour,
with a random delay of up to 15 minutes. It pulls the image it follows with
Podman, verifies the staged digest, and stages the new version. The version
starts at your next normal reboot. The stager does not force a reboot.

Check the state on any image:

```bash
sudo snosi-update-status
sudo snosi-update-status --check
sudo snosi-update-status --pkg-diff
systemctl list-timers bootc-update-stage.timer
```

`snosi-update-status` must run as root. It prints the running version, the
image the host follows, the result of the last check, and any staged update.
`--check` also queries the registry and compares versions, never digests.
`--pkg-diff` lists the Debian package changes between the running image and
the staged one.

The stager records its result in `/run/snosi/update-check` and
`/run/snosi/update-staged`. The files do not survive a reboot. The login
message on a headless system reports a staged update or a failed check. For a
failure, run `journalctl -u bootc-update-stage.service`.

The stager's service starts only when the kernel command line has
`composefs`. On a host that bootc does not manage, the stager exits without
changes.

## System extensions

Base carries the system-extension definitions in `/usr/lib/sysupdate.<name>.d/`.
Each component has a `.transfer` file that downloads its image from
`https://repository.frostyard.org/ext/<name>/` and verifies the signed
`SHA256SUMS`, and a `.feature` file that sets `Enabled=false`. `docker` and
`tailscale` are two examples.

Every extension starts switched off. Turn one on with
[Updex](/docs/tools/updex/); the [catalog](/docs/sysexts/) lists every
extension.

After `systemd-sysext.service` merges the enabled extensions,
`reload-sysext.service` runs `systemd-sysusers`, `systemd-tmpfiles`, and
`systemctl daemon-reload`.

## What ships

| Group | What it includes |
| --- | --- |
| Userspace | Debian Trixie, systemd, `dracut`, `sudo`, `systemd-cryptsetup`, `tpm2-tools`, `efibootmgr`, and `shim-signed` |
| Updates | `bootc-update-stage.timer`, the stager, `snosi-update-status`, and `frostyard-updex` |
| Extensions | The definitions under `/usr/lib/sysupdate.*.d/` and `reload-sysext.service` |
| Firmware and microcode | `amd64-microcode`, `intel-microcode`, `fwupd`, and `wireless-regdb` |
| Network | `network-manager`, `wpasupplicant`, `openssh-server`, and `systemd-resolved` |
| Tools | `git`, `curl`, `rsync`, `vim`, `jq`, `gcc`, `make`, `skopeo`, and `qemu-system-x86` |

The presets start NetworkManager, `reload-sysext.service`, and
`bootc-update-stage.timer`. They turn off the APT daily update and upgrade
timers, `bootc-fetch-apply-updates.timer`, and `rsync.service`.

## What Base does not include

- No desktop and no server payload. The product composition adds them.
- No kernel. Each product adds one.
- No core Flatpak set of its own. Snow and Snowfield share one list, Sundog
  has its own, and Floe has none.
- No product name. Each product profile sets its own `ImageId`.

## Choose an image

Firn offers only these four bootc products. Base is not one of them.

| Product | Role | Page |
| --- | --- | --- |
| Snow | General-purpose GNOME desktop | [Snow](/docs/images/snow/) |
| Snowfield | GNOME desktop for Microsoft Surface devices | [Snowfield](/docs/images/snowfield/) |
| Sundog | KDE Plasma desktop, bootc only | [Sundog](/docs/images/sundog/) |
| Floe | Headless server image | [Floe](/docs/images/floe/) |

Snowfield is untested on representative Surface hardware. The
[Snow page](/docs/images/snow/#choose-snow) compares the products.

## See also

- [Install a Frostyard image](/install)
- [Install, update, and roll back](/docs/images/install-update/)
- [Snow image](/docs/images/snow/)
- [System extension catalog](/docs/sysexts/)
- [Updex](/docs/tools/updex/)
- [nbc to bootc migration runbook](https://github.com/frostyard/snosi/blob/e5d0597f5b53ddddfa7a35ff6f706b094f20f76b/docs/nbc-to-bootc-migration.md)
- [Bootc Secure Operations runbook](https://github.com/frostyard/snosi/blob/e5d0597f5b53ddddfa7a35ff6f706b094f20f76b/docs/bootc-secure-operations.md)

## Sources

Reviewed 2026-10-22 against snosi commit
[`e5d0597f5b53ddddfa7a35ff6f706b094f20f76b`](https://github.com/frostyard/snosi/tree/e5d0597f5b53ddddfa7a35ff6f706b094f20f76b).

- [`README.md`](https://github.com/frostyard/snosi/blob/e5d0597f5b53ddddfa7a35ff6f706b094f20f76b/README.md)
- [`mkosi.conf`](https://github.com/frostyard/snosi/blob/e5d0597f5b53ddddfa7a35ff6f706b094f20f76b/mkosi.conf)
- [`mkosi.images/base/mkosi.conf`](https://github.com/frostyard/snosi/blob/e5d0597f5b53ddddfa7a35ff6f706b094f20f76b/mkosi.images/base/mkosi.conf)
- [`shared/packages/bootc/mkosi.conf`](https://github.com/frostyard/snosi/blob/e5d0597f5b53ddddfa7a35ff6f706b094f20f76b/shared/packages/bootc/mkosi.conf)
- [`shared/bootc-secure/mkosi.conf`](https://github.com/frostyard/snosi/blob/e5d0597f5b53ddddfa7a35ff6f706b094f20f76b/shared/bootc-secure/mkosi.conf)
- [`shared/outformat/image/mkosi.conf`](https://github.com/frostyard/snosi/blob/e5d0597f5b53ddddfa7a35ff6f706b094f20f76b/shared/outformat/image/mkosi.conf)
- [`shared/kernel/backports/mkosi.conf`](https://github.com/frostyard/snosi/blob/e5d0597f5b53ddddfa7a35ff6f706b094f20f76b/shared/kernel/backports/mkosi.conf)
- [`shared/kernel/surface/mkosi.conf`](https://github.com/frostyard/snosi/blob/e5d0597f5b53ddddfa7a35ff6f706b094f20f76b/shared/kernel/surface/mkosi.conf)
- [`mkosi.profiles/snowfield/mkosi.conf`](https://github.com/frostyard/snosi/blob/e5d0597f5b53ddddfa7a35ff6f706b094f20f76b/mkosi.profiles/snowfield/mkosi.conf)
- [`flatpaks/core-flatpaks.py`](https://github.com/frostyard/snosi/blob/e5d0597f5b53ddddfa7a35ff6f706b094f20f76b/flatpaks/core-flatpaks.py)
- [`mkosi.images/base/mkosi.extra/usr/libexec/bootc-update-stage`](https://github.com/frostyard/snosi/blob/e5d0597f5b53ddddfa7a35ff6f706b094f20f76b/mkosi.images/base/mkosi.extra/usr/libexec/bootc-update-stage)
- [`mkosi.images/base/mkosi.extra/usr/bin/snosi-update-status`](https://github.com/frostyard/snosi/blob/e5d0597f5b53ddddfa7a35ff6f706b094f20f76b/mkosi.images/base/mkosi.extra/usr/bin/snosi-update-status)
- [`mkosi.images/base/mkosi.extra/usr/lib/systemd/system/bootc-update-stage.timer`](https://github.com/frostyard/snosi/blob/e5d0597f5b53ddddfa7a35ff6f706b094f20f76b/mkosi.images/base/mkosi.extra/usr/lib/systemd/system/bootc-update-stage.timer)
- [`mkosi.images/base/mkosi.extra/usr/lib/systemd/system/bootc-update-stage.service`](https://github.com/frostyard/snosi/blob/e5d0597f5b53ddddfa7a35ff6f706b094f20f76b/mkosi.images/base/mkosi.extra/usr/lib/systemd/system/bootc-update-stage.service)
- [`mkosi.images/base/mkosi.extra/usr/lib/systemd/system/reload-sysext.service`](https://github.com/frostyard/snosi/blob/e5d0597f5b53ddddfa7a35ff6f706b094f20f76b/mkosi.images/base/mkosi.extra/usr/lib/systemd/system/reload-sysext.service)
- [`mkosi.images/base/mkosi.extra/etc/update-motd.d/86-bootc-update-staged`](https://github.com/frostyard/snosi/blob/e5d0597f5b53ddddfa7a35ff6f706b094f20f76b/mkosi.images/base/mkosi.extra/etc/update-motd.d/86-bootc-update-staged)
- [`mkosi.images/base/mkosi.extra/usr/lib/systemd/system-preset/00-apt.preset`](https://github.com/frostyard/snosi/blob/e5d0597f5b53ddddfa7a35ff6f706b094f20f76b/mkosi.images/base/mkosi.extra/usr/lib/systemd/system-preset/00-apt.preset)
- [`mkosi.images/base/mkosi.extra/usr/lib/systemd/system-preset/00-network.preset`](https://github.com/frostyard/snosi/blob/e5d0597f5b53ddddfa7a35ff6f706b094f20f76b/mkosi.images/base/mkosi.extra/usr/lib/systemd/system-preset/00-network.preset)
- [`mkosi.images/base/mkosi.extra/usr/lib/systemd/system-preset/03-core.preset`](https://github.com/frostyard/snosi/blob/e5d0597f5b53ddddfa7a35ff6f706b094f20f76b/mkosi.images/base/mkosi.extra/usr/lib/systemd/system-preset/03-core.preset)
- [`mkosi.images/base/mkosi.extra/usr/lib/systemd/system-preset/04-bootc-update.preset`](https://github.com/frostyard/snosi/blob/e5d0597f5b53ddddfa7a35ff6f706b094f20f76b/mkosi.images/base/mkosi.extra/usr/lib/systemd/system-preset/04-bootc-update.preset)
- [`mkosi.images/base/mkosi.extra/usr/lib/sysupdate.docker.d/docker.feature`](https://github.com/frostyard/snosi/blob/e5d0597f5b53ddddfa7a35ff6f706b094f20f76b/mkosi.images/base/mkosi.extra/usr/lib/sysupdate.docker.d/docker.feature)
- [`mkosi.images/base/mkosi.extra/usr/lib/sysupdate.docker.d/docker.transfer`](https://github.com/frostyard/snosi/blob/e5d0597f5b53ddddfa7a35ff6f706b094f20f76b/mkosi.images/base/mkosi.extra/usr/lib/sysupdate.docker.d/docker.transfer)
- [`mkosi.images/base/mkosi.extra/usr/lib/sysupdate.tailscale.d/tailscale.feature`](https://github.com/frostyard/snosi/blob/e5d0597f5b53ddddfa7a35ff6f706b094f20f76b/mkosi.images/base/mkosi.extra/usr/lib/sysupdate.tailscale.d/tailscale.feature)
- [`shared/firn-installer/catalog.json`](https://github.com/frostyard/snosi/blob/e5d0597f5b53ddddfa7a35ff6f706b094f20f76b/shared/firn-installer/catalog.json)
- [`docs/installing.md`](https://github.com/frostyard/snosi/blob/e5d0597f5b53ddddfa7a35ff6f706b094f20f76b/docs/installing.md)
- [`docs/bootc-secure-operations.md`](https://github.com/frostyard/snosi/blob/e5d0597f5b53ddddfa7a35ff6f706b094f20f76b/docs/bootc-secure-operations.md)
- [`docs/adr/0002-ship-no-enablement-symlinks-in-etc.md`](https://github.com/frostyard/snosi/blob/e5d0597f5b53ddddfa7a35ff6f706b094f20f76b/docs/adr/0002-ship-no-enablement-symlinks-in-etc.md)
- [`docs/design/overview.md`](https://github.com/frostyard/snosi/blob/e5d0597f5b53ddddfa7a35ff6f706b094f20f76b/docs/design/overview.md)
- [`docs/design/sysexts.md`](https://github.com/frostyard/snosi/blob/e5d0597f5b53ddddfa7a35ff6f706b094f20f76b/docs/design/sysexts.md)
