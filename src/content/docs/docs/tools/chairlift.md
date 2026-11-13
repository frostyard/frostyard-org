---
title: ChairLift
description: "Use ChairLift on a Frostyard image to update the system image, features, Flatpak apps, Homebrew packages and device firmware in one window, and to read every command it runs."
follows:
  repo: frostyard/chairlift
  tag: v0.17.1
---

ChairLift is the command center of a Frostyard desktop. In one window it
updates the system image, the system features, Flatpak apps, Homebrew packages
and device firmware, and it shows every command it runs. This guide follows
ChairLift v0.17.1, which uses Updex v2.2.0 for the Features page.

## Which images have it

Snow, Snowfield, and Sundog install ChairLift as the `frostyard-chairlift`
package. Floe does not.

## Open it

Start ChairLift from your application menu, or run it in a terminal:

```bash
chairlift
```

The window has a top bar with the command palette, a rail of pages, a console
that shows each command ChairLift runs and its output, and a status bar.

From v0.17.0, ChairLift uses Frostyard's dark theme when your desktop is dark,
and its light theme otherwise. It follows the desktop's text size and
high-contrast setting, but not its accent color.

| Key | What it does |
| --- | --- |
| `Alt+1` to `Alt+6` | Open Overview, Updates, Apps, Features, Problems or Maintenance, in that order |
| `Ctrl+K` | Open the command palette |
| `Ctrl+J` | Show or hide the console |
| `Ctrl+R` | Check for updates |
| `Ctrl+?` | List the shortcuts |
| `F1` | Open Help |
| `Ctrl+Q` | Quit |

Before v0.13.0, `Ctrl+Q` did nothing.

ChairLift runs one change at a time. It asks before an install, an uninstall, a
pin, a feature toggle, tap trust, a bundle, a cleanup or a firmware update. An
update starts when you click it.

To try the controls without changing anything, run:

```bash
chairlift --dry-run
```

In that mode ChairLift changes nothing on the system, and the console shows
the commands that would run.

## What each page does

| Page | What you do there |
| --- | --- |
| Overview | Read the system image and its deployment chain, live processor and memory use, and recent changes. From v0.17.0, its Open button starts the first system monitor that is installed: Mission Center, GNOME System Monitor, or KDE System Monitor. With none of them, the button does not show. |
| Updates | Update the system image, features, Flatpak, Homebrew and firmware, one card per source. |
| Apps | Update, open, pin or uninstall installed Flatpak apps and Homebrew packages. Install a bundle in Bundles, or search Homebrew in Find more. |
| Features | Turn an Updex feature on or off, and update the features. |
| Problems | From v0.14.0. Read the problems recorded on this computer, with a hint for each. Copy the details or dismiss a problem. From v0.15.0, you can also send problem reports, after you turn reporting on. The Snow, Snowfield, and Sundog pages say [what the image records](/docs/images/snow/#problems). |
| Maintenance | Clean up Homebrew, remove unused Flatpak runtimes, and run the configured maintenance scripts. |

The Apps page does not install new Flatpak apps. It opens the software center
for that, Bazaar by default.

Help is a dialog, not a page: `F1`, the main menu or the command palette opens
it. It holds the links to the project website, the issue tracker and the
community chat.

From v0.15.0, `chairlift --send-pending-reports` sends pending problem reports with no window, as **Send automatically** does. It sends nothing, and says why, for example when reporting is off, when the mode is **Ask each time**, or when `problems_reporting_group` is off ([Hide a group or a page](#hide-a-group-or-a-page)). It exits 1 after a configuration error or a failed send, and 0 otherwise. See [the Problems page settings](https://github.com/frostyard/chairlift/blob/3f77c74692dc10d9ee4b536eb13afa87c09a2964/docs/reference.md#problems-page-problems_page-the-problems-page).

## First-login setup

From v0.13.0, ChairLift has a first-login setup, `chairlift --first-run`. It replaces SNOW First Setup. Its steps are Welcome, Connectivity, Style, Reporting (optional), Apps, Progress, and Done. It sets the light or dark style, offers Flatpak apps from Flathub, and installs the ones you pick for your user. From v0.15.0, it can also ask whether to send problem reports, with the switch off.

ChairLift does not start it by itself. An image can start `chairlift-first-run` at login, which opens the setup once for each user. Snow and Snowfield start it at login. Sundog does not. [Snow](/docs/images/snow/) lists what the image ships.

To try the setup without changes:

```bash
chairlift --first-run --dry-run
```

The window opens. In this mode it installs no app, does not change the style, and does not record the setup as done.

The setup counts as done for you when `~/.config/chairlift/first-run.done` or SNOW First Setup's `~/.config/snow-first-setup.done` exists. If you set `$XDG_CONFIG_HOME`, it replaces `~/.config`, so you do not see the setup again after SNOW First Setup.

To skip the setup without opening it:

```bash
chairlift-first-run --mark-done
```

Both files now exist.

Without an internet connection, the setup skips the app step, and you can still finish.

To hide the app step, set `first_run_apps_group` to `enabled: false` under `first_run_page` ([Hide a group or a page](#hide-a-group-or-a-page)). The app list is `/usr/share/snow/first-run/apps.json`, and `apps_path` changes it.

See [first-run settings](https://github.com/frostyard/chairlift/blob/3f77c74692dc10d9ee4b536eb13afa87c09a2964/docs/reference.md#first-run-page-first_run_page) and [how the first run works](https://github.com/frostyard/chairlift/blob/3f77c74692dc10d9ee4b536eb13afa87c09a2964/docs/design/overview.md#first-run-mode).

## Everyday tasks

### Stage a system update

1. Open Updates.
2. On the system image card, press **Stage**. When no newer image is offered, press **Check and stage** on the card instead.
3. Enter your administrator password when you are asked.

ChairLift downloads the next image and stages it. The status bar shows
`<version> staged`. When no other update can run and no job runs, the
Overview headline says `Restart to finish`. ChairLift does not restart the
computer. The new version starts when you restart it.

The card needs `/usr/libexec/bootc-update-stage` on a bootc system, or
`/usr/lib/snosi/native-ab` and `/usr/libexec/snosi-sysupdate-stage` on a native
A/B system. Every Frostyard bootc image has the bootc helper.

### Update Homebrew and Flatpak

1. Open Updates.
2. On the Homebrew card, press **Update metadata**. This updates Homebrew and its formula definitions.
3. Press **Upgrade** on each package you want, or **Update all** for every package that is not held.
4. On the Flatpak card, press **Update** on each app, or **Update all**.

**Update everything** in the page header runs the update of every source, and
leaves out held items and firmware.

A pinned formula and a package from an untrusted tap are held: their button is
disabled, and its tooltip gives the reason. Trust the tap to update its
packages again ([Trust a Homebrew tap](#trust-a-homebrew-tap)).

From v0.13.0, ChairLift checks each Flatpak remote on its own. When a remote that an installed app comes from does not answer, the card says `2 updates available; the system installation could not be checked`. When both checks fail and find no update, it says `Could not check for updates`, and the count from the last check stays. See [Update queries run per remote](https://github.com/frostyard/chairlift/blob/3f77c74692dc10d9ee4b536eb13afa87c09a2964/docs/design/package-managers.md#update-queries-run-per-remote).

From v0.17.1, the Flatpak card no longer offers an update for an app from an
OCI remote, such as the Frostyard remote, when the installed image is already
the newest. Flatpak 1.16.6 lists such an app as an update forever, and
`flatpak update` does nothing for it.

### Install a firmware update

From v0.12.0, the Updates page has a firmware card. It lists device firmware
updates from the Linux Vendor Firmware Service (fwupd). It shows only when
`fwupdmgr` is installed, and every Frostyard image installs fwupd.

You install 1 device at a time. ChairLift asks you to confirm first: do not turn off or unplug the computer during the update, and keep the power connected. Some devices restart or disconnect while they update. It does not restart the computer. When the device needs a restart or a shutdown, ChairLift says so, and you do it yourself.

A device that fwupd will not update now, for example with the lid closed or on battery power, stays in the list with its reason and no install button. fwupd, not ChairLift, asks for authentication, with its own PolicyKit actions.

After the install, ChairLift reads the device's own state: an update that fwupd did not apply shows as an error, and the device stays in the list. [Firmware Updates](https://github.com/frostyard/chairlift/blob/3f77c74692dc10d9ee4b536eb13afa87c09a2964/docs/reference.md#updates-page-updates_page-the-updates-page) has the details.

To hide the card, set `firmware_updates_group` to `enabled: false` under `updates_page` ([Hide a group or a page](#hide-a-group-or-a-page)).

### Turn a feature on or off

1. Open Features.
2. Flip the switch on the feature.
3. Press **Turn on** or **Turn off** in the dialog, and enter your
   administrator password.

ChairLift hands the change to Updex through the helper
`/usr/bin/chairlift-updex-helper`. An enable takes effect after a feature
update and a restart. For what a feature does, see [Updex](/docs/tools/updex/)
and [Manage system extensions](/docs/sysexts/manage/).

### Update features

1. Open Features.
2. Press **Update features** in the page header, or **Update** on a feature
   row, and enter your administrator password.

One run updates every feature that is on. The toast says what happened:

- The update succeeds, every feature updated or was already current, and at
  least one updated: `Features updated. Changes apply after reboot.`
- The update succeeds, and every feature was already current:
  `Features are already up to date.`
- No feature is on: `No enabled features to update.`
- A feature waits, is held, or failed: the toast names those features with
  their reasons, under `Waiting for a newer OS image:`, `Held by a rollback:`,
  or `Failed:`, and the features that updated, under `Updated:`. It stays on
  screen until you close it.
- The update fails: the toast reports the error, and stays on screen.

From v0.17.0, a feature that updated leaves the list of updates at once, even
when the check after the update fails.

A feature waits when a downloaded revision needs a newer OS image than the
one that boots next. Its row says `waiting for a newer OS image` and names
each component with the image it needs, as
`COMPONENT: needs image >= VERSION`. Stage a system update and restart, and the
next feature update links the revision. See
[An extension that needs a newer image](/docs/sysexts/manage/#an-extension-that-needs-a-newer-image).

One limit: when a newer OS image is already staged, a row can say
`waiting for a newer OS image` although the next update would link the
feature. Restart into the staged image to clear it.

A feature held by a rollback stays at its older version. See
[Roll back](/docs/sysexts/manage/#roll-back).

### Trust a Homebrew tap

Homebrew 6 skips packages from a tap that you have not trusted. The Homebrew
card on Updates shows a banner for each tap that has installed packages.

1. Open Updates.
2. On the banner, press **Trust tap**, and press **Trust** in the dialog.

A toast says `Trusted TAP. Its packages can update again.` The banner leaves
the card. Trust is per user and needs no password.

### Hide a group or a page

ChairLift reads one YAML file. It uses the first of these that exists:

1. `/etc/chairlift/config.yml`
2. `/usr/share/chairlift/config.yml`

Put your changes in `/etc/chairlift/config.yml`. A package update can replace
the file in `/usr/share`, and nothing creates or overwrites the one in `/etc`.
For example, to hide Find more on Apps:

```yaml
applications_page:
  brew_search_group:
    enabled: false
```

Restart ChairLift. Find more is gone from Apps. A page disappears from the rail
when all of its groups are off. The Overview always shows, so the window always
has a page. The
[configuration reference](https://github.com/frostyard/chairlift/blob/3f77c74692dc10d9ee4b536eb13afa87c09a2964/CONFIG.md)
lists every page and group.

## Update and roll back

ChairLift v0.17.1 builds with Go 1.27.4 for its security fixes.

On Snow, Snowfield, and Sundog, ChairLift is part of the image. It updates
with the image: see [Stage a system update](#stage-a-system-update). It rolls
back with the image too. Follow
[Roll back](/docs/images/install-update/#roll-back). ChairLift has no
rollback control of its own. On a bootc install, the Overview shows the
rollback image in the deployment chain. On a native A/B install, the Updates
card names the version on the inactive slot, which the boot menu offers at the
next restart.

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

Download `frostyard-chairlift` and `checksums.txt` from the same release,
then check the package before you install it:

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

The window needs GTK 3, libepoxy with an OpenGL driver (Mesa), and Pango at run
time. Without a GPU it draws on the CPU.

From v0.17.0, each package depends on pkexec: `pkexec` for the `.deb`,
`/usr/bin/pkexec` for the `.rpm`, and `polkit` for the `.apk`. A change that
asks for your password also needs a PolicyKit authentication agent in your
desktop session.

To update the package, download the newer release package and
`checksums.txt`, check the file, and install it with the command in the table.

Do not install `frostyard-chairlift-system-integration` next to it: it has no
app, it exists for a system that gets the app another way, and the two packages
conflict.

Tagged releases also publish the `.deb` packages to
`https://repository.frostyard.org/debian/`, which is where the Frostyard
images get ChairLift.

On another distribution, the Features card needs Updex, and the system image
card needs `bootc` with `/usr/libexec/bootc-update-stage` or a native A/B image
with `/usr/libexec/snosi-sysupdate-stage`. A source whose tool is missing is
left out of the page, or says the tool is unavailable.

## Troubleshooting

| Symptom | Check | Fix |
| --- | --- | --- |
| A `CONFIGURATION ERROR` toast stays on screen, and every group is hidden | The file path in the toast | Fix the YAML or the unknown name, then restart ChairLift. It reads only the first file it finds. |
| A page is missing from the rail | `/etc/chairlift/config.yml` | Every group on that page is set to `enabled: false`. Turn one on and restart. |
| No system image card on Updates | `sudo bootc status` and `ls /usr/libexec/bootc-update-stage` | The card needs a booted bootc deployment and that helper, or the native A/B marker and its helper. |
| Features says **Feature Manager Not Available** | `updex features list` | Updex is not set up on this system. See [Updex](/docs/tools/updex/). |
| A feature row says `waiting for a newer OS image` | `sudo bootc status` | A downloaded revision needs a newer OS image. Stage a system update and restart. The next feature update links it. If a newer image is already staged, restart into it. |
| The feature toast says `activation did not finish` | The toast | The extensions are in place. Restart the computer to finish. |
| A Homebrew upgrade fails and mentions an untrusted tap | The Homebrew card on Updates | Press **Trust tap** on the tap's banner, then upgrade again. |
| The Flatpak card says an installation `could not be checked` | `flatpak remotes --user` or `flatpak remotes --system`, then `flatpak remote-ls --updates --app --user REMOTE` (or `--system`) for each remote | A remote that an installed app comes from did not answer. ChairLift lists the updates from the other remotes. Try again when that remote answers. |
| Updates has no Flatpak card | `flatpak --version`, then `flatpak_updates_group` under `updates_page` in `/etc/chairlift/config.yml` | If Flatpak is missing, install it, then restart ChairLift. A cleanup whose tool is missing is left out of Maintenance too. If Flatpak is installed, the group is set to `enabled: false`: turn it on and restart ChairLift. |
| ChairLift asks for a password | The prompt | Staging an image and changing a feature need administrator authentication. ChairLift installs no passwordless rule. |

## See also

- [Updex](/docs/tools/updex/)
- [Manage system extensions](/docs/sysexts/manage/)
- [Snow](/docs/images/snow/)
- [ChairLift user documentation](https://github.com/frostyard/chairlift/blob/3f77c74692dc10d9ee4b536eb13afa87c09a2964/docs/index.md)

## Sources

Reviewed 2026-11-12.

- Followed release: ChairLift release v0.17.1 commit [`3f77c74692dc10d9ee4b536eb13afa87c09a2964`](https://github.com/frostyard/chairlift/tree/3f77c74692dc10d9ee4b536eb13afa87c09a2964), released 2026-11-12 ([release](https://github.com/frostyard/chairlift/releases/tag/v0.17.1)): [`README.md`](https://github.com/frostyard/chairlift/blob/3f77c74692dc10d9ee4b536eb13afa87c09a2964/README.md), [`docs/index.md`](https://github.com/frostyard/chairlift/blob/3f77c74692dc10d9ee4b536eb13afa87c09a2964/docs/index.md), [`docs/reference.md`](https://github.com/frostyard/chairlift/blob/3f77c74692dc10d9ee4b536eb13afa87c09a2964/docs/reference.md), [`CONFIG.md`](https://github.com/frostyard/chairlift/blob/3f77c74692dc10d9ee4b536eb13afa87c09a2964/CONFIG.md), [`config.yml`](https://github.com/frostyard/chairlift/blob/3f77c74692dc10d9ee4b536eb13afa87c09a2964/config.yml), [`docs/design/overview.md`](https://github.com/frostyard/chairlift/blob/3f77c74692dc10d9ee4b536eb13afa87c09a2964/docs/design/overview.md), [`docs/design/package-managers.md`](https://github.com/frostyard/chairlift/blob/3f77c74692dc10d9ee4b536eb13afa87c09a2964/docs/design/package-managers.md), [`docs/design/frostui.md`](https://github.com/frostyard/chairlift/blob/3f77c74692dc10d9ee4b536eb13afa87c09a2964/docs/design/frostui.md), [`.goreleaser.yaml`](https://github.com/frostyard/chairlift/blob/3f77c74692dc10d9ee4b536eb13afa87c09a2964/.goreleaser.yaml), [`go.mod`](https://github.com/frostyard/chairlift/blob/3f77c74692dc10d9ee4b536eb13afa87c09a2964/go.mod). The Frostyard APT index [`Packages`](https://repository.frostyard.org/debian/dists/trixie/main/binary-amd64/Packages) for trixie on amd64, checked 2026-11-12, lists `frostyard-chairlift` 0.17.1.
- ChairLift release v0.17.0 commit [`67f49c623bc64f502316aa18fd1362daa310a3ec`](https://github.com/frostyard/chairlift/tree/67f49c623bc64f502316aa18fd1362daa310a3ec), released 2026-11-12 ([release](https://github.com/frostyard/chairlift/releases/tag/v0.17.0)): the Frostyard look [chairlift#295](https://github.com/frostyard/chairlift/pull/295) (`docs/design/frostui.md`, The Frostyard look; the README), the system monitor list [chairlift#298](https://github.com/frostyard/chairlift/pull/298) (`config.yml`, `CONFIG.md` `health_group`), the pkexec dependency [chairlift#297](https://github.com/frostyard/chairlift/pull/297) (`.goreleaser.yaml`, `docs/index.md`), and the feature updates that leave the list [chairlift#293](https://github.com/frostyard/chairlift/pull/293) (`docs/design/package-managers.md`, The re-check after an update).
- ChairLift v0.17.1: the OCI Flatpak update [chairlift#301](https://github.com/frostyard/chairlift/pull/301) ([`docs/design/package-managers.md`](https://github.com/frostyard/chairlift/blob/3f77c74692dc10d9ee4b536eb13afa87c09a2964/docs/design/package-managers.md#oci-remotes-list-the-installed-image-as-an-update), OCI remotes list the installed image as an update).
- The command-center window, its six pages, its keys and its console: ChairLift release v0.16.0 commit [`1cf6c02252aa9d36e0b4d8aca892502cf39844c4`](https://github.com/frostyard/chairlift/tree/1cf6c02252aa9d36e0b4d8aca892502cf39844c4): [`docs/adr/0017-mygo-command-center-window.md`](https://github.com/frostyard/chairlift/blob/1cf6c02252aa9d36e0b4d8aca892502cf39844c4/docs/adr/0017-mygo-command-center-window.md), [`internal/views/system.go`](https://github.com/frostyard/chairlift/blob/1cf6c02252aa9d36e0b4d8aca892502cf39844c4/internal/views/system.go), [`internal/views/pageview/pageview.go`](https://github.com/frostyard/chairlift/blob/1cf6c02252aa9d36e0b4d8aca892502cf39844c4/internal/views/pageview/pageview.go), [`internal/views/actionmsg/actionmsg.go`](https://github.com/frostyard/chairlift/blob/1cf6c02252aa9d36e0b4d8aca892502cf39844c4/internal/views/actionmsg/actionmsg.go), [`internal/views/flatpakstatus/flatpakstatus.go`](https://github.com/frostyard/chairlift/blob/1cf6c02252aa9d36e0b4d8aca892502cf39844c4/internal/views/flatpakstatus/flatpakstatus.go), [`internal/homebrew/trust.go`](https://github.com/frostyard/chairlift/blob/1cf6c02252aa9d36e0b4d8aca892502cf39844c4/internal/homebrew/trust.go).
- Problem reporting: ChairLift release v0.15.0 commit [`e3e434a2843512c99538c08070bafd1c965eb7f8`](https://github.com/frostyard/chairlift/tree/e3e434a2843512c99538c08070bafd1c965eb7f8), released 2026-11-05 ([release](https://github.com/frostyard/chairlift/releases/tag/v0.15.0)); [chairlift#267](https://github.com/frostyard/chairlift/pull/267): [`docs/adr/0015-problems-page-and-opt-in-reporting.md`](https://github.com/frostyard/chairlift/blob/e3e434a2843512c99538c08070bafd1c965eb7f8/docs/adr/0015-problems-page-and-opt-in-reporting.md), [`docs/specs/problem-reporting.md`](https://github.com/frostyard/chairlift/blob/e3e434a2843512c99538c08070bafd1c965eb7f8/docs/specs/problem-reporting.md).
- The Problems page: ChairLift release v0.14.0 commit [`54124831081796ffdadd4e10644fdc20719bf723`](https://github.com/frostyard/chairlift/tree/54124831081796ffdadd4e10644fdc20719bf723), released 2026-11-05 ([release](https://github.com/frostyard/chairlift/releases/tag/v0.14.0)); [chairlift#266](https://github.com/frostyard/chairlift/pull/266): [`README.md`](https://github.com/frostyard/chairlift/blob/54124831081796ffdadd4e10644fdc20719bf723/README.md), [`docs/adr/0015-problems-page-and-opt-in-reporting.md`](https://github.com/frostyard/chairlift/blob/54124831081796ffdadd4e10644fdc20719bf723/docs/adr/0015-problems-page-and-opt-in-reporting.md), [`docs/specs/problems-page.md`](https://github.com/frostyard/chairlift/blob/54124831081796ffdadd4e10644fdc20719bf723/docs/specs/problems-page.md), [`CONFIG.md`](https://github.com/frostyard/chairlift/blob/54124831081796ffdadd4e10644fdc20719bf723/CONFIG.md).
- ChairLift release v0.13.0 commit [`7aada596112fb0ed833a5ed99b7c62c5f4411b4c`](https://github.com/frostyard/chairlift/tree/7aada596112fb0ed833a5ed99b7c62c5f4411b4c), released 2026-11-04 ([release](https://github.com/frostyard/chairlift/releases/tag/v0.13.0)); [chairlift#260](https://github.com/frostyard/chairlift/pull/260), [chairlift#262](https://github.com/frostyard/chairlift/pull/262), [chairlift#264](https://github.com/frostyard/chairlift/pull/264), [chairlift#265](https://github.com/frostyard/chairlift/pull/265).
- [`docs/adr/0014-first-run-mode.md`](https://github.com/frostyard/chairlift/blob/7aada596112fb0ed833a5ed99b7c62c5f4411b4c/docs/adr/0014-first-run-mode.md) (the first-login setup), [`docs/design/package-managers.md`](https://github.com/frostyard/chairlift/blob/7aada596112fb0ed833a5ed99b7c62c5f4411b4c/docs/design/package-managers.md) (each Flatpak remote is checked on its own).
- snosi commit [`770f9a3c82c4bb7348f6c477fce08febf25554af`](https://github.com/frostyard/snosi/tree/770f9a3c82c4bb7348f6c477fce08febf25554af) ([snosi#1224](https://github.com/frostyard/snosi/pull/1224)): [`docs/adr/0028-first-login-runs-chairlift-first-run.md`](https://github.com/frostyard/snosi/blob/770f9a3c82c4bb7348f6c477fce08febf25554af/docs/adr/0028-first-login-runs-chairlift-first-run.md) (Snow and Snowfield start `chairlift-first-run` at login, Sundog and Floe do not), [`shared/snow/tree/etc/xdg/autostart/org.frostyard.ChairLift.FirstRun.desktop`](https://github.com/frostyard/snosi/blob/770f9a3c82c4bb7348f6c477fce08febf25554af/shared/snow/tree/etc/xdg/autostart/org.frostyard.ChairLift.FirstRun.desktop).
- ChairLift release v0.12.0 commit [`64245bc9852c4171e9b55b46048d8cf64e7a0f47`](https://github.com/frostyard/chairlift/tree/64245bc9852c4171e9b55b46048d8cf64e7a0f47), released 2026-11-04 ([release](https://github.com/frostyard/chairlift/releases/tag/v0.12.0)); [chairlift#257](https://github.com/frostyard/chairlift/pull/257), [chairlift#258](https://github.com/frostyard/chairlift/pull/258).
- [`docs/adr/0012-firmware-updates-use-fwupds-own-polkit.md`](https://github.com/frostyard/chairlift/blob/64245bc9852c4171e9b55b46048d8cf64e7a0f47/docs/adr/0012-firmware-updates-use-fwupds-own-polkit.md) (fwupd authenticates the install), [`docs/adr/0013-firmware-updates-are-on-by-default.md`](https://github.com/frostyard/chairlift/blob/64245bc9852c4171e9b55b46048d8cf64e7a0f47/docs/adr/0013-firmware-updates-are-on-by-default.md).
- snosi commit [`42677d1514096716069bbb13b785d9f5814b14be`](https://github.com/frostyard/snosi/tree/42677d1514096716069bbb13b785d9f5814b14be): [`mkosi.images/base/mkosi.conf`](https://github.com/frostyard/snosi/blob/42677d1514096716069bbb13b785d9f5814b14be/mkosi.images/base/mkosi.conf#L121-L123) (fwupd in every image).
- snosi commit [`55898754f678c81ae83c4e218679647311932be0`](https://github.com/frostyard/snosi/tree/55898754f678c81ae83c4e218679647311932be0) (`main` on 2026-11-12): [`mkosi.images/base/mkosi.extra/usr/libexec/bootc-update-stage`](https://github.com/frostyard/snosi/blob/55898754f678c81ae83c4e218679647311932be0/mkosi.images/base/mkosi.extra/usr/libexec/bootc-update-stage) (the base image still has the bootc helper).
- snosi commit [`b2858ca0222814c395cf8248db98f3e096d57dc9`](https://github.com/frostyard/snosi/tree/b2858ca0222814c395cf8248db98f3e096d57dc9): [`mkosi.profiles/snowfield/mkosi.conf`](https://github.com/frostyard/snosi/blob/b2858ca0222814c395cf8248db98f3e096d57dc9/mkosi.profiles/snowfield/mkosi.conf), [`shared/composition/snow/mkosi.conf`](https://github.com/frostyard/snosi/blob/b2858ca0222814c395cf8248db98f3e096d57dc9/shared/composition/snow/mkosi.conf), [`shared/packages/snow/mkosi.conf`](https://github.com/frostyard/snosi/blob/b2858ca0222814c395cf8248db98f3e096d57dc9/shared/packages/snow/mkosi.conf), [`shared/packages/sundog/mkosi.conf`](https://github.com/frostyard/snosi/blob/b2858ca0222814c395cf8248db98f3e096d57dc9/shared/packages/sundog/mkosi.conf).
- [Duncan's review: package downgrade (frostyard-org#30)](https://github.com/frostyard/frostyard-org/pull/30#pullrequestreview-5630346572)
