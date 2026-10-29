---
title: ChairLift
description: "Use ChairLift on a Frostyard image to stage system updates, update Homebrew and Flatpak apps, toggle features, and trust Homebrew taps."
---

ChairLift is a GTK4 and Libadwaita app for system chores on a Frostyard
desktop. It stages the next system image, updates Homebrew and Flatpak
applications, runs cleanups, and turns Updex features on and off. This guide
follows ChairLift v0.11.3, which uses Updex v2.1.3 for the Features page.

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
`/usr/bin/chairlift-updex-helper`. For what a feature does, how to check the
merge, and how to remove one, see [Updex](/docs/tools/updex/) and
[Manage system extensions](/docs/sysexts/manage/).

### Update features

When you open Features, ChairLift checks the enabled features for updates.
The group description shows the result, for example
`4 features available (1 update, 1 waiting for a newer OS image)`.

1. Open Features.
2. Press **Update** in the group header, and enter your administrator
   password.

The toast says what happened:

- The update succeeds, every feature updated or was already current, and at
  least one updated: `Features updated. Changes apply after reboot.`
- The update succeeds, and every feature was already current:
  `Features are already up to date.`
- No feature is enabled: `No enabled features to update.`
- A feature waits, is held, or failed: the toast lists those features with
  their reasons, under `Waiting for a newer OS image:`, `Held by a rollback:`,
  or `Failed:`, and the features that updated, under `Updated:`. It stays on
  screen until you close it.
- The update itself fails: the toast reports the error and stays on screen
  until you close it.

A feature waits when a downloaded revision needs a newer OS image than the
one that boots next. Its row says `waiting for a newer OS image` and names
each component with the image it needs, as
`COMPONENT: needs image >= VERSION`. Updex keeps the downloaded revision, but
links no new revision of that feature while the image that boots next is too
old. Stage a system update and restart. The next feature update links the
revision. See
[An extension that needs a newer image](/docs/sysexts/manage/#an-extension-that-needs-a-newer-image).

ChairLift can tell that a revision needs a newer OS image only after an update
downloads it. Until then, its feature reads as update available.

A feature held by a rollback stays at its older version. See
[Roll back](/docs/sysexts/manage/#roll-back).

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
[configuration reference](https://github.com/frostyard/chairlift/blob/f29ae11b5d5abf20f1acb9d3c0f85e4146e00464/CONFIG.md)
lists every page and group.

## Update and roll back

ChairLift v0.11.3 needs Go 1.26.10 or later to build. That Go release has the
fixes for security issues in Go's `crypto/x509`, `crypto/tls`, `net/http`, and
`net/textproto` packages. If you installed the package yourself, update it to
v0.11.3 or later.

On Snow, Snowfield, and Sundog, ChairLift is part of the image. It updates
with the image: see [Stage a system update](#stage-a-system-update). It rolls
back with the image too. Follow
[Roll back](/docs/images/install-update/#roll-back). ChairLift has no
rollback control of its own. On a bootc install, its System page shows the
rollback image. On a native A/B install, its Updates page shows the previous
version.

For a package you installed yourself, update it as in the next section.

To roll a package back, download the older release from
`https://github.com/frostyard/chairlift/releases/download/vX.Y.Z/`. Get the
package and `checksums.txt`, and check the file as in the next section. Then
install it:

```bash
sudo apt install --allow-downgrades ./frostyard-chairlift_X.Y.Z_amd64.deb
```

On Fedora or RHEL, run `sudo dnf downgrade ./frostyard-chairlift-X.Y.Z-1.x86_64.rpm`
instead.

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

After you install the package, print the installed version. On Debian or
Ubuntu:

```bash
dpkg-query -W frostyard-chairlift
```

On Fedora or RHEL, run `rpm -q frostyard-chairlift` instead. ChairLift has no
`--version` flag.

To update the package, download the newer release package and
`checksums.txt`, check the file, and install it with the command in the table.

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
| A feature row says `waiting for a newer OS image` | `sudo bootc status` | A downloaded revision needs a newer OS image. Stage a system update and restart. The next feature update links it. |
| The Update toast says `activation did not finish` | The toast | The extensions merged. Restart to finish. |
| A feature change or **Update** fails with `another updex operation is running` | Another `updex` command or the timer | Wait, then try again. Only one Updex operation that changes state runs at a time. |
| A Homebrew upgrade fails and mentions an untrusted tap | Untrusted Homebrew Taps on Updates | Press **Trust** on the tap, then upgrade again. |
| ChairLift asks for a password | The prompt | Staging an update and changing a feature need administrator authentication. ChairLift installs no passwordless rule. |
| A Homebrew or Flatpak group says the tool is unavailable | `brew --version` or `flatpak --version` | Install the tool. The Maintenance groups for a missing tool are hidden. |

## See also

- [Updex](/docs/tools/updex/)
- [Manage system extensions](/docs/sysexts/manage/)
- [Snow](/docs/images/snow/)
- [ChairLift README](https://github.com/frostyard/chairlift/blob/f29ae11b5d5abf20f1acb9d3c0f85e4146e00464/README.md)

## Sources

Reviewed 2026-10-29.

- ChairLift main commit [`f29ae11b5d5abf20f1acb9d3c0f85e4146e00464`](https://github.com/frostyard/chairlift/tree/f29ae11b5d5abf20f1acb9d3c0f85e4146e00464) (the v0.11.3 release commit)
- [`README.md`](https://github.com/frostyard/chairlift/blob/f29ae11b5d5abf20f1acb9d3c0f85e4146e00464/README.md)
- [`docs/index.md`](https://github.com/frostyard/chairlift/blob/f29ae11b5d5abf20f1acb9d3c0f85e4146e00464/docs/index.md)
- [`docs/reference.md`](https://github.com/frostyard/chairlift/blob/f29ae11b5d5abf20f1acb9d3c0f85e4146e00464/docs/reference.md)
- [`CONFIG.md`](https://github.com/frostyard/chairlift/blob/f29ae11b5d5abf20f1acb9d3c0f85e4146e00464/CONFIG.md)
- [`config.yml`](https://github.com/frostyard/chairlift/blob/f29ae11b5d5abf20f1acb9d3c0f85e4146e00464/config.yml)
- [`docs/design/package-managers.md`](https://github.com/frostyard/chairlift/blob/f29ae11b5d5abf20f1acb9d3c0f85e4146e00464/docs/design/package-managers.md)
- [`internal/views/updates_page.go`](https://github.com/frostyard/chairlift/blob/f29ae11b5d5abf20f1acb9d3c0f85e4146e00464/internal/views/updates_page.go)
- [`internal/views/features_page.go`](https://github.com/frostyard/chairlift/blob/f29ae11b5d5abf20f1acb9d3c0f85e4146e00464/internal/views/features_page.go)
- [`internal/views/system_page.go`](https://github.com/frostyard/chairlift/blob/f29ae11b5d5abf20f1acb9d3c0f85e4146e00464/internal/views/system_page.go)
- [`internal/views/featurestatus/featurestatus.go`](https://github.com/frostyard/chairlift/blob/f29ae11b5d5abf20f1acb9d3c0f85e4146e00464/internal/views/featurestatus/featurestatus.go)
- [`internal/views/actionmsg/actionmsg.go`](https://github.com/frostyard/chairlift/blob/f29ae11b5d5abf20f1acb9d3c0f85e4146e00464/internal/views/actionmsg/actionmsg.go)
- [`internal/updex/summary.go`](https://github.com/frostyard/chairlift/blob/f29ae11b5d5abf20f1acb9d3c0f85e4146e00464/internal/updex/summary.go)
- [`internal/window/window.go`](https://github.com/frostyard/chairlift/blob/f29ae11b5d5abf20f1acb9d3c0f85e4146e00464/internal/window/window.go)
- [ChairLift v0.11.3 release notes](https://github.com/frostyard/chairlift/releases/tag/v0.11.3)
- Go 1.26.10 change: commit [`5fd9b98ce7c805e6d542e1d0d5c309d34b74dcee`](https://github.com/frostyard/chairlift/commit/5fd9b98ce7c805e6d542e1d0d5c309d34b74dcee)
- Updex v2.1.3 [`updex/lock.go`](https://github.com/frostyard/updex/blob/v2.1.3/updex/lock.go)
- The Frostyard APT index [`Packages`](https://repository.frostyard.org/debian/dists/trixie/main/binary-amd64/Packages) for trixie on amd64, checked 2026-10-29, lists `frostyard-chairlift` 0.11.3.
- [Duncan's review: package downgrade (frostyard-org#30)](https://github.com/frostyard/frostyard-org/pull/30#pullrequestreview-5630346572)
- snosi commit [`b2858ca0222814c395cf8248db98f3e096d57dc9`](https://github.com/frostyard/snosi/tree/b2858ca0222814c395cf8248db98f3e096d57dc9): [`mkosi.images/base/mkosi.extra/usr/libexec/bootc-update-stage`](https://github.com/frostyard/snosi/blob/b2858ca0222814c395cf8248db98f3e096d57dc9/mkosi.images/base/mkosi.extra/usr/libexec/bootc-update-stage), [`mkosi.profiles/snowfield/mkosi.conf`](https://github.com/frostyard/snosi/blob/b2858ca0222814c395cf8248db98f3e096d57dc9/mkosi.profiles/snowfield/mkosi.conf), [`shared/composition/snow/mkosi.conf`](https://github.com/frostyard/snosi/blob/b2858ca0222814c395cf8248db98f3e096d57dc9/shared/composition/snow/mkosi.conf), [`shared/packages/snow/mkosi.conf`](https://github.com/frostyard/snosi/blob/b2858ca0222814c395cf8248db98f3e096d57dc9/shared/packages/snow/mkosi.conf), [`shared/packages/sundog/mkosi.conf`](https://github.com/frostyard/snosi/blob/b2858ca0222814c395cf8248db98f3e096d57dc9/shared/packages/sundog/mkosi.conf)
