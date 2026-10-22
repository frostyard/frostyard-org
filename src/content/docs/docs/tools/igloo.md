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

Igloo uses the GNOME 51 runtime from Flathub. Set Flathub up first if your
system does not have it: [flathub.org/setup](https://flathub.org/setup). Snow,
Snowfield, and Sundog already configure the Flathub remote.

## Install

Add the Frostyard Flatpak remote once:

```bash
flatpak remote-add --if-not-exists frostyard https://frostyard.github.io/flatpak-index/frostyard.flatpakrepo
```

Then install Igloo:

```bash
flatpak install frostyard io.github.frostyard.Igloo
```

Flatpak also installs the GNOME 51 runtime from Flathub if you do not have it.
Start Igloo from your applications, or run:

```bash
flatpak run io.github.frostyard.Igloo
```

The terminal opens. To
build Igloo yourself, see the [README](https://github.com/frostyard/igloo/blob/cf315cb3fcdb43c07ab6ca24e4d45c0e43aa670b/README.md).

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

Export and import are not in the interface yet. Use `nsl export` and
`nsl import`.

## Update

Update Igloo with the Flatpak command:

```bash
flatpak update
```

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
- [Igloo README](https://github.com/frostyard/igloo/blob/cf315cb3fcdb43c07ab6ca24e4d45c0e43aa670b/README.md)

## Sources

Reviewed 2026-10-22.

- Igloo commit [`cf315cb3fcdb43c07ab6ca24e4d45c0e43aa670b`](https://github.com/frostyard/igloo/tree/cf315cb3fcdb43c07ab6ca24e4d45c0e43aa670b)
- [`README.md`](https://github.com/frostyard/igloo/blob/cf315cb3fcdb43c07ab6ca24e4d45c0e43aa670b/README.md)
- [`io.github.frostyard.Igloo.json`](https://github.com/frostyard/igloo/blob/cf315cb3fcdb43c07ab6ca24e4d45c0e43aa670b/io.github.frostyard.Igloo.json)
- [`meson.build`](https://github.com/frostyard/igloo/blob/cf315cb3fcdb43c07ab6ca24e4d45c0e43aa670b/meson.build)
- [`agent/ptyxis-nsl.c`](https://github.com/frostyard/igloo/blob/cf315cb3fcdb43c07ab6ca24e4d45c0e43aa670b/agent/ptyxis-nsl.c)
- snosi commit [`e5d0597f5b53ddddfa7a35ff6f706b094f20f76b`](https://github.com/frostyard/snosi/tree/e5d0597f5b53ddddfa7a35ff6f706b094f20f76b): [`shared/snow/tree/etc/flatpak/remotes.d/flathub.flatpakrepo`](https://github.com/frostyard/snosi/blob/e5d0597f5b53ddddfa7a35ff6f706b094f20f76b/shared/snow/tree/etc/flatpak/remotes.d/flathub.flatpakrepo), [`shared/sundog/scripts/postinstall/sundog.postinst.chroot`](https://github.com/frostyard/snosi/blob/e5d0597f5b53ddddfa7a35ff6f706b094f20f76b/shared/sundog/scripts/postinstall/sundog.postinst.chroot), [`mkosi.profiles/snowfield/mkosi.conf`](https://github.com/frostyard/snosi/blob/e5d0597f5b53ddddfa7a35ff6f706b094f20f76b/mkosi.profiles/snowfield/mkosi.conf)
