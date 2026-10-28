---
title: APT repository
description: "The Frostyard APT repository feeds Frostyard image builds. It also works on Debian 13, without support: add it, install, update, roll back."
---

The Frostyard APT repository serves the `.deb` packages that Frostyard images
are built from. An installed image has no Frostyard APT source and needs none:
it updates as a whole.

The repository also works on a plain Debian 13 (trixie) host, on amd64 and
arm64, for example to install Updex. This page shows how. That use is not
supported.

This page covers Debian 13 only. The repository also publishes `forky`
(Debian 14). System extensions do not work on plain Debian: use the `.deb`
packages there.

## Add the repository

Install the tools that fetch the key and check its fingerprint:

```bash
sudo apt install curl gpg
```

Create the keyring directory:

```bash
sudo install -d -m 0755 /etc/apt/keyrings
```

Download the signing key:

```bash
sudo curl -fsSL -o /etc/apt/keyrings/frostyard.gpg https://repository.frostyard.org/debian/frostyard.gpg
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

If you added `/etc/apt/preferences.d/frostyard.pref` from an earlier version
of this page, you no longer need it. Remove it:

```bash
sudo rm -f /etc/apt/preferences.d/frostyard.pref
```

Refresh the package lists:

```bash
sudo apt update
```

The output includes `https://repository.frostyard.org/debian trixie InRelease`.

## The `image` component

Each codename (`trixie`, `forky`) publishes 2 components: `main` and `image`.
`main` holds the packages for general use. `image` holds the builds that
Frostyard images need. Some replace a Debian package of the same name:
`libostree-1-1`, `incus`, `incus-base`, `incus-client`, and `incus-extra`.
Others depend on one of them: `bootc` links against that `libostree-1-1`, and
`incus-ui-canonical` depends on `incus`. In `trixie`, `image` has these
packages for amd64 only. In `forky`, `image` is empty. Frostyard
image builds enable both components. Installed images have no Frostyard APT
source and update as a whole.

Do not add `image` to a plain Debian host. A host that enables it by hand gets
these builds without support.

`main` has no package that Debian also ships for the same codename. A plain
host that uses only `main` therefore keeps Debian's versions of these packages
and Debian's security updates, with no pin. That is a side effect, not support
for plain hosts.

A host that already installed a Frostyard `libostree-1-1`, `bootc`, or
`incus*` build keeps it and gets no more updates for it from Frostyard. There
is no supported way back to Debian's version. An older Incus can refuse a
database that a newer Incus upgraded. Read
[Upgrade Incus](https://linuxcontainers.org/incus/docs/main/installing/#upgrade-incus).

## Find and install packages

List the packages in the repository:

```bash
apt list '?origin(Frostyard)'
```

Frostyard tools carry the `frostyard-` prefix, for example `frostyard-updex`
([Updex](/docs/tools/updex/)) and `frostyard-chairlift`
([ChairLift](/docs/tools/chairlift/)). The binary keeps the bare name. The
repository also carries other applications. The Frostyard builds of `bootc`,
`libostree-1-1`, and the `incus` packages are in `image`, not in `main`. See
[The `image` component](#the-image-component).

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

A package that Debian also ships stays with Debian, because `main` does not
carry it.

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

You can roll back only the packages in `main`. The builds of `bootc`,
`libostree-1-1`, and `incus*` are not for plain hosts: see
[The `image` component](#the-image-component).

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

Remove the repository: delete the sources file and the key, then refresh the
lists:

```bash
sudo rm /etc/apt/sources.list.d/frostyard.sources /etc/apt/keyrings/frostyard.gpg
sudo apt update
```

The Frostyard lines no longer appear in the output. If you added the pin
file from an earlier version of this page, remove it too:
`sudo rm -f /etc/apt/preferences.d/frostyard.pref`.

## See also

- [Updex](/docs/tools/updex/)
- [ChairLift](/docs/tools/chairlift/)
- [Install and update an image](/docs/images/install-update/)

## Sources

Reviewed 2026-10-28.

- Owner decision, Brian, 2026-10-24: the repository is for Frostyard images and their builds. Plain Debian 13 hosts are not a supported use. Installed images have no Frostyard APT source: core ADR-0059, Context.
- `image` component: [ADR-0059](https://github.com/frostyard/core/blob/4d340b939fccab2ecb7f0be5dbf9e7ab7c03963c/docs/adr/0059-publish-image-only-packages-in-a-separate-apt-component.md), accepted by Brian on 2026-10-24 (core#162, accepted in core#163): the rule for `image`, the 7 packages, and step 6 (key URL, no pin, caveat for plain hosts). [ADR-0061](https://github.com/frostyard/core/blob/4d340b939fccab2ecb7f0be5dbf9e7ab7c03963c/docs/adr/0061-add-the-image-apt-component-on-the-first-publication-run.md) amends it: the first publication run adds `image`.
- [Ben Sherman's review of core#162](https://github.com/frostyard/core/pull/162#issuecomment-6388139358): protection of plain hosts is a side effect, not a commitment, and no Incus downgrade advice.
- apt-publisher commit [`d9337550b9a34e1246099c18747ee0080e84cbac`](https://github.com/frostyard/apt-publisher/tree/d9337550b9a34e1246099c18747ee0080e84cbac): [`docs/adr/0002-two-components-per-codename.md`](https://github.com/frostyard/apt-publisher/blob/d9337550b9a34e1246099c18747ee0080e84cbac/docs/adr/0002-two-components-per-codename.md), [`config/producers.tsv`](https://github.com/frostyard/apt-publisher/blob/d9337550b9a34e1246099c18747ee0080e84cbac/config/producers.tsv)
- snosi commit [`90074e6db6cf59ac551db8637126c5feaa512866`](https://github.com/frostyard/snosi/tree/90074e6db6cf59ac551db8637126c5feaa512866): [`mkosi.sandbox/etc/apt/sources.list.d/frostyard.sources`](https://github.com/frostyard/snosi/blob/90074e6db6cf59ac551db8637126c5feaa512866/mkosi.sandbox/etc/apt/sources.list.d/frostyard.sources) reads `Components: main image` after [snosi#1165](https://github.com/frostyard/snosi/pull/1165), merged 2026-10-27.
- Live reads, 2026-10-28: [`dists/trixie/InRelease`](https://repository.frostyard.org/debian/dists/trixie/InRelease) (`Date: Wed, 28 Oct 2026 09:36:46 UTC`, `Components: image main`, `Origin: Frostyard`); `main` lists none of the 7 packages; `image` has them for amd64 only and is empty for arm64; [`dists/forky/InRelease`](https://repository.frostyard.org/debian/dists/forky/InRelease) (`Date: Mon, 26 Oct 2026 18:31:42 UTC`, `Components: image main`) with an empty `image` for every architecture; in `trixie/image/binary-amd64/Packages`, `bootc` has `Depends: libostree-1-1` and `incus-ui-canonical` has `Depends: incus`; [`debian/frostyard.gpg`](https://repository.frostyard.org/debian/frostyard.gpg) is a binary keyring with SHA256 `7c270b81dfc4084753c9aacadffe436c23f066301e2e0c371261889ee3e3557f` and fingerprint `432C 452C D2B7 F4FF 1B5D  2326 4DE6 A201 6E62 2F97`. `/public.key` still works.
- Incus database after an upgrade: [Incus, Upgrade Incus](https://linuxcontainers.org/incus/docs/main/installing/#upgrade-incus), read 2026-10-24.
- core commit [`4d340b939fccab2ecb7f0be5dbf9e7ab7c03963c`](https://github.com/frostyard/core/tree/4d340b939fccab2ecb7f0be5dbf9e7ab7c03963c)
- [`docs/adr/0055-publish-debian-packages-through-the-apt-publisher.md`](https://github.com/frostyard/core/blob/4d340b939fccab2ecb7f0be5dbf9e7ab7c03963c/docs/adr/0055-publish-debian-packages-through-the-apt-publisher.md)
- [`docs/adr/0011-frostyard-prefixed-package-names.md`](https://github.com/frostyard/core/blob/4d340b939fccab2ecb7f0be5dbf9e7ab7c03963c/docs/adr/0011-frostyard-prefixed-package-names.md)
- [`docs/design/debian-publication.md`](https://github.com/frostyard/core/blob/4d340b939fccab2ecb7f0be5dbf9e7ab7c03963c/docs/design/debian-publication.md)
- [`.github/stable-repository.json`](https://github.com/frostyard/core/blob/4d340b939fccab2ecb7f0be5dbf9e7ab7c03963c/.github/stable-repository.json)
- The steps on this page were run in a `debian:trixie` container on 2026-10-28.
- Lucilla's owner review of frostyard-org#55, 2026-10-28: the `image` package roles, `forky`, and the live reads.
- [Lucilla's review of frostyard-org#32: the pin, arm64, and withdrawal](https://github.com/frostyard/frostyard-org/pull/32#pullrequestreview-5630777947)
- [Lucilla's review of frostyard-org#29](https://github.com/frostyard/frostyard-org/pull/29#pullrequestreview-5630350205)
- Owner statement, Murbella, 2026-10-23: system extensions are not supported on plain Debian.
