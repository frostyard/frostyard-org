import assert from "node:assert/strict";
import { copyFile, mkdir, mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { pathToFileURL } from "node:url";

const repository = "https://repository.frostyard.org/ext/";

test("sync omits retired readd while retaining notesd from the published index", async (t) => {
  const root = await mkdtemp(join(tmpdir(), "sync-extensions-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  // A disposable copy runs the real generator without rewriting the tracked snapshot.
  const script = join(root, "scripts", "sync-extensions.mjs");
  await mkdir(join(root, "scripts"));
  for (const name of ["extension-versions.mjs", "sync-extensions.mjs"]) {
    await copyFile(new URL(`../${name}`, import.meta.url), join(root, "scripts", name));
  }
  t.mock.method(globalThis, "fetch", async (url) => {
    if (url === `${repository}index`) return new Response("notesd\r\n readd \r\n");
    return new Response(null, { status: 404 });
  });

  await import(pathToFileURL(script).href);

  const snapshot = JSON.parse(await readFile(join(root, "src", "data", "extensions.json"), "utf8"));
  assert.deepEqual(snapshot.extensions, [{ name: "notesd", label: "Frostnotes notesd", version: null }]);
});
