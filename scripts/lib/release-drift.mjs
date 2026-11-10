export const REPO_PATTERN = /^[A-Za-z0-9][A-Za-z0-9_.-]*\/[A-Za-z0-9][A-Za-z0-9_.-]*$/;
export const TAG_PATTERN = /^v[0-9]+\.[0-9]+\.[0-9]+$/;

function frontmatter(text) {
  const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/);
  if (lines[0] !== "---") return { lines: [], body: text };
  const end = lines.indexOf("---", 1);
  if (end < 0) {
    if (lines.some(line => /^follows\s*:/.test(line))) throw new Error("Malformed follows: unclosed frontmatter");
    return { lines: [], body: text };
  }
  return { lines: lines.slice(1, end), body: lines.slice(end + 1).join("\n") };
}

/** Read only the supported block-mapping form, not general YAML. */
export function readFollows(text) {
  const { lines } = frontmatter(text);
  const starts = lines.flatMap((line, index) => /^follows\s*:/.test(line) ? [index] : []);
  if (!starts.length) return null;
  const fail = () => { throw new Error("Malformed follows: use only repo and tag in a two-space block mapping (owner/name and vX.Y.Z)"); };
  if (starts.length !== 1 || lines[starts[0]] !== "follows:") fail();
  const values = {};
  for (let i = starts[0] + 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    if (!/^\s/.test(line)) break;
    const match = line.match(/^  (repo|tag):\s*(?:'([^']*)'|"([^"]*)"|([^\s'"{}\[\]]+))\s*$/);
    if (!match || Object.hasOwn(values, match[1])) fail();
    values[match[1]] = match[2] ?? match[3] ?? match[4];
  }
  if (!REPO_PATTERN.test(values.repo ?? "") || !TAG_PATTERN.test(values.tag ?? "")) fail();
  return { repo: values.repo, tag: values.tag };
}

export function statedVersion(text) {
  return frontmatter(text).body.match(/(?:\bguide\s+follows\s+\S+\s+|\bThe\s+latest\s+release\s+is\s+)(v[0-9]+\.[0-9]+\.[0-9]+)(?![0-9A-Za-z+-]|\.[0-9])/)?.[1] ?? null;
}

export function compareTags(a, b) {
  if (!TAG_PATTERN.test(a) || !TAG_PATTERN.test(b)) throw new Error("Expected release tags in vX.Y.Z form");
  const left = a.slice(1).split(".").map(BigInt);
  const right = b.slice(1).split(".").map(BigInt);
  for (let i = 0; i < 3; i++) {
    if (left[i] !== right[i]) return left[i] < right[i] ? -1 : 1;
  }
  return 0;
}

export function driftStatus(follows, latest) {
  const order = compareTags(follows.tag, latest);
  return order === 0 ? "OK" : order < 0 ? "BEHIND" : "AHEAD";
}

/** Rows contain page, follows (a tag), latest, and status. */
export function formatReport(rows) {
  if (!rows.length) return "";
  const keys = ["page", "follows", "latest", "status"];
  const widths = keys.map(key => Math.max(...rows.map(row => row[key].length)));
  return rows.map(row => keys.map((key, i) => i === 3 ? row[key] : row[key].padEnd(widths[i])).join("  ")).join("\n");
}

export function parseLatestRelease(json) {
  if (!json || json.draft === true || json.prerelease === true || !TAG_PATTERN.test(json.tag_name ?? "")) {
    throw new Error("Latest published release must have a vX.Y.Z tag");
  }
  return json.tag_name;
}

export function releaseHttpError(repo, status, remaining) {
  if ((status === 403 || status === 429) && remaining === "0") {
    return `${repo}: GitHub rate limit reached (HTTP ${status}); set GITHUB_TOKEN or wait for the limit to reset`;
  }
  if (status === 404) return `${repo}: no published release found (HTTP 404)`;
  return `${repo}: GitHub release request failed (HTTP ${status})`;
}
