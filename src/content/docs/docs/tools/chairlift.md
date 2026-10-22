---
title: ChairLift
description: "Use ChairLift on a Frostyard image to stage system updates, update Homebrew and Flatpak apps, toggle features, and trust Homebrew taps."
---

ChairLift is a GTK4 and Libadwaita app for system chores on a Frostyard
desktop. It stages the next system image, updates Homebrew and Flatpak
applications, runs cleanups, and turns Updex features on and off. This guide
follows ChairLift v0.11.2.

## Which images have it

Snow, Snowfield, and Sundog install ChairLift as the `frostyard-chairlift`
package. Floe does not.

## Open it

Start ChairLift from your application menu. You can also run it from a
terminal:

```bash
chairlift
```

The window opens with a sidebar of pages. To try the controls without
changing anything, add `--dry-run`:

```bash
chairlift --dry-run
```

In that mode ChairLift changes nothing on the system.

Keys: `Alt+1`, `Alt+2`, and so on open the pages in sidebar order. `F1` opens
Help, `Ctrl+?` lists the shortcuts, and `Ctrl+Q` quits.

## What each page does

| Page | What you do there |
| --- | --- |
| Applications | Search for Homebrew formulae and casks and install them. Uninstall them, and pin or unpin formulae. Install curated bundles. List and uninstall Flatpak apps. |
| Maintenance | Run `brew cleanup` and `flatpak uninstall --unused`. |
| Updates | Stage the next system image. Update Homebrew and its packages. Update Flatpak apps. Trust Homebrew taps. |
| System | Read the OS information and the booted, staged, and rollback images. Open the health monitor. |
| Features | Turn Updex features on and off, and update them. |
| Help | Open the project website, the issue tracker, and the community chat. |

ChairLift does not install new Flatpak apps. The Applications page opens
Bazaar for that.

## Everyday tasks

### Stage a system update

1. Open Updates.
2. In System Updates, press **Check for Updates** on the System Update row.
3. Enter your administrator password when you are asked.

ChairLift downloads the next image and stages it. The row subtitle shows the
staged version. The new version starts at your next restart. To see the booted,
staged, and rollback images, open System.

The System Updates group is only on a bootc system that has
`/usr/libexec/bootc-update-stage`. Every Frostyard bootc image has it. For the
hourly background staging that Snow does, see [Snow](/docs/images/snow/).

### Update Homebrew and Flatpak

1. Open Updates.
2. In Homebrew Updates, press **Update** on the Update Homebrew row. This
   updates Homebrew and its formula definitions.
3. Open Outdated Packages and press the upgrade button on each package you
   want.
4. In Flatpak Updates, open Available Updates and press **Update** on each
   app.

After each successful action, ChairLift refreshes the outdated list and the
update badge in the sidebar.

### Turn a feature on or off

1. Open Features.
2. Flip the switch on the feature, and enter your administrator password.

ChairLift hands the change to Updex through the helper
`/usr/bin/chairlift-updex-helper`. The **Update** button in the group header
updates features. For what a feature does, how to check the merge, and how
to remove one, see [Updex](/docs/tools/updex/) and
[Manage system extensions](/docs/sysexts/manage/).

### Trust a Homebrew tap

Homebrew 6 skips packages from a tap that you have not trusted. A failed
upgrade for that reason sends you to this group.

1. Open Updates.
2. In Untrusted Homebrew Taps, press **Trust** on the tap.

A toast says `Trusted TAP. Its packages can update again.` The tap leaves the
list. Trust is per user and needs no password. The group is only on screen
when an installed package comes from an untrusted tap.

### Hide a group or a page

ChairLift reads one YAML file. It uses the first of these that exists:

1. `/etc/chairlift/config.yml`
2. `/usr/share/chairlift/config.yml`

Put your changes in `/etc/chairlift/config.yml`. A package update can replace
the file in `/usr/share`, and nothing creates or overwrites the one in `/etc`.
For example, to hide Homebrew search:

```yaml
applications_page:
  brew_search_group:
    enabled: false
```

Restart ChairLift. The Brew Search group is gone. A page disappears when all of its
groups are off, and Help always stays. The
[configuration reference](https://github.com/frostyard/chairlift/blob/3505e9478287e56bef45d1ae1642e2c8e2a835d9/CONFIG.md)
lists every page and group.

## Install on another system

Each [ChairLift release](https://github.com/frostyard/chairlift/releases) has
packages for 64-bit Intel/AMD and Arm.

| Distribution | Package | Install |
| --- | --- | --- |
| Debian, Ubuntu | `frostyard-chairlift_<version>_<arch>.deb` | `sudo apt install ./<file>` |
| Fedora, RHEL | `frostyard-chairlift-<version>-1.<arch>.rpm` | `sudo dnf install ./<file>` |
| Alpine | `frostyard-chairlift_<version>_<arch>.apk` | `sudo apk add --allow-untrusted ./<file>` |

Download the full `frostyard-chairlift` package. Download `checksums.txt` from
the same release, then check the file before you install it:

```bash
package='<downloaded-package-filename>'
grep -F "  $package" checksums.txt | sha256sum --check -
```

The check prints `<downloaded-package-filename>: OK`.

Do not install `frostyard-chairlift-system-integration` next to it. That
package has no app. It exists for a system that gets the app another way, and
the two packages conflict.

Tagged releases also publish the `.deb` packages to
`https://repository.frostyard.org/debian/`, which is where the Frostyard
images get ChairLift.

On another distribution, the Features and System Update groups need Updex and
`/usr/libexec/bootc-update-stage`. A group whose tool is missing is hidden or
says the tool is unavailable.

## Troubleshooting

| Symptom | Check | Fix |
| --- | --- | --- |
| A `CONFIGURATION ERROR` toast stays on screen, and every group is hidden | The file path in the toast | Fix the YAML or the unknown name it names, then restart ChairLift. ChairLift reads only the first file it finds and never falls back to the next one. |
| A page is missing from the sidebar | `/etc/chairlift/config.yml` | Every group on that page is set to `enabled: false`. Turn one on and restart. |
| No System Updates group on Updates | `sudo bootc status` and `ls /usr/libexec/bootc-update-stage` | The group needs a booted bootc deployment and that helper. |
| Features says **Feature Manager Not Available** | `updex features list` | Updex is not set up on this system. See [Updex](/docs/tools/updex/). |
| A Homebrew upgrade fails and mentions an untrusted tap | Untrusted Homebrew Taps on Updates | Press **Trust** on the tap, then upgrade again. |
| ChairLift asks for a password | The prompt | Staging an update and changing a feature need administrator authentication. ChairLift installs no passwordless rule. |
| A Homebrew or Flatpak group says the tool is unavailable | `brew --version` or `flatpak --version` | Install the tool. The Maintenance groups for a missing tool are hidden. |

## See also

- [Updex](/docs/tools/updex/)
- [Manage system extensions](/docs/sysexts/manage/)
- [Snow](/docs/images/snow/)
- [ChairLift README](https://github.com/frostyard/chairlift/blob/3505e9478287e56bef45d1ae1642e2c8e2a835d9/README.md)

## Sources

Reviewed 2026-10-22.

- ChairLift v0.11.2 commit [`3505e9478287e56bef45d1ae1642e2c8e2a835d9`](https://github.com/frostyard/chairlift/tree/3505e9478287e56bef45d1ae1642e2c8e2a835d9)
- [`README.md`](https://github.com/frostyard/chairlift/blob/3505e9478287e56bef45d1ae1642e2c8e2a835d9/README.md)
- [`docs/index.md`](https://github.com/frostyard/chairlift/blob/3505e9478287e56bef45d1ae1642e2c8e2a835d9/docs/index.md)
- [`docs/reference.md`](https://github.com/frostyard/chairlift/blob/3505e9478287e56bef45d1ae1642e2c8e2a835d9/docs/reference.md)
- [`CONFIG.md`](https://github.com/frostyard/chairlift/blob/3505e9478287e56bef45d1ae1642e2c8e2a835d9/CONFIG.md)
- [`config.yml`](https://github.com/frostyard/chairlift/blob/3505e9478287e56bef45d1ae1642e2c8e2a835d9/config.yml)
- [`docs/design/package-managers.md`](https://github.com/frostyard/chairlift/blob/3505e9478287e56bef45d1ae1642e2c8e2a835d9/docs/design/package-managers.md)
- [`internal/views/updates_page.go`](https://github.com/frostyard/chairlift/blob/3505e9478287e56bef45d1ae1642e2c8e2a835d9/internal/views/updates_page.go)
- [`internal/views/features_page.go`](https://github.com/frostyard/chairlift/blob/3505e9478287e56bef45d1ae1642e2c8e2a835d9/internal/views/features_page.go)
- snosi commit [`79ccc63ea44ce9309a837b9428e9b5d44290fada`](https://github.com/frostyard/snosi/tree/79ccc63ea44ce9309a837b9428e9b5d44290fada): [`shared/packages/snow/mkosi.conf`](https://github.com/frostyard/snosi/blob/79ccc63ea44ce9309a837b9428e9b5d44290fada/shared/packages/snow/mkosi.conf), [`shared/packages/sundog/mkosi.conf`](https://github.com/frostyard/snosi/blob/79ccc63ea44ce9309a837b9428e9b5d44290fada/shared/packages/sundog/mkosi.conf), [`shared/composition/snow/mkosi.conf`](https://github.com/frostyard/snosi/blob/79ccc63ea44ce9309a837b9428e9b5d44290fada/shared/composition/snow/mkosi.conf), [`mkosi.profiles/snowfield/mkosi.conf`](https://github.com/frostyard/snosi/blob/79ccc63ea44ce9309a837b9428e9b5d44290fada/mkosi.profiles/snowfield/mkosi.conf), [`mkosi.images/base/mkosi.extra/usr/libexec/bootc-update-stage`](https://github.com/frostyard/snosi/blob/79ccc63ea44ce9309a837b9428e9b5d44290fada/mkosi.images/base/mkosi.extra/usr/libexec/bootc-update-stage)
