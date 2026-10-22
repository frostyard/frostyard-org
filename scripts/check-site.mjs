import { access, readFile, readdir } from "node:fs/promises";
import { join, relative } from "node:path";

const dist = new URL("../dist/", import.meta.url);

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
    : ">No version in the snapshot</dd>";
}

assert(snapshotVersionMarkup(null) === ">No version in the snapshot</dd>", "The null snapshot version must use the plain-text fallback.");
assert(snapshotVersionMarkup("") === ">No version in the snapshot</dd>", "The empty snapshot version must use the plain-text fallback.");
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
  "/docs/sysexts/docker",
  "/docs/sysexts/incus",
  "/docs/sysexts/tailscale",
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
  assert(!html.includes("2026-10-28"), `${page} contains the superseded lifecycle date.`);

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
    "/docs/images/snow/",
    "/docs/sysexts/docker/",
    "/docs/sysexts/incus/",
    "/docs/sysexts/tailscale/",
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
  "Software layers",
  "Source and snapshot policy",
  "What this pilot does not cover",
  "not a maximum",
]) {
  assert(docsLanding.includes(text), `/docs must contain the section or statement "${text}".`);
}
for (const route of ["/install", "/docs/images/snow/", "/docs/sysexts/docker/", "/docs/sysexts/incus/", "/docs/sysexts/tailscale/"]) {
  assert(docsLanding.includes(`href="${route}"`), `/docs must link to ${route}.`);
}
assert(docsLanding.includes("menuStateSynced"), "Docs pages must load the mobile menu aria-expanded sync.");
assert(docsLanding.includes("Updex v2.0.3"), "/docs must name the Updex v2.0.3 source pin.");
assert(docsLanding.includes("runtime bug report"), "/docs must acknowledge the linked Updex runtime bug report.");
assert(docsLanding.includes("https://github.com/frostyard/updex/issues/444"), "/docs must link Updex issue #444.");
assert(!docsLanding.includes("d750445daf3fe8c589419749a1ebae9f5eb1eba2"), "/docs must not cite the old Updex branch commit.");

const snow = await readRoute("/docs/images/snow");
const snowText = textOf(snow);
for (const heading of [
  "purpose-and-support-boundary",
  "what-ships",
  "choose-snow",
  "install",
  "first-boot-and-use",
  "updates-and-rollback",
  "special-cases-and-troubleshooting",
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
  assert(snow.includes(`https://github.com/frostyard/snosi/blob/5b610e3db1017e0ccc9a5dabc10b841e80c1d2e5/${source}`), `/docs/images/snow must cite ${source}.`);
}
assert(snow.includes("Fresh-install evidence"), "/docs/images/snow must state the fresh-install evidence limit.");
assert(snow.includes("There is no in-place conversion"), "/docs/images/snow must state the migration limit.");
assert(!snow.includes("Boot presentation"), "/docs/images/snow must not carry the removed boot-presentation row.");
assert(snow.includes("Image and system-extension applications live under"), "/docs/images/snow must separate /usr payloads from /var state.");
assert(snow.includes("Firn can install the chosen core Flatpak set"), "/docs/images/snow must state that Firn can install the core Flatpak set.");
assert(!snow.includes("present only if"), "/docs/images/snow must not claim the core apps have one install path.");
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
assert(snowText.includes("operators do not need to run them"), "/docs/images/snow must describe the commands as stager behavior.");
assert(snowText.includes("does not force a reboot"), "/docs/images/snow must state that the stager does not force a reboot.");
assert(snowText.includes("linux-image-amd64/forky") && snowText.includes("trixie-backports"), "/docs/images/snow must preserve the confirmed kernel selection.");

const catalog = JSON.parse(await readFile(new URL("../src/data/extensions.json", import.meta.url), "utf8"));
const catalogDate = catalog.updatedAt.slice(0, 10);
const catalogComponent = await readFile(new URL("../src/components/ExtensionSnapshot.astro", import.meta.url), "utf8");
assert(!catalogComponent.includes("set:html"), "ExtensionSnapshot must not render catalog values as raw HTML.");
assert(catalogComponent.includes("{entry.label}") && catalogComponent.includes("{entry.version}"), "ExtensionSnapshot must render catalog values as escaped expressions.");

const sysextPages = [
  {
    route: "/docs/sysexts/docker",
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
    name: "incus",
    sources: [
      "mkosi.images/incus/mkosi.conf",
      "mkosi.images/incus/mkosi.finalize",
      "mkosi.images/incus/required-paths.txt",
      "mkosi.images/base/mkosi.extra/usr/lib/sysupdate.incus.d/incus.transfer",
      "mkosi.images/base/mkosi.extra/usr/lib/sysupdate.incus.d/incus.feature",
      "mkosi.images/base/mkosi.conf",
      "mkosi.sandbox/etc/apt/sources.list.d/frostyard.sources",
      "docs/design/sysexts.md",
    ],
    command: "sudo updex features enable incus --now",
  },
  {
    route: "/docs/sysexts/tailscale",
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

  for (const heading of ["purpose-and-host-prerequisites", "what-ships", "enable", "updates-and-removal", "troubleshooting", "see-also", "sources"]) {
    assert(html.includes(`id="${heading}"`), `${page.route} must render the "${heading}" section.`);
  }
  assert(/(id="choose-[^"]+")/.test(html), `${page.route} must render a choice section.`);

  assert(html.includes("Checked catalog snapshot"), `${page.route} must render the catalog snapshot component.`);
  const escapedLabel = escapeHtml(entry.label);
  assert(html.includes(`>${escapedLabel}</dd>`), `${page.route} must render the escaped snapshot label.`);
  assert(html.includes(snapshotVersionMarkup(entry.version)), `${page.route} must render the snapshot version with the expected markup.`);
  assert(html.includes(catalogDate), `${page.route} must render the catalog snapshot date.`);
  assert(html.includes("not a latest-version claim"), `${page.route} must state the snapshot version limit.`);
  assert(html.includes(page.command), `${page.route} must use the current Updex enable syntax.`);
  assert(html.includes("refresh_error"), `${page.route} must explain a failed refresh.`);
  assert(html.includes("features check"), `${page.route} must explain read-only update checks.`);
  assert(html.includes("sudo updex daemon enable"), `${page.route} must distinguish timer staging from interactive refresh.`);
  assert(html.includes('class="copy"'), `${page.route} must render copyable code blocks.`);
  assert(text.includes("%w") && text.includes("%a"), `${page.route} must explain the %w and %a transfer matching.`);
  assert(text.includes("does not prove that setup completed"), `${page.route} must state that a merge does not prove setup completed.`);
  assert(text.includes("unmerges all extensions on the host"), `${page.route} must warn that removal unmerges all extensions.`);
  assert(text.includes("remaining extensions stay unmerged"), `${page.route} must warn about a failed post-removal refresh.`);
  assert(text.includes("sudo systemd-sysext refresh"), `${page.route} must give the sudo refresh recovery command.`);
  assert(html.includes("https://github.com/frostyard/snosi/blob/5b610e3db1017e0ccc9a5dabc10b841e80c1d2e5/mkosi.images/base/mkosi.extra/usr/lib/systemd/system/reload-sysext.service"), `${page.route} must cite reload-sysext.service.`);
  assert(html.includes("https://github.com/frostyard/updex/blob/a76548350995ecbe80371e57a24d7d844ceb408d/updex/features.go"), `${page.route} must cite updex/features.go.`);
  if (page.route === "/docs/sysexts/incus") {
    assert(html.includes('<code dir="auto">driver: lxc | qemu</code>'), "Incus must render the complete QEMU driver text.");
    assert(html.includes('If only <code dir="auto">lxc</code> is present, the bundled QEMU runtime is not loading.'), "Incus must keep the VM troubleshooting next action.");
    assert(!html.includes("The checked catalog snapshot shows a version ending in"), "Incus must not hard-code the snapshot revision in prose.");
    assert(html.includes("The checked catalog snapshot is generated"), "Incus must state that the snapshot is generated.");
    assert(text.includes("A Base with a different composition"), "Incus must state the Base compatibility limit.");
    assert(text.includes("Build package requests"), "Incus must label the package list as build requests.");
    assert(text.includes("does not promise that every request ships"), "Incus must not imply every request ships.");
    assert(html.includes("repository.frostyard.org/debian/"), "Incus must cite the executable Frostyard APT source.");
    assert(text.includes("Base already ships") && text.includes("delta therefore"), "Incus must distinguish Base packages from the delta.");
    assert(text.includes("does not carry Debian") && text.includes("qemu-utils"), "Incus must state that the delta omits Base-owned qemu-utils.");
    assert(text.includes("qemu-kvm") && text.includes("qemu-system-gui") && text.includes("qemu-system-modules-spice") && text.includes("ipxe-qemu"), "Incus must name the unused delta leftovers.");
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
    assert(html.includes(`https://github.com/frostyard/snosi/blob/5b610e3db1017e0ccc9a5dabc10b841e80c1d2e5/${source}`), `${page.route} must cite ${source}.`);
  }
  assert(html.includes("https://github.com/frostyard/updex/blob/a76548350995ecbe80371e57a24d7d844ceb408d/README.md"), `${page.route} must cite the Updex v2.0.3 README.`);
  assert(html.includes("https://github.com/frostyard/updex/releases/tag/v2.0.3"), `${page.route} must link the Updex v2.0.3 release.`);
  assert(html.includes("Updex v2.0.3 release"), `${page.route} must label the Updex release source.`);
  assert(html.includes("Updex v2.0.3 commit"), `${page.route} must label the Updex commit source.`);
  assert(html.includes("https://github.com/frostyard/updex/issues/444"), `${page.route} must link Updex issue #444.`);
  assert(html.includes("https://github.com/frostyard/updex/blob/a76548350995ecbe80371e57a24d7d844ceb408d/updex/install.go"), `${page.route} must cite updex/install.go.`);
  assert(html.includes("https://github.com/frostyard/updex/blob/a76548350995ecbe80371e57a24d7d844ceb408d/sysext/manager.go"), `${page.route} must cite sysext/manager.go.`);
  assert(!html.includes("d750445daf3fe8c589419749a1ebae9f5eb1eba2"), `${page.route} must not cite the old Updex branch commit.`);
  assert(html.includes(`/var/lib/extensions/${page.name}.raw`), `${page.route} must name the live sysext link.`);
  assert(html.includes(`/var/lib/extensions.d/${page.name}.raw`), `${page.route} must name the removed legacy link.`);
  assert(text.includes("takes effect at once"), `${page.route} must state that removal acts at once.`);
  assert(text.includes("also when the extension is merged"), `${page.route} must state that removal acts on a merged extension.`);
  assert(text.includes("does not detect a merged image"), `${page.route} must document the Updex #444 merged-image limitation.`);
  assert(text.includes("--force guard does not fire"), `${page.route} must not present --force as a working guard.`);
  assert(text.includes("If Updex refuses"), `${page.route} must keep the conditional refusal path.`);
  assert(text.includes("Do not rely on that refusal as a safety check"), `${page.route} must not present a refusal as a safety check.`);
  assert(text.includes("writes only Enabled=false"), `${page.route} must explain plain disable.`);
  assert(text.includes("daemon is not stopped"), `${page.route} must state that plain disable leaves the daemon running.`);
  assert(text.includes("iterates the enabled features in scope"), `${page.route} must describe features check.`);
  assert(text.includes("gets no row") && text.includes("no row is not an up-to-date result"), `${page.route} must explain the disabled-feature no-row result.`);
  assert(!text.includes("requires --force and a reboot"), `${page.route} must not keep the old --force prerequisite claim.`);
  if (page.route === "/docs/sysexts/docker") {
    assert(text.includes("Running containers can stop immediately"), "Docker must warn that removal can stop containers.");
  }
  if (page.route === "/docs/sysexts/incus") {
    assert(text.includes("Running containers and virtual machines can stop immediately"), "Incus must warn that removal can stop workloads.");
  }
}

await access(new URL("pagefind/pagefind.js", dist));
const pagefindEntry = JSON.parse(await readFile(new URL("pagefind/pagefind-entry.json", dist), "utf8"));
const pagefindEnglish = pagefindEntry.languages?.en;
assert(pagefindEnglish, "The Pagefind index must contain an English language entry.");
assert(pagefindEnglish.page_count === docsRoutes.length, `The Pagefind index must contain all ${docsRoutes.length} docs pages.`);

console.log(`Checked ${files.length} built pages, ${docsRoutes.length} docs pages, and their internal routes.`);
