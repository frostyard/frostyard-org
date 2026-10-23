---
title: APT repository
description: "Add the Frostyard APT repository to a Debian 13 host, install Frostyard packages, update them, and roll them back."
---

The Frostyard APT repository serves Frostyard `.deb` packages. Debian 13
(trixie) is supported, on amd64 and arm64. Use the repository to install tools
such as Updex on a plain Debian 13 host.

This page covers Debian 13 only. The repository also publishes `forky`
(Debian 14), but this page makes no promise for it.

Frostyard images already have their packages, so this page is for plain
Debian 13 hosts. System extensions do not work on plain Debian: use the `.deb` packages
there.

## Add the repository

Install the tools that fetch and convert the key:

```bash
sudo apt install curl gpg
```

Create the keyring directory:

```bash
sudo install -d -m 0755 /etc/apt/keyrings
```

Download the signing key:

```bash
curl -fsSL https://repository.frostyard.org/public.key | sudo gpg --dearmor -o /etc/apt/keyrings/frostyard.gpg
```

Check the key:

```bash
gpg --show-keys --with-fingerprint /etc/apt/keyrings/frostyard.gpg
```

The output shows the user ID `Frostyard Debian Repository <debian@frostyard.org>`
and the fingerprint `432C 452C D2B7 F4FF 1B5D  2326 4DE6 A201 6E62 2F97`. Compare
it with `432C452CD2B7F4FF1B5D23264DE6A2016E622F97`. If it differs, stop and
delete the file with `sudo rm /etc/apt/keyrings/frostyard.gpg`.

Add the repository:

```bash
sudo tee /etc/apt/sources.list.d/frostyard.sources <<'EOF'
Types: deb
URIs: https://repository.frostyard.org/debian/
Suites: trixie
Components: main
Signed-By: /etc/apt/keyrings/frostyard.gpg
EOF
```

Give Debian's own packages priority:

```bash
sudo tee /etc/apt/preferences.d/frostyard.pref <<'EOF'
Package: *
Pin: release o=Frostyard
Pin-Priority: 100
EOF
```

The pin keeps a package that Debian also has, such as `libostree-1-1` or
`incus`, on Debian's version, so that `apt upgrade` does not replace it and
Debian's security updates keep installing. A package that only Frostyard has
still installs and upgrades.

Refresh the package lists:

```bash
sudo apt update
```

The output includes `https://repository.frostyard.org/debian trixie InRelease`.

## Find and install packages

List the packages in the repository:

```bash
apt list '?origin(Frostyard)'
```

Frostyard tools carry the `frostyard-` prefix, for example `frostyard-updex`
([Updex](/docs/tools/updex/)) and `frostyard-chairlift`
([ChairLift](/docs/tools/chairlift/)). The binary keeps the bare name. The
repository also carries other applications, and Frostyard builds of `bootc`,
`libostree-1-1`, and `incus`. Those builds are for Frostyard images. They are
not supported on plain Debian hosts.

On arm64, the repository has fewer packages. Check with
`apt-cache policy <package>`.

List the versions of one package:

```bash
apt-cache policy frostyard-updex
```

The output shows the installed version, the newest version, and every version
the repository offers.

Install a package:

```bash
sudo apt install frostyard-updex
```

Check it:

```bash
updex --version
```

The output shows the Updex version.

## Update

Refresh the lists, then upgrade everything:

```bash
sudo apt update
sudo apt upgrade
```

Upgrade one package:

```bash
sudo apt install --only-upgrade <package>
```

With the pin from [Add the repository](#add-the-repository), a package that
Debian also has stays with Debian. If a host already got a Frostyard build of
a Debian package, go back to Debian's version with
`sudo apt install <package>=<Debian version>`.

## Roll back a package

List the versions that are available:

```bash
apt-cache policy <package>
```

Install an older version:

```bash
sudo apt install <package>=<version>
```

apt shows the package as a downgrade and asks you to confirm. Use the version
string exactly as `apt-cache policy` prints it, including a `~deb13` marker when it has one.

Stop `apt upgrade` from replacing it:

```bash
sudo apt-mark hold <package>
```

A held package stays at its version. Resume upgrades with
`sudo apt-mark unhold <package>`.

After `sudo apt update`, a version that Frostyard withdrew is no longer
listed, and apt cannot install it. A copy that you installed stays installed.
If Frostyard publishes that release again, the version comes back.

## Remove

Remove a package:

```bash
sudo apt remove <package>
```

Remove the repository: delete the sources file, the pin, and the key, then refresh the
lists:

```bash
sudo rm /etc/apt/sources.list.d/frostyard.sources /etc/apt/preferences.d/frostyard.pref /etc/apt/keyrings/frostyard.gpg
sudo apt update
```

The Frostyard lines no longer appear in the output.

## See also

- [Updex](/docs/tools/updex/)
- [ChairLift](/docs/tools/chairlift/)
- [Install and update an image](/docs/images/install-update/)

## Sources

Reviewed 2026-10-23.

- core commit [`d55b259c57c636169e9a86f89ce808b075a1bf3c`](https://github.com/frostyard/core/tree/d55b259c57c636169e9a86f89ce808b075a1bf3c)
- [`docs/adr/0055-publish-debian-packages-through-the-apt-publisher.md`](https://github.com/frostyard/core/blob/d55b259c57c636169e9a86f89ce808b075a1bf3c/docs/adr/0055-publish-debian-packages-through-the-apt-publisher.md)
- [`docs/adr/0011-frostyard-prefixed-package-names.md`](https://github.com/frostyard/core/blob/d55b259c57c636169e9a86f89ce808b075a1bf3c/docs/adr/0011-frostyard-prefixed-package-names.md)
- [`docs/design/debian-publication.md`](https://github.com/frostyard/core/blob/d55b259c57c636169e9a86f89ce808b075a1bf3c/docs/design/debian-publication.md)
- [`.github/stable-repository.json`](https://github.com/frostyard/core/blob/d55b259c57c636169e9a86f89ce808b075a1bf3c/.github/stable-repository.json)
- snosi commit [`9db7cde83454b92972887d3b1cf27a144a283201`](https://github.com/frostyard/snosi/tree/9db7cde83454b92972887d3b1cf27a144a283201): [`mkosi.sandbox/etc/apt/sources.list.d/frostyard.sources`](https://github.com/frostyard/snosi/blob/9db7cde83454b92972887d3b1cf27a144a283201/mkosi.sandbox/etc/apt/sources.list.d/frostyard.sources), [`shared/sysext/keys/README.md`](https://github.com/frostyard/snosi/blob/9db7cde83454b92972887d3b1cf27a144a283201/shared/sysext/keys/README.md)
- [`dists/trixie/InRelease`](https://repository.frostyard.org/debian/dists/trixie/InRelease), read 2026-10-23: `Origin: Frostyard`, `Architectures: all amd64 arm64`
- The steps on this page were run in a `debian:trixie` container on 2026-10-23.
- [Lucilla's review of frostyard-org#32: the pin, arm64, and withdrawal](https://github.com/frostyard/frostyard-org/pull/32#pullrequestreview-5630777947)
- [Lucilla's review of frostyard-org#29](https://github.com/frostyard/frostyard-org/pull/29#pullrequestreview-5630350205)
- Owner statement, Murbella, 2026-10-23: system extensions are not supported on plain Debian.
