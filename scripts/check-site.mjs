import { access, readFile, readdir } from "node:fs/promises";
import { join, relative } from "node:path";

// Astro 7 with the Cloudflare adapter writes the static site to dist/client.
const dist = new URL("../dist/client/", import.meta.url);

async function htmlFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(entry => {
    const path = join(directory.pathname, entry.name);
    if (entry.isDirectory()) return htmlFiles(new URL(`file://${path}/`));
    return entry.name.endsWith(".html") ? [path] : [];
  }));
  return nested.flat();
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

assert(escapeHtml("<b>&") === "&lt;b&gt;&amp;", "The HTML escape helper must escape markup and ampersands.");

function textOf(html) {
  return html
    .replace(/<script\b[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function snapshotVersionMarkup(version) {
  return version
    ? `>${escapeHtml(version)}</code>`
    : ">No version listed</dd>";
}

assert(snapshotVersionMarkup(null) === ">No version listed</dd>", "The null snapshot version must use the plain-text fallback.");
assert(snapshotVersionMarkup("") === ">No version listed</dd>", "The empty snapshot version must use the plain-text fallback.");
assert(snapshotVersionMarkup("1&2") === ">1&amp;2</code>", "The snapshot version markup must escape HTML.");

function routeFile(pathname) {
  if (pathname === "/") return new URL("index.html", dist);
  return new URL(`${pathname.replace(/^\/|\/$/g, "")}/index.html`, dist);
}

async function readRoute(pathname) {
  return readFile(routeFile(pathname), "utf8");
}

const docsRoutes = [
  "/docs",
  "/docs/images/snow",
  "/docs/images/snowfield",
  "/docs/images/sundog",
  "/docs/images/floe",
  "/docs/images/base",
  "/docs/images/install-update",
  "/docs/sysexts",
  "/docs/sysexts/dev",
  "/docs/sysexts/docker",
  "/docs/sysexts/incus",
  "/docs/sysexts/k3s",
  "/docs/sysexts/nix",
  "/docs/sysexts/tailscale",
  "/docs/sysexts/vscode",
  "/docs/sysexts/manage",
  "/docs/tools/apt-repository",
  "/docs/get-software",
  "/docs/sysexts/1password",
  "/docs/sysexts/1password-cli",
  "/docs/sysexts/bitwarden",
  "/docs/sysexts/chatgpt",
  "/docs/sysexts/claude-desktop",
  "/docs/sysexts/code-server",
  "/docs/sysexts/coder",
  "/docs/sysexts/debdev",
  "/docs/sysexts/edge",
  "/docs/sysexts/gitdesktop",
  "/docs/sysexts/github-copilot",
  "/docs/sysexts/himmelblau",
  "/docs/sysexts/lemonade",
  "/docs/sysexts/localsend",
  "/docs/sysexts/lodge",
  "/docs/sysexts/maild",
  "/docs/sysexts/moonlight",
  "/docs/sysexts/notesd",
  "/docs/sysexts/obsidian",
  "/docs/sysexts/paseo",
  "/docs/sysexts/pilothouse",
  "/docs/sysexts/podman",
  "/docs/sysexts/porterd",
  "/docs/sysexts/readd",
  "/docs/sysexts/sunshine",
  "/docs/sysexts/voxtype",
  "/docs/tools/updex",
  "/docs/apps/frostmail",
  "/docs/apps/frostnotes",
  "/docs/apps/lodge",
  "/docs/apps/frostread",
  "/docs/apps/porter",
  "/docs/tools/nsl",
  "/docs/tools/igloo",
  "/docs/tools/chairlift",
  "/docs/tools/intuneme",
];

await Promise.all(["install", "sundog"].map(route => access(routeFile(`/${route}`))));
await Promise.all(docsRoutes.map(route => access(routeFile(route))));
try {
  await access(routeFile("/projects"));
  throw new Error("The removed /projects route is still present.");
} catch (error) {
  if (error.code !== "ENOENT") throw error;
}

const files = await htmlFiles(dist);
for (const file of files) {
  const html = await readFile(file, "utf8");
  const page = `/${relative(dist.pathname, file)}`;
  assert((html.match(/<h1(?:\s|>)/g) || []).length === 1, `${page} must contain exactly one h1.`);
  assert(!html.includes("frostyard/millhouse"), `${page} still links to Millhouse.`);
  // The superseded lifecycle date must not come back in page prose. The catalog
  // snapshot and catalog cards show the snapshot's own date, which is today's
  // date on a fresh sync, so their time elements are not prose.
  const body = html
    .split('<h2 id="sources"')[0]
    .replace(/<time\b[^>]*>[\s\S]*?<\/time>/g, " ");
  assert(!body.includes("2026-10-28"), `${page} contains the superseded lifecycle date.`);

  for (const match of html.matchAll(/<a\b[^>]*\shref="(\/[^"#?]*)(?:[#?][^"]*)?"/g)) {
    await access(routeFile(match[1])).catch(() => {
      throw new Error(`${page} links to missing internal route ${match[1]}.`);
    });
  }
}

const home = await readRoute("/");
assert((home.match(/class="image-card(?:\s[^"]*)?"/g) || []).length === 4, "Home must render exactly four product cards.");
for (const route of ["/base", "/snow", "/snowfield", "/sundog", "/floe"]) {
  assert(home.includes(`href="${route}"`), `Home must render a link to ${route}.`);
}
assert(home.includes("Four bootc products"), "Home must identify the four bootc products.");
assert(home.includes("bootc only"), "Home must identify Sundog as bootc-only.");
assert(home.includes("Base feeds Floe, Snow, and Sundog"), "Home composition alternative must name all direct products.");
assert(home.includes("September 30, 2026"), "Home must keep the lifecycle boundary discoverable.");
const mobileNav = [...home.matchAll(/<details\b[^>]*>/g)].some((tag) => {
  const classAttribute = tag[0].match(/\bclass="([^"]*)"/);
  return classAttribute?.[1].split(/\s+/).includes("mobile-nav");
});
assert(mobileNav, "Shared navigation must include a details element with the mobile-nav class.");
assert(home.includes('href="/docs/"'), "Shared navigation must link to the documentation.");
assert(!home.includes("live catalog"), "Home must describe the catalog as a checked snapshot.");

const install = await readRoute("/install");
for (const href of [
  "https://repository.frostyard.org/isos/native/v1/snosi-installer-latest-x86-64.iso",
  "https://repository.frostyard.org/isos/native/v1/SHA256SUMS",
  "https://repository.frostyard.org/isos/native/v1/SHA256SUMS.gpg",
  "https://github.com/frostyard/snosi/blob/main/docs/installing.md",
  "https://frostyard.github.io/lab/",
]) {
  assert(install.includes(`href="${href}"`), `/install must link to ${href}.`);
}
assert(install.includes("no in-place conversion"), "/install must state that migration is not in-place.");

const tools = await readRoute("/tools");
assert(tools.includes("sudo updex features enable &lt;feature&gt; --now"), "Tools must use current Updex syntax.");

const redirects = await readFile(new URL("_redirects", dist), "utf8");
assert(/^\/cayo\s+\/floe\s+301$/m.test(redirects), "/cayo must remain a permanent redirect to /floe.");

const docsBuilt = await htmlFiles(new URL("docs/", dist));
assert(docsBuilt.length === docsRoutes.length, `The docs pilot must build exactly ${docsRoutes.length} pages.`);

for (const route of docsRoutes) {
  const html = await readRoute(route);

  for (const href of [
    "/docs/",
    "/docs/get-software/",
    "/docs/images/snow/",
    "/docs/images/snowfield/",
    "/docs/images/sundog/",
    "/docs/images/floe/",
    "/docs/images/base/",
    "/docs/images/install-update/",
    "/docs/sysexts/",
    "/docs/sysexts/dev/",
    "/docs/sysexts/docker/",
    "/docs/sysexts/incus/",
    "/docs/sysexts/k3s/",
    "/docs/sysexts/nix/",
    "/docs/sysexts/tailscale/",
    "/docs/sysexts/vscode/",
    "/docs/sysexts/manage/",
    "/docs/sysexts/1password/",
    "/docs/sysexts/1password-cli/",
    "/docs/sysexts/bitwarden/",
    "/docs/sysexts/chatgpt/",
    "/docs/sysexts/claude-desktop/",
    "/docs/sysexts/code-server/",
    "/docs/sysexts/coder/",
    "/docs/sysexts/debdev/",
    "/docs/sysexts/edge/",
    "/docs/sysexts/gitdesktop/",
    "/docs/sysexts/github-copilot/",
    "/docs/sysexts/himmelblau/",
    "/docs/sysexts/lemonade/",
    "/docs/sysexts/localsend/",
    "/docs/sysexts/lodge/",
    "/docs/sysexts/maild/",
    "/docs/sysexts/moonlight/",
    "/docs/sysexts/notesd/",
    "/docs/sysexts/obsidian/",
    "/docs/sysexts/paseo/",
    "/docs/sysexts/pilothouse/",
    "/docs/sysexts/podman/",
    "/docs/sysexts/porterd/",
    "/docs/sysexts/readd/",
    "/docs/sysexts/sunshine/",
    "/docs/sysexts/voxtype/",
    "/docs/tools/updex/",
    "/docs/tools/apt-repository/",
    "/docs/apps/frostmail/",
    "/docs/apps/frostnotes/",
    "/docs/apps/lodge/",
    "/docs/apps/frostread/",
    "/docs/apps/porter/",
    "/docs/tools/nsl/",
    "/docs/tools/igloo/",
    "/docs/tools/chairlift/",
    "/docs/tools/intuneme/",
  ]) {
    assert(html.includes(`href="${href}"`), `${route} must render the docs navigation link ${href}.`);
  }
  assert(html.includes('class="site-title'), `${route} must render the Starlight site title.`);
  assert(html.includes('href="/"'), `${route} must link back to the site home.`);
  assert(html.includes("<site-search"), `${route} must render the Starlight search control.`);
  assert(html.includes("On this page"), `${route} must render the table of contents.`);
}

const docsLanding = await readRoute("/docs");
for (const text of [
  "Support boundary",
  "Start here",
  "Choose an image",
  "Install and first boot",
  "How a Frostyard system is built",
  "Not covered yet",
  "updex features check",
]) {
  assert(docsLanding.includes(text), `/docs must contain the section or statement "${text}".`);
}
for (const route of ["/install", "/docs/images/snow/", "/docs/images/snowfield/", "/docs/images/sundog/", "/docs/images/floe/", "/docs/images/base/", "/docs/sysexts/docker/", "/docs/sysexts/incus/", "/docs/sysexts/tailscale/", "/docs/sysexts/manage/", "/docs/tools/updex/", "/docs/tools/nsl/", "/docs/tools/igloo/", "/docs/tools/chairlift/", "/docs/tools/intuneme/"]) {
  assert(docsLanding.includes(`href="${route}"`), `/docs must link to ${route}.`);
}

for (const route of ["/docs/images/install-update/"]) {
  assert(docsLanding.includes(`href="${route}"`), `/docs must link to ${route}.`);
}
assert(docsLanding.includes("menuStateSynced"), "Docs pages must load the mobile menu aria-expanded sync.");
assert(docsLanding.includes("Updex v2.1.2"), "/docs must name the Updex v2.1.2 source pin.");
assert(docsLanding.includes("https://github.com/frostyard/updex/blob/ce3900e5f2eded725ddc5afd8b532992e573200e/README.md"), "/docs must cite the pinned Updex v2.1.2 README.");
assert(!docsLanding.includes("d750445daf3fe8c589419749a1ebae9f5eb1eba2"), "/docs must not cite the old Updex branch commit.");

const snow = await readRoute("/docs/images/snow");
const snowText = textOf(snow);
for (const heading of [
  "install",
  "first-boot",
  "updates-and-rollback",
  "what-ships",
  "choose-snow",
  "troubleshooting",
  "moving-from-an-nbc-or-ab-install",
  "see-also",
  "sources",
]) {
  assert(snow.includes(`id="${heading}"`), `/docs/images/snow must render the "${heading}" section.`);
}
for (const source of [
  "mkosi.profiles/snow/mkosi.conf",
  "shared/composition/snow/mkosi.conf",
  "shared/packages/snow/mkosi.conf",
  "shared/packages/bootc/mkosi.conf",
  "shared/kernel/backports/mkosi.conf",
  "mkosi.images/base/mkosi.conf",
  "docs/installing.md",
  "docs/bootc-secure-operations.md",
  "docs/nbc-to-bootc-migration.md",
]) {
  assert(snow.includes(`https://github.com/frostyard/snosi/blob/b2858ca0222814c395cf8248db98f3e096d57dc9/${source}`), `/docs/images/snow must cite ${source}.`);
}
assert(snowText.includes("have passed fresh installs in a lab VM") && snowText.includes("not hardware qualification"), "/docs/images/snow must state the fresh-install test limit.");
assert(snowText.includes("There is no in-place conversion"), "/docs/images/snow must state the migration limit.");
assert(!snowText.includes("Boot presentation"), "/docs/images/snow must not carry the removed boot-presentation row.");
assert(snowText.includes("Image and system-extension applications live under"), "/docs/images/snow must separate /usr payloads from /var state.");
assert(snowText.includes("Firn can install the chosen core Flatpak set"), "/docs/images/snow must state that Firn can install the core Flatpak set.");
assert(!snowText.includes("present only if"), "/docs/images/snow must not claim the core apps have one install path.");
assert(!snowText.includes("userspace, systemd, bootc,"), "/docs/images/snow must not attribute bootc to Base.");
assert(snowText.includes("Bootc runtime"), "/docs/images/snow must have a separate bootc-runtime row.");
assert(snowText.includes("The table shows the main layers only"), "/docs/images/snow must scope the table to main layers.");
assert(snowText.includes("Homebrew") && snowText.includes("frostyard-chairlift") && snowText.includes("snow-first-setup"), "/docs/images/snow must name key omitted components.");
assert(snowText.includes("untested on representative Surface hardware"), "/docs/images/snow must state that Snowfield is untested.");
assert(snowText.includes("gate was waived for catalog inclusion"), "/docs/images/snow must state the Surface hardware gate waiver.");
assert(!snowText.includes("testing still pending"), "/docs/images/snow must not imply a planned Surface test.");
assert(snowText.includes("first staged update") && snowText.includes("steady state"), "/docs/images/snow must explain both stager paths.");
assert(snowText.includes("bootc upgrade") && snowText.includes("staged digest"), "/docs/images/snow must describe the steady-state upgrade and digest check.");
assert(snowText.includes("Both paths verify the staged digest"), "/docs/images/snow must state that both stager paths verify the digest.");
assert(snowText.includes("You do not need to run them"), "/docs/images/snow must describe the commands as stager behavior.");
assert(snowText.includes("does not force a reboot"), "/docs/images/snow must state that the stager does not force a reboot.");
assert(!snowText.includes("A rollback also changes the image") && snowText.includes("It waits for the next published image"), "/docs/images/snow must describe the rollback hold correctly.");
assert(snowText.includes("linux-image-amd64/forky") && snowText.includes("trixie-backports"), "/docs/images/snow must preserve the confirmed kernel selection.");

const floe = await readRoute("/docs/images/floe");
const floeText = textOf(floe);
for (const heading of [
  "install",
  "first-boot",
  "updates-and-rollback",
  "what-ships",
  "choose-floe",
  "run-containers-and-extensions",
  "troubleshooting",
  "moving-from-an-nbc-or-ab-install",
  "see-also",
  "sources",
]) {
  assert(floe.includes(`id="${heading}"`), `/docs/images/floe must render the "${heading}" section.`);
}
for (const source of [
  "mkosi.profiles/floe/mkosi.conf",
  "shared/composition/floe/mkosi.conf",
  "shared/packages/floe/mkosi.conf",
  "shared/packages/bootc/mkosi.conf",
  "shared/kernel/backports/mkosi.conf",
  "mkosi.images/base/mkosi.conf",
  "shared/floe/tree/usr/lib/sysctl.d/70-networking.conf",
  "shared/floe/tree/usr/lib/systemd/system-preset/00-apt.preset",
  "shared/floe/tree/usr/lib/systemd/system-preset/01-homebrew.preset",
  "flatpaks/core-flatpaks.py",
  "shared/composition/core-flatpaks.finalize",
  "mkosi.images/base/mkosi.extra/usr/libexec/bootc-update-stage",
  "docs/installing.md",
  "docs/bootc-secure-operations.md",
  "docs/nbc-to-bootc-migration.md",
  "docs/design/overview.md",
  "docs/design/testing.md",
]) {
  assert(floe.includes(`https://github.com/frostyard/snosi/blob/b2858ca0222814c395cf8248db98f3e096d57dc9/${source}`), `/docs/images/floe must cite ${source}.`);
}
assert(floeText.includes("Floe starts without a desktop"), "/docs/images/floe must state that Floe has no desktop.");
assert(floeText.includes("Floe has no core Flatpak set"), "/docs/images/floe must state that Floe has no core Flatpak set.");
assert(floeText.includes("linux-image-amd64/forky"), "/docs/images/floe must name the kernel selection.");
assert(floeText.includes("systemd-vmspawn"), "/docs/images/floe must name the server virtual-machine tool.");
assert(floeText.includes("turns off the APT daily update and upgrade timers"), "/docs/images/floe must state that the APT daily timers are off.");
assert(!floeText.includes("A rollback also changes the image") && floeText.includes("It waits for the next published image"), "/docs/images/floe must describe the rollback hold correctly.");
assert(floeText.includes("twice the image size"), "/docs/images/floe must state the update space requirement.");
assert(floeText.includes("Every image carries a definition for each system extension, switched off"), "/docs/images/floe must state that extensions start switched off.");
assert(floeText.includes("Homebrew"), "/docs/images/floe must cover the Homebrew units.");

const snowfield = await readRoute("/docs/images/snowfield");
const snowfieldText = textOf(snowfield);
for (const heading of [
  "install",
  "first-boot",
  "updates-and-rollback",
  "what-ships",
  "the-surface-kernel",
  "choose-snowfield",
  "troubleshooting",
  "moving-from-an-nbc-or-ab-install",
  "see-also",
  "sources",
]) {
  assert(snowfield.includes(`id="${heading}"`), `/docs/images/snowfield must render the "${heading}" section.`);
}
for (const source of [
  "README.md",
  "mkosi.profiles/snowfield/mkosi.conf",
  "shared/kernel/surface/mkosi.conf",
  "shared/composition/snow/mkosi.conf",
  "shared/packages/snow/mkosi.conf",
  "mkosi.sandbox/etc/apt/sources.list.d/linux-surface.sources",
  "mkosi.images/base/mkosi.conf",
  "docs/installing.md",
  "docs/bootc-secure-operations.md",
  "docs/nbc-to-bootc-migration.md",
  "docs/design/overview.md",
  "docs/design/testing.md",
]) {
  assert(snowfield.includes(`https://github.com/frostyard/snosi/blob/b2858ca0222814c395cf8248db98f3e096d57dc9/${source}`), `/docs/images/snowfield must cite ${source}.`);
}
assert(snowfieldText.includes("untested on representative Surface hardware"), "/docs/images/snowfield must state the Surface hardware limit.");
assert(snowfieldText.includes("gate was waived for catalog inclusion"), "/docs/images/snowfield must state the Surface hardware gate waiver.");
assert(snowfieldText.includes("same desktop as Snow"), "/docs/images/snowfield must say it shares the Snow desktop.");
assert(snowfieldText.includes("linux-image-surface") && snowfieldText.includes("pkg.surfacelinux.com"), "/docs/images/snowfield must name the Surface kernel and its repository.");
assert(!snowfieldText.includes("linux-image-amd64/forky"), "/docs/images/snowfield must not claim the backports kernel.");
assert(snowfieldText.includes("does not force a reboot"), "/docs/images/snowfield must state that the stager does not force a reboot.");
assert(!snowfieldText.includes("A rollback also changes the image") && snowfieldText.includes("It waits for the next published image"), "/docs/images/snowfield must describe the rollback hold correctly.");

const sundog = await readRoute("/docs/images/sundog");
const sundogText = textOf(sundog);
for (const heading of [
  "install",
  "first-boot",
  "updates-and-rollback",
  "what-ships",
  "desktop-packages",
  "services-and-settings",
  "choose-sundog",
  "troubleshooting",
  "see-also",
  "sources",
]) {
  assert(sundog.includes(`id="${heading}"`), `/docs/images/sundog must render the "${heading}" section.`);
}
for (const source of [
  "README.md",
  "mkosi.profiles/sundog/mkosi.conf",
  "shared/composition/sundog/mkosi.conf",
  "shared/packages/sundog/mkosi.conf",
  "shared/sundog/scripts/postinstall/sundog.postinst.chroot",
  "shared/sundog/tree/etc/sddm.conf.d/10-sundog.conf",
  "shared/sundog/tree/usr/lib/systemd/user-preset/90-sundog.preset",
  "mkosi.images/base/mkosi.extra/usr/lib/systemd/journald.conf.d/10-snosi-persistent.conf",
  "shared/kernel/backports/mkosi.conf",
  "flatpaks/sundog.json",
  "flatpaks/core-flatpaks.py",
  "docs/installing.md",
  "docs/bootc-secure-operations.md",
  "docs/design/overview.md",
  "docs/design/sysexts.md",
  "docs/design/testing.md",
  "docs/adr/0016-name-kde-bootc-product-sundog.md",
]) {
  assert(sundog.includes(`https://github.com/frostyard/snosi/blob/b2858ca0222814c395cf8248db98f3e096d57dc9/${source}`), `/docs/images/sundog must cite ${source}.`);
}
assert(sundogText.includes("ships only as a bootc image"), "/docs/images/sundog must state that Sundog is bootc only.");
assert(sundogText.includes("Plasma on Wayland is the only desktop session"), "/docs/images/sundog must state the Wayland-only session limit.");
assert(sundogText.includes("kde-plasma-desktop") && sundogText.includes("sddm-theme-breeze"), "/docs/images/sundog must name the KDE packages.");
assert(sundogText.includes("plasma-discover-backend-flatpak"), "/docs/images/sundog must name the Flatpak Discover backend.");
assert(sundogText.includes("Gwenview, Okular, KCalc, and Skanpage are Flatpaks"), "/docs/images/sundog must state that the KDE apps come from the Flatpak set.");
assert(sundogText.includes("linux-image-amd64/forky"), "/docs/images/sundog must name the kernel selection.");
assert(!sundogText.includes("A rollback also changes the image") && sundogText.includes("It waits for the next published image"), "/docs/images/sundog must describe the rollback hold correctly.");

const base = await readRoute("/docs/images/base");
const baseText = textOf(base);
for (const heading of [
  "the-layers",
  "what-base-gives-you",
  "updates",
  "system-extensions",
  "what-ships",
  "what-base-does-not-include",
  "choose-an-image",
  "see-also",
  "sources",
]) {
  assert(base.includes(`id="${heading}"`), `/docs/images/base must render the "${heading}" section.`);
}
assert(!base.includes('id="install"'), "/docs/images/base must not render an Install section.");
for (const source of [
  "README.md",
  "mkosi.conf",
  "mkosi.images/base/mkosi.conf",
  "shared/packages/bootc/mkosi.conf",
  "shared/outformat/image/mkosi.conf",
  "mkosi.images/base/mkosi.extra/usr/libexec/bootc-update-stage",
  "mkosi.images/base/mkosi.extra/usr/bin/snosi-update-status",
  "mkosi.images/base/mkosi.extra/usr/lib/systemd/system/reload-sysext.service",
  "mkosi.images/base/mkosi.extra/usr/lib/sysupdate.docker.d/docker.transfer",
  "shared/firn-installer/catalog.json",
  "docs/installing.md",
  "docs/design/overview.md",
  "docs/design/sysexts.md",
]) {
  assert(base.includes(`https://github.com/frostyard/snosi/blob/b2858ca0222814c395cf8248db98f3e096d57dc9/${source}`), `/docs/images/base must cite ${source}.`);
}
assert(baseText.includes("Base is not an installer choice"), "/docs/images/base must state that Base is not an installer choice.");
assert(baseText.includes("Firn offers only Snow, Snowfield, Sundog, and Floe"), "/docs/images/base must list the four installer choices.");
assert(baseText.includes("snosi-update-status") && baseText.includes("/usr/lib/sysupdate."), "/docs/images/base must name the status tool and the extension definitions.");
assert(baseText.includes("reload-sysext.service"), "/docs/images/base must cover the extension reload service.");
assert(baseText.includes("not bootable"), "/docs/images/base must state that Base does not build a bootable image.");

const guide = await readRoute("/docs/images/install-update");
const guideText = textOf(guide);
for (const heading of [
  "choose-an-image",
  "download-and-check-firn",
  "write-and-boot-the-installer",
  "install-with-firn",
  "enroll-the-mok",
  "after-installation",
  "how-updates-arrive",
  "update-now-by-hand",
  "roll-back",
  "move-from-an-nbc-or-ab-install",
  "find-out-what-you-have",
  "back-up-first",
  "reinstall-and-restore",
  "troubleshooting",
  "see-also",
  "sources",
]) {
  assert(guide.includes(`id="${heading}"`), `/docs/images/install-update must render the "${heading}" section.`);
}
for (const source of [
  "README.md",
  "docs/installing.md",
  "docs/nbc-to-bootc-migration.md",
  "docs/2026-07-03-bootc-migration-record.md",
  "docs/bootc-secure-operations.md",
  "docs/adr/0015-retire-native-ab-images-and-nbc-installs.md",
  "docs/adr/0018-remove-native-ab-and-nbc-lanes.md",
  "shared/native-ab/keys/import-pubring.gpg",
  "mkosi.images/base/mkosi.extra/usr/libexec/bootc-update-stage",
  "mkosi.images/base/mkosi.extra/usr/lib/systemd/system/bootc-update-stage.service",
  "mkosi.images/base/mkosi.extra/usr/lib/systemd/system/bootc-update-stage.timer",
  "mkosi.images/base/mkosi.extra/usr/bin/snosi-update-status",
]) {
  assert(guide.includes(`https://github.com/frostyard/snosi/blob/b2858ca0222814c395cf8248db98f3e096d57dc9/${source}`), `/docs/images/install-update must cite ${source}.`);
}
for (const href of ["/docs/", "/docs/images/snow/", "/docs/images/snowfield/", "/docs/images/sundog/", "/docs/images/floe/", "/install"]) {
  assert(guide.includes(`href="${href}"`), `/docs/images/install-update must link ${href}.`);
}
assert(guide.includes("F37282A35CB6BDFEBFC8FE775A2EAC5C8216FD68"), "/docs/images/install-update must give the signing-key fingerprint.");
assert(guideText.includes("sudo systemctl start bootc-update-stage.service"), "/docs/images/install-update must give the manual update command.");
assert(guideText.includes("sudo bootc rollback") && guideText.includes("published image equals the rollback deployment"), "/docs/images/install-update must cover rollback and the rollback hold.");
assert(guideText.includes("does not force a reboot") && guideText.includes("twice the image size"), "/docs/images/install-update must state the reboot and space rules.");
assert(guideText.includes("cannot convert to bootc in place") && guideText.includes("2026-09-30"), "/docs/images/install-update must state the nbc limit and the end-of-life date.");
assert(guideText.includes("have passed fresh installs in a lab VM") && guideText.includes("hardware qualification") && guideText.includes("cannot convert to the secure layout in place"), "/docs/images/install-update must state the Secure Boot support limit.");
assert(guideText.includes("/var/lib/tailscale") && guideText.includes("/var/lib/himmelblau"), "/docs/images/install-update must list the state to back up.");
assert(guideText.includes("Do not run bootc upgrade by hand"), "/docs/images/install-update must warn against a bare bootc upgrade.");

const updex = await readRoute("/docs/tools/updex");
const updexText = textOf(updex);
for (const heading of [
  "check-your-version",
  "everyday-commands",
  "automatic-updates",
  "roll-back-an-extension",
  "stop-updates-or-remove",
  "install-updex-on-another-system",
  "catalogs",
  "reference",
  "troubleshooting",
  "see-also",
  "sources",
]) {
  assert(updex.includes(`id="${heading}"`), `/docs/tools/updex must render the "${heading}" section.`);
}
for (const source of [
  "README.md",
  "docs/design/overview.md",
  "docs/adr/0007-daemon-stages-never-activates.md",
  "docs/adr/0014-local-catalog-signature-policy.md",
  "docs/adr/0015-detect-merged-sysexts-from-hierarchy-metadata.md",
  "docs/adr/0016-automatic-sysext-updates-apply-at-next-boot.md",
  "cmd/updex/features.go",
  "cmd/updex/features_run.go",
  "cmd/updex/daemon.go",
  "cmd/updex/catalog.go",
  "updex/features.go",
  "updex/install.go",
  "updex/rollback.go",
  "updex/daemon.go",
  "updex/catalog.go",
]) {
  assert(updex.includes(`https://github.com/frostyard/updex/blob/ce3900e5f2eded725ddc5afd8b532992e573200e/${source}`), `/docs/tools/updex must cite ${source}.`);
}
for (const source of [
  "mkosi.images/base/mkosi.conf",
  "mkosi.images/base/mkosi.extra/usr/lib/sysupdate.docker.d/docker.feature",
  "docs/design/sysexts.md",
]) {
  assert(updex.includes(`https://github.com/frostyard/snosi/blob/b2858ca0222814c395cf8248db98f3e096d57dc9/${source}`), `/docs/tools/updex must cite snosi ${source}.`);
}
assert(updex.includes("https://github.com/frostyard/updex/releases/tag/v2.0.4"), "/docs/tools/updex must link the Updex v2.0.4 release.");
assert(updex.includes("https://github.com/frostyard/updex/pull/445"), "/docs/tools/updex must link Updex PR #445.");
assert(updexText.includes("Extension docker (version 5+29.9.1-1~debian.13~trixie) is active. Removing requires --force and a reboot to take effect."), "/docs/tools/updex must show the exact removal refusal message.");
assert(updexText.includes("--force"), "/docs/tools/updex must explain --force.");
assert(updexText.includes("updex-update.timer"), "/docs/tools/updex must name the daemon timer.");
assert(updexText.includes("--no-refresh"), "/docs/tools/updex must explain the daemon's --no-refresh command.");
assert(updexText.includes("AllowUnsigned"), "/docs/tools/updex must explain AllowUnsigned.");
assert(updexText.includes("/etc/updex/catalogs.d/"), "/docs/tools/updex must name the catalog directory.");
assert(updexText.includes("This guide follows Updex v2.1.2"), "/docs/tools/updex must follow Updex v2.1.2.");
assert(updex.includes("https://github.com/frostyard/updex/releases/tag/v2.1.2"), "/docs/tools/updex must link the Updex v2.1.2 release.");
assert(updexText.includes("sudo updex --dry-run daemon enable"), "/docs/tools/updex must explain the daemon dry run.");
assert(updex.includes('href="/docs/sysexts/"'), "/docs/tools/updex must link the extension catalog page.");
assert(updexText.includes("updex features rollback"), "/docs/tools/updex must give the rollback command.");
assert(updexText.includes("sudo updex daemon enable"), "/docs/tools/updex must tell the reader how to turn the timer on.");
assert(updexText.includes("PENDING REBOOT:"), "/docs/tools/updex must explain the PENDING REBOOT line.");

for (const route of ["/docs/apps/frostmail/", "/docs/apps/frostnotes/", "/docs/apps/lodge/", "/docs/apps/frostread/", "/docs/apps/porter/"]) {
  assert(docsLanding.includes(`href="${route}"`), `/docs must link to ${route}.`);
}

const lightPages = [
  {
    route: "lodge",
    repo: "lodge",
    sha: "a43d3be1de45704e0514d51da4c4b32d575f7c6c",
    install: "install",
    canonical: "packaging/README.md",
    sentence: "lodge is pre-release",
    links: ["/docs/apps/porter/", "/docs/apps/frostread/", "/docs/apps/frostnotes/", "/docs/apps/frostmail/", "/docs/tools/nsl/"],
  },
  {
    route: "frostread",
    repo: "frostread",
    sha: "3dc30c605f750d671e04465ef8b52810bc52ff2c",
    install: "install",
    canonical: "README.md#install-on-lodges-host",
    sentence: "frostread is pre-release",
    links: ["/docs/apps/lodge/", "/docs/apps/frostnotes/", "/docs/apps/porter/", "/docs/apps/frostmail/", "/docs/tools/nsl/"],
  },
  {
    route: "porter",
    repo: "porter",
    sha: "a56337d0f2cec26f660b651fa3c8003ed19d22bd",
    install: "install",
    canonical: "docs/design/overview.md#operational-notes",
    sentence: "Porter is pre-release",
    links: ["/docs/apps/lodge/", "/docs/apps/frostread/", "/docs/apps/frostnotes/", "/docs/apps/frostmail/", "/docs/tools/nsl/"],
  },
  {
    route: "frostmail",
    repo: "frostmail",
    sha: "df106558209fad29c63983710a1a646557064dd4",
    install: "install",
    canonical: "docs/design/desktop.md#installing-for-one-user",
    sentence: "Frostmail is pre-release",
    links: ["/docs/apps/lodge/", "/docs/apps/frostnotes/", "/docs/apps/porter/", "/docs/tools/nsl/"],
  },
  {
    route: "frostnotes",
    repo: "frostnotes",
    sha: "e850667533e63c52df844fc0cadac28516dc7450",
    install: "install",
    canonical: "README.md#try-it",
    sentence: "Frostnotes is pre-release",
    links: ["/docs/apps/lodge/", "/docs/apps/frostmail/", "/docs/apps/porter/", "/docs/apps/frostread/", "/docs/tools/nsl/"],
  },
];
const lightHtml = {};
for (const page of lightPages) {
  const path = `/docs/apps/${page.route}`;
  const html = await readRoute(path);
  const text = textOf(html);
  lightHtml[page.route] = { html, text };
  for (const heading of ["status", page.install, "documentation", "see-also", "sources"]) {
    assert(html.includes(`id="${heading}"`), `${path} must render the "${heading}" section.`);
  }
  assert(html.includes(`https://github.com/frostyard/${page.repo}/blob/${page.sha}/README.md`), `${path} must cite README.md at the pinned commit.`);
  assert(html.includes(`https://github.com/frostyard/${page.repo}/blob/main/${page.canonical}`), `${path} must link the canonical install doc ${page.canonical}.`);
  assert(text.includes(page.sentence), `${path} must say that it is pre-release.`);
  for (const link of page.links) {
    assert(html.includes(`href="${link}"`), `${path} must link ${link}.`);
  }
  assert(!html.includes("data-code="), `${path} must not carry copied command blocks.`);
}
assert(lightHtml.lodge.text.includes("On a Frostyard image, enable the lodge system extension") && lightHtml.lodge.text.includes("/usr is read-only on a Frostyard image."), "/docs/apps/lodge must state the lodge extension and the /usr limit.");
assert(lightHtml.frostread.text.includes("lodge shows it as the app Read"), "/docs/apps/frostread must say that lodge shows it as Read.");
assert(!/repository (is|stays) private|private for now|pre-release, private/i.test(lightHtml.frostread.text), "/docs/apps/frostread must not call the repository private.");
assert(lightHtml.frostmail.html.includes('href="/docs/apps/lodge/"') && lightHtml.frostnotes.html.includes('href="/docs/apps/lodge/"'), "/docs/apps/frostmail and /docs/apps/frostnotes must link the lodge page.");
assert(lightHtml.frostnotes.text.includes("The hub moved behind lodge on 2026-10-26"), "/docs/apps/frostnotes must say that the hub moved behind lodge.");
assert(!lightHtml.frostnotes.text.includes("moving behind lodge"), "/docs/apps/frostnotes must not say that the hub is still moving behind lodge.");
for (const [route, doc] of [
  ["lodge", "lodge/blob/main/packaging/README.md"],
  ["porter", "porter/blob/main/README.md"],
  ["frostread", "frostread/blob/main/README.md"],
]) {
  for (const section of ["update", "roll-back"]) {
    assert(lightHtml[route].html.includes(`https://github.com/frostyard/${doc}#${section}`), `/docs/apps/${route} must link the canonical ${section} section of ${doc}.`);
  }
}
const extensionForApp = { lodge: "lodge", porter: "porterd", frostread: "readd" };
for (const [route, extension] of Object.entries(extensionForApp)) {
  const path = `/docs/apps/${route}`;
  const page = lightHtml[route];
  assert(page.html.includes('id="update-and-roll-back"'), `${path} must render the "update-and-roll-back" section.`);
  assert(page.html.includes(`href="/docs/sysexts/${extension}/#update-roll-back-and-remove"`), `${path} must link /docs/sysexts/${extension}/#update-roll-back-and-remove.`);
  assert(page.text.includes("not in the Frostyard APT repository"), `${path} must say that the release .deb is not in the Frostyard APT repository.`);
}
assert(lightHtml.porter.html.includes("https://github.com/frostyard/porter/blob/main/README.md#limits"), "/docs/apps/porter must link the canonical Limits section.");
assert(!lightHtml.lodge.text.includes("proposed plan"), "/docs/apps/lodge must not call the accepted sysext plan proposed.");
assert(lightHtml.frostmail.text.includes("not in the Frostyard APT repository, the Frostyard Flatpak remote, or the Frostyard Homebrew tap"), "/docs/apps/frostmail must say that there is no published install path.");
assert(lightHtml.frostnotes.text.includes("flatpak install frostyard org.frostyard.Frostnotes"), "/docs/apps/frostnotes must give the Flatpak install command.");
assert(lightHtml.frostnotes.html.includes("https://github.com/frostyard/flatpak-index/blob/main/README.md"), "/docs/apps/frostnotes must link the Frostyard Flatpak remote README.");

const nsl = await readRoute("/docs/tools/nsl");
const nslText = textOf(nsl);
for (const heading of [
  "before-you-start",
  "install",
  "create-your-first-machine",
  "everyday-tasks",
  "update-and-remove",
  "igloo",
  "troubleshooting",
  "see-also",
  "sources",
]) {
  assert(nsl.includes(`id="${heading}"`), `/docs/tools/nsl must render the "${heading}" section.`);
}
for (const source of [
  "README.md",
  "site/content/getting-started/install.md",
  "site/content/getting-started/first-machine.md",
  "site/content/reference/machine-images.md",
  "site/content/reference/limits.md",
]) {
  assert(nsl.includes(`https://github.com/frostyard/nsl/blob/b78a782f7f56eb1717afac16fa69d05a58cfd60e/${source}`), `/docs/tools/nsl must cite ${source}.`);
}
for (const source of ["mkosi.images/base/mkosi.conf", "shared/packages/snow/mkosi.conf"]) {
  assert(nsl.includes(`https://github.com/frostyard/snosi/blob/b2858ca0222814c395cf8248db98f3e096d57dc9/${source}`), `/docs/tools/nsl must cite snosi ${source}.`);
}
assert(nsl.includes("https://github.com/frostyard/firn/blob/11133e6b801fc68a7490742244aa87e0313a8acd/internal/catalog/catalog.go"), "/docs/tools/nsl must cite the Firn default groups.");
assert(nslText.includes("This guide follows nsl v0.11.0"), "/docs/tools/nsl must follow nsl v0.11.0.");
assert(nsl.includes('href="https://frostyard.github.io/nsl/reference/machine-images/"'), "/docs/tools/nsl must link the nsl machine images reference.");
assert(nslText.includes("Firn does not add your user to it"), "/docs/tools/nsl must state that Firn does not add the user to kvm.");
assert(nsl.includes('data-code="sudo usermod -aG kvm'), "/docs/tools/nsl must give the kvm group command.");
assert(nsl.includes("brew install --cask frostyard/tap/nsl"), "/docs/tools/nsl must give the Homebrew install command.");
assert(nsl.includes("brew upgrade --cask frostyard/tap/nsl"), "/docs/tools/nsl must give the Homebrew upgrade command.");
assert(nsl.includes('href="/docs/tools/igloo/"'), "/docs/tools/nsl must link the Igloo page.");

const igloo = await readRoute("/docs/tools/igloo");
const iglooText = textOf(igloo);
for (const heading of [
  "before-you-start",
  "install",
  "use-igloo",
  "update-and-remove",
  "troubleshooting",
  "see-also",
  "sources",
]) {
  assert(igloo.includes(`id="${heading}"`), `/docs/tools/igloo must render the "${heading}" section.`);
}
for (const source of ["README.md", "io.github.frostyard.Igloo.json", "agent/ptyxis-nsl.c"]) {
  assert(igloo.includes(`https://github.com/frostyard/igloo/blob/38d98cd171d4ffbbe4adfaa55818f503206866dd/${source}`), `/docs/tools/igloo must cite ${source}.`);
}
assert(igloo.includes("https://github.com/frostyard/snosi/blob/b2858ca0222814c395cf8248db98f3e096d57dc9/shared/snow/tree/etc/flatpak/remotes.d/flathub.flatpakrepo"), "/docs/tools/igloo must cite the Snow Flathub remote.");
assert(iglooText.includes("nsl 0.8.0 or later"), "/docs/tools/igloo must state the nsl 0.8.0 requirement.");
assert(iglooText.includes("The Flatpak does not bundle nsl"), "/docs/tools/igloo must state that the Flatpak does not bundle nsl.");
assert(igloo.includes('data-code="flatpak remote-add --if-not-exists frostyard'), "/docs/tools/igloo must give the Frostyard remote command.");
assert(igloo.includes('data-code="flatpak install frostyard io.github.frostyard.Igloo"'), "/docs/tools/igloo must give the install command.");
assert(iglooText.includes("Check Again"), "/docs/tools/igloo must mention the Check Again button.");
assert(igloo.includes('href="/docs/tools/nsl/"'), "/docs/tools/igloo must link the nsl page.");

const chairlift = await readRoute("/docs/tools/chairlift");
const chairliftText = textOf(chairlift);
for (const heading of [
  "which-images-have-it",
  "open-it",
  "what-each-page-does",
  "everyday-tasks",
  "install-on-another-system",
  "troubleshooting",
  "see-also",
  "sources",
]) {
  assert(chairlift.includes(`id="${heading}"`), `/docs/tools/chairlift must render the "${heading}" section.`);
}
for (const source of ["README.md", "docs/index.md", "docs/reference.md", "CONFIG.md", "config.yml"]) {
  assert(chairlift.includes(`https://github.com/frostyard/chairlift/blob/2ee787eafc52d687b036c67a769099d58b8f7065/${source}`), `/docs/tools/chairlift must cite ${source}.`);
}
for (const source of ["shared/packages/snow/mkosi.conf", "shared/packages/sundog/mkosi.conf"]) {
  assert(chairlift.includes(`https://github.com/frostyard/snosi/blob/b2858ca0222814c395cf8248db98f3e096d57dc9/${source}`), `/docs/tools/chairlift must cite snosi ${source}.`);
}
assert(chairliftText.includes("This guide follows ChairLift v0.11.2"), "/docs/tools/chairlift must follow ChairLift v0.11.2.");
assert(chairliftText.includes("Snow, Snowfield, and Sundog install ChairLift") && chairliftText.includes("Floe does not"), "/docs/tools/chairlift must name the images that have ChairLift.");
assert(chairlift.includes('data-code="chairlift --dry-run"'), "/docs/tools/chairlift must give the dry-run command.");
assert(chairliftText.includes("/etc/chairlift/config.yml"), "/docs/tools/chairlift must name the administrator config file.");
assert(chairliftText.includes("Trust is per user and needs no password"), "/docs/tools/chairlift must state that tap trust needs no password.");
assert(chairliftText.includes("frostyard-chairlift-system-integration"), "/docs/tools/chairlift must warn about the system-integration package.");
assert(chairlift.includes('href="/docs/tools/updex/"'), "/docs/tools/chairlift must link the Updex page.");
assert(chairlift.includes('href="/docs/sysexts/manage/"'), "/docs/tools/chairlift must link the manage page.");

const intuneme = await readRoute("/docs/tools/intuneme");
const intunemeText = textOf(intuneme);
for (const heading of [
  "before-you-start",
  "install",
  "enroll-your-device",
  "every-day",
  "options",
  "what-the-helper-can-do",
  "upgrade",
  "remove",
  "troubleshooting",
  "see-also",
  "sources",
]) {
  assert(intuneme.includes(`id="${heading}"`), `/docs/tools/intuneme must render the "${heading}" section.`);
}
for (const source of ["README.md", "SECURITY.md", "site/getting-started/quick-start.md", "site/user-guide/upgrading.md", "site/troubleshooting.md"]) {
  assert(intuneme.includes(`https://github.com/frostyard/intuneme/blob/2cde560c5559470aa5ca9ae2baa28edc875dc68f/${source}`), `/docs/tools/intuneme must cite ${source}.`);
}
for (const source of ["shared/packages/snow/mkosi.conf", "shared/packages/sundog/mkosi.conf"]) {
  assert(intuneme.includes(`https://github.com/frostyard/snosi/blob/b2858ca0222814c395cf8248db98f3e096d57dc9/${source}`), `/docs/tools/intuneme must cite snosi ${source}.`);
}
assert(intunemeText.includes("This guide follows intuneme v0.21.0"), "/docs/tools/intuneme must follow intuneme v0.21.0.");
assert(intunemeText.includes("Snow, Snowfield, and Sundog already include the frostyard-intuneme package") && intunemeText.includes("Floe does not"), "/docs/tools/intuneme must name the images that have intuneme.");
for (const command of ["intuneme init", "intuneme start", "intuneme open portal", "intuneme recreate", "intuneme destroy --all"]) {
  assert(intuneme.includes(`data-code="${command}`), `/docs/tools/intuneme must give the command ${command}.`);
}
assert(intuneme.includes("https://frostyard.github.io/intuneme/user-guide/broker-proxy/"), "/docs/tools/intuneme must link the broker proxy guide.");
assert(intunemeText.includes("A root shell in the container needs a password"), "/docs/tools/intuneme must state the helper limits.");

const catalog = JSON.parse(await readFile(new URL("../src/data/extensions.json", import.meta.url), "utf8"));
const catalogDate = catalog.updatedAt.slice(0, 10);
const catalogComponent = await readFile(new URL("../src/components/ExtensionSnapshot.astro", import.meta.url), "utf8");
assert(!catalogComponent.includes("set:html"), "ExtensionSnapshot must not render catalog values as raw HTML.");
assert(catalogComponent.includes("{entry.label}") && catalogComponent.includes("{entry.version}"), "ExtensionSnapshot must render catalog values as escaped expressions.");

const catalogPage = await readRoute("/docs/sysexts");
for (const entry of catalog.extensions) {
  assert(catalogPage.includes(`>${escapeHtml(entry.label)}</td>`), `/docs/sysexts must render the escaped catalog label for ${entry.name}.`);
  assert(catalogPage.includes(`>${escapeHtml(entry.name)}</code>`), `/docs/sysexts must render the escaped component name for ${entry.name}.`);
  const listedVersion = entry.version ? `>${escapeHtml(entry.version)}</code>` : ">No version listed</td>";
  assert(catalogPage.includes(listedVersion), `/docs/sysexts must render the listed version for ${entry.name}.`);
}
assert(catalogPage.includes(catalogDate), "/docs/sysexts must render the catalog snapshot date.");
for (const href of ["/docs/sysexts/dev/", "/docs/sysexts/docker/", "/docs/sysexts/incus/", "/docs/sysexts/k3s/", "/docs/sysexts/nix/", "/docs/sysexts/tailscale/", "/docs/sysexts/vscode/"]) {
  assert(catalogPage.includes(`href="${href}"`), `/docs/sysexts must link the guide ${href}.`);
}
assert(catalogPage.includes("sudo updex features enable"), "/docs/sysexts must use the current Updex enable syntax.");
assert(catalogPage.includes('href="/docs/sysexts/manage/"'), "/docs/sysexts must link the lifecycle guide instead of repeating its steps.");
assert(!catalogPage.includes("--force"), "/docs/sysexts must not keep a second removal instruction set.");
const catalogList = await readFile(new URL("../src/components/ExtensionCatalog.astro", import.meta.url), "utf8");
assert(!catalogList.includes("set:html"), "ExtensionCatalog must not render catalog values as raw HTML.");

const sysextPages = [
  {
    route: "/docs/sysexts/docker",
    snosi: "b2858ca0222814c395cf8248db98f3e096d57dc9",
    name: "docker",
    sources: [
      "mkosi.images/docker/mkosi.conf",
      "mkosi.images/docker/mkosi.finalize",
      "mkosi.images/docker/required-paths.txt",
      "mkosi.images/base/mkosi.extra/usr/lib/sysupdate.docker.d/docker.transfer",
      "mkosi.images/base/mkosi.extra/usr/lib/sysupdate.docker.d/docker.feature",
      "shared/sysext/postoutput/sysext-postoutput.sh",
      "docs/design/sysexts.md",
    ],
    command: "sudo updex features enable docker --now",
  },
  {
    route: "/docs/sysexts/incus",
    // Incus is pinned after snosi#1020 (revision 4).
    snosi: "b2858ca0222814c395cf8248db98f3e096d57dc9",
    name: "incus",
    sources: [
      "mkosi.images/incus/mkosi.conf",
      "mkosi.images/incus/mkosi.finalize",
      "mkosi.images/incus/required-paths.txt",
      "mkosi.images/base/mkosi.extra/usr/lib/sysupdate.incus.d/incus.transfer",
      "mkosi.images/base/mkosi.extra/usr/lib/sysupdate.incus.d/incus.feature",
      "mkosi.images/base/mkosi.conf",
      "mkosi.sandbox/etc/apt/sources.list.d/frostyard.sources",
      "shared/sysext/finalize/sysext-no-base-owned.sh",
      "shared/sysext/base-owned-paths.txt",
      "docs/design/sysexts.md",
    ],
    command: "sudo updex features enable incus --now",
  },
  {
    route: "/docs/sysexts/tailscale",
    snosi: "b2858ca0222814c395cf8248db98f3e096d57dc9",
    name: "tailscale",
    sources: [
      "mkosi.images/tailscale/mkosi.conf",
      "mkosi.images/tailscale/mkosi.finalize",
      "mkosi.images/tailscale/required-paths.txt",
      "mkosi.images/base/mkosi.extra/usr/lib/sysupdate.tailscale.d/tailscale.transfer",
      "mkosi.images/base/mkosi.extra/usr/lib/sysupdate.tailscale.d/tailscale.feature",
      "docs/design/sysexts.md",
      "docs/nbc-to-bootc-migration.md",
    ],
    command: "sudo updex features enable tailscale --now",
  },
];

for (const page of sysextPages) {
  const html = await readRoute(page.route);
  const text = textOf(html);
  const entry = catalog.extensions.find((item) => item.name === page.name);
  assert(entry, `${page.route} must have a matching entry in the checked catalog.`);

  for (const heading of ["before-you-start", "update", "stop-updates-or-remove", "special-cases", "troubleshooting", "what-ships", "see-also", "sources"]) {
    assert(html.includes(`id="${heading}"`), `${page.route} must render the "${heading}" section.`);
  }
  assert(html.includes(`id="choose-${page.name}"`), `${page.route} must render a choice section.`);
  assert(html.includes(`id="enable-${page.name}"`), `${page.route} must render the enable section.`);

  assert(html.includes("In the extension catalog"), `${page.route} must render the catalog snapshot component.`);
  const escapedLabel = escapeHtml(entry.label);
  assert(html.includes(`>${escapedLabel}</dd>`), `${page.route} must render the escaped snapshot label.`);
  assert(html.includes(snapshotVersionMarkup(entry.version)), `${page.route} must render the snapshot version with the expected markup.`);
  assert(html.includes(catalogDate), `${page.route} must render the catalog snapshot date.`);
  assert(html.includes("This is not always the"), `${page.route} must state that the listed version is not always the newest.`);
  assert(html.includes(page.command), `${page.route} must use the current Updex enable syntax.`);
  assert(html.includes("refresh_error"), `${page.route} must explain a failed refresh.`);
  assert(html.includes("features check"), `${page.route} must explain read-only update checks.`);
  assert(html.includes("--no-refresh") && html.includes('href="/docs/sysexts/manage/#automatic-updates"'), `${page.route} must distinguish timer staging from interactive refresh and link the automatic updates section.`);
  assert(text.includes("sudo systemctl mask --now updex-update.timer"), `${page.route} must give the host-wide timer opt-out.`);
  assert(!text.includes("sudo updex daemon enable") && !text.includes("switched off. `daemon enable`") && !text.includes("The package ships the timer switched off"), `${page.route} must not repeat the timer commands or say that the timer is off by default.`);
  assert(html.includes('class="copy"'), `${page.route} must render copyable code blocks.`);
  assert(text.includes("%w") && text.includes("%a"), `${page.route} must explain the %w and %a transfer matching.`);
  assert(text.includes("does not prove that setup completed"), `${page.route} must state that a merge does not prove setup completed.`);
  assert(text.includes("unmerges all extensions on the host"), `${page.route} must warn that removal unmerges all extensions.`);
  assert(text.includes("remaining extensions stay unmerged"), `${page.route} must warn about a failed post-removal refresh.`);
  assert(text.includes("sudo systemd-sysext refresh"), `${page.route} must give the sudo refresh recovery command.`);
  assert(html.includes(`https://github.com/frostyard/snosi/blob/${page.snosi}/mkosi.images/base/mkosi.extra/usr/lib/systemd/system/reload-sysext.service`), `${page.route} must cite reload-sysext.service.`);
  assert(html.includes("https://github.com/frostyard/updex/blob/ce3900e5f2eded725ddc5afd8b532992e573200e/updex/features.go"), `${page.route} must cite updex/features.go.`);
  if (page.route === "/docs/sysexts/incus") {
    assert(html.includes('<code dir="auto">driver: lxc | qemu</code>'), "Incus must render the complete QEMU driver text.");
    assert(html.includes('If only <code dir="auto">lxc</code> is present, the bundled QEMU runtime is not loading.'), "Incus must keep the VM troubleshooting next action.");
    assert(!html.includes("The checked catalog snapshot shows a version ending in"), "Incus must not hard-code the snapshot revision in prose.");
    assert(html.includes("The checked catalog snapshot is generated"), "Incus must state that the snapshot is generated.");
    assert(text.includes("A Base with a different composition"), "Incus must state the Base compatibility limit.");
    assert(text.includes("Build package requests"), "Incus must label the package list as build requests.");
    assert(text.includes("does not promise that every request ships"), "Incus must not imply every request ships.");
    assert(html.includes("repository.frostyard.org/debian/"), "Incus must cite the executable Frostyard APT source.");
    assert(text.includes("Base already ships") && text.includes("holds only what Base does not have"), "Incus must distinguish Base packages from the delta.");
    // snosi#1020: revision 4 drops the Debian QEMU. snosi#1113: revision 5 stops upholding incus-lxcfs.service.
    assert(text.includes("SYSEXT_REVISION=5") && !text.includes("can still be revision 3"), "Incus must state that the source builds r5 and must not say the published image can still be r3.");
    assert(text.includes("Since revision 4, the extension ships no Debian QEMU or OVMF") && text.includes("A build guard keeps it so"), "Incus must state that r4 and later ship no Debian QEMU, enforced by a build guard.");
    assert(text.includes("Revision 3 images carried"), "Incus must limit the Debian leftovers to r3 images.");
    assert(text.includes("The setup service pulls in incus-lxcfs.service"), "Incus must state that the setup service pulls in incus-lxcfs.service instead of the target upholding it.");
    assert(text.includes("qemu-kvm") && text.includes("qemu-system-gui") && text.includes("qemu-system-modules-spice") && text.includes("ipxe-qemu"), "Incus must name the r3 Debian leftovers.");
    const incusRequests = text.slice(text.indexOf("Build package requests"), text.indexOf("Version", text.indexOf("Build package requests")));
    assert(incusRequests.includes("librsvg2-common") && !/qemu|ovmf/.test(incusRequests), "Incus must list the r4 build requests without the dropped Debian QEMU packages.");
    assert(!text.includes("QEMU display modules"), "Incus must not claim the extension ships the Debian QEMU display modules.");
    assert(text.includes("/etc/qemu-ifdown , come from Base") || text.includes("come from Base, not from the extension"), "Incus must state that Base owns the QEMU network helpers.");
    assert(text.includes("These Debian leftovers are separate from the bundled"), "Incus must separate delta leftovers from the bundled runtime.");
    assert(!text.includes("remain carried and unused"), "Incus must not repeat the stale blanket carry claim.");
  }
  if (page.route === "/docs/sysexts/tailscale") {
    assert(html.includes("does not authorize the host"), "Tailscale must separate enabling from authorization.");
    assert(html.includes('must be running before <code dir="auto">tailscale up</code>'), "Tailscale must require a working daemon before tailscale up.");
    assert(!html.includes("changes the host's network identity"), "Tailscale must not claim enabling changes the network identity.");
    assert(!html.includes("empty or malformed file"), "Tailscale must not claim an empty environment file prevents startup.");
    assert(text.includes("On a new installation"), "Tailscale must qualify the join path for a new node.");
    assert(text.includes("restored node identity can reconnect without a new authorization") || text.includes("A still-authorized node reconnects without a new authorization"), "Tailscale must state that restored state can reconnect.");
    assert(text.includes("Without that state, the host is a new node"), "Tailscale must keep the new-node path separate.");
    assert(!text.includes("so a later"), "Tailscale must not say restored state needs tailscale up.");
    assert(text.includes("node key expired") && text.includes("administrator removed the node"), "Tailscale must limit re-authorization to the real exceptions.");
    assert(text.includes("remote session through the tailnet can drop immediately"), "Tailscale must warn that a remote session can drop immediately.");
  }

  for (const source of page.sources) {
    assert(html.includes(`https://github.com/frostyard/snosi/blob/${page.snosi}/${source}`), `${page.route} must cite ${source} at snosi ${page.snosi}.`);
  }
  assert(html.includes("https://github.com/frostyard/updex/blob/ce3900e5f2eded725ddc5afd8b532992e573200e/README.md"), `${page.route} must cite the Updex v2.1.2 README.`);
  assert(html.includes("https://github.com/frostyard/updex/releases/tag/v2.1.2"), `${page.route} must link the Updex v2.1.2 release.`);
  assert(html.includes("Updex v2.1.2 release"), `${page.route} must label the Updex release source.`);
  assert(html.includes("Updex v2.1.2 commit"), `${page.route} must label the Updex commit source.`);
  assert(html.includes("https://github.com/frostyard/updex/pull/445"), `${page.route} must link Updex PR #445.`);
  assert(text.includes("--force"), `${page.route} must explain the --force removal guard.`);
  assert(html.includes("https://github.com/frostyard/updex/blob/ce3900e5f2eded725ddc5afd8b532992e573200e/updex/install.go"), `${page.route} must cite updex/install.go.`);
  assert(html.includes("https://github.com/frostyard/updex/blob/ce3900e5f2eded725ddc5afd8b532992e573200e/sysext/manager.go"), `${page.route} must cite sysext/manager.go.`);
  assert(!html.includes("d750445daf3fe8c589419749a1ebae9f5eb1eba2"), `${page.route} must not cite the old Updex branch commit.`);
  assert(html.includes(`/var/lib/extensions/${page.name}.raw`), `${page.route} must name the live sysext link.`);
  assert(html.includes(`/var/lib/extensions.d/${page.name}.raw`), `${page.route} must name the removed legacy link.`);
  assert(text.includes("Updex refuses while"), `${page.route} must state that Updex refuses removal of a merged extension without --force.`);
  assert(!text.includes("does not have this check yet"), `${page.route} must not say that the released Updex lacks the removal guard.`);
  assert(!text.includes("Updex v2.0.4 and later have this check") && !text.includes("Updex v2.0.3 and older do not"), `${page.route} must not carry the superseded Updex v2.0.3 and v2.0.4 removal-guard limit.`);
  assert(text.includes("Removing requires --force and a reboot to take effect"), `${page.route} must quote the refusal message for a merged extension.`);
  assert(!text.includes("they remove the extension at once"), `${page.route} must not carry the superseded older-Updex removal text.`);
  assert(!text.includes("updex catalog remove has the same check"), `${page.route} must not claim the catalog remove guard for an image feature.`);
  assert(text.includes("only sets Enabled=false"), `${page.route} must explain plain disable.`);
  assert(text.includes("The next boot merges the version that the link names"), `${page.route} must state that plain disable leaves the link, and the next boot merges the linked version.`);
  assert(text.includes("one row for each enabled feature"), `${page.route} must describe features check.`);
  assert(text.includes("has no row") && text.includes("a missing row does not mean"), `${page.route} must explain the disabled-feature no-row result.`);
  if (page.route === "/docs/sysexts/docker") {
    assert(text.includes("Running containers can stop immediately"), "Docker must warn that removal can stop containers.");
  }
  if (page.route === "/docs/sysexts/incus") {
    assert(text.includes("Running containers and virtual machines can stop immediately"), "Incus must warn that removal can stop workloads.");
  }
}

// The shorter guides link the general lifecycle instead of repeating it.
const commandPages = [
  {
    route: "/docs/sysexts/dev",
    name: "dev",
    enableId: "enable-dev-tools",
    useId: "use-dev-tools",
    sources: [
      "mkosi.images/dev/mkosi.conf",
      "mkosi.images/dev/mkosi.postinst.chroot",
      "mkosi.images/dev/required-paths.txt",
      "mkosi.images/base/mkosi.extra/usr/lib/sysupdate.dev.d/dev.feature",
      "mkosi.images/base/mkosi.extra/usr/lib/sysupdate.dev.d/dev.transfer",
    ],
    statements: [
      "come from the image, not from this extension",
      "repoints every /usr/bin and /usr/sbin link",
      "SVG loader",
    ],
  },
  {
    route: "/docs/sysexts/k3s",
    name: "k3s",
    enableId: "enable-k3s",
    useId: "use-k3s",
    sources: [
      "mkosi.images/k3s/mkosi.conf",
      "mkosi.images/k3s/mkosi.postinst.chroot",
      "mkosi.images/k3s/required-paths.txt",
      "mkosi.images/base/mkosi.extra/usr/lib/sysupdate.k3s.d/k3s.feature",
      "mkosi.images/base/mkosi.extra/usr/lib/sysupdate.k3s.d/k3s.transfer",
    ],
    statements: [
      "Use k3s ctr",
      "starts a standalone server",
      "br_netfilter",
    ],
  },
  {
    route: "/docs/sysexts/nix",
    name: "nix",
    enableId: "enable-nix",
    useId: "use-nix",
    sources: [
      "mkosi.images/nix/mkosi.conf",
      "mkosi.images/nix/mkosi.finalize",
      "mkosi.images/nix/required-paths.txt",
      "mkosi.images/nix/mkosi.extra/usr/lib/sysusers.d/nix.conf",
      "mkosi.images/base/mkosi.extra/usr/lib/sysupdate.nix.d/nix.feature",
      "mkosi.images/base/mkosi.extra/usr/lib/sysupdate.nix.d/nix.transfer",
    ],
    statements: [
      "nix-users group and adds nobody to it",
      "start a new login session",
      "bound to that mount",
    ],
  },
  {
    route: "/docs/sysexts/vscode",
    name: "vscode",
    enableId: "enable-visual-studio-code",
    useId: "use-visual-studio-code",
    sources: [
      "mkosi.images/vscode/mkosi.conf",
      "mkosi.images/vscode/required-paths.txt",
      "shared/packages/vscode/mkosi.postinst.d/vscode.chroot",
      "mkosi.images/base/mkosi.extra/usr/lib/sysupdate.vscode.d/vscode.feature",
      "mkosi.images/base/mkosi.extra/usr/lib/sysupdate.vscode.d/vscode.transfer",
    ],
    statements: [
      "The build adds inode/directory",
      "no service",
      "gui-base",
    ],
  },
];

for (const page of commandPages) {
  const html = await readRoute(page.route);
  const text = textOf(html);
  const entry = catalog.extensions.find((item) => item.name === page.name);
  assert(entry, `${page.route} must have a matching entry in the checked catalog.`);

  for (const heading of ["before-you-start", page.enableId, page.useId, "update-and-remove", "troubleshooting", "what-ships", "see-also", "sources"]) {
    assert(html.includes(`id="${heading}"`), `${page.route} must render the "${heading}" section.`);
  }

  assert(html.includes("In the extension catalog"), `${page.route} must render the catalog snapshot component.`);
  assert(html.includes(`>${escapeHtml(entry.label)}</dd>`), `${page.route} must render the escaped snapshot label.`);
  assert(html.includes(snapshotVersionMarkup(entry.version)), `${page.route} must render the snapshot version with the expected markup.`);
  assert(html.includes(catalogDate), `${page.route} must render the catalog snapshot date.`);
  assert(html.includes(`>${escapeHtml(entry.name)}</code>`), `${page.route} must render the component name.`);

  assert(html.includes(`sudo updex features enable ${page.name} --now`), `${page.route} must use the current Updex enable syntax.`);
  assert(html.includes('href="/docs/sysexts/manage/"'), `${page.route} must link the general lifecycle guide.`);
  assert(html.includes("refresh_error"), `${page.route} must explain a failed refresh.`);
  assert(text.includes("--force"), `${page.route} must explain the --force removal guard.`);
  assert(text.includes("unmerges all extensions on the host"), `${page.route} must warn that removal unmerges all extensions.`);

  for (const source of page.sources) {
    assert(html.includes(`https://github.com/frostyard/snosi/blob/b2858ca0222814c395cf8248db98f3e096d57dc9/${source}`), `${page.route} must cite ${source}.`);
  }
  assert(html.includes("https://github.com/frostyard/snosi/blob/b2858ca0222814c395cf8248db98f3e096d57dc9/docs/design/sysexts.md"), `${page.route} must cite the system extension model.`);
  assert(html.includes("https://github.com/frostyard/updex/blob/ce3900e5f2eded725ddc5afd8b532992e573200e/README.md"), `${page.route} must cite the Updex v2.1.2 README.`);
  assert(html.includes("https://github.com/frostyard/updex/blob/ce3900e5f2eded725ddc5afd8b532992e573200e/updex/features.go"), `${page.route} must cite updex/features.go.`);
  assert(html.includes("https://github.com/frostyard/frostyard-org/blob/main/src/data/extensions.json"), `${page.route} must cite the catalog snapshot.`);

  for (const statement of page.statements) {
    assert(text.includes(statement), `${page.route} must state "${statement}".`);
  }
}

for (const route of ["/docs/tools/updex", "/docs/sysexts", "/docs/sysexts/manage", "/docs/sysexts/docker", "/docs/sysexts/incus", "/docs/sysexts/tailscale", "/docs/sysexts/dev", "/docs/sysexts/k3s", "/docs/sysexts/nix", "/docs/sysexts/vscode", "/docs/sysexts/himmelblau"]) {
  const stale = textOf(await readRoute(route));
  assert(!stale.includes("Planned:"), `${route} must not carry a "Planned:" paragraph: Updex v2.1.2 ships rollback, the packaged timer, and the RUNNING and LINKED columns.`);
  assert(!stale.includes("has no rollback command"), `${route} must not say that Updex has no rollback command.`);
  assert(!stale.includes("once a day") && !stale.includes("daily timer"), `${route} must not describe the old daily timer.`);
  assert(!stale.includes("switched off. daemon enable turns it on") && !stale.includes("timer is off by default") && !stale.includes("timer is opt-in"), `${route} must not say that the update timer is off by default: the base image enables updex-update.timer.`);
}

const manage = await readRoute("/docs/sysexts/manage");
const manageText = textOf(manage);
for (const heading of [
  "before-you-start",
  "find-an-extension",
  "enable-an-extension",
  "check-that-it-works",
  "update",
  "automatic-updates",
  "roll-back",
  "stop-updates-or-remove",
  "how-extensions-are-built",
  "troubleshooting",
  "see-also",
  "sources",
]) {
  assert(manage.includes(`id="${heading}"`), `/docs/sysexts/manage must render the "${heading}" section.`);
}
for (const source of [
  "docs/design/sysexts.md",
  "docs/adr/0004-sysext-authoring-rules.md",
  "mkosi.images/base/mkosi.conf",
  "mkosi.images/base/mkosi.extra/usr/lib/systemd/system/reload-sysext.service",
  "mkosi.images/base/mkosi.extra/usr/lib/sysupdate.docker.d/docker.transfer",
  "mkosi.images/docker/mkosi.extra/usr/lib/systemd/system/multi-user.target.d/10-docker.conf",
  "mkosi.images/docker/required-paths.txt",
  "shared/sysext/postoutput/sysext-postoutput.sh",
  "shared/sysext/finalize/sysext-required-paths.sh",
]) {
  assert(manage.includes(`https://github.com/frostyard/snosi/blob/b2858ca0222814c395cf8248db98f3e096d57dc9/${source}`), `/docs/sysexts/manage must cite ${source}.`);
}
for (const source of [
  "README.md",
  "docs/design/overview.md",
  "docs/specs/config-reference.md",
  "docs/adr/0007-daemon-stages-never-activates.md",
  "docs/adr/0015-detect-merged-sysexts-from-hierarchy-metadata.md",
  "docs/adr/0016-automatic-sysext-updates-apply-at-next-boot.md",
  "cmd/updex/features_run.go",
  "cmd/updex/daemon.go",
  "updex/features.go",
  "updex/install.go",
  "updex/rollback.go",
  "updex/daemon.go",
  "updex/list.go",
  "manifest/gpg.go",
  "sysext/manager.go",
  "systemd/unit.go",
]) {
  assert(manage.includes(`https://github.com/frostyard/updex/blob/ce3900e5f2eded725ddc5afd8b532992e573200e/${source}`), `/docs/sysexts/manage must cite ${source}.`);
}
assert(manageText.includes("This guide follows Updex v2.1.2"), "/docs/sysexts/manage must follow Updex v2.1.2.");
assert(manage.includes("https://github.com/frostyard/updex/releases/tag/v2.1.2"), "/docs/sysexts/manage must link the Updex v2.1.2 release.");
assert(manage.includes('id="roll-back"'), "/docs/sysexts/manage must render the roll back section.");
assert(manageText.includes("sudo updex features rollback"), "/docs/sysexts/manage must give the rollback command.");
assert(manageText.includes("sudo updex features rollback --clear"), "/docs/sysexts/manage must give the rollback --clear command.");
assert(manageText.includes("/var/lib/updex/rollback/"), "/docs/sysexts/manage must name the rollback record.");
assert(manageText.includes("held by rollback: rejected"), "/docs/sysexts/manage must show the rollback hold message.");
assert(manageText.includes("An image rollback with bootc rollback does not roll back extensions"), "/docs/sysexts/manage must keep the bootc rollback note.");
assert(manageText.includes("not linked: needs image &gt;="), "/docs/sysexts/manage must show the minimum-image message.");
assert(manageText.includes("PENDING REBOOT:") && manageText.includes("RUNNING") && manageText.includes("LINKED"), "/docs/sysexts/manage must explain RUNNING, LINKED, and PENDING REBOOT.");
assert(manageText.includes("another updex operation is running"), "/docs/sysexts/manage must show the operation-lock message.");
assert(manageText.includes("updex-update.timer") && manageText.includes("sudo updex daemon enable"), "/docs/sysexts/manage must name the timer and how to turn it on.");
assert(manageText.includes("sudo systemctl mask --now updex-update.timer"), "/docs/sysexts/manage must give the host-wide opt-out.");
assert(manageText.includes("Every Frostyard image enables updex-update.timer"), "/docs/sysexts/manage must state that the base image enables the update timer.");
assert(manageText.includes("updex: no update source is reachable; skipping this run"), "/docs/sysexts/manage must state that a run with no reachable source is skipped and exits 0.");
assert(manageText.includes("(version &lt;version&gt;) is active. Removing requires --force and a reboot to take effect."), "/docs/sysexts/manage must show the exact removal refusal message.");
assert(manageText.includes("Updex refuses to remove a merged extension without --force"), "/docs/sysexts/manage must state the removal guard.");
assert(manageText.includes("It never activates"), "/docs/sysexts/manage must state that the timer never activates.");
assert(manageText.includes("--no-refresh"), "/docs/sysexts/manage must name the timer's --no-refresh command.");
assert(manageText.includes("Updex unmerges all extensions on the host"), "/docs/sysexts/manage must warn that removal unmerges all extensions.");
assert(manageText.includes("Reboot when the command finishes."), "/docs/sysexts/manage must ask for a reboot after removal.");
assert(manageText.includes("import-pubring.gpg"), "/docs/sysexts/manage must name the systemd keyring it verifies against.");
assert(manageText.includes("required-paths.txt"), "/docs/sysexts/manage must explain the required-path check.");
assert(manageText.includes("sudo updex features enable"), "/docs/sysexts/manage must use the current Updex enable syntax.");
assert(manage.includes("/var/lib/extensions.d/"), "/docs/sysexts/manage must name the staged image directory.");
assert(manage.includes("/etc/sysupdate."), "/docs/sysexts/manage must name the drop-in path.");

await access(new URL("pagefind/pagefind.js", dist));
const pagefindEntry = JSON.parse(await readFile(new URL("pagefind/pagefind-entry.json", dist), "utf8"));
const pagefindEnglish = pagefindEntry.languages?.en;
assert(pagefindEnglish, "The Pagefind index must contain an English language entry.");
assert(pagefindEnglish.page_count === docsRoutes.length, `The Pagefind index must contain all ${docsRoutes.length} docs pages.`);

for (const name of ["1password-cli", "1password", "bitwarden", "chatgpt", "claude-desktop", "code-server", "coder", "debdev", "edge", "gitdesktop", "github-copilot", "lemonade", "localsend", "lodge", "maild", "moonlight", "notesd", "obsidian", "paseo", "pilothouse", "podman", "porterd", "readd", "sunshine", "voxtype"]) {
  const route = `/docs/sysexts/${name}`;
  const text = textOf(await readRoute(route));
  assert(!text.includes("has no rollback command") && !text.includes("planned `updex features rollback`") && !text.includes("planned updex features rollback"), `${route} must not say that Updex has no rollback command: Updex v2.1.2 ships it.`);
  assert(text.includes(`sudo updex features rollback ${name}`), `${route} must give the rollback command.`);
}

// The suite service guides use the current enable syntax and start their units at boot.
for (const name of ["notesd", "maild", "lodge", "readd", "porterd"]) {
  const route = `/docs/sysexts/${name}`;
  const text = textOf(await readRoute(route));
  assert(text.includes(`sudo updex features enable ${name} --now`), `${route} must use the current Updex enable syntax.`);
  assert(text.includes("Upholds="), `${route} must explain the Upholds= drop-in that restarts the units.`);
  assert(text.includes("sudo systemd-sysusers"), `${route} must give the sysusers command for a start without a reboot.`);
  assert(!text.includes("RequisiteFeatures"), `${route} must not describe a RequisiteFeatures dependency.`);
}

// The update sections of the suite guides that back lodge's apps.
for (const [name, marker] of [
  ["lodge", "the database is at version N, newer than this lodge's M"],
  ["readd", "database schema N is newer than this readd"],
  ["porterd", "open thread database:"],
]) {
  const route = `/docs/sysexts/${name}`;
  const html = await readRoute(route);
  const start = html.indexOf('id="update-roll-back-and-remove"');
  const end = html.indexOf('id="what-ships"', start + 1);
  assert(start !== -1, `${route} must render the "update-roll-back-and-remove" section.`);
  assert(end !== -1, `${route} must render the "what-ships" section after it.`);
  assert(end > start, `${route} must render "what-ships" after "update-roll-back-and-remove".`);
  const section = html.slice(start, end);
  const sectionText = textOf(section);
  assert(sectionText.includes("Updex v2.1.3"), `${route} must name Updex v2.1.3 in the update section.`);
  assert(sectionText.includes("systemctl mask --now"), `${route} must mask the units while the state is copied.`);
  assert(sectionText.includes("keeps its old binary until it restarts"), `${route} must say that the running daemon keeps its old binary until it restarts.`);
  assert(sectionText.includes(marker), `${route} must give the failure message "${marker}".`);
  assert(sectionText.indexOf("older than v2.1.3") !== -1 && sectionText.indexOf("older than v2.1.3") < sectionText.indexOf("To run the new version now"), `${route} must give the older-Updex commands before the restart step.`);
  assert(textOf(html).includes("activation did not finish"), `${route} must explain the "activation did not finish" message.`);
}

console.log(`Checked ${files.length} built pages, ${docsRoutes.length} docs pages, and their internal routes.`);
