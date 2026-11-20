import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const snapshots = ["src/data/extensions.json", "src/data/problem-stats.json"];

export function checkSnapshots(root) {
  const errors = [];
  for (const path of snapshots) {
    try {
      const git = (...args) => execFileSync("git", args, { cwd: root, stdio: ["ignore", "pipe", "pipe"] });
      const committed = git("show", `HEAD:${path}`);
      const staged = git("show", `:${path}`);
      const working = readFileSync(join(root, path));
      if (!committed.equals(staged)) errors.push(`${path}: staged snapshot differs from HEAD`);
      if (!committed.equals(working)) errors.push(`${path}: working snapshot differs from HEAD`);
    } catch (error) {
      errors.push(`${path}: cannot read the tracked snapshot in HEAD, the index, or the working tree: ${error.message}`);
    }
  }
  return { checkedCount: snapshots.length, errors };
}

function main(args) {
  if (args.length && (args.length !== 2 || args[0] !== "--root")) {
    throw new Error("usage: node scripts/check-snapshots.mjs [--root DIR]");
  }
  const root = args.length ? resolve(args[1]) : fileURLToPath(new URL("..", import.meta.url));
  const result = checkSnapshots(root);
  for (const error of result.errors) console.error(`FAIL: ${error}`);
  console.log(`check-snapshots: checked ${result.checkedCount} snapshots against HEAD (index and working tree).`);
  if (result.errors.length) process.exitCode = 1;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    main(process.argv.slice(2));
  } catch (error) {
    console.error(`check-snapshots: ${error.message}`);
    process.exitCode = 1;
  }
}
