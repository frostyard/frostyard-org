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

function routeFile(pathname) {
  if (pathname === "/") return new URL("index.html", dist);
  return new URL(`${pathname.replace(/^\/|\/$/g, "")}/index.html`, dist);
}

await Promise.all(["install", "sundog"].map(route => access(routeFile(`/${route}`))));
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

const home = await readFile(routeFile("/"), "utf8");
assert((home.match(/class="image-card"/g) || []).length === 4, "Home must render exactly four product cards.");
for (const route of ["/base", "/snow", "/snowfield", "/sundog", "/floe"]) {
  assert(home.includes(`href="${route}"`), `Home must render a link to ${route}.`);
}
assert(home.includes("Four bootc products"), "Home must identify the four bootc products.");
assert(home.includes("bootc only"), "Home must identify Sundog as bootc-only.");
assert(home.includes("Base feeds Floe, Snow, and Sundog"), "Home composition alternative must name all direct products.");
assert(home.includes("September 30, 2026"), "Home must keep the lifecycle boundary discoverable.");
assert(home.includes('<details class="mobile-nav">'), "Shared navigation must include the native mobile disclosure.");
assert(!home.includes("live catalog"), "Home must describe the catalog as a checked snapshot.");

const install = await readFile(routeFile("/install"), "utf8");
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

const tools = await readFile(routeFile("/tools"), "utf8");
assert(tools.includes("sudo updex features enable &lt;feature&gt; --now"), "Tools must use current Updex syntax.");

const redirects = await readFile(new URL("_redirects", dist), "utf8");
assert(/^\/cayo\s+\/floe\s+301$/m.test(redirects), "/cayo must remain a permanent redirect to /floe.");

console.log(`Checked ${files.length} built pages and their internal routes.`);
