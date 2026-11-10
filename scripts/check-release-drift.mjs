// Compare the release each app and tool guide follows with the latest release.
//
// A page names the release it follows in its `follows` frontmatter
// ({ repo, tag }). This script asks the GitHub API for each repository's
// latest published release and prints 1 line per page: the page, its tag, the
// latest tag, and OK, BEHIND or AHEAD. It needs the network, so CI does not run
// it; `npm test` checks without the network that `follows` matches the page.
// Exit codes: 0 all OK, 1 a page is behind or ahead, 2 an error or no
// tracked page.
import { readdir, readFile } from "node:fs/promises";
import { resolve, relative, join } from "node:path";
import { readFollows, driftStatus, formatReport, parseLatestRelease, releaseFetchError, releaseHttpError } from "./lib/release-drift.mjs";

const TIMEOUT_SECONDS = 15;

async function pages(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const found = await Promise.all(entries.map(entry => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? pages(path) : /\.mdx?$/.test(entry.name) ? [path] : [];
  }));
  return found.flat().sort();
}

async function main() {
  const root = process.cwd();
  const tracked = [];
  for (const section of ["apps", "tools"]) {
    for (const path of await pages(resolve(root, "src/content/docs/docs", section))) {
      const page = relative(root, path);
      try {
        const follows = readFollows(await readFile(path, "utf8"));
        if (follows) tracked.push({ page, follows });
      } catch (error) {
        throw new Error(`${page}: ${error.message}`);
      }
    }
  }
  if (!tracked.length) throw new Error("No app or tool page carries follows frontmatter: nothing to check");
  const releases = new Map();
  for (const { follows: { repo } } of tracked) {
    if (releases.has(repo)) continue;
    const headers = { accept: "application/vnd.github+json", "user-agent": "frostyard-release-drift" };
    if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
    try {
      const response = await fetch(`https://api.github.com/repos/${repo}/releases/latest`, {
        headers, signal: AbortSignal.timeout(TIMEOUT_SECONDS * 1000),
      });
      if (!response.ok) throw new Error(releaseHttpError(repo, response.status, response.headers.get("x-ratelimit-remaining")));
      releases.set(repo, parseLatestRelease(await response.json()));
    } catch (error) {
      throw new Error(releaseFetchError(repo, error, TIMEOUT_SECONDS));
    }
  }
  const rows = tracked.map(({ page, follows }) => {
    const latest = releases.get(follows.repo);
    return { page, follows: follows.tag, latest, status: driftStatus(follows, latest) };
  });
  const failing = rows.filter(row => row.status !== "OK").length;
  console.log(formatReport(rows));
  console.log(`Checked ${rows.length} pages against ${releases.size} repositories: ${failing} not OK.`);
  process.exitCode = failing ? 1 : 0;
}

main().catch(error => {
  console.error(error.message);
  process.exitCode = 2;
});
