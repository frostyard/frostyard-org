---
title: Get software
description: Choose Flatpak, Homebrew, a system extension, or Distrobox to add software to a Frostyard image.
---

On a Frostyard image, the image owns `/usr`. It is read-only, and an update
replaces it. Add your software on top, with the tool that fits.

| You want | Use | Go to |
| --- | --- | --- |
| A desktop app | Flatpak | [Flatpak](#flatpak) |
| A command-line tool | Homebrew | [Homebrew](#homebrew) |
| A service, a daemon, or a tool that needs `/usr` or root | A system extension | [System extensions](#system-extensions) |
| A Debian package, or another distribution | Distrobox | [Distrobox](#distrobox) |

Do not install APT packages into `/usr`: an image update does not keep them.

## Flatpak

Use Flatpak for desktop apps. [Snow](/docs/images/snow/),
[Snowfield](/docs/images/snowfield/), and [Sundog](/docs/images/sundog/)
include Flatpak and the Flathub remote. [Floe](/docs/images/floe/) has no
Flatpak: use another tool on it.

Find and install an app:

```bash
flatpak search NAME
flatpak install flathub APP_ID
```

Check that it is there:

```bash
flatpak list --app
```

The app is in the list.

Flatpak apps do not update by themselves unless you turn that on. Update them
with `flatpak update`, [ChairLift](/docs/tools/chairlift/), Bazaar (Snow,
Snowfield), or Discover (Sundog). Bazaar and Discover each have an automatic
update setting, which is off by default.

- Snow, Snowfield, and Sundog carry Bazaar, an app store, in their core
  Flatpak set. Firn installs the set only if your install recipe includes it.
  On Sundog, the app store is Discover: Sundog turns off Bazaar's background
  service.
- Frostyard's own Flatpak remote has one app: Igloo. See
  [Igloo](/docs/tools/igloo/) for the steps.
- [Frostmail](/docs/apps/frostmail/) and [Frostnotes](/docs/apps/frostnotes/)
  have no published Flatpak. Frostyard plans to ship them as Flatpaks, and the
  plan is not final. Build them from source today.
- Some desktop apps are system extensions in the catalog instead, for example
  Visual Studio Code and 1Password. See the
  [catalog](/docs/sysexts/).

## Homebrew

Use Homebrew for command-line tools. Snow, Snowfield, Sundog, and Floe include
it. At first boot, `brew-setup.service` unpacks it into `/var/home/linuxbrew`.
The service runs only while `/var/home/linuxbrew/.linuxbrew` does not exist,
and it gives Homebrew to UID 1000. That is the first user you create.

Check that your shell finds it:

```bash
brew --version
```

You see a version. If the shell says the command is not found, you are
probably in bash: fish loads Homebrew on its own. Add this line to
`~/.bashrc`, then open a new terminal:

```bash
eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
```

Install a tool, then list what you have:

```bash
brew install NAME
brew list
```

Homebrew updates itself. `brew update` runs 10 minutes after boot, then about
every 6 hours. `brew upgrade` runs 30 minutes after boot, then about every 8
hours. On Snow, Snowfield, and Sundog, ChairLift updates Homebrew too.

The images ship Brewfile bundles of recommended tools:

- Snow and Snowfield: `/usr/share/snow/bundles/cli.Brewfile` and
  `/usr/share/snow/bundles/fonts.Brewfile`.
- Floe: `/usr/share/floe/bundles/cli.Brewfile`.

Sundog has no bundle file.

Install one with `brew bundle --file=PATH`. On Snow and Snowfield, ChairLift
can also install curated bundles.

Frostyard's Homebrew tap, `frostyard/tap`, has 2 casks: `nsl` and `chairlift`.
The [nsl](/docs/tools/nsl/) page uses it to install the nsl CLI.

## System extensions

Use a system extension for a service, a daemon, or a tool that must be in
`/usr` or run as root. Docker, Incus, and Tailscale are examples. Every image
carries a definition for each extension in the catalog, switched off. The
extension itself is not in the image: Updex turns it on and downloads it.

Start with [Manage extensions](/docs/sysexts/manage/). The
[catalog](/docs/sysexts/) lists every extension.

## Distrobox

Use Distrobox for a mutable Debian, or another distribution where `apt` works.
Snow, Snowfield, Sundog, and Floe ship Podman and Distrobox.

```bash
distrobox create --name NAME --image IMAGE
distrobox enter NAME
```

You are now in the container, and its package manager works there. Read
[distrobox.it](https://distrobox.it/) for the rest.

For a whole Linux machine, use [nsl](/docs/tools/nsl/). Images are built
from the Frostyard [APT repository](/docs/tools/apt-repository/) and update as
a whole: you do not add it to an image.

## Sources

- Delivery guidance: core [`docs/tenets.md`](https://github.com/frostyard/core/blob/5f36f7edb88e87cbb31892255f5fb7037361cf91/docs/tenets.md), proposed in core#161, not merged.
- Suite app delivery: core [`docs/adr/0058-ship-suite-desktop-apps-as-flatpaks-and-services-as-sysexts.md`](https://github.com/frostyard/core/blob/d55b259c57c636169e9a86f89ce808b075a1bf3c/docs/adr/0058-ship-suite-desktop-apps-as-flatpaks-and-services-as-sysexts.md) (Status: Proposed).
- Flathub remote: snosi [`shared/snow/tree/etc/flatpak/remotes.d/flathub.flatpakrepo`](https://github.com/frostyard/snosi/blob/82c45014c62d27428cec14292fadc9ee28ea1119/shared/snow/tree/etc/flatpak/remotes.d/flathub.flatpakrepo) and [`shared/sundog/scripts/postinstall/sundog.postinst.chroot`](https://github.com/frostyard/snosi/blob/82c45014c62d27428cec14292fadc9ee28ea1119/shared/sundog/scripts/postinstall/sundog.postinst.chroot).
- Flatpak, Podman, and Distrobox packages: snosi [`shared/packages/snow/mkosi.conf`](https://github.com/frostyard/snosi/blob/82c45014c62d27428cec14292fadc9ee28ea1119/shared/packages/snow/mkosi.conf), [`shared/packages/sundog/mkosi.conf`](https://github.com/frostyard/snosi/blob/82c45014c62d27428cec14292fadc9ee28ea1119/shared/packages/sundog/mkosi.conf), and [`shared/packages/floe/mkosi.conf`](https://github.com/frostyard/snosi/blob/82c45014c62d27428cec14292fadc9ee28ea1119/shared/packages/floe/mkosi.conf).
- Snowfield includes the Snow composition: snosi [`mkosi.profiles/snowfield/mkosi.conf`](https://github.com/frostyard/snosi/blob/82c45014c62d27428cec14292fadc9ee28ea1119/mkosi.profiles/snowfield/mkosi.conf).
- Core Flatpak sets: snosi [`flatpaks/snow.json`](https://github.com/frostyard/snosi/blob/82c45014c62d27428cec14292fadc9ee28ea1119/flatpaks/snow.json) and [`flatpaks/sundog.json`](https://github.com/frostyard/snosi/blob/82c45014c62d27428cec14292fadc9ee28ea1119/flatpaks/sundog.json).
- Frostyard Flatpak remote: flatpak-index [`README.md`](https://github.com/frostyard/flatpak-index/blob/ce9f016860ed19d8e532facb605b7b9635f380cd/README.md) and [`apps.json`](https://github.com/frostyard/flatpak-index/blob/ce9f016860ed19d8e532facb605b7b9635f380cd/apps.json).
- Homebrew in each image: snosi [`shared/composition/snow/mkosi.conf`](https://github.com/frostyard/snosi/blob/82c45014c62d27428cec14292fadc9ee28ea1119/shared/composition/snow/mkosi.conf), [`shared/composition/sundog/mkosi.conf`](https://github.com/frostyard/snosi/blob/82c45014c62d27428cec14292fadc9ee28ea1119/shared/composition/sundog/mkosi.conf), [`shared/composition/floe/mkosi.conf`](https://github.com/frostyard/snosi/blob/82c45014c62d27428cec14292fadc9ee28ea1119/shared/composition/floe/mkosi.conf), and [`shared/scripts/build/brew.chroot`](https://github.com/frostyard/snosi/blob/82c45014c62d27428cec14292fadc9ee28ea1119/shared/scripts/build/brew.chroot).
- Homebrew first-boot setup: snosi [`shared/snow/tree/usr/lib/systemd/system/brew-setup.service`](https://github.com/frostyard/snosi/blob/82c45014c62d27428cec14292fadc9ee28ea1119/shared/snow/tree/usr/lib/systemd/system/brew-setup.service). Floe and Sundog use the files under `shared/floe/tree/`.
- Homebrew update timers: snosi [`brew-update.timer`](https://github.com/frostyard/snosi/blob/82c45014c62d27428cec14292fadc9ee28ea1119/shared/snow/tree/usr/lib/systemd/system/brew-update.timer), [`brew-update.service`](https://github.com/frostyard/snosi/blob/82c45014c62d27428cec14292fadc9ee28ea1119/shared/snow/tree/usr/lib/systemd/system/brew-update.service), [`brew-upgrade.timer`](https://github.com/frostyard/snosi/blob/82c45014c62d27428cec14292fadc9ee28ea1119/shared/snow/tree/usr/lib/systemd/system/brew-upgrade.timer), [`brew-upgrade.service`](https://github.com/frostyard/snosi/blob/82c45014c62d27428cec14292fadc9ee28ea1119/shared/snow/tree/usr/lib/systemd/system/brew-upgrade.service), and [`01-homebrew.preset`](https://github.com/frostyard/snosi/blob/82c45014c62d27428cec14292fadc9ee28ea1119/shared/snow/tree/usr/lib/systemd/system-preset/01-homebrew.preset).
- fish setup for Homebrew: snosi [`ublue-brew.fish`](https://github.com/frostyard/snosi/blob/82c45014c62d27428cec14292fadc9ee28ea1119/mkosi.images/base/mkosi.extra/usr/share/fish/vendor_conf.d/ublue-brew.fish).
- Brewfile bundles: snosi [`shared/snow/tree/usr/share/snow/bundles/cli.Brewfile`](https://github.com/frostyard/snosi/blob/82c45014c62d27428cec14292fadc9ee28ea1119/shared/snow/tree/usr/share/snow/bundles/cli.Brewfile), [`fonts.Brewfile`](https://github.com/frostyard/snosi/blob/82c45014c62d27428cec14292fadc9ee28ea1119/shared/snow/tree/usr/share/snow/bundles/fonts.Brewfile), and [`shared/floe/tree/usr/share/floe/bundles/cli.Brewfile`](https://github.com/frostyard/snosi/blob/82c45014c62d27428cec14292fadc9ee28ea1119/shared/floe/tree/usr/share/floe/bundles/cli.Brewfile), the bundle instructions in [`shared/snow/tree/usr/share/snow/bundles/README.txt`](https://github.com/frostyard/snosi/blob/82c45014c62d27428cec14292fadc9ee28ea1119/shared/snow/tree/usr/share/snow/bundles/README.txt) and [`shared/floe/tree/usr/share/floe/bundles/README.txt`](https://github.com/frostyard/snosi/blob/82c45014c62d27428cec14292fadc9ee28ea1119/shared/floe/tree/usr/share/floe/bundles/README.txt), and Sundog's removal of `/usr/share/floe` in [`sundog.postinst.chroot`](https://github.com/frostyard/snosi/blob/82c45014c62d27428cec14292fadc9ee28ea1119/shared/sundog/scripts/postinstall/sundog.postinst.chroot).
- Frostyard Homebrew tap casks: homebrew-tap [`Casks/`](https://github.com/frostyard/homebrew-tap/tree/f96abc1cbdc9e6b7de1494c0241eb5a3f43aec84/Casks).
- APT timers off in the image: snosi [`00-apt.preset`](https://github.com/frostyard/snosi/blob/82c45014c62d27428cec14292fadc9ee28ea1119/mkosi.images/base/mkosi.extra/usr/lib/systemd/system-preset/00-apt.preset).
- Flatpak commands: flatpak [`doc/flatpak-search.xml`](https://github.com/flatpak/flatpak/blob/ed425ed0c9d23d3fe69110386929f8d34c928490/doc/flatpak-search.xml), [`doc/flatpak-install.xml`](https://github.com/flatpak/flatpak/blob/ed425ed0c9d23d3fe69110386929f8d34c928490/doc/flatpak-install.xml), [`doc/flatpak-list.xml`](https://github.com/flatpak/flatpak/blob/ed425ed0c9d23d3fe69110386929f8d34c928490/doc/flatpak-list.xml) (`--app`), and [`doc/flatpak-update.xml`](https://github.com/flatpak/flatpak/blob/ed425ed0c9d23d3fe69110386929f8d34c928490/doc/flatpak-update.xml).
- Distrobox commands: distrobox [`docs/usage/distrobox-create.md`](https://github.com/89luca89/distrobox/blob/24035a6dd11d0ec2f88ee46a8a4b89876d62c56b/docs/usage/distrobox-create.md) (`--image`, `--name`) and [`docs/usage/distrobox-enter.md`](https://github.com/89luca89/distrobox/blob/24035a6dd11d0ec2f88ee46a8a4b89876d62c56b/docs/usage/distrobox-enter.md).
- Extension definitions, each with `Enabled=false`: snosi [`mkosi.images/base/mkosi.extra/usr/lib/`](https://github.com/frostyard/snosi/tree/82c45014c62d27428cec14292fadc9ee28ea1119/mkosi.images/base/mkosi.extra/usr/lib) (`sysupdate.<name>.d/<name>.feature`), for example [`docker.feature`](https://github.com/frostyard/snosi/blob/82c45014c62d27428cec14292fadc9ee28ea1119/mkosi.images/base/mkosi.extra/usr/lib/sysupdate.docker.d/docker.feature).
- ChairLift on Snow, Snowfield, and Sundog only: `frostyard-chairlift` in snosi [`shared/packages/snow/mkosi.conf`](https://github.com/frostyard/snosi/blob/82c45014c62d27428cec14292fadc9ee28ea1119/shared/packages/snow/mkosi.conf) and [`shared/packages/sundog/mkosi.conf`](https://github.com/frostyard/snosi/blob/82c45014c62d27428cec14292fadc9ee28ea1119/shared/packages/sundog/mkosi.conf), not in [`shared/packages/floe/mkosi.conf`](https://github.com/frostyard/snosi/blob/82c45014c62d27428cec14292fadc9ee28ea1119/shared/packages/floe/mkosi.conf).
- Sundog turns off Bazaar's service: snosi [`shared/sundog/tree/usr/lib/systemd/user-preset/90-sundog.preset`](https://github.com/frostyard/snosi/blob/82c45014c62d27428cec14292fadc9ee28ea1119/shared/sundog/tree/usr/lib/systemd/user-preset/90-sundog.preset).
- Bazaar automatic updates, default `false`: bazaar [`data/io.github.kolunmi.Bazaar.gschema.xml`](https://github.com/kolunmi/bazaar/blob/3d347d5d0fb828a0ff6ff0c1dcd356b26ddfdd33/data/io.github.kolunmi.Bazaar.gschema.xml) (`auto-update`).
- Discover automatic updates, default `false`: discover [`kcm/updatessettings.kcfg`](https://github.com/KDE/discover/blob/4c44f74f1eff31ec7b2a455a4b6b481f7be3625f/kcm/updatessettings.kcfg) (`UseUnattendedUpdates`).
- ChairLift bundles come from `/usr/share/snow/bundles` by default: chairlift [`CONFIG.md`](https://github.com/frostyard/chairlift/blob/14e6bbd6381cc660b551b21b3e8a5f8de09eb354/CONFIG.md) (`bundles_paths`).
- Images are built from the APT repository and carry no Frostyard APT source: core ADR-0059 (Status: Proposed), Context, at core#162 head [`a087df3`](https://github.com/frostyard/core/blob/a087df359f5df47ef2c640ddb84bf9036b416e87/docs/adr/0059-publish-image-only-packages-in-a-separate-apt-component.md); owner decision, Brian, 2026-10-24.
