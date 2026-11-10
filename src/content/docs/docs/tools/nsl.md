---
title: nsl
description: "Install nsl on a Frostyard image, create your first Linux machine, and update or remove it."
follows:
  repo: frostyard/nsl
  tag: v0.13.0
---

nsl gives you WSL-style Linux machines on Linux: a systemd-nspawn container
inside a systemd-vmspawn VM, with its own packages, services, and home. Use it
when a project needs `apt`, `dnf`, or `pacman` and your host `/usr` is
read-only. nsl is pre-release: commands and defaults can change between
releases. This guide follows nsl v0.13.0; the full documentation is at
[frostyard.github.io/nsl](https://frostyard.github.io/nsl/).

## Before you start

You need an x86-64 host with KVM. A Frostyard image already carries most of the
VM stack. Base has QEMU, `qemu-img`, OVMF firmware with a QEMU firmware
descriptor, and `virtiofsd`. Snow, Snowfield, Sundog, and Floe have
`systemd-container`, and the desktops add Waypipe for machine windows.

Join the `kvm` group. Firn does not add your user to it, so the check fails
without it. No new login is needed after the group is added.

```bash
sudo usermod -aG kvm 'YOUR_USERNAME'
```

Then run the host check:

```bash
nsl doctor
```

`doctor` prints `OK` or `MISSING` for each tool, the systemd version, the UEFI
firmware, and device access. A passing line is `OK kvm group membership`.
`MISSING systemd 259 or newer` needs a newer host release.

## Install

Install the CLI from the Frostyard tap on Linux with Homebrew:

```bash
brew tap frostyard/tap
brew install --cask frostyard/tap/nsl
nsl doctor
```

Snow, Snowfield, Sundog, and Floe set up Homebrew at first boot. The cask installs the CLI only; images
are downloaded and checked on your first create.

Each release also has `linux_amd64` and `linux_arm64` tarballs with a
`checksums.txt`. The arm64 CLI cannot run machines: `create` rejects a host that
is not x86-64. The
[nsl install guide](https://frostyard.github.io/nsl/getting-started/install/)
has the download, check, and unpack commands.

## Create your first machine

Create a Debian 13 machine:

```bash
nsl create debian --distro debian:13
```

nsl downloads the signed image catalogue, checks that both images came from the
Frostyard publishing workflow, and caches them. It starts the shared VM and
creates the machine. The first machine becomes the default, and the command
ends with `Created debian from BUILD_ID`.

For another distro, change the `--distro` selector. Run `nsl images` to see
what the current catalogue offers. The
[machine images reference](https://frostyard.github.io/nsl/reference/machine-images/)
lists every selector and its distro notes.

Open a shell in it from your project directory:

```bash
mkdir -p ~/src/project
cd ~/src/project
nsl
```

You are in a login shell in the default machine, in the same files at
`/mnt/host` plus the host path. Your username, UID, and GID match the host, and
`sudo` needs no password. Type `exit` or press Ctrl-D to return.

Run one command from the host:

```bash
nsl run cat /etc/os-release
```

The output identifies Debian 13. Look around and stop the VM:

```bash
nsl list
nsl shutdown
```

`nsl list` shows the VM, its resources and data disk, and every machine. You
can usually leave the shutdown to nsl: a machine stops after 15 minutes
without sessions or windows, and the VM stops a minute after its last machine.

## Machines

A machine is a Linux distro with its own packages, services, and home, under a
name you choose. Ordinary machines are systemd-nspawn containers in one shared
VM. nsl boots that VM with systemd-vmspawn and QEMU/KVM, and the machines share
its memory and CPUs.
[How nsl works](https://frostyard.github.io/nsl/concepts/how-it-works/)
explains the parts.

| Task | Command | Guide |
| --- | --- | --- |
| Create a machine | `nsl create NAME --distro DISTRO:RELEASE` | [Create a machine](https://frostyard.github.io/nsl/guides/machines/#create-a-machine) |
| Make a machine the default | `nsl default NAME` | [The default machine](https://frostyard.github.io/nsl/guides/machines/#the-default-machine) |
| Start or stop one machine | `nsl start NAME`, `nsl stop NAME` | [Start, stop and idle](https://frostyard.github.io/nsl/guides/machines/#start-stop-and-idle) |
| Remove a stopped machine | `nsl remove NAME --yes` | [Remove a machine](https://frostyard.github.io/nsl/guides/machines/#remove-a-machine) |
| Grow the VM's data disk | `nsl resize --disk GiB` | [Grow the data disk](https://frostyard.github.io/nsl/guides/storage/#grow-the-data-disk) |
| Run untrusted software in a VM of its own | `nsl create NAME --distro DISTRO:RELEASE --isolated` | [Isolated machines](https://frostyard.github.io/nsl/guides/isolated/) |

A name starts with a lowercase letter, then lowercase letters, digits, or
hyphens, up to 24 characters. It cannot end with a hyphen. Put flags after the
name.

Install software with the machine's own package manager: `apt-get`, `dnf`,
`pacman`, or `zypper`. A newer machine image changes only machines you create
later. Rootless Podman works inside a machine.

An ordinary machine can read and write your home, `/run/media/USER`, and
`/mnt`, under `/mnt/host`. Treat software in it as software that runs with
your permissions. Edits you make on the host send no file events into the
machine, so keep file watchers and hot reload in the guest home. The
[host files guide](https://frostyard.github.io/nsl/guides/host-files/) has the
path rules.

An isolated machine runs in its own VM. It has no host files, no windows on
your desktop, and no `nsl-open` to the host. Its VM gets 2 GiB of memory and 2
CPUs by default. You choose the tier when you create or import the machine.

Services inside a machine do not keep it running. To keep machines running,
set `idle_timeout = 0` in the `[machines]` section of
`$XDG_CONFIG_HOME/nsl/nsl.conf`. When `XDG_CONFIG_HOME` is unset, empty, or
relative, the file is `~/.config/nsl/nsl.conf`. The same file sets the VM's
memory and CPUs: see the
[configuration reference](https://frostyard.github.io/nsl/reference/configuration/#keys).

Run `nsl remove NAME` without `--yes` first: it shows what it deletes.
Removal is permanent. Your host files, cached images, and exported archives
stay. To keep a copy, export the machine first.

## Everyday tasks

| Task | Command | Guide |
| --- | --- | --- |
| Open a shell in a named machine | `nsl -m fedora` | [Machines](https://frostyard.github.io/nsl/guides/machines/#enter-a-machine) |
| Reach a server on host loopback | `nsl ports` | [Ports](https://frostyard.github.io/nsl/guides/ports/) |
| Connect VS Code or another SSH client | `nsl ssh-config NAME` | [Editors over SSH](https://frostyard.github.io/nsl/guides/editors/) |
| Save a stopped machine to an archive | `nsl export NAME FILE` | [Export and import](https://frostyard.github.io/nsl/guides/export-import/#export) |
| Move to the newest VM image | `nsl update` | [Images and updates](https://frostyard.github.io/nsl/guides/images/#update-the-vm) |
| Put a machine application in your host's menu | `nsl app add APP` | [Desktop applications](https://frostyard.github.io/nsl/guides/desktop/#add-an-application-to-the-menu) |

`nsl app add` writes a menu entry, named with the application's name and the machine, for example `Calculator (debian)`. APP is the application's desktop-file ID without `.desktop`; `nsl run ls /usr/share/applications` lists them. `nsl app list` shows the entries and `nsl app remove APP` removes one. Add `--mime-types` to list the application in "Open With" for its file types.

## Update and remove

Update the CLI with Homebrew:

```bash
brew update
brew upgrade --cask frostyard/tap/nsl
```

For a tarball install, repeat the download, check, and unpack steps in the
[nsl install guide](https://frostyard.github.io/nsl/getting-started/install/).
Every release uses the same file names, so those steps fetch the newest
release.

Run `nsl shutdown` before you remove it:

```bash
brew uninstall --cask frostyard/tap/nsl
```

For a tarball install, remove `~/.local/bin/nsl`. Both methods leave your
machines and state in `NSL_HOME`, and leave your `nsl.conf` settings. To delete
the machines too, remove them with nsl first.

## Roll back

Homebrew installs only the newest nsl. To roll back, run `nsl shutdown`,
remove the cask with `brew uninstall --cask frostyard/tap/nsl`, and install
the release you want from its tarball.

For a tarball install, set `base` to the release you want, replace `VERSION`
with its number, and repeat the steps:

```bash
base=https://github.com/frostyard/nsl/releases/download/vVERSION
curl -LO "$base/nsl_linux_amd64.tar.gz" -LO "$base/checksums.txt"
sha256sum --ignore-missing -c checksums.txt
gh attestation verify nsl_linux_amd64.tar.gz --repo frostyard/nsl
tar -xzf nsl_linux_amd64.tar.gz nsl
mkdir -p ~/.local/bin
install -m 0755 nsl ~/.local/bin/nsl
nsl version
```

The check prints `nsl_linux_amd64.tar.gz: OK`, and `nsl version` shows the
release you chose.

Roll back to v0.9.0 or later. Your machines and `nsl.conf` stay. v0.9.0
changed the VM's data disk, so v0.8.0 and earlier releases cannot use machines
that a newer release made. Before you roll back across a release, read its
release notes for breaking changes.

Machine images do not roll back. Inside a machine, go back with the distro's
own package manager, or import an `nsl export` archive that you saved before.
The VM image also moves only forward with `nsl update`.

## Igloo

Igloo is a GNOME terminal that opens nsl machines from its New Tab menu.
Install it from the Frostyard Flatpak remote: [Igloo](/docs/tools/igloo/).

## Troubleshooting

| Symptom | Check | Fix |
| --- | --- | --- |
| `nsl doctor` reports `MISSING kvm group membership` | The command it prints | Ask an administrator to run it, then retry nsl. No new login is needed. |
| Bare `nsl` fails and lists the machines | There is no default machine | Run `nsl default NAME`, or `nsl -m NAME`. |
| A port is not reachable from the host | `nsl ports` | A `conflict` means something else holds the port. The server must listen on port 1024 or above, and not on 5353 or 5355. |
| The VM does not become ready | `nsl logs`, then `nsl recover` | Recovery starts the VM from a fresh root and keeps your machines. |
| nsl reports `Failed to connect to bus` | `echo $XDG_RUNTIME_DIR` | Run nsl in your own login session, or set `XDG_RUNTIME_DIR=/run/user/$(id -u)`. A shell from `su`, `sudo -u`, or a plain `ssh` can lack it. |

## Problem records

When a release build of nsl crashes or meets 1 of 4 internal errors, it writes a
record to your local systemd journal. nsl sends nothing over the network, and
it has no setting to turn the records off. On a desktop, ChairLift can show
these records, and it sends a report only after you turn reporting on.
[Problem reports](/privacy/problem-reports/) says what a report holds. To read
the records, see
[nsl's limits page](https://frostyard.github.io/nsl/reference/limits/#problem-records).
To learn why nsl keeps them local, read
[nsl ADR-0023](https://github.com/frostyard/nsl/blob/4d087c480a0ff1810ff1a93e6faf57ac228db8a6/docs/adr/0023-local-problem-records.md).

## See also

- [nsl documentation](https://frostyard.github.io/nsl/)
- [Igloo](/docs/tools/igloo/)

## Sources

Reviewed 2026-11-06.

- nsl release v0.13.0 commit [`4d087c480a0ff1810ff1a93e6faf57ac228db8a6`](https://github.com/frostyard/nsl/tree/4d087c480a0ff1810ff1a93e6faf57ac228db8a6), released 2026-11-05 ([release](https://github.com/frostyard/nsl/releases/tag/v0.13.0)).
- [`README.md`](https://github.com/frostyard/nsl/blob/4d087c480a0ff1810ff1a93e6faf57ac228db8a6/README.md)
- [`AGENTS.md`](https://github.com/frostyard/nsl/blob/4d087c480a0ff1810ff1a93e6faf57ac228db8a6/AGENTS.md)
- [`site/content/getting-started/install.md`](https://github.com/frostyard/nsl/blob/4d087c480a0ff1810ff1a93e6faf57ac228db8a6/site/content/getting-started/install.md)
- [`site/content/getting-started/first-machine.md`](https://github.com/frostyard/nsl/blob/4d087c480a0ff1810ff1a93e6faf57ac228db8a6/site/content/getting-started/first-machine.md)
- [`site/content/guides/machines.md`](https://github.com/frostyard/nsl/blob/4d087c480a0ff1810ff1a93e6faf57ac228db8a6/site/content/guides/machines.md)
- [`site/content/guides/isolated.md`](https://github.com/frostyard/nsl/blob/4d087c480a0ff1810ff1a93e6faf57ac228db8a6/site/content/guides/isolated.md)
- [`site/content/guides/host-files.md`](https://github.com/frostyard/nsl/blob/4d087c480a0ff1810ff1a93e6faf57ac228db8a6/site/content/guides/host-files.md)
- [`site/content/guides/storage.md`](https://github.com/frostyard/nsl/blob/4d087c480a0ff1810ff1a93e6faf57ac228db8a6/site/content/guides/storage.md)
- [`site/content/concepts/how-it-works.md`](https://github.com/frostyard/nsl/blob/4d087c480a0ff1810ff1a93e6faf57ac228db8a6/site/content/concepts/how-it-works.md)
- [`site/content/reference/configuration.md`](https://github.com/frostyard/nsl/blob/4d087c480a0ff1810ff1a93e6faf57ac228db8a6/site/content/reference/configuration.md)
- [`main.go`](https://github.com/frostyard/nsl/blob/4d087c480a0ff1810ff1a93e6faf57ac228db8a6/main.go)
- [`config.go`](https://github.com/frostyard/nsl/blob/4d087c480a0ff1810ff1a93e6faf57ac228db8a6/config.go)
- [`machines.go`](https://github.com/frostyard/nsl/blob/4d087c480a0ff1810ff1a93e6faf57ac228db8a6/machines.go)
- [`internal/protocol/protocol.go`](https://github.com/frostyard/nsl/blob/4d087c480a0ff1810ff1a93e6faf57ac228db8a6/internal/protocol/protocol.go)
- [`site/content/guides/ports.md`](https://github.com/frostyard/nsl/blob/4d087c480a0ff1810ff1a93e6faf57ac228db8a6/site/content/guides/ports.md)
- [`site/content/guides/editors.md`](https://github.com/frostyard/nsl/blob/4d087c480a0ff1810ff1a93e6faf57ac228db8a6/site/content/guides/editors.md)
- [`site/content/guides/export-import.md`](https://github.com/frostyard/nsl/blob/4d087c480a0ff1810ff1a93e6faf57ac228db8a6/site/content/guides/export-import.md)
- [`site/content/guides/images.md`](https://github.com/frostyard/nsl/blob/4d087c480a0ff1810ff1a93e6faf57ac228db8a6/site/content/guides/images.md)
- [`site/content/reference/machine-images.md`](https://github.com/frostyard/nsl/blob/4d087c480a0ff1810ff1a93e6faf57ac228db8a6/site/content/reference/machine-images.md)
- [`site/content/reference/limits.md`](https://github.com/frostyard/nsl/blob/4d087c480a0ff1810ff1a93e6faf57ac228db8a6/site/content/reference/limits.md)
- [`site/content/guides/desktop.md`](https://github.com/frostyard/nsl/blob/4d087c480a0ff1810ff1a93e6faf57ac228db8a6/site/content/guides/desktop.md)
- [`site/content/reference/cli.md`](https://github.com/frostyard/nsl/blob/4d087c480a0ff1810ff1a93e6faf57ac228db8a6/site/content/reference/cli.md)
- [`docs/adr/0023-local-problem-records.md`](https://github.com/frostyard/nsl/blob/4d087c480a0ff1810ff1a93e6faf57ac228db8a6/docs/adr/0023-local-problem-records.md)
- [Duncan's review: nsl roll back (frostyard-org#30)](https://github.com/frostyard/frostyard-org/pull/30#pullrequestreview-5630346572)
- snosi commit [`b2858ca0222814c395cf8248db98f3e096d57dc9`](https://github.com/frostyard/snosi/tree/b2858ca0222814c395cf8248db98f3e096d57dc9): [`mkosi.images/base/mkosi.conf`](https://github.com/frostyard/snosi/blob/b2858ca0222814c395cf8248db98f3e096d57dc9/mkosi.images/base/mkosi.conf), [`shared/packages/snow/mkosi.conf`](https://github.com/frostyard/snosi/blob/b2858ca0222814c395cf8248db98f3e096d57dc9/shared/packages/snow/mkosi.conf), [`shared/packages/sundog/mkosi.conf`](https://github.com/frostyard/snosi/blob/b2858ca0222814c395cf8248db98f3e096d57dc9/shared/packages/sundog/mkosi.conf), [`shared/packages/floe/mkosi.conf`](https://github.com/frostyard/snosi/blob/b2858ca0222814c395cf8248db98f3e096d57dc9/shared/packages/floe/mkosi.conf), [`shared/snow/tree/usr/lib/systemd/system/brew-setup.service`](https://github.com/frostyard/snosi/blob/b2858ca0222814c395cf8248db98f3e096d57dc9/shared/snow/tree/usr/lib/systemd/system/brew-setup.service), [`shared/floe/tree/usr/lib/systemd/system/brew-setup.service`](https://github.com/frostyard/snosi/blob/b2858ca0222814c395cf8248db98f3e096d57dc9/shared/floe/tree/usr/lib/systemd/system/brew-setup.service), [`shared/composition/sundog/mkosi.conf`](https://github.com/frostyard/snosi/blob/b2858ca0222814c395cf8248db98f3e096d57dc9/shared/composition/sundog/mkosi.conf), [`mkosi.profiles/snowfield/mkosi.conf`](https://github.com/frostyard/snosi/blob/b2858ca0222814c395cf8248db98f3e096d57dc9/mkosi.profiles/snowfield/mkosi.conf)
- Firn v0.10.0 commit [`11133e6b801fc68a7490742244aa87e0313a8acd`](https://github.com/frostyard/firn/tree/11133e6b801fc68a7490742244aa87e0313a8acd): [`internal/catalog/catalog.go`](https://github.com/frostyard/firn/blob/11133e6b801fc68a7490742244aa87e0313a8acd/internal/catalog/catalog.go)
