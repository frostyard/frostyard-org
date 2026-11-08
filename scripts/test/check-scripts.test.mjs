import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { copyFile, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { test } from "node:test";

async function fixtureDir() {
  return mkdtemp(join(tmpdir(), "check-scripts-"));
}

async function copyScripts(root, names) {
  const scriptsDir = join(root, "scripts");
  await mkdir(scriptsDir, { recursive: true });
  for (const name of names) {
    const target = join(scriptsDir, name);
    await mkdir(dirname(target), { recursive: true });
    await copyFile(new URL(`../${name}`, import.meta.url), target);
  }
  return scriptsDir;
}

function run(script, root) {
  return spawnSync(process.execPath, [script], { cwd: root, encoding: "utf8" });
}

test("check-prose fails when the docs directory has no pages", async () => {
  const root = await fixtureDir();
  try {
    const scriptsDir = await copyScripts(root, ["check-prose.mjs", "prose-rules.json"]);
    await mkdir(join(root, "src/content/docs"), { recursive: true });

    const result = run(join(scriptsDir, "check-prose.mjs"), root);

    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /no \.md or \.mdx pages/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("check-prose passes a clean page", async () => {
  const root = await fixtureDir();
  try {
    const scriptsDir = await copyScripts(root, ["check-prose.mjs", "prose-rules.json"]);
    const docsDir = join(root, "src/content/docs");
    await mkdir(docsDir, { recursive: true });
    await writeFile(join(docsDir, "index.md"), "Enable the extension.");

    const result = run(join(scriptsDir, "check-prose.mjs"), root);

    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /checked 1 pages/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("check-prose reports a banned phrase and file name", async () => {
  const root = await fixtureDir();
  try {
    const scriptsDir = await copyScripts(root, ["check-prose.mjs", "prose-rules.json"]);
    const docsDir = join(root, "src/content/docs");
    await mkdir(docsDir, { recursive: true });
    await writeFile(join(docsDir, "index.md"), "Leverage the extension.");

    const result = run(join(scriptsDir, "check-prose.mjs"), root);

    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /index\.md:1: "Leverage"/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("the committed problem report schema copy is the pinned byte copy", async () => {
  const pin = JSON.parse(await readFile(new URL("../../src/data/problem-report-schema-pin.json", import.meta.url), "utf8"));
  const copy = await readFile(new URL("../../public/schemas/problem-report/v1.json", import.meta.url));

  assert.equal(createHash("sha256").update(copy).digest("hex"), pin.sha256);
  assert.equal(JSON.parse(copy.toString("utf8")).$id, "https://frostyard.org/schemas/problem-report/v1.json");
});

test("check-site fails when dist/client is empty", async () => {
  const root = await fixtureDir();
  try {
    const scriptsDir = await copyScripts(root, ["check-site.mjs", "lib/problem-page-checks.mjs", "lib/site-files.mjs"]);
    await mkdir(join(root, "dist/client"), { recursive: true });

    const result = run(join(scriptsDir, "check-site.mjs"), root);

    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /no built HTML pages in dist\/client/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("check-site fails when dist/client has only a non-HTML file", async () => {
  const root = await fixtureDir();
  try {
    const scriptsDir = await copyScripts(root, ["check-site.mjs", "lib/problem-page-checks.mjs", "lib/site-files.mjs"]);
    await mkdir(join(root, "dist/client"), { recursive: true });
    await writeFile(join(root, "dist/client/_redirects"), "/cayo /floe 301\n");

    const result = run(join(scriptsDir, "check-site.mjs"), root);

    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /no built HTML pages in dist\/client/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("check-site fails when dist is missing", async () => {
  const root = await fixtureDir();
  try {
    const scriptsDir = await copyScripts(root, ["check-site.mjs", "lib/problem-page-checks.mjs", "lib/site-files.mjs"]);

    const result = run(join(scriptsDir, "check-site.mjs"), root);

    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /no built HTML pages in dist\/client/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
