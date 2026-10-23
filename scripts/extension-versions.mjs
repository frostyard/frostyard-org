// Version selection for the extension catalog.
//
// A published SHA256SUMS lists every kept image of one extension, in no fixed
// order. The catalog must show the newest one, so the file names are compared
// in Debian version order (dpkg's verrevcmp): epoch, then upstream version,
// then Debian revision. A snosi `+rN` suffix sorts after the same version
// without it, because "+" sorts after the end of a string.

// dpkg's order for one character: "~" first, then the end of the string and
// digits, then letters, then every other character.
function order(character) {
  if (character === undefined) return 0;
  if (character === "~") return -1;
  if (/[0-9]/.test(character)) return 0;
  if (/[A-Za-z]/.test(character)) return character.charCodeAt(0);
  return character.charCodeAt(0) + 256;
}

function compareFragment(a, b) {
  let i = 0;
  let j = 0;
  while (i < a.length || j < b.length) {
    let firstDifference = 0;
    while ((i < a.length && !/[0-9]/.test(a[i])) || (j < b.length && !/[0-9]/.test(b[j]))) {
      const difference = order(a[i]) - order(b[j]);
      if (difference) return difference;
      i += 1;
      j += 1;
    }
    while (a[i] === "0") i += 1;
    while (b[j] === "0") j += 1;
    while (/[0-9]/.test(a[i] ?? "") && /[0-9]/.test(b[j] ?? "")) {
      if (!firstDifference) firstDifference = a.charCodeAt(i) - b.charCodeAt(j);
      i += 1;
      j += 1;
    }
    if (/[0-9]/.test(a[i] ?? "")) return 1;
    if (/[0-9]/.test(b[j] ?? "")) return -1;
    if (firstDifference) return firstDifference;
  }
  return 0;
}

function parseVersion(version) {
  const colon = version.indexOf(":");
  const epoch = colon >= 0 && /^[0-9]+$/.test(version.slice(0, colon)) ? Number(version.slice(0, colon)) : 0;
  const rest = colon >= 0 && /^[0-9]+$/.test(version.slice(0, colon)) ? version.slice(colon + 1) : version;
  const hyphen = rest.lastIndexOf("-");
  return hyphen >= 0
    ? { epoch, upstream: rest.slice(0, hyphen), revision: rest.slice(hyphen + 1) }
    : { epoch, upstream: rest, revision: "" };
}

/** Compare two versions in Debian order. Returns <0, 0, or >0. */
export function compareDebianVersions(a, b) {
  const left = parseVersion(a);
  const right = parseVersion(b);
  if (left.epoch !== right.epoch) return left.epoch - right.epoch;
  return compareFragment(left.upstream, right.upstream) || compareFragment(left.revision, right.revision);
}

function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** All versions of `name` that a SHA256SUMS text lists. */
export function listedVersions(name, sums) {
  const pattern = new RegExp(`^${escapeRegExp(name)}_@?v?_?([^_\\s]+)`);
  return sums
    .split(/\r?\n/)
    .map(line => line.trim().split(/\s+/).at(-1)?.replace(/^\*/, "") ?? "")
    .map(filename => filename.match(pattern)?.[1])
    .filter(Boolean);
}

/** The newest version of `name` in a SHA256SUMS text, or null. */
export function newestVersion(name, sums) {
  const versions = listedVersions(name, sums);
  if (!versions.length) return null;
  return versions.reduce((newest, version) => (compareDebianVersions(version, newest) > 0 ? version : newest));
}
