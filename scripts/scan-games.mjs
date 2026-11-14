// Scans game files for risky or suspicious code.
//
// This is a tripwire, not a guarantee: it looks for patterns, and code can be written to
// hide from it. Errors fail the PR; warnings only point a human reviewer at what to look at.
//
// Usage:
//   node scripts/scan-games.mjs                 scan every game
//   node scripts/scan-games.mjs <base-commit>   scan only files changed since <base-commit>
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const base = process.argv[2];
const MAX_GAME_BYTES = 5 * 1024 * 1024;
const ALLOWED_EXT = new Set([".html", ".js", ".css", ".json", ".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg",
  ".mp3", ".ogg", ".wav", ".woff", ".woff2", ".txt", ".md"]);
const TEXT_EXT = new Set([".html", ".js", ".css", ".svg", ".json"]);
// Sites a game may load from. www.w3.org only appears in SVG/XML namespace strings.
const ALLOWED_HOSTS = new Set(["cdnjs.cloudflare.com", "cdn.jsdelivr.net", "unpkg.com",
  "fonts.googleapis.com", "fonts.gstatic.com", "www.w3.org"]);

// [level, pattern, what it means]
const RULES = [
  // Running code built from strings: the usual way to hide what a script does
  ["error", /\beval\s*\(/g, "eval() runs code built from strings"],
  ["error", /\bnew\s+Function\s*\(/g, "new Function() runs code built from strings"],
  ["error", /\bset(?:Timeout|Interval)\s*\(\s*["'`]/g, "setTimeout/setInterval with a string runs code built from strings"],
  // Reaching outside the game
  ["error", /document\.cookie/g, "reads or writes cookies"],
  ["error", /\b(?:window\.)?(?:parent|top|opener)\s*\.\s*(?:document|location|localStorage|sessionStorage|SLOP_GAMES)/g,
    "reaches outside the game into the arcade page"],
  ["error", /serviceWorker/g, "registers a service worker, which could take over every page of the site"],
  // Sending data somewhere
  ["error", /\b(?:WebSocket|EventSource|RTCPeerConnection|sendBeacon)\b/g, "opens a network connection"],
  ["error", /type\s*=\s*["']?password/gi, "has a password field"],
  ["error", /<form\b[^>]*\baction\s*=/gi, "has a form that sends data somewhere"],
  ["error", /<(?:object|embed|applet)\b/gi, "embeds a plugin or external object"],
  // Worth a human look, but often harmless
  ["warn", /\bfetch\s*\(|XMLHttpRequest/g, "makes network requests (fine if it only loads the game's own files)"],
  ["warn", /\bimport\s*\(/g, "loads code dynamically"],
  ["warn", /<iframe\b/gi, "embeds another page"],
  ["warn", /window\.open\s*\(|\blocation(?:\.href)?\s*=(?!=)|location\.(?:assign|replace)\s*\(/g, "opens or navigates to another page"],
  ["warn", /navigator\.(?:geolocation|mediaDevices|clipboard|credentials)|getUserMedia/g, "asks for device or personal access"],
  ["warn", /String\.fromCharCode|\batob\s*\(|(?:\\x[0-9a-fA-F]{2}){20,}|(?:\\u[0-9a-fA-F]{4}){20,}/g, "decodes hidden strings (possible obfuscation)"],
  ["warn", /[A-Za-z0-9+/]{3000,}={0,2}/g, "contains a very long encoded blob (fine if it's an embedded image or sound)"],
  ["warn", /WebAssembly\.(?:instantiate|compile)/g, "runs WebAssembly (check it isn't a crypto miner)"],
  ["warn", /\b(?:coinhive|cryptonight|monero|xmrig)\b/gi, "mentions crypto mining"],
];

const problems = [];
const report = (level, file, msg, text, index) => problems.push({
  level, file, msg, line: text != null && index != null ? text.slice(0, index).split("\n").length : undefined,
});
const walk = dir => fs.readdirSync(dir, { withFileTypes: true })
  .flatMap(d => d.isDirectory() ? walk(path.join(dir, d.name)) : [path.join(dir, d.name)]);

// 1. Which files to scan: the ones this PR adds or changes, or every game when run without a base
const changed = base
  ? execFileSync("git", ["diff", "--name-only", "--diff-filter=ACMR", `${base}...HEAD`], { encoding: "utf8" })
      .split("\n").filter(Boolean)
  : walk("games");

// Changes to the site itself aren't scanned, but they deserve a careful human review
for (const f of changed)
  if (f !== "games.js" && !f.startsWith("games/"))
    report("warn", f, "changes a site file, not just a game. Review this carefully");

// 2. Size limit for every game the PR touches
for (const slug of new Set(changed.filter(f => f.startsWith("games/")).map(f => f.split("/")[1]))) {
  const dir = `games/${slug}`;
  if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) continue;
  const bytes = walk(dir).reduce((n, f) => n + fs.statSync(f).size, 0);
  if (bytes > MAX_GAME_BYTES) report("error", dir, `game is ${(bytes / 1048576).toFixed(1)} MB; the limit is 5 MB`);
}

// 3. File types and code patterns
for (const f of changed) {
  if (!f.startsWith("games/") || !fs.existsSync(f)) continue;
  if (f.split("/").length < 3) { report("error", f, "game files must be inside a games/<slug>/ folder"); continue; }
  const ext = path.extname(f).toLowerCase();
  if (!ALLOWED_EXT.has(ext) && path.basename(f) !== "LICENSE") {
    report("error", f, `file type "${ext || "none"}" isn't allowed in a game folder`);
    continue;
  }
  if (!TEXT_EXT.has(ext)) continue;

  const text = fs.readFileSync(f, "utf8");
  for (const [level, re, msg] of RULES)
    for (const m of [...text.matchAll(re)].slice(0, 3)) report(level, f, msg, text, m.index);

  // Any address on another site: full http(s):// links, plus protocol-relative "//host" ones inside quotes
  for (const m of text.matchAll(/(?:https?:\/\/|(?<=["'`(=]\s*)\/\/)[a-z0-9.-]+\.[a-z]{2,}[^\s"'`<>)\\]*/gi)) {
    let u;
    try { u = new URL(m[0].startsWith("//") ? "https:" + m[0] : m[0]); } catch { continue; }
    if (m[0].toLowerCase().startsWith("http://") && u.hostname !== "www.w3.org")
      report("error", f, `uses insecure http:// (${u.hostname})`, text, m.index);
    else if (!ALLOWED_HOSTS.has(u.hostname))
      report("error", f, `loads or links to ${u.hostname}, which isn't an allowed CDN`, text, m.index);
  }
}

// 4. Print as GitHub annotations, so they show up on the PR's "Files changed" tab
for (const p of problems) {
  const where = p.file ? ` file=${p.file}${p.line ? `,line=${p.line}` : ""}` : "";
  console.log(`::${p.level === "error" ? "error" : "warning"}${where}::${p.msg}`);
}
const nErr = problems.filter(p => p.level === "error").length;
const nWarn = problems.length - nErr;
console.log(nErr || nWarn
  ? `\nScanned ${changed.length} file(s): ${nErr} error(s), ${nWarn} warning(s)`
  : `Scanned ${changed.length} file(s): nothing suspicious found ✓`);
process.exit(nErr ? 1 : 0);
