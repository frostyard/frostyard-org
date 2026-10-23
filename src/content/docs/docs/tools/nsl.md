---
title: nsl
description: "Install nsl on a Frostyard image, create your first Linux machine, and update or remove it."
---

nsl gives you WSL-style Linux machines on Linux: a systemd-nspawn container
inside a systemd-vmspawn VM, with its own packages, services, and home. Use it
when a project needs `apt`, `dnf`, or `pacman` and your host `/usr` is
read-only. nsl is pre-release: commands and defaults can change between
releases. This guide follows nsl v0.10.0; the full documentation is at
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

## Everyday tasks

| Task | Command | Guide |
| --- | --- | --- |
| Open a shell in a named machine | `nsl -m fedora` | [Machines](https://frostyard.github.io/nsl/guides/machines/#enter-a-machine) |
| Reach a server on host loopback | `nsl ports` | [Ports](https://frostyard.github.io/nsl/guides/ports/) |
| Connect VS Code or another SSH client | `nsl ssh-config NAME` | [Editors over SSH](https://frostyard.github.io/nsl/guides/editors/) |
| Save a stopped machine to an archive | `nsl export NAME FILE` | [Export and import](https://frostyard.github.io/nsl/guides/export-import/#export) |
| Move to the newest VM image | `nsl update` | [Images and updates](https://frostyard.github.io/nsl/guides/images/#update-the-vm) |

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

## See also

- [nsl documentation](https://frostyard.github.io/nsl/)
- [Igloo](/docs/tools/igloo/)

## Sources

Reviewed 2026-10-23.

- nsl v0.10.0 commit [`684facbb51468ad9790d7c5539a869b4d69776eb`](https://github.com/frostyard/nsl/tree/684facbb51468ad9790d7c5539a869b4d69776eb)
- [`README.md`](https://github.com/frostyard/nsl/blob/684facbb51468ad9790d7c5539a869b4d69776eb/README.md)
- [`site/content/getting-started/install.md`](https://github.com/frostyard/nsl/blob/684facbb51468ad9790d7c5539a869b4d69776eb/site/content/getting-started/install.md)
- [`site/content/getting-started/first-machine.md`](https://github.com/frostyard/nsl/blob/684facbb51468ad9790d7c5539a869b4d69776eb/site/content/getting-started/first-machine.md)
- [`site/content/guides/machines.md`](https://github.com/frostyard/nsl/blob/684facbb51468ad9790d7c5539a869b4d69776eb/site/content/guides/machines.md)
- [`site/content/guides/ports.md`](https://github.com/frostyard/nsl/blob/684facbb51468ad9790d7c5539a869b4d69776eb/site/content/guides/ports.md)
- [`site/content/guides/editors.md`](https://github.com/frostyard/nsl/blob/684facbb51468ad9790d7c5539a869b4d69776eb/site/content/guides/editors.md)
- [`site/content/guides/export-import.md`](https://github.com/frostyard/nsl/blob/684facbb51468ad9790d7c5539a869b4d69776eb/site/content/guides/export-import.md)
- [`site/content/guides/images.md`](https://github.com/frostyard/nsl/blob/684facbb51468ad9790d7c5539a869b4d69776eb/site/content/guides/images.md)
- [`site/content/reference/limits.md`](https://github.com/frostyard/nsl/blob/684facbb51468ad9790d7c5539a869b4d69776eb/site/content/reference/limits.md)
- nsl main commit [`b78a782f7f56eb1717afac16fa69d05a58cfd60e`](https://github.com/frostyard/nsl/tree/b78a782f7f56eb1717afac16fa69d05a58cfd60e): [`site/content/getting-started/install.md`](https://github.com/frostyard/nsl/blob/b78a782f7f56eb1717afac16fa69d05a58cfd60e/site/content/getting-started/install.md)
- nsl main commit `b78a782f7f56eb1717afac16fa69d05a58cfd60e`: [`AGENTS.md`](https://github.com/frostyard/nsl/blob/b78a782f7f56eb1717afac16fa69d05a58cfd60e/AGENTS.md), [`site/content/guides/images.md`](https://github.com/frostyard/nsl/blob/b78a782f7f56eb1717afac16fa69d05a58cfd60e/site/content/guides/images.md)
- [Duncan's review: nsl roll back (frostyard-org#30)](https://github.com/frostyard/frostyard-org/pull/30#pullrequestreview-5630346572)
- snosi commit [`e5d0597f5b53ddddfa7a35ff6f706b094f20f76b`](https://github.com/frostyard/snosi/tree/e5d0597f5b53ddddfa7a35ff6f706b094f20f76b): [`mkosi.images/base/mkosi.conf`](https://github.com/frostyard/snosi/blob/e5d0597f5b53ddddfa7a35ff6f706b094f20f76b/mkosi.images/base/mkosi.conf), [`shared/packages/snow/mkosi.conf`](https://github.com/frostyard/snosi/blob/e5d0597f5b53ddddfa7a35ff6f706b094f20f76b/shared/packages/snow/mkosi.conf), [`shared/packages/sundog/mkosi.conf`](https://github.com/frostyard/snosi/blob/e5d0597f5b53ddddfa7a35ff6f706b094f20f76b/shared/packages/sundog/mkosi.conf), [`shared/packages/floe/mkosi.conf`](https://github.com/frostyard/snosi/blob/e5d0597f5b53ddddfa7a35ff6f706b094f20f76b/shared/packages/floe/mkosi.conf), [`shared/snow/tree/usr/lib/systemd/system/brew-setup.service`](https://github.com/frostyard/snosi/blob/e5d0597f5b53ddddfa7a35ff6f706b094f20f76b/shared/snow/tree/usr/lib/systemd/system/brew-setup.service), [`shared/floe/tree/usr/lib/systemd/system/brew-setup.service`](https://github.com/frostyard/snosi/blob/e5d0597f5b53ddddfa7a35ff6f706b094f20f76b/shared/floe/tree/usr/lib/systemd/system/brew-setup.service), [`shared/composition/sundog/mkosi.conf`](https://github.com/frostyard/snosi/blob/e5d0597f5b53ddddfa7a35ff6f706b094f20f76b/shared/composition/sundog/mkosi.conf), [`mkosi.profiles/snowfield/mkosi.conf`](https://github.com/frostyard/snosi/blob/e5d0597f5b53ddddfa7a35ff6f706b094f20f76b/mkosi.profiles/snowfield/mkosi.conf)
- Firn commit [`313f576ab450cfb8e6858d06f342b77b401882ef`](https://github.com/frostyard/firn/tree/313f576ab450cfb8e6858d06f342b77b401882ef): [`internal/tui/catalog.go`](https://github.com/frostyard/firn/blob/313f576ab450cfb8e6858d06f342b77b401882ef/internal/tui/catalog.go)
