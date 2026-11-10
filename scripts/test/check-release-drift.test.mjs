import test from "node:test";
import assert from "node:assert/strict";
import { readdir, readFile, mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { readFollows, statedVersion, compareTags, driftStatus, formatReport, parseLatestRelease, releaseHttpError } from "../lib/release-drift.mjs";

const block = inner => `---\ntitle: Test\n${inner}\n---\n`;
const follows = { repo: "frostyard/nsl", tag: "v0.13.0" };

test("readFollows accepts the plain and quoted block mapping", () => {
  for (const quote of ["", "'", '"']) {
    assert.deepEqual(readFollows(block(`follows:\n  repo: ${quote}frostyard/nsl${quote}\n  tag: ${quote}v0.13.0${quote}`)), follows);
  }
  assert.equal(readFollows(block("description: No release")), null);
  assert.equal(readFollows("No frontmatter\nfollows:\n  repo: example/repo"), null);
});

test("readFollows rejects malformed mappings", () => {
  for (const inner of [
    "follows:",
    "follows:\n  repo: frostyard/nsl",
    "follows:\n  tag: v0.13.0",
    "follows:\n  repo: frostyard/nsl\n  tag: v0.13.0\n  extra: value",
    "follows:\n  repo: bad repo\n  tag: v0.13.0",
    "follows:\n  repo: ../nsl\n  tag: v0.13.0",
    "follows:\n  repo: frostyard/nsl\n  tag: 0.13.0",
    "follows:\n  repo: frostyard/nsl\n  tag: v0.13.0-rc1",
    "follows: { repo: frostyard/nsl, tag: v0.13.0 }",
    "follows:\n    repo: frostyard/nsl\n    tag: v0.13.0",
    "follows:\n  repo: frostyard/nsl\n  tag: v0.13.0\n  tag: v0.14.0",
    "follows:\nfollows:\n  repo: frostyard/nsl\n  tag: v0.13.0",
    "follows:\n  repo: 'frostyard/nsl\n  tag: v0.13.0",
  ]) assert.throws(() => readFollows(block(inner)), /Malformed follows/);
  assert.throws(() => readFollows("---\nfollows:\n"), /unclosed frontmatter/);
});

test("statedVersion reads release sentences, including wrapped sentences", () => {
  assert.equal(statedVersion("This guide follows nsl v0.13.0; see docs."), "v0.13.0");
  assert.equal(statedVersion("This\nguide follows ChairLift\nv0.13.0."), "v0.13.0");
  assert.equal(statedVersion("The latest release is v2.2.0."), "v2.2.0");
  assert.equal(statedVersion(block('description: "The latest release is v1.0.0"') + "No release sentence."), null);
  assert.equal(statedVersion("Install v1.2.3."), null);
  assert.equal(statedVersion("The latest release is v1.2.3-rc1."), null);
});

test("compareTags uses numeric components, including large values", () => {
  assert.equal(compareTags("v1.2.3", "v1.2.3"), 0);
  assert.equal(compareTags("v0.9.0", "v0.13.0"), -1);
  assert.equal(compareTags("v2.0.0", "v1.99.99"), 1);
  assert.equal(compareTags("v1.2.10", "v1.2.9"), 1);
  assert.equal(compareTags("v99999999999999999999.0.0", "v99999999999999999998.0.0"), 1);
  assert.throws(() => compareTags("1.2.3", "v1.2.3"), /vX.Y.Z/);
});

test("driftStatus reports equal, older, and newer page tags", () => {
  assert.equal(driftStatus(follows, "v0.13.0"), "OK");
  assert.equal(driftStatus(follows, "v0.15.0"), "BEHIND");
  assert.equal(driftStatus(follows, "v0.12.0"), "AHEAD");
});

test("formatReport aligns columns with one row per page", () => {
  assert.equal(formatReport([]), "");
  assert.equal(formatReport([
    { page: "a.md", follows: "v1.0.0", latest: "v1.0.0", status: "OK" },
    { page: "long.md", follows: "v0.10.0", latest: "v1.0.0", status: "BEHIND" },
  ]), "a.md     v1.0.0   v1.0.0  OK\nlong.md  v0.10.0  v1.0.0  BEHIND");
});

test("release API parsing rejects invalid or unpublished tags", () => {
  assert.equal(parseLatestRelease({ tag_name: "v1.2.3" }), "v1.2.3");
  for (const value of [null, {}, { tag_name: "latest" }, { tag_name: "v1.2.3", draft: true }, { tag_name: "v1.2.3", prerelease: true }]) {
    assert.throws(() => parseLatestRelease(value), /Latest published release/);
  }
});

test("HTTP errors explain rate limits and missing releases", () => {
  for (const status of [403, 429]) {
    assert.match(releaseHttpError("owner/repo", status, "0"), /owner\/repo: GitHub rate limit.*GITHUB_TOKEN/);
  }
  assert.match(releaseHttpError("owner/repo", 404, null), /no published release.*404/);
  assert.match(releaseHttpError("owner/repo", 500, null), /request failed.*500/);
  assert.doesNotMatch(releaseHttpError("owner/repo", 403, "10"), /rate limit/);
});

async function realPages(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  return (await Promise.all(entries.map(entry => entry.isDirectory()
    ? realPages(join(directory, entry.name))
    : /\.mdx?$/.test(entry.name) ? [join(directory, entry.name)] : []))).flat();
}

test("real app and tool follows tags match their release sentences in both directions", async () => {
  let count = 0;
  for (const section of ["apps", "tools"]) {
    const directory = fileURLToPath(new URL(`../../src/content/docs/docs/${section}/`, import.meta.url));
    for (const path of await realPages(directory)) {
      const text = await readFile(path, "utf8");
      const metadata = readFollows(text);
      const stated = statedVersion(text);
      if (metadata || stated) {
        assert.ok(metadata, `${path}: release sentence needs follows`);
        assert.equal(metadata.tag, stated, `${path}: follows must match the release sentence`);
        count++;
      }
    }
  }
  assert.ok(count > 0, "no app or tool page names a release");
});

test("CLI fails when no page carries follows, without a network request", async () => {
  const root = await mkdtemp(join(tmpdir(), "release-drift-"));
  try {
    for (const section of ["apps", "tools"]) {
      const directory = join(root, "src/content/docs/docs", section);
      await mkdir(directory, { recursive: true });
      await writeFile(join(directory, "page.mdx"), block("title: No release"));
    }
    const result = spawnSync(process.execPath, [fileURLToPath(new URL("../check-release-drift.mjs", import.meta.url))], { cwd: root, encoding: "utf8", timeout: 5000 });
    assert.equal(result.status, 2, result.stderr);
    assert.equal(result.stdout, "");
    assert.match(result.stderr, /No app or tool page carries follows/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
