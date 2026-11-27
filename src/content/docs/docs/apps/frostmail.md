---
title: Frostmail
description: Read, search, and send mail with contacts, calendars, and tasks. Install the NSGo desktop client from the Frostyard Flatpak remote.
follows:
  repo: frostyard/frostmail
  tag: v0.11.0
---

Frostmail is a desktop mail client with contacts, calendars, and tasks.

## Status

Frostmail is pre-release. The latest release is v0.11.0. The Linux Flatpak
starts the native NSGo client by default. It includes `maild` for local sync
and `mailctl` for the command line. You do not need a lodge server to use it.

Frostmail v0.11.0 removes the MyGo client. The Frostyard Flatpak remote
still listed version 0.10.0 when checked on 2026-11-27.

## Install

On Linux, follow the [Frostyard Flatpak install steps](https://github.com/frostyard/flatpak-index/blob/main/README.md#install)
for `org.frostyard.Frostmail`, including the per-user Flathub setup for the
runtime. Launch Frostmail from your app menu or run
`flatpak run org.frostyard.Frostmail`.

The NSGo client opens. If you have no account set up, Frostmail shows a
welcome screen. For sign-in, see [Accounts and providers](https://github.com/frostyard/frostmail/blob/main/docs/design/accounts.md#sign-in).

For a source build, see [Desktop setup](https://github.com/frostyard/frostmail/blob/main/docs/design/desktop.md#installing-for-one-user)
or [Windows build steps](https://github.com/frostyard/frostmail/blob/main/docs/design/desktop.md#windows).
The Windows build produces an installer for NSGo, but the v0.11.0 release
has no Windows installer attached.

## Server package

The [v0.11.0 release](https://github.com/frostyard/frostmail/releases/tag/v0.11.0)
attaches `frostyard-maild_0.11.0_amd64.deb` for a lodge host. It contains
`maild`, `mailctl`, service files, and the NSGo client's web build for lodge.
It does not install the desktop client. On Frostyard images, see the [maild system extension](/docs/sysexts/maild/).

## Documentation

- [Frostmail project](https://github.com/frostyard/frostmail): features and project documentation.
- [Release history](https://github.com/frostyard/frostmail/releases): what changed in each version.
- [The Flatpak's own maild](https://github.com/frostyard/frostmail/blob/main/docs/design/desktop.md#the-flatpaks-own-maild): local storage and moving from a host daemon.
- [Frostmail privacy policy](/privacy): what data Frostmail uses and how to remove it.

## See also

- [lodge](/docs/apps/lodge/)
- [Frostnotes](/docs/apps/frostnotes/)
- [Porter](/docs/apps/porter/)
- [nsl](/docs/tools/nsl/)

## Sources

- [Frostmail v0.11.0](https://github.com/frostyard/frostmail/releases/tag/v0.11.0), published 2026-11-27. See the [README at the release commit](https://github.com/frostyard/frostmail/blob/28b886a9972ab85dceafceabda7a63ef3b3ebecb/README.md).
- [Frostyard Flatpak catalog](https://frostyard.github.io/flatpak-index/index/static): `org.frostyard.Frostmail` version `0.10.0` as checked on 2026-11-27. The attested `v0.11.0-rc.1` Flatpak (OCI digest `sha256:ea46b8915427a6b2c6da236d18203b00a904c1d64a76df6f9a10c7a1a5155406`) was built from the v0.11.0 release commit and includes the [NSGo-only launcher](https://github.com/frostyard/frostmail/blob/v0.11.0/packaging/flatpak/frostmail.sh).
- [Server .deb](https://github.com/frostyard/frostmail/releases/download/v0.11.0/frostyard-maild_0.11.0_amd64.deb): SHA-256 `1f6d55260594f92ccb3d64eed636e4de6571938b0910f36a0f020837cc4c5ea5`. Its attestation names the same release commit as the Flatpak candidate.
