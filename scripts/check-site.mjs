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
  "/docs/sysexts",
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
    "/docs/sysexts/",
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
  "How a Frostyard system is built",
  "Not covered yet",
  "not a maximum",
]) {
  assert(docsLanding.includes(text), `/docs must contain the section or statement "${text}".`);
}
for (const route of ["/install", "/docs/images/snow/", "/docs/sysexts/docker/", "/docs/sysexts/incus/", "/docs/sysexts/tailscale/"]) {
  assert(docsLanding.includes(`href="${route}"`), `/docs must link to ${route}.`);
}
assert(docsLanding.includes("menuStateSynced"), "Docs pages must load the mobile menu aria-expanded sync.");
assert(docsLanding.includes("Updex v2.0.3"), "/docs must name the Updex v2.0.3 source pin.");
assert(docsLanding.includes("https://github.com/frostyard/updex/pull/445"), "/docs must link Updex PR #445.");
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
  assert(snow.includes(`https://github.com/frostyard/snosi/blob/5b610e3db1017e0ccc9a5dabc10b841e80c1d2e5/${source}`), `/docs/images/snow must cite ${source}.`);
}
assert(snowText.includes("Fresh-install test results"), "/docs/images/snow must state the fresh-install test limit.");
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
assert(snowText.includes("linux-image-amd64/forky") && snowText.includes("trixie-backports"), "/docs/images/snow must preserve the confirmed kernel selection.");

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
for (const href of ["/docs/sysexts/docker/", "/docs/sysexts/incus/", "/docs/sysexts/tailscale/"]) {
  assert(catalogPage.includes(`href="${href}"`), `/docs/sysexts must link the guide ${href}.`);
}
assert(catalogPage.includes("sudo updex features enable"), "/docs/sysexts must use the current Updex enable syntax.");
assert(catalogPage.includes("--force"), "/docs/sysexts must explain the --force removal guard.");
const catalogList = await readFile(new URL("../src/components/ExtensionCatalog.astro", import.meta.url), "utf8");
assert(!catalogList.includes("set:html"), "ExtensionCatalog must not render catalog values as raw HTML.");

const sysextPages = [
  {
    route: "/docs/sysexts/docker",
    snosi: "5b610e3db1017e0ccc9a5dabc10b841e80c1d2e5",
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
    snosi: "c0d6476ecda7124f8be86f3f991cc8b61fb0dbdd",
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
    snosi: "5b610e3db1017e0ccc9a5dabc10b841e80c1d2e5",
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
  assert(html.includes("sudo updex daemon enable"), `${page.route} must distinguish timer staging from interactive refresh.`);
  assert(html.includes('class="copy"'), `${page.route} must render copyable code blocks.`);
  assert(text.includes("%w") && text.includes("%a"), `${page.route} must explain the %w and %a transfer matching.`);
  assert(text.includes("does not prove that setup completed"), `${page.route} must state that a merge does not prove setup completed.`);
  assert(text.includes("unmerges all extensions on the host"), `${page.route} must warn that removal unmerges all extensions.`);
  assert(text.includes("remaining extensions stay unmerged"), `${page.route} must warn about a failed post-removal refresh.`);
  assert(text.includes("sudo systemd-sysext refresh"), `${page.route} must give the sudo refresh recovery command.`);
  assert(html.includes(`https://github.com/frostyard/snosi/blob/${page.snosi}/mkosi.images/base/mkosi.extra/usr/lib/systemd/system/reload-sysext.service`), `${page.route} must cite reload-sysext.service.`);
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
    assert(text.includes("Base already ships") && text.includes("holds only what Base does not have"), "Incus must distinguish Base packages from the delta.");
    // snosi#1020: revision 4 drops the Debian QEMU; the published image can still be revision 3.
    assert(text.includes("SYSEXT_REVISION=4") && text.includes("can still be revision 3"), "Incus must state that the source builds r4 and the published image can still be r3.");
    assert(text.includes("Revision 4 ships no Debian QEMU or OVMF") && text.includes("A build guard keeps it so"), "Incus must state that r4 ships no Debian QEMU, enforced by a build guard.");
    assert(text.includes("published revision 3 image still carries"), "Incus must limit the Debian leftovers to the published r3 image.");
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
  assert(html.includes("https://github.com/frostyard/updex/blob/a76548350995ecbe80371e57a24d7d844ceb408d/README.md"), `${page.route} must cite the Updex v2.0.3 README.`);
  assert(html.includes("https://github.com/frostyard/updex/releases/tag/v2.0.3"), `${page.route} must link the Updex v2.0.3 release.`);
  assert(html.includes("Updex v2.0.3 release"), `${page.route} must label the Updex release source.`);
  assert(html.includes("Updex v2.0.3 commit"), `${page.route} must label the Updex commit source.`);
  assert(html.includes("https://github.com/frostyard/updex/pull/445"), `${page.route} must link Updex PR #445.`);
  assert(text.includes("--force"), `${page.route} must explain the --force removal guard.`);
  assert(html.includes("https://github.com/frostyard/updex/blob/a76548350995ecbe80371e57a24d7d844ceb408d/updex/install.go"), `${page.route} must cite updex/install.go.`);
  assert(html.includes("https://github.com/frostyard/updex/blob/a76548350995ecbe80371e57a24d7d844ceb408d/sysext/manager.go"), `${page.route} must cite sysext/manager.go.`);
  assert(!html.includes("d750445daf3fe8c589419749a1ebae9f5eb1eba2"), `${page.route} must not cite the old Updex branch commit.`);
  assert(html.includes(`/var/lib/extensions/${page.name}.raw`), `${page.route} must name the live sysext link.`);
  assert(html.includes(`/var/lib/extensions.d/${page.name}.raw`), `${page.route} must name the removed legacy link.`);
  assert(text.includes("Updex refuses while"), `${page.route} must state that Updex refuses removal of a merged extension without --force.`);
  assert(text.includes("Updex v2.0.4 and later have this check"), `${page.route} must state that Updex v2.0.4 has the removal guard.`);
  assert(!text.includes("does not have this check yet"), `${page.route} must not say that the released Updex lacks the removal guard.`);
  assert(text.includes("Updex v2.0.3 and older do not"), `${page.route} must state that Updex v2.0.3 lacks the removal guard.`);
  assert(html.includes("https://github.com/frostyard/updex/releases/tag/v2.0.4"), `${page.route} must link the Updex v2.0.4 release.`);
  assert(text.includes("Removing requires --force and a reboot to take effect"), `${page.route} must quote the refusal message for a merged extension.`);
  assert(text.includes("they remove the extension at once"), `${page.route} must state that older Updex removes a merged extension at once.`);
  assert(text.includes("updex catalog remove has it"), `${page.route} must cover the catalog remove guard.`);
  assert(text.includes("only sets Enabled=false"), `${page.route} must explain plain disable.`);
  assert(text.includes("keeps running"), `${page.route} must state that plain disable leaves the daemon running.`);
  assert(text.includes("one row for each enabled feature"), `${page.route} must describe features check.`);
  assert(text.includes("has no row") && text.includes("a missing row does not mean"), `${page.route} must explain the disabled-feature no-row result.`);
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
