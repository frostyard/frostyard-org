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
- Frostyard's own Flatpak remote has 3 apps: [Igloo](/docs/tools/igloo/),
  [Frostnotes](/docs/apps/frostnotes/), and [Frostmail](/docs/apps/frostmail/).
  Add it as a user remote. Each page has the steps. Their runtimes come from
  Flathub.
- A desktop app for [frostread](/docs/apps/frostread/) is planned. Frostnotes
  and Frostmail work on their own, without lodge. You opt into lodge for each
  app.
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
An enabled extension updates on its own: a new version is staged and starts at the next boot. See [Automatic updates](/docs/sysexts/manage/#automatic-updates).

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

- Which tool for which software: core [`docs/tenets.md`](https://github.com/frostyard/core/blob/cd2720e0c55d08f3ba8f28a3b55dd5796a5c425a/docs/tenets.md), section "Delivery", at `cd2720e0c55d08f3ba8f28a3b55dd5796a5c425a`. It prefers `brew` over `apt` for user-space command-line tools, Flatpak for desktop software, and systemd-sysext for daemons and system services. It uses systemd-sysext for GUI tools only where a Flatpak is not possible or available.
- Suite app delivery: core [`docs/adr/0058-ship-suite-desktop-apps-as-flatpaks-and-services-as-sysexts.md`](https://github.com/frostyard/core/blob/28e7847642a05214415af6d8d2ddf7f3033682d5/docs/adr/0058-ship-suite-desktop-apps-as-flatpaks-and-services-as-sysexts.md) (Status: Accepted, 2026-10-26).
- Flathub remote: snosi [`shared/snow/tree/etc/flatpak/remotes.d/flathub.flatpakrepo`](https://github.com/frostyard/snosi/blob/b2858ca0222814c395cf8248db98f3e096d57dc9/shared/snow/tree/etc/flatpak/remotes.d/flathub.flatpakrepo) and [`shared/sundog/scripts/postinstall/sundog.postinst.chroot`](https://github.com/frostyard/snosi/blob/b2858ca0222814c395cf8248db98f3e096d57dc9/shared/sundog/scripts/postinstall/sundog.postinst.chroot).
- Flatpak, Podman, and Distrobox packages: snosi [`shared/packages/snow/mkosi.conf`](https://github.com/frostyard/snosi/blob/b2858ca0222814c395cf8248db98f3e096d57dc9/shared/packages/snow/mkosi.conf), [`shared/packages/sundog/mkosi.conf`](https://github.com/frostyard/snosi/blob/b2858ca0222814c395cf8248db98f3e096d57dc9/shared/packages/sundog/mkosi.conf), and [`shared/packages/floe/mkosi.conf`](https://github.com/frostyard/snosi/blob/b2858ca0222814c395cf8248db98f3e096d57dc9/shared/packages/floe/mkosi.conf).
- Snowfield includes the Snow composition: snosi [`mkosi.profiles/snowfield/mkosi.conf`](https://github.com/frostyard/snosi/blob/b2858ca0222814c395cf8248db98f3e096d57dc9/mkosi.profiles/snowfield/mkosi.conf).
- Core Flatpak sets: snosi [`flatpaks/snow.json`](https://github.com/frostyard/snosi/blob/b2858ca0222814c395cf8248db98f3e096d57dc9/flatpaks/snow.json) and [`flatpaks/sundog.json`](https://github.com/frostyard/snosi/blob/b2858ca0222814c395cf8248db98f3e096d57dc9/flatpaks/sundog.json).
- Frostyard Flatpak remote: flatpak-index [`README.md`](https://github.com/frostyard/flatpak-index/blob/ec8b85e371bd9cac79512904c1a8b27179c5cc6a/README.md) and [`apps.json`](https://github.com/frostyard/flatpak-index/blob/ec8b85e371bd9cac79512904c1a8b27179c5cc6a/apps.json) at `ec8b85e371bd9cac79512904c1a8b27179c5cc6a`.
- The per-user remote: Brian's decisions T532a (2026-10-29) and T532b: every user adds the remote. A fresh Snow install has no `frostyard` remote, user or system (Murbella's check, T540).
- Suite rule: core [`docs/adr/0062-make-desktop-suite-apps-standalone-flatpaks-with-opt-in-lodge.md`](https://github.com/frostyard/core/blob/4d340b939fccab2ecb7f0be5dbf9e7ab7c03963c/docs/adr/0062-make-desktop-suite-apps-standalone-flatpaks-with-opt-in-lodge.md) (Accepted 2026-10-27) at `4d340b939fccab2ecb7f0be5dbf9e7ab7c03963c`.
- Homebrew in each image: snosi [`shared/composition/snow/mkosi.conf`](https://github.com/frostyard/snosi/blob/b2858ca0222814c395cf8248db98f3e096d57dc9/shared/composition/snow/mkosi.conf), [`shared/composition/sundog/mkosi.conf`](https://github.com/frostyard/snosi/blob/b2858ca0222814c395cf8248db98f3e096d57dc9/shared/composition/sundog/mkosi.conf), [`shared/composition/floe/mkosi.conf`](https://github.com/frostyard/snosi/blob/b2858ca0222814c395cf8248db98f3e096d57dc9/shared/composition/floe/mkosi.conf), and [`shared/scripts/build/brew.chroot`](https://github.com/frostyard/snosi/blob/b2858ca0222814c395cf8248db98f3e096d57dc9/shared/scripts/build/brew.chroot).
- Homebrew first-boot setup: snosi [`shared/snow/tree/usr/lib/systemd/system/brew-setup.service`](https://github.com/frostyard/snosi/blob/b2858ca0222814c395cf8248db98f3e096d57dc9/shared/snow/tree/usr/lib/systemd/system/brew-setup.service). Floe and Sundog use the files under `shared/floe/tree/`.
- Homebrew update timers: snosi [`brew-update.timer`](https://github.com/frostyard/snosi/blob/b2858ca0222814c395cf8248db98f3e096d57dc9/shared/snow/tree/usr/lib/systemd/system/brew-update.timer), [`brew-update.service`](https://github.com/frostyard/snosi/blob/b2858ca0222814c395cf8248db98f3e096d57dc9/shared/snow/tree/usr/lib/systemd/system/brew-update.service), [`brew-upgrade.timer`](https://github.com/frostyard/snosi/blob/b2858ca0222814c395cf8248db98f3e096d57dc9/shared/snow/tree/usr/lib/systemd/system/brew-upgrade.timer), [`brew-upgrade.service`](https://github.com/frostyard/snosi/blob/b2858ca0222814c395cf8248db98f3e096d57dc9/shared/snow/tree/usr/lib/systemd/system/brew-upgrade.service), and [`01-homebrew.preset`](https://github.com/frostyard/snosi/blob/b2858ca0222814c395cf8248db98f3e096d57dc9/shared/snow/tree/usr/lib/systemd/system-preset/01-homebrew.preset).
- fish setup for Homebrew: snosi [`ublue-brew.fish`](https://github.com/frostyard/snosi/blob/b2858ca0222814c395cf8248db98f3e096d57dc9/mkosi.images/base/mkosi.extra/usr/share/fish/vendor_conf.d/ublue-brew.fish).
- Brewfile bundles: snosi [`shared/snow/tree/usr/share/snow/bundles/cli.Brewfile`](https://github.com/frostyard/snosi/blob/b2858ca0222814c395cf8248db98f3e096d57dc9/shared/snow/tree/usr/share/snow/bundles/cli.Brewfile), [`fonts.Brewfile`](https://github.com/frostyard/snosi/blob/b2858ca0222814c395cf8248db98f3e096d57dc9/shared/snow/tree/usr/share/snow/bundles/fonts.Brewfile), and [`shared/floe/tree/usr/share/floe/bundles/cli.Brewfile`](https://github.com/frostyard/snosi/blob/b2858ca0222814c395cf8248db98f3e096d57dc9/shared/floe/tree/usr/share/floe/bundles/cli.Brewfile), the bundle instructions in [`shared/snow/tree/usr/share/snow/bundles/README.txt`](https://github.com/frostyard/snosi/blob/b2858ca0222814c395cf8248db98f3e096d57dc9/shared/snow/tree/usr/share/snow/bundles/README.txt) and [`shared/floe/tree/usr/share/floe/bundles/README.txt`](https://github.com/frostyard/snosi/blob/b2858ca0222814c395cf8248db98f3e096d57dc9/shared/floe/tree/usr/share/floe/bundles/README.txt), and Sundog's removal of `/usr/share/floe` in [`sundog.postinst.chroot`](https://github.com/frostyard/snosi/blob/b2858ca0222814c395cf8248db98f3e096d57dc9/shared/sundog/scripts/postinstall/sundog.postinst.chroot).
- Frostyard Homebrew tap casks: homebrew-tap [`Casks/`](https://github.com/frostyard/homebrew-tap/tree/f96abc1cbdc9e6b7de1494c0241eb5a3f43aec84/Casks).
- Automatic sysext updates on by default: snosi [`05-updex.preset`](https://github.com/frostyard/snosi/blob/b2858ca0222814c395cf8248db98f3e096d57dc9/mkosi.images/base/mkosi.extra/usr/lib/systemd/system-preset/05-updex.preset) and the section "Automatic sysext updates (updex-update.timer)" in [`docs/design/sysexts.md`](https://github.com/frostyard/snosi/blob/b2858ca0222814c395cf8248db98f3e096d57dc9/docs/design/sysexts.md).
- APT timers off in the image: snosi [`00-apt.preset`](https://github.com/frostyard/snosi/blob/b2858ca0222814c395cf8248db98f3e096d57dc9/mkosi.images/base/mkosi.extra/usr/lib/systemd/system-preset/00-apt.preset).
- Flatpak commands: flatpak [`doc/flatpak-search.xml`](https://github.com/flatpak/flatpak/blob/ed425ed0c9d23d3fe69110386929f8d34c928490/doc/flatpak-search.xml), [`doc/flatpak-install.xml`](https://github.com/flatpak/flatpak/blob/ed425ed0c9d23d3fe69110386929f8d34c928490/doc/flatpak-install.xml), [`doc/flatpak-list.xml`](https://github.com/flatpak/flatpak/blob/ed425ed0c9d23d3fe69110386929f8d34c928490/doc/flatpak-list.xml) (`--app`), and [`doc/flatpak-update.xml`](https://github.com/flatpak/flatpak/blob/ed425ed0c9d23d3fe69110386929f8d34c928490/doc/flatpak-update.xml).
- Distrobox commands: distrobox [`docs/usage/distrobox-create.md`](https://github.com/89luca89/distrobox/blob/24035a6dd11d0ec2f88ee46a8a4b89876d62c56b/docs/usage/distrobox-create.md) (`--image`, `--name`) and [`docs/usage/distrobox-enter.md`](https://github.com/89luca89/distrobox/blob/24035a6dd11d0ec2f88ee46a8a4b89876d62c56b/docs/usage/distrobox-enter.md).
- Extension definitions, each with `Enabled=false`: snosi [`mkosi.images/base/mkosi.extra/usr/lib/`](https://github.com/frostyard/snosi/tree/b2858ca0222814c395cf8248db98f3e096d57dc9/mkosi.images/base/mkosi.extra/usr/lib) (`sysupdate.<name>.d/<name>.feature`), for example [`docker.feature`](https://github.com/frostyard/snosi/blob/b2858ca0222814c395cf8248db98f3e096d57dc9/mkosi.images/base/mkosi.extra/usr/lib/sysupdate.docker.d/docker.feature).
- ChairLift on Snow, Snowfield, and Sundog only: `frostyard-chairlift` in snosi [`shared/packages/snow/mkosi.conf`](https://github.com/frostyard/snosi/blob/b2858ca0222814c395cf8248db98f3e096d57dc9/shared/packages/snow/mkosi.conf) and [`shared/packages/sundog/mkosi.conf`](https://github.com/frostyard/snosi/blob/b2858ca0222814c395cf8248db98f3e096d57dc9/shared/packages/sundog/mkosi.conf), not in [`shared/packages/floe/mkosi.conf`](https://github.com/frostyard/snosi/blob/b2858ca0222814c395cf8248db98f3e096d57dc9/shared/packages/floe/mkosi.conf).
- Sundog turns off Bazaar's service: snosi [`shared/sundog/tree/usr/lib/systemd/user-preset/90-sundog.preset`](https://github.com/frostyard/snosi/blob/b2858ca0222814c395cf8248db98f3e096d57dc9/shared/sundog/tree/usr/lib/systemd/user-preset/90-sundog.preset).
- Bazaar automatic updates, default `false`: bazaar [`data/io.github.kolunmi.Bazaar.gschema.xml`](https://github.com/kolunmi/bazaar/blob/3d347d5d0fb828a0ff6ff0c1dcd356b26ddfdd33/data/io.github.kolunmi.Bazaar.gschema.xml) (`auto-update`).
- Discover automatic updates, default `false`: discover [`kcm/updatessettings.kcfg`](https://github.com/KDE/discover/blob/4c44f74f1eff31ec7b2a455a4b6b481f7be3625f/kcm/updatessettings.kcfg) (`UseUnattendedUpdates`).
- ChairLift bundles come from `/usr/share/snow/bundles` by default: chairlift [`CONFIG.md`](https://github.com/frostyard/chairlift/blob/2ee787eafc52d687b036c67a769099d58b8f7065/CONFIG.md) (`bundles_paths`).
- Images are built from the APT repository and carry no Frostyard APT source: core ADR-0059 (accepted 2026-10-24), Context, at [`28e7847`](https://github.com/frostyard/core/blob/28e7847642a05214415af6d8d2ddf7f3033682d5/docs/adr/0059-publish-image-only-packages-in-a-separate-apt-component.md); owner decision, Brian, 2026-10-24.
