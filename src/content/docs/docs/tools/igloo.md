---
title: Igloo
description: "Install Igloo, the GNOME terminal that opens nsl machines from its New Tab menu."
---

Igloo is a GNOME terminal that opens nsl machines the way it opens Podman,
Toolbox, and Distrobox containers. Pick a machine from the New Tab menu, or
create and manage machines in Preferences. It installs as
`io.github.frostyard.Igloo`, beside Ptyxis, with its own settings.

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
flatpak install --user frostyard io.github.frostyard.Igloo
```

Flatpak also installs the GNOME 51 runtime from Flathub if you do not have it.
Start Igloo from your applications, or run:

```bash
flatpak run io.github.frostyard.Igloo
```

The terminal opens. To
build Igloo yourself, see the [README](https://github.com/frostyard/igloo/blob/38d98cd171d4ffbbe4adfaa55818f503206866dd/README.md).

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
- Open, start, stop, or remove a machine, and make it the default.
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

Export and import are not in the interface yet. Use `nsl export` and
`nsl import`.

## Update and remove

Update Igloo with the Flatpak command:

```bash
flatpak update
```

Remove Igloo:

```bash
flatpak uninstall io.github.frostyard.Igloo
```

This keeps your Igloo settings in `~/.var/app/io.github.frostyard.Igloo/`. Add
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
- [Igloo README](https://github.com/frostyard/igloo/blob/38d98cd171d4ffbbe4adfaa55818f503206866dd/README.md)

## Sources

Reviewed 2026-10-27.

- Igloo commit [`38d98cd171d4ffbbe4adfaa55818f503206866dd`](https://github.com/frostyard/igloo/tree/38d98cd171d4ffbbe4adfaa55818f503206866dd)
- [`README.md`](https://github.com/frostyard/igloo/blob/38d98cd171d4ffbbe4adfaa55818f503206866dd/README.md)
- [`io.github.frostyard.Igloo.json`](https://github.com/frostyard/igloo/blob/38d98cd171d4ffbbe4adfaa55818f503206866dd/io.github.frostyard.Igloo.json)
- [`meson.build`](https://github.com/frostyard/igloo/blob/38d98cd171d4ffbbe4adfaa55818f503206866dd/meson.build)
- [`agent/ptyxis-nsl.c`](https://github.com/frostyard/igloo/blob/38d98cd171d4ffbbe4adfaa55818f503206866dd/agent/ptyxis-nsl.c)
- [Duncan's review: Igloo roll back (frostyard-org#30)](https://github.com/frostyard/frostyard-org/pull/30#pullrequestreview-5630346572)
- snosi commit [`b2858ca0222814c395cf8248db98f3e096d57dc9`](https://github.com/frostyard/snosi/tree/b2858ca0222814c395cf8248db98f3e096d57dc9): [`shared/snow/tree/etc/flatpak/remotes.d/flathub.flatpakrepo`](https://github.com/frostyard/snosi/blob/b2858ca0222814c395cf8248db98f3e096d57dc9/shared/snow/tree/etc/flatpak/remotes.d/flathub.flatpakrepo), [`shared/sundog/scripts/postinstall/sundog.postinst.chroot`](https://github.com/frostyard/snosi/blob/b2858ca0222814c395cf8248db98f3e096d57dc9/shared/sundog/scripts/postinstall/sundog.postinst.chroot), [`mkosi.profiles/snowfield/mkosi.conf`](https://github.com/frostyard/snosi/blob/b2858ca0222814c395cf8248db98f3e096d57dc9/mkosi.profiles/snowfield/mkosi.conf)
- nsl main [`site/content/reference/machine-images.md`](https://github.com/frostyard/nsl/blob/b78a782f7f56eb1717afac16fa69d05a58cfd60e/site/content/reference/machine-images.md)
- [Duncan's review: the OSC 7 image date and the uninstall behaviour (frostyard-org#22)](https://github.com/frostyard/frostyard-org/pull/22#pullrequestreview-5620027150)
- The per-user remote: Brian's decisions T532a (2026-10-29) and T532b: every user adds the remote. A fresh Snow install has no `frostyard` remote, user or system (Murbella's check, T540).
- The Flathub user remote: a test on 2026-10-30 with Flatpak 1.16.6 and an empty user installation. Without Flathub as a user remote, `flatpak install --user` fails with `requires the runtime org.gnome.Platform/x86_64/51 which was not found`.
- Install text: flatpak-index [flatpak-index#7](https://github.com/frostyard/flatpak-index/pull/7) at [`8f951e53a8801b289e4edcd7d06f018a0333f73e`](https://github.com/frostyard/flatpak-index/blob/8f951e53a8801b289e4edcd7d06f018a0333f73e/README.md) (open on 2026-10-30): the per-user remote and the Flathub user remote.
