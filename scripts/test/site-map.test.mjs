// The page inventory table in docs/site.md must list every page file, and must
// not name a file that is gone. Only the table rows count: a path in prose or in
// a code block does not list a page.
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../..", import.meta.url));
const inventoryFile = join(root, "docs/site.md");

const pageDirectories = ["src/pages", "src/content/docs/docs"];
const pageFile = /\.(astro|md|mdx)$/;
const sectionHeading = "## Page inventory";
const singleBackticked = /^`([^`\n]+)`$/;

// Every page file, as a path relative to the repository root with "/" separators.
async function pageFiles(directory) {
  const entries = await readdir(join(root, directory), { withFileTypes: true });
  const nested = await Promise.all(entries.map((entry) => {
    const path = `${directory}/${entry.name}`;
    if (entry.isDirectory()) return pageFiles(path);
    return pageFile.test(entry.name) ? [path] : [];
  }));
  return nested.flat();
}

function isPagePath(candidate) {
  return pageFile.test(candidate) && pageDirectories.some((prefix) => candidate.startsWith(`${prefix}/`));
}

// The lines of the "## Page inventory" section: from its heading to the next
// "## " heading, or to the end of the document.
export function inventorySection(text) {
  const lines = text.split("\n");
  const start = lines.findIndex((line) => line.trim() === sectionHeading);
  if (start === -1) return [];
  const rest = lines.slice(start + 1);
  const end = rest.findIndex((line) => /^##\s/.test(line));
  return end === -1 ? rest : rest.slice(0, end);
}

function cellsOf(line) {
  return line.replace(/^\|/, "").replace(/\|\s*$/, "").split("|").map((cell) => cell.trim());
}

const separatorCell = /^:?-+:?$/;

// The fence marker of a line, or null. A fence closes on the same character,
// with at least as many of them.
function fenceRun(line) {
  const match = line.trimStart().match(/^(`{3,}|~{3,})/);
  return match ? match[1] : null;
}

// The rows of the first real table in the section, and the errors in them. A
// table is a "|" line (the header) followed by a separator line. Fenced code
// blocks are ignored, and so is everything after the table's last row.
export function inventoryTable(text) {
  const outside = [];
  let fence = null;
  for (const line of inventorySection(text)) {
    // A fence line, and every line inside a fence, becomes an empty line: it
    // ends a table, as a fence does in rendered Markdown.
    const run = fenceRun(line);
    if (fence) {
      if (run && run[0] === fence[0] && run.length >= fence.length) fence = null;
      outside.push("");
      continue;
    }
    if (run) {
      fence = run;
      outside.push("");
      continue;
    }
    outside.push(line);
  }

  let header = -1;
  for (let index = 0; index + 1 < outside.length; index += 1) {
    const line = outside[index];
    const next = outside[index + 1];
    if (!line.startsWith("|") || !next.startsWith("|")) continue;
    if (cellsOf(next).every((cell) => separatorCell.test(cell))) {
      header = index;
      break;
    }
  }
  if (header === -1) return { rows: [], errors: ["no Page inventory table"] };

  const rows = [];
  const errors = [];
  for (const line of outside.slice(header + 2)) {
    if (!line.startsWith("|")) break;
    const cells = cellsOf(line);
    const path = (cells[0] ?? "").match(singleBackticked)?.[1];
    const route = (cells[1] ?? "").match(singleBackticked)?.[1];
    if (path === undefined || !isPagePath(path)) {
      errors.push(`the first cell must be 1 backticked page path: ${line.trim()}`);
      continue;
    }
    if (route === undefined || !route.startsWith("/")) {
      errors.push(`the row for ${path} needs 1 backticked route: ${line.trim()}`);
      continue;
    }
    rows.push({ path, route, line: line.trim() });
  }
  return { rows, errors };
}

// Page files that the table does not list.
export function filesMissingFromInventory(files, text) {
  const listed = new Set(inventoryTable(text).rows.map((row) => row.path));
  return files.filter((file) => !listed.has(file));
}

// Page paths that the table lists and that are not page files.
export function pathsNotOnDisk(files, text) {
  const known = new Set(files);
  return inventoryTable(text).rows.map((row) => row.path).filter((path) => !known.has(path));
}

async function readInventory() {
  const files = (await Promise.all(pageDirectories.map(pageFiles))).flat().sort();
  const text = await readFile(inventoryFile, "utf8");
  return { files, text, table: inventoryTable(text) };
}

test("the inventory table lists every page file", async (t) => {
  const { files, text, table } = await readInventory();
  t.diagnostic(`site-map: ${files.length} page files, ${table.rows.length} inventory rows`);
  assert.deepEqual(table.errors, [], "every Page inventory row must name 1 page path and 1 route");
  assert.deepEqual(filesMissingFromInventory(files, text), [], "docs/site.md must list every page file");
  assert.ok(files.length > 0, "the repository must have page files");
  assert.ok(table.rows.length > 0, "docs/site.md must have Page inventory rows");
  assert.equal(table.rows.length, files.length, "every page file needs exactly 1 row");
});

test("the inventory table names no page file that is gone", async () => {
  const { files, text } = await readInventory();
  assert.deepEqual(pathsNotOnDisk(files, text), [], "docs/site.md must name only files that exist");
});

test("only the table rows count, and they must be well formed", () => {
  const files = [
    "src/pages/index.astro",
    "src/content/docs/docs/get-software.md",
    "src/content/docs/docs/sysexts/x.mdx",
  ];
  const fixture = [
    "## How the docs are built",
    "",
    "The docs content lives in `src/content/docs/docs/`.",
    "",
    "```sh",
    "ls src/content/docs/docs/get-software.md",
    "```",
    "",
    sectionHeading,
    "",
    "| File | Route | Covers |",
    "| --- | --- | --- |",
    "| `src/pages/index.astro` | `/` | The landing page. |",
    "| `src/pages/gone.astro` | `/gone/` | A page that is gone. |",
    "",
    "## After the table",
    "",
    "`src/pages/after.astro` is named here only.",
  ].join("\n");

  const table = inventoryTable(fixture);
  assert.deepEqual(table.errors, [], "a directory reference outside the table is not a row");
  assert.deepEqual(table.rows.map((row) => [row.path, row.route]), [
    ["src/pages/index.astro", "/"],
    ["src/pages/gone.astro", "/gone/"],
  ]);
  assert.deepEqual(
    filesMissingFromInventory(files, fixture),
    ["src/content/docs/docs/get-software.md", "src/content/docs/docs/sysexts/x.mdx"],
    "a path in prose, in a code block, or after the next heading must not hide a missing row",
  );
  assert.deepEqual(pathsNotOnDisk(files, fixture), ["src/pages/gone.astro"]);

  const broken = [
    sectionHeading,
    "",
    "| File | Route | Covers |",
    "| --- | --- | --- |",
    "| src/pages/index.astro | `/` | No backticks around the path. |",
    "| `src/pages/base.astro` | base | No backticks around the route. |",
  ].join("\n");
  assert.equal(inventoryTable(broken).errors.length, 2, "a row with no page path or no route is an error");
  assert.deepEqual(inventoryTable(broken).rows, []);
});

test("the parser reads only the first real table outside fences", () => {
  const files = ["src/pages/index.astro", "src/content/docs/docs/get-software.md"];
  const header = ["| File | Route | Covers |", "| --- | --- | --- |"];
  const row = (path, route) => `| \`${path}\` | \`${route}\` | A page. |`;

  // The missing row sits in a fenced block right after the real table.
  const fencedAfter = [
    sectionHeading,
    "",
    ...header,
    row("src/pages/index.astro", "/"),
    "",
    "```text",
    row("src/content/docs/docs/get-software.md", "/docs/get-software/"),
    "```",
  ].join("\n");
  assert.deepEqual(inventoryTable(fencedAfter).rows.map((entry) => entry.path), ["src/pages/index.astro"]);
  assert.deepEqual(
    filesMissingFromInventory(files, fencedAfter),
    ["src/content/docs/docs/get-software.md"],
    "a row inside a fenced block must not hide a missing page",
  );

  // A second table after a blank line is not part of the first table.
  const secondTable = [
    sectionHeading,
    "",
    ...header,
    row("src/pages/index.astro", "/"),
    "",
    ...header,
    row("src/content/docs/docs/get-software.md", "/docs/get-software/"),
  ].join("\n");
  assert.deepEqual(inventoryTable(secondTable).rows.map((entry) => entry.path), ["src/pages/index.astro"]);
  assert.deepEqual(filesMissingFromInventory(files, secondTable), ["src/content/docs/docs/get-software.md"]);

  // A fenced table before the real table is not the table.
  const fencedBefore = [
    sectionHeading,
    "",
    "~~~",
    ...header,
    row("src/content/docs/docs/get-software.md", "/docs/get-software/"),
    "~~~",
    ...header,
    row("src/pages/index.astro", "/"),
  ].join("\n");
  assert.deepEqual(inventoryTable(fencedBefore).rows.map((entry) => entry.path), ["src/pages/index.astro"]);

  // A fence right after the last row ends the table, also with no blank line,
  // and a "|" line after the closing fence does not join it.
  const fenceThenRow = [
    sectionHeading,
    "",
    ...header,
    row("src/pages/index.astro", "/"),
    "```",
    "text",
    "```",
    row("src/content/docs/docs/get-software.md", "/docs/get-software/"),
  ].join("\n");
  assert.deepEqual(inventoryTable(fenceThenRow).rows.map((entry) => entry.path), ["src/pages/index.astro"]);

  // A fenced table and no real table is an error.
  const fencedOnly = [sectionHeading, "", "```", ...header, row("src/pages/index.astro", "/"), "```"].join("\n");
  assert.deepEqual(inventoryTable(fencedOnly), { rows: [], errors: ["no Page inventory table"] });
  assert.deepEqual(inventoryTable(`${sectionHeading}\n\nSee \`src/pages/index.astro\`.`).errors, ["no Page inventory table"]);
});
