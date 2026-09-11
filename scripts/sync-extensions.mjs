import { mkdir, readFile, writeFile } from "node:fs/promises";

const indexUrl = "https://repository.frostyard.org/ext/index";
const output = new URL("../src/data/extensions.json", import.meta.url);
const labels = {
  "1password": "1Password desktop", "1password-cli": "1Password CLI", azurevpn: "Azure VPN", bitwarden: "Bitwarden", chatgpt: "ChatGPT", "claude-desktop": "Claude Desktop", "code-server": "code-server", coder: "Coder", debdev: "Debian development", dev: "Development tools", docker: "Docker CE", edge: "Microsoft Edge", emdash: "Emdash", "github-copilot": "GitHub Copilot", himmelblau: "Himmelblau", incus: "Incus", k3s: "K3s", lemonade: "Lemonade", localsend: "LocalSend", moonlight: "Moonlight", nix: "Nix", obsidian: "Obsidian", podman: "Podman + Distrobox", sunshine: "Sunshine", tailscale: "Tailscale", vscode: "Visual Studio Code", voxtype: "Voxtype"
};

async function publishedExtensions() {
  const response = await fetch(indexUrl, { signal: AbortSignal.timeout(8000) });
  if (!response.ok) throw new Error(`index returned ${response.status}`);
  const names = (await response.text()).split(/\r?\n/).map(name => name.trim()).filter(Boolean);
  return {
    source: indexUrl,
    updatedAt: new Date().toISOString(),
    extensions: await Promise.all(names.map(async name => {
      let version = null;
      try {
        const response = await fetch(`${indexUrl.replace(/index$/, "")}${name}/SHA256SUMS`, { signal: AbortSignal.timeout(5000) });
        const filename = response.ok && (await response.text()).match(new RegExp(`${name}_@?v?_?([^_\\s]+)`))?.[1];
        version = filename || null;
      } catch { /* A single unavailable checksum must not hide the catalog. */ }
      return { name, label: labels[name] || name, version };
    })),
  };
}

try {
  await mkdir(new URL("../src/data/", import.meta.url), { recursive: true });
  await writeFile(output, `${JSON.stringify(await publishedExtensions(), null, 2)}\n`);
  console.log("Synced published Frostyard system extensions.");
} catch (error) {
  console.warn(`Could not refresh extension catalog (${error.message}); using the committed snapshot.`);
  await readFile(output);
}
