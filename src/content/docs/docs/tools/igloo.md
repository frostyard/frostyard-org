---
title: Igloo
description: "Install Igloo, the GNOME terminal that opens nsl machines from its New Tab menu."
---

Igloo is a GNOME terminal that opens nsl machines the way it opens Podman,
Toolbox, and Distrobox containers. Pick a machine from the New Tab menu, or
create and manage machines in Preferences. It installs as
`org.frostyard.Igloo`, beside Ptyxis, with its own settings.

## Before you start

You need nsl 0.8.0 or later on the host. The Flatpak does not bundle nsl. With
an older nsl, machines still open from the New Tab menu, but the Machines page
asks you to update.

Igloo uses the GNOME 51 runtime from Flathub. Snow, Snowfield, and Sundog
configure Flathub for the whole system. A user install needs Flathub for your
user too: the steps below add it.

## Install

Add the Frostyard Flatpak remote once, for your user:

```bash
flatpak remote-add --user --if-not-exists frostyard https://frostyard.github.io/flatpak-index/frostyard.flatpakrepo
```

Apps use runtimes from Flathub, such as the GNOME runtime. A `--user` install
gets a missing runtime only from a user remote, so add Flathub for your user
too:

```bash
flatpak remote-add --user --if-not-exists flathub https://dl.flathub.org/repo/flathub.flatpakrepo
```

Then install Igloo:

```bash
flatpak install --user frostyard org.frostyard.Igloo
```

Flatpak also installs the GNOME 51 runtime from Flathub if you do not have it.
Start Igloo from your applications, or run:

```bash
flatpak run org.frostyard.Igloo
```

The terminal opens. To
build Igloo yourself, see [build and release](https://github.com/frostyard/igloo/blob/71b440d0bbe6837977dcf7a7a358862b3c610522/docs/design/build-and-release.md).

## Use Igloo

Open a machine tab from the New Tab menu:

1. Click the dropdown next to the new tab button.
2. Pick a machine in the *Machines* section.

The tab opens in that machine. The menu ends with *Manage Machines…*.

Open the Machines page with **Main menu → Machines**. It lists every machine
with its distribution, tier, state, and default marker. It also lets you:

- Create a machine with *New Machine*. Igloo asks for a name, a distribution
  from the signed nsl catalogue, isolation, default, and an optional username.
  It then runs `nsl create` in a terminal, so you see the downloads and the
  check, and offers to open the new machine.
- Import a machine from an `nsl export` archive with *Import…*.
- Open, start, stop, export, or remove a machine, and make it the default.
  *Export…* stops a running machine first, after you confirm.
- Create a profile for a machine with *Edit Profile…*, for its own palette,
  font, and command.
- Change *Resources*: shared VM memory and processors, autostart, idle timeout,
  and isolated VM resources. Igloo writes them to `nsl.conf`.
- Run *Host* commands: `nsl doctor`, `nsl update`, and `nsl shutdown`.

A profile's *Default Container* can be an nsl machine. Pinned or restored tabs
reopen in their machine, and new tabs keep the current machine as they keep the
current container.

A new tab opened from a machine tab starts in the same directory. This needs a
machine created from an nsl image built since 2026-10-05; older machines start
new tabs in the guest home.

## Update and remove

Update Igloo with the Flatpak command:

```bash
flatpak update
```

Igloo was `io.github.frostyard.Igloo` before. `flatpak update`, or GNOME
Software, replaces it with `org.frostyard.Igloo` and keeps your settings,
profiles, saved session, and palettes.

Remove Igloo:

```bash
flatpak uninstall --user org.frostyard.Igloo
```

This keeps your Igloo settings in `~/.var/app/org.frostyard.Igloo/`. Add
`--delete-data` to remove them too. nsl, your machines, and `nsl.conf` stay.

## Roll back

Igloo has no roll back. The Frostyard remote serves only the newest tagged release.

## Troubleshooting

| Symptom | Check | Fix |
| --- | --- | --- |
| The Machines page asks you to update nsl | `nsl version` | Install nsl 0.8.0 or later. Igloo reads machine state through `--json`, which 0.8.0 introduced. |
| The Machines page cannot find nsl | The lookup paths below | Install nsl, or put it in one of the lookup paths, then press *Check Again*. |

Igloo looks for nsl on `PATH`, then in `~/.local/bin`,
`/home/linuxbrew/.linuxbrew/bin`, `~/.linuxbrew/bin`, `/usr/local/bin`, and
`/usr/bin`. A session started through `flatpak-spawn` often has a minimal
`PATH`, so the extra paths matter. If nsl is not installed, the page links to
its installation guide.

## See also

- [nsl](/docs/tools/nsl/)
- [nsl documentation](https://frostyard.github.io/nsl/)
- [Ptyxis](https://gitlab.gnome.org/chergert/ptyxis)
- [Frostyard Flatpak remote](https://github.com/frostyard/flatpak-index)
- [Igloo README](https://github.com/frostyard/igloo/blob/71b440d0bbe6837977dcf7a7a358862b3c610522/README.md)

## Sources

Reviewed 2026-11-16.

- Igloo release v51.0 commit [`71b440d0bbe6837977dcf7a7a358862b3c610522`](https://github.com/frostyard/igloo/tree/71b440d0bbe6837977dcf7a7a358862b3c610522), tagged 2026-11-06 ([tag](https://github.com/frostyard/igloo/tree/v51.0)): the application ID becomes `org.frostyard.Igloo`, with an end-of-life rebase from `io.github.frostyard.Igloo` ([igloo#10](https://github.com/frostyard/igloo/pull/10)), and the Machines page exports and imports machines ([igloo#7](https://github.com/frostyard/igloo/pull/7)). On 2026-11-15, `ghcr.io/frostyard/igloo:latest`, the image the Frostyard remote serves, has the same digest as `v51.0` (`sha256:4ca67169dc6caf0a36711cb9447160a53efce42c93816406ae79dd0cb6051325`).
- Igloo main commit [`1bb63dd1182536633e7b484d93daa617d8d1f0c4`](https://github.com/frostyard/igloo/tree/1bb63dd1182536633e7b484d93daa617d8d1f0c4), checked 2026-11-16: after v51.0 it adds logs and recovery to the Machines page ([igloo#15](https://github.com/frostyard/igloo/pull/15)), resumes an unfinished removal ([igloo#19](https://github.com/frostyard/igloo/pull/19)), restores `nsl.conf` when `nsl config` cannot run ([igloo#20](https://github.com/frostyard/igloo/pull/20)), and shows the data disk of each VM with *Grow Disk…*, which runs `nsl resize` ([igloo#27](https://github.com/frostyard/igloo/pull/27)). No tag carries them yet, and the Flatpak image moves only on a tag ([`.github/workflows/flatpak.yml`](https://github.com/frostyard/igloo/blob/1bb63dd1182536633e7b484d93daa617d8d1f0c4/.github/workflows/flatpak.yml)), so this page does not describe them. On 2026-11-16, `latest` still has the `v51.0` digest.
- [`README.md`](https://github.com/frostyard/igloo/blob/71b440d0bbe6837977dcf7a7a358862b3c610522/README.md)
- [`org.frostyard.Igloo.json`](https://github.com/frostyard/igloo/blob/71b440d0bbe6837977dcf7a7a358862b3c610522/org.frostyard.Igloo.json)
- [`meson.build`](https://github.com/frostyard/igloo/blob/71b440d0bbe6837977dcf7a7a358862b3c610522/meson.build)
- [`agent/ptyxis-nsl.c`](https://github.com/frostyard/igloo/blob/71b440d0bbe6837977dcf7a7a358862b3c610522/agent/ptyxis-nsl.c)
- [`docs/design/nsl-integration.md`](https://github.com/frostyard/igloo/blob/71b440d0bbe6837977dcf7a7a358862b3c610522/docs/design/nsl-integration.md)
- [`docs/design/build-and-release.md`](https://github.com/frostyard/igloo/blob/71b440d0bbe6837977dcf7a7a358862b3c610522/docs/design/build-and-release.md)
- [`docs/adr/0003-rename-the-application-id.md`](https://github.com/frostyard/igloo/blob/71b440d0bbe6837977dcf7a7a358862b3c610522/docs/adr/0003-rename-the-application-id.md)
- Igloo commit [`38d98cd171d4ffbbe4adfaa55818f503206866dd`](https://github.com/frostyard/igloo/tree/38d98cd171d4ffbbe4adfaa55818f503206866dd), the previous review (2026-10-27).
- [Duncan's review: Igloo roll back (frostyard-org#30)](https://github.com/frostyard/frostyard-org/pull/30#pullrequestreview-5630346572)
- snosi commit [`b2858ca0222814c395cf8248db98f3e096d57dc9`](https://github.com/frostyard/snosi/tree/b2858ca0222814c395cf8248db98f3e096d57dc9): [`shared/snow/tree/etc/flatpak/remotes.d/flathub.flatpakrepo`](https://github.com/frostyard/snosi/blob/b2858ca0222814c395cf8248db98f3e096d57dc9/shared/snow/tree/etc/flatpak/remotes.d/flathub.flatpakrepo), [`shared/sundog/scripts/postinstall/sundog.postinst.chroot`](https://github.com/frostyard/snosi/blob/b2858ca0222814c395cf8248db98f3e096d57dc9/shared/sundog/scripts/postinstall/sundog.postinst.chroot), [`mkosi.profiles/snowfield/mkosi.conf`](https://github.com/frostyard/snosi/blob/b2858ca0222814c395cf8248db98f3e096d57dc9/mkosi.profiles/snowfield/mkosi.conf)
- nsl main [`site/content/reference/machine-images.md`](https://github.com/frostyard/nsl/blob/b78a782f7f56eb1717afac16fa69d05a58cfd60e/site/content/reference/machine-images.md)
- [Duncan's review: the OSC 7 image date and the uninstall behaviour (frostyard-org#22)](https://github.com/frostyard/frostyard-org/pull/22#pullrequestreview-5620027150)
- The per-user remote: flatpak-index [`README.md`](https://github.com/frostyard/flatpak-index/blob/4828c9836d451aaa7376483737d25a764b4e17bd/README.md#install-apps) at `4828c9836d451aaa7376483737d25a764b4e17bd` adds it with `flatpak remote-add --user`. A Snow image carries no `frostyard` remote: snosi [`shared/snow/tree/etc/flatpak/remotes.d/`](https://github.com/frostyard/snosi/tree/b2858ca0222814c395cf8248db98f3e096d57dc9/shared/snow/tree/etc/flatpak/remotes.d) at `b2858ca0222814c395cf8248db98f3e096d57dc9` holds only `flathub.flatpakrepo`.
- The Flathub user remote: a test on 2026-10-30 with Flatpak 1.16.6 and an empty user installation. Without Flathub as a user remote, `flatpak install --user` fails with `requires the runtime org.gnome.Platform/x86_64/51 which was not found`.
- Install text: flatpak-index [`README.md`](https://github.com/frostyard/flatpak-index/blob/4828c9836d451aaa7376483737d25a764b4e17bd/README.md) at `4828c9836d451aaa7376483737d25a764b4e17bd` ([flatpak-index#7](https://github.com/frostyard/flatpak-index/pull/7), merged 2026-10-30): the per-user remote and the Flathub user remote.
- The new application ID on the remote: flatpak-index [`README.md`](https://github.com/frostyard/flatpak-index/blob/4042656cda4ec96eb85bfa445754e40ef2cb4ac6/README.md#install) at `4042656cda4ec96eb85bfa445754e40ef2cb4ac6` installs `org.frostyard.Igloo`, and its [`apps.json`](https://github.com/frostyard/flatpak-index/blob/4042656cda4ec96eb85bfa445754e40ef2cb4ac6/apps.json) keeps `io.github.frostyard.Igloo` so that installed copies move to the new ID.
