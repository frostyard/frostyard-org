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

// The rows of the section's table, and the errors in them. The first "|" line is
// the header, and the line below it is the separator.
export function inventoryTable(text) {
  const rows = [];
  const errors = [];
  let headerSeen = false;
  for (const line of inventorySection(text)) {
    if (!line.startsWith("|")) continue;
    const cells = cellsOf(line);
    if (!headerSeen) {
      headerSeen = true;
      continue;
    }
    if (cells.every((cell) => /^:?-+:?$/.test(cell))) continue;
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
