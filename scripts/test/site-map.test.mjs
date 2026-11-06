// The page inventory in docs/site.md must list every page file, and must not
// name a file that is gone. The table can go stale in 2 ways; this checks both.
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../..", import.meta.url));
const inventoryFile = join(root, "docs/site.md");

const pageDirectories = ["src/pages", "src/content/docs/docs"];
const pageFile = /\.(astro|md|mdx)$/;

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

// A backticked token that ends with "/" names a directory, such as the nested
// docs directory, not a page file.
function backtickedPaths(text) {
  const tokens = [...text.matchAll(/`([^`\n]+)`/g)].map((match) => match[1]);
  return tokens.filter((token) => pageDirectories.some((prefix) => token.startsWith(`${prefix}/`)) && !token.endsWith("/"));
}

// Files that the inventory does not name.
export function filesMissingFromInventory(files, text) {
  const named = new Set(backtickedPaths(text));
  return files.filter((file) => !named.has(file));
}

// Paths that the inventory names and that are not page files.
export function pathsNotOnDisk(files, text) {
  const known = new Set(files);
  return backtickedPaths(text).filter((path) => !known.has(path));
}

test("the inventory lists every page file", async () => {
  const files = (await Promise.all(pageDirectories.map(pageFiles))).flat().sort();
  const text = await readFile(inventoryFile, "utf8");
  assert.deepEqual(filesMissingFromInventory(files, text), [], "docs/site.md must name every page file");
});

test("the inventory names no page file that is gone", async () => {
  const files = (await Promise.all(pageDirectories.map(pageFiles))).flat();
  const text = await readFile(inventoryFile, "utf8");
  assert.deepEqual(pathsNotOnDisk(files, text), [], "docs/site.md must name only files that exist");
});

test("the checks read the file list and the document text", () => {
  const files = ["src/pages/index.astro", "src/content/docs/docs/get-software.md"];
  const fixture = [
    "| File | Route | Covers |",
    "| --- | --- | --- |",
    "| `src/pages/index.astro` | `/` | The landing page. |",
    "| `src/pages/gone.astro` | `/gone/` | A page that no longer exists. |",
  ].join("\n");

  assert.deepEqual(filesMissingFromInventory(files, fixture), ["src/content/docs/docs/get-software.md"]);
  assert.deepEqual(pathsNotOnDisk(files, fixture), ["src/pages/gone.astro"]);
});
