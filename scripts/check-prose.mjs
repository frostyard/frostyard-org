// Fails when a docs page uses a banned phrase from scripts/prose-rules.json.
// The rules and the reasons for them are in docs/agents/skills/docs-voice.md.
import { readFile, readdir } from "node:fs/promises";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const docsDir = join(root, "src/content/docs");
const { rules } = JSON.parse(await readFile(join(root, "scripts/prose-rules.json"), "utf8"));
const compiled = rules.map((rule) => ({ ...rule, regex: new RegExp(rule.pattern, "giu") }));

async function pages(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return pages(path);
    return /\.mdx?$/.test(entry.name) ? [path] : [];
  }));
  return nested.flat();
}

// Returns the prose of each line, or null for lines that are not checked:
// fenced code, MDX imports, and the "Sources" section (provenance lives there).
export function proseLines(source) {
  let fence = null;
  let inSources = false;
  return source.split("\n").map((line) => {
    const fenceMatch = line.match(/^\s*(```|~~~)/);
    if (fence) {
      if (fenceMatch && fenceMatch[1] === fence) fence = null;
      return null;
    }
    if (fenceMatch) {
      fence = fenceMatch[1];
      return null;
    }
    const heading = line.match(/^(#{1,6})\s+(.*)$/);
    if (heading && heading[1].length <= 2) inSources = /^sources$/i.test(heading[2].trim());
    if (inSources || /^import\s/.test(line)) return null;
    return line
      .replace(/`[^`]*`/g, " ")
      .replace(/\]\([^)]*\)/g, "]")
      .replace(/\bhref="[^"]*"/g, " ")
      .replace(/https?:\/\/\S+/g, " ");
  });
}

export function findings(source) {
  const found = [];
  proseLines(source).forEach((line, index) => {
    if (line === null) return;
    for (const rule of compiled) {
      for (const match of line.matchAll(rule.regex)) {
        found.push({ line: index + 1, phrase: match[0], kind: rule.kind, use: rule.use });
      }
    }
  });
  return found;
}

// Self-test: the check must catch a banned phrase in prose and skip code and Sources.
const sample = [
  "The pinned sources do not contain a test record.",
  "`ensure` in code is fine.",
  "```bash",
  "leverage --now",
  "```",
  "## Sources",
  "- pinned commit evidence",
].join("\n");
const sampleFound = findings(sample).map((item) => item.line);
if (sampleFound.length === 0 || sampleFound.some((line) => line !== 1)) {
  throw new Error(`check-prose self-test failed: ${JSON.stringify(findings(sample))}`);
}

let failures = 0;
for (const file of (await pages(docsDir)).sort()) {
  const source = await readFile(file, "utf8");
  for (const item of findings(source)) {
    failures += 1;
    console.error(`${relative(root, file)}:${item.line}: "${item.phrase}" (${item.kind}). ${item.use}`);
  }
}

if (failures > 0) {
  console.error(`\ncheck-prose: ${failures} banned phrase(s). See docs/agents/skills/docs-voice.md.`);
  process.exit(1);
}
console.log("check-prose: no banned phrases in src/content/docs.");
