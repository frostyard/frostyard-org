---
title: intuneme
description: "Run Microsoft Intune for a managed work device on a Frostyard image: install intuneme, enroll, and use it every day."
---

intuneme runs Microsoft Intune, the Microsoft Identity Broker, and Microsoft
Edge in a systemd-nspawn container on an immutable host. You need it when your
employer manages your device with Intune and the host `/usr` is read-only.
The host stays almost unchanged, and your enrollment lives in `~/Intune`. This
guide follows intuneme v0.20.4; the full documentation is at
[frostyard.github.io/intuneme](https://frostyard.github.io/intuneme/).

Snow, Snowfield, and Sundog already include the `frostyard-intuneme` package.
Floe does not.

## Before you start

You need:

- A work or school account that your organization manages with Intune.
- `systemd-container`, for `systemd-nspawn` and `machinectl`.
- A container engine: Podman, Docker, or `skopeo` with `umoci`.
- A graphical session, X11 or Wayland.
- PipeWire or PulseAudio.

Snow, Snowfield, and Sundog have `systemd-container` and Podman. Check the
tools on another system with `machinectl --version` and `podman --version`.

## Install

Skip this step on Snow, Snowfield, and Sundog. On another system, download a
`.deb` or `.rpm` package from the
[intuneme releases](https://github.com/frostyard/intuneme/releases), then
install it:

```bash
sudo dpkg -i frostyard-intuneme_X.Y.Z_amd64.deb
```

On Fedora or RHEL, install the `.rpm` package:

```bash
sudo rpm -i frostyard-intuneme-X.Y.Z-1.x86_64.rpm
```

Then check it:

```bash
intuneme --version
```

The command prints the version. Install the CLI to a root-owned path. A
`go install` build in `~/go/bin` works for `intuneme init`, but a later
`intuneme start` cannot refresh the privileged helpers from it. The
[installation page](https://frostyard.github.io/intuneme/getting-started/installation/)
covers `go install`, building from source, and the Arch User Repository.

## Enroll your device

Create the container:

```bash
intuneme init
```

intuneme asks for your sudo password and for a password for the container
user, twice. The container password needs 12 or more characters, with a digit,
an uppercase letter, a lowercase letter, and a special character, and it
cannot contain your username. To give the password in a file, add
`--password-file FILE`.

`init` pulls the Ubuntu 24.04 image, which contains Edge and Intune Portal,
from the GitHub Container Registry, and creates a container user that matches
your host UID. It also creates `~/Intune`, which is the container user's home.
The command ends with `Initialized intuneme at` and the data path. Add
`--insiders` for the pre-release image.

Start the container:

```bash
intuneme start
```

Check that it runs:

```bash
intuneme status
```

The output has the line `Container: running`.

Open Intune Portal and sign in with your work account:

```bash
intuneme open portal
```

The Intune Portal window opens on your desktop. Follow its steps to enroll the
device. Your IT administrator may have to approve the device before you reach
corporate resources.

Open Edge for corporate sites:

```bash
intuneme open edge
```

## Every day

```bash
intuneme start
intuneme open edge
intuneme stop
```

`start` boots the container, and a second `start` is safe. `stop` shuts it
down. Your enrollment, browser profile, and downloads stay in `~/Intune`.

| Task | Command |
| --- | --- |
| See whether the container runs | `intuneme status` |
| Open a shell in the container | `intuneme shell` |
| Open Intune Portal, for a compliance check | `intuneme open portal` |

## Options

Each of these is optional. The guides are on the intuneme site.

| Task | Command | Guide |
| --- | --- | --- |
| Let host apps such as Edge and VS Code sign in through the container's enrollment | `intuneme config broker-proxy enable`, then `intuneme stop` and `intuneme start` | [Broker proxy](https://frostyard.github.io/intuneme/user-guide/broker-proxy/) |
| Run an MCP server inside the container, for a second tenant | `intuneme mcp` | [MCP servers](https://frostyard.github.io/intuneme/user-guide/mcp-servers/) |
| Use a YubiKey or webcam in the container | Automatic while the container runs | [Device hotplug](https://frostyard.github.io/intuneme/user-guide/device-hotplug/) |
| Start and stop from GNOME Quick Settings | `intuneme extension install`, then log out and back in | [GNOME extension](https://frostyard.github.io/intuneme/user-guide/gnome-extension/) |
| Launch Edge and Intune Portal from the application grid | `bash scripts/install-desktop-items.sh` from the intuneme repository | [Desktop shortcuts](https://frostyard.github.io/intuneme/user-guide/desktop-shortcuts/) |

The broker proxy gives host apps your corporate sign-in tokens. Turn it on
only if you use Microsoft apps on the host with your Intune identity.

## What the helper can do

`intuneme init` installs a sudoers rule at `/etc/sudoers.d/intuneme-exec`. It
lets you run one root-owned helper, `/usr/local/libexec/intuneme/nsenter-exec`,
without a password. The helper is a copy of the intuneme binary. App and MCP
launches through it run as your numeric user, with setuid and file
capabilities switched off for good. You pass it only the command to run.

Some limits follow:

- A root shell in the container needs a password. A passwordless shell is only
  for your user and your machine.
- Container administration that needs `sudo` must happen in an interactive
  `intuneme shell`.
- MCP mounts need Linux 5.12 or later, and the directory must be yours and
  stays read-only.
- To report a vulnerability, use a
  [draft security advisory](https://github.com/frostyard/intuneme/security/advisories/new),
  not a public issue.

## Upgrade

On Snow, Snowfield, and Sundog, the package updates with the image. On
another system with the `.deb` package, download the newer package from the
[intuneme releases](https://github.com/frostyard/intuneme/releases) and
install it with `dpkg -i`, as in [Install](#install). With the `.rpm`
package, run `sudo dnf install ./frostyard-intuneme-X.Y.Z-1.x86_64.rpm`.

After you upgrade the intuneme package, run `start`, even if the container
already runs:

```bash
intuneme start
```

It asks for sudo and refreshes the helpers and their security policy without a
reboot of the container. A failed refresh stops the command with an error.

For a new container image, rebuild the container and keep your enrollment:

```bash
intuneme recreate
intuneme start
```

`recreate` stops the container, pulls the new image, and builds the root
filesystem again. Your enrollment, Edge profile, downloads, and keyring stay.
Packages and settings inside the container come from the new image. If
`recreate` fails with `disk quota exceeded`, add `--tmp-dir /var/tmp`.
`recreate` keeps your image channel. `--insiders` switches to the insiders
image, and `--insiders=false` switches back.

## Roll back

On Snow, Snowfield, and Sundog, the intuneme package rolls back with the
image. Follow [Roll back](/docs/images/install-update/#roll-back). Your
enrollment and files in `~/Intune` stay, because they are not part of the
image. Then match the container to the older CLI:

```bash
intuneme recreate
intuneme start
```

On another system, download the release you want from
`https://github.com/frostyard/intuneme/releases/download/vX.Y.Z/`. Do not use
`releases/latest/download/`: it serves only the newest release. Install it:

```bash
sudo dpkg -i frostyard-intuneme_X.Y.Z_amd64.deb
```

On Fedora or RHEL, run `sudo dnf downgrade ./frostyard-intuneme-X.Y.Z-1.x86_64.rpm`
instead. Then run `intuneme recreate` and `intuneme start`.

The older CLI selects the container image of its own version,
`ghcr.io/frostyard/ubuntu-intune:vX.Y.Z`. The CLI has no flag to select an
earlier dated build of the same version.

The insiders image is a channel, not an earlier version. To go from the
insiders image back to the stable image, run:

```bash
intuneme recreate --insiders=false
intuneme start
```

Your enrollment, Edge profile, and downloads stay.

## Remove

Remove the container and its host rules:

```bash
intuneme destroy
```

This deletes the root filesystem, the udev rules, the polkit rule, and the
sudoers rule. It also deletes your Intune enrollment, keyrings, and broker
state in `~/Intune`. Downloads and the Edge profile stay. You enroll again
after the next `init`, and your IT administrator may need to approve the device.

To remove everything intuneme added to your home and host, run:

```bash
intuneme destroy --all
```

This also removes the GNOME extension, the D-Bus broker service file, the whole
`~/Intune` directory, and `~/.local/share/intuneme`. Copy your downloads
first. The package stays: on Snow, Snowfield, and Sundog it is part of the
image.

If you installed the package yourself, run `intuneme destroy --all` first,
because `destroy` needs the binary. Then remove the package:

```bash
sudo apt remove frostyard-intuneme
```

On Fedora or RHEL, run `sudo rpm -e frostyard-intuneme` instead.

## Troubleshooting

| Symptom | Check | Fix |
| --- | --- | --- |
| `intuneme init` fails with `disk quota exceeded` | `/tmp` is a small tmpfs | Run `intuneme init --tmp-dir /var/tmp`. |
| `intune-portal` shows error 1001 or `UI web navigation failed` | In `intuneme shell`: `systemctl --user status microsoft-identity-broker` and `sudo systemctl status microsoft-identity-device-broker` | Restart the service that failed with `systemctl restart`. |
| The compliance check fails | In `intuneme shell`: `systemctl --user status intune-agent.timer` | Run `systemctl --user start intune-agent.timer`, then `/opt/microsoft/intune/bin/intune-agent` to see the error. |
| No sound in Edge | `ls /run/user/$UID/pipewire-0` on the host | Start PipeWire on the host: `systemctl --user start pipewire pipewire-pulse`. |
| A YubiKey or webcam is missing in the container | `ls /etc/udev/rules.d/70-intuneme-*.rules` | Run `intuneme udev install`, then check `journalctl -t intuneme-hotplug`. |
| `intuneme start` says `broker proxy failed to start within 5 seconds` | `echo $DBUS_SESSION_BUS_ADDRESS` | Run from a desktop session, or run `intuneme config broker-proxy disable`, then `intuneme stop` and `intuneme start`. |
| Commands fail with a `config.toml` parse error | `~/.local/share/intuneme/config.toml` | Fix the TOML syntax. To rebuild the file, run `intuneme init --force`. Your `~/Intune` stays, but settings such as the broker proxy return to their defaults. |

The [troubleshooting page](https://frostyard.github.io/intuneme/troubleshooting/)
covers Edge crashes, X authorization errors, and the rest.

## See also

- [intuneme documentation](https://frostyard.github.io/intuneme/)
- [Snow](/docs/images/snow/)

## Sources

Reviewed 2026-10-23.

- intuneme v0.20.4 commit [`aeed93d4e398da8aada4d854664828596594eea1`](https://github.com/frostyard/intuneme/tree/aeed93d4e398da8aada4d854664828596594eea1)
- [`README.md`](https://github.com/frostyard/intuneme/blob/aeed93d4e398da8aada4d854664828596594eea1/README.md)
- [`SECURITY.md`](https://github.com/frostyard/intuneme/blob/aeed93d4e398da8aada4d854664828596594eea1/SECURITY.md)
- [`site/getting-started/prerequisites.md`](https://github.com/frostyard/intuneme/blob/aeed93d4e398da8aada4d854664828596594eea1/site/getting-started/prerequisites.md)
- [`site/getting-started/installation.md`](https://github.com/frostyard/intuneme/blob/aeed93d4e398da8aada4d854664828596594eea1/site/getting-started/installation.md)
- [`site/getting-started/quick-start.md`](https://github.com/frostyard/intuneme/blob/aeed93d4e398da8aada4d854664828596594eea1/site/getting-started/quick-start.md)
- [`site/user-guide/daily-workflow.md`](https://github.com/frostyard/intuneme/blob/aeed93d4e398da8aada4d854664828596594eea1/site/user-guide/daily-workflow.md)
- [`site/user-guide/broker-proxy.md`](https://github.com/frostyard/intuneme/blob/aeed93d4e398da8aada4d854664828596594eea1/site/user-guide/broker-proxy.md)
- [`site/user-guide/mcp-servers.md`](https://github.com/frostyard/intuneme/blob/aeed93d4e398da8aada4d854664828596594eea1/site/user-guide/mcp-servers.md)
- [`site/user-guide/device-hotplug.md`](https://github.com/frostyard/intuneme/blob/aeed93d4e398da8aada4d854664828596594eea1/site/user-guide/device-hotplug.md)
- [`site/user-guide/gnome-extension.md`](https://github.com/frostyard/intuneme/blob/aeed93d4e398da8aada4d854664828596594eea1/site/user-guide/gnome-extension.md)
- [`site/user-guide/desktop-shortcuts.md`](https://github.com/frostyard/intuneme/blob/aeed93d4e398da8aada4d854664828596594eea1/site/user-guide/desktop-shortcuts.md)
- [`site/user-guide/upgrading.md`](https://github.com/frostyard/intuneme/blob/aeed93d4e398da8aada4d854664828596594eea1/site/user-guide/upgrading.md)
- [`site/troubleshooting.md`](https://github.com/frostyard/intuneme/blob/aeed93d4e398da8aada4d854664828596594eea1/site/troubleshooting.md)
- [`cmd/init.go`](https://github.com/frostyard/intuneme/blob/aeed93d4e398da8aada4d854664828596594eea1/cmd/init.go)
- [`cmd/destroy.go`](https://github.com/frostyard/intuneme/blob/aeed93d4e398da8aada4d854664828596594eea1/cmd/destroy.go)
- intuneme main commit [`f9b11984da3d6e1ca048be8109e41930b96b5d81`](https://github.com/frostyard/intuneme/tree/f9b11984da3d6e1ca048be8109e41930b96b5d81): [`site/getting-started/installation.md`](https://github.com/frostyard/intuneme/blob/f9b11984da3d6e1ca048be8109e41930b96b5d81/site/getting-started/installation.md), [`site/user-guide/upgrading.md`](https://github.com/frostyard/intuneme/blob/f9b11984da3d6e1ca048be8109e41930b96b5d81/site/user-guide/upgrading.md)
- [`internal/version/version.go`](https://github.com/frostyard/intuneme/blob/f9b11984da3d6e1ca048be8109e41930b96b5d81/internal/version/version.go)
- [Duncan's review: intuneme roll back (frostyard-org#30)](https://github.com/frostyard/frostyard-org/pull/30#pullrequestreview-5630346572)
- snosi commit [`9db7cde83454b92972887d3b1cf27a144a283201`](https://github.com/frostyard/snosi/tree/9db7cde83454b92972887d3b1cf27a144a283201): [`shared/packages/snow/mkosi.conf`](https://github.com/frostyard/snosi/blob/9db7cde83454b92972887d3b1cf27a144a283201/shared/packages/snow/mkosi.conf), [`shared/packages/sundog/mkosi.conf`](https://github.com/frostyard/snosi/blob/9db7cde83454b92972887d3b1cf27a144a283201/shared/packages/sundog/mkosi.conf), [`mkosi.profiles/snowfield/mkosi.conf`](https://github.com/frostyard/snosi/blob/9db7cde83454b92972887d3b1cf27a144a283201/mkosi.profiles/snowfield/mkosi.conf)
- snosi commit [`79ccc63ea44ce9309a837b9428e9b5d44290fada`](https://github.com/frostyard/snosi/tree/79ccc63ea44ce9309a837b9428e9b5d44290fada): [`shared/packages/snow/mkosi.conf`](https://github.com/frostyard/snosi/blob/79ccc63ea44ce9309a837b9428e9b5d44290fada/shared/packages/snow/mkosi.conf), [`shared/packages/sundog/mkosi.conf`](https://github.com/frostyard/snosi/blob/79ccc63ea44ce9309a837b9428e9b5d44290fada/shared/packages/sundog/mkosi.conf), [`shared/composition/snow/mkosi.conf`](https://github.com/frostyard/snosi/blob/79ccc63ea44ce9309a837b9428e9b5d44290fada/shared/composition/snow/mkosi.conf), [`mkosi.profiles/snowfield/mkosi.conf`](https://github.com/frostyard/snosi/blob/79ccc63ea44ce9309a837b9428e9b5d44290fada/mkosi.profiles/snowfield/mkosi.conf)
