import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { pathToFileURL } from "node:url";

import { htmlFiles, pageName } from "../lib/site-files.mjs";

// frostyard-org#92: a checkout path with a space or a non-ASCII character
// must not break the site check. A URL pathname is percent-encoded, so the
// helpers must give decoded file system paths.
async function fixtureDist() {
  const root = await mkdtemp(join(tmpdir(), "check site é-"));
  const dist = join(root, "dist", "client");
  await mkdir(join(dist, "docs", "naïve page"), { recursive: true });
  await writeFile(join(dist, "index.html"), "<h1>home</h1>");
  await writeFile(join(dist, "docs", "naïve page", "index.html"), "<h1>nested</h1>");
  await writeFile(join(dist, "docs", "notes.txt"), "not a page");
  return { root, distUrl: pathToFileURL(`${dist}/`) };
}

test("htmlFiles lists readable paths under a directory with a space and a non-ASCII name", async () => {
  const { root, distUrl } = await fixtureDist();
  try {
    const files = await htmlFiles(distUrl);

    assert.equal(files.length, 2);
    for (const file of files) {
      assert.match(file, /check site é-/);
      assert.match(await readFile(file, "utf8"), /<h1>/);
    }
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("pageName gives the decoded page path relative to dist", async () => {
  const { root, distUrl } = await fixtureDist();
  try {
    const pages = (await htmlFiles(distUrl)).map(file => pageName(distUrl, file)).sort();

    assert.deepEqual(pages, ["/docs/naïve page/index.html", "/index.html"]);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
