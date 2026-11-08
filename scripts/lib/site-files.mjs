// File helpers for the site check. They take directory URLs and return plain
// file system paths. A URL's pathname is percent-encoded, so a checkout path
// with a space or a non-ASCII character must go through fileURLToPath, never
// through URL.pathname or a `file://` template (frostyard-org#92).
import { readdir } from "node:fs/promises";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

// Every .html file under the directory URL, as decoded file system paths.
export async function htmlFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(entry => {
    if (entry.isDirectory()) return htmlFiles(new URL(`${encodeURIComponent(entry.name)}/`, directory));
    return entry.name.endsWith(".html") ? [join(fileURLToPath(directory), entry.name)] : [];
  }));
  return nested.flat();
}

// The page name of a built file, as the site check shows it in a message:
// the path relative to the dist directory URL, with a leading slash.
export function pageName(dist, file) {
  return `/${relative(fileURLToPath(dist), file)}`;
}
