// Checks that games.js and the games/ folder follow the SlopGames format.
// Run locally with: node scripts/check-games.mjs
import fs from "node:fs";
import vm from "node:vm";

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const REQUIRED = ["slug", "title", "description", "author", "madeWith", "tags", "controls", "added"];
const errors = [];
const fail = (file, msg) => errors.push({ file, msg });

// 1. games.js runs and sets window.SLOP_GAMES to a list
let games = [];
try {
  const sandbox = { window: {} };
  vm.runInNewContext(fs.readFileSync("games.js", "utf8"), sandbox, { timeout: 1000 });
  if (Array.isArray(sandbox.window.SLOP_GAMES)) games = sandbox.window.SLOP_GAMES;
  else fail("games.js", "games.js must set window.SLOP_GAMES to a list");
} catch (e) {
  fail("games.js", `games.js has a syntax error: ${e.message}`);
}

// 2. Every entry is complete and points at real files
const slugs = new Set();
games.forEach((g, i) => {
  const at = `entry ${i + 1} (${g?.slug || "no slug"})`;
  if (!g || typeof g !== "object") return fail("games.js", `${at}: is not an object`);
  for (const k of REQUIRED) if (g[k] === undefined || g[k] === "") fail("games.js", `${at}: missing "${k}"`);
  if (!SLUG.test(g.slug ?? "")) fail("games.js", `${at}: slug must be lowercase letters, numbers and dashes`);
  if (slugs.has(g.slug)) fail("games.js", `${at}: slug is used twice`);
  slugs.add(g.slug);
  if (g.added && (!/^\d{4}-\d{2}-\d{2}$/.test(g.added) || isNaN(Date.parse(g.added))))
    fail("games.js", `${at}: "added" must be a date like 2026-11-14`);
  if (!Array.isArray(g.tags) || g.tags.some(t => !/^[a-z0-9-]+$/.test(t)))
    fail("games.js", `${at}: tags must be a list of short lowercase words`);
  if (SLUG.test(g.slug ?? "") && !fs.existsSync(`games/${g.slug}/index.html`))
    fail("games.js", `${at}: games/${g.slug}/index.html doesn't exist (names are case-sensitive)`);
  if (g.thumbnail) {
    if (!String(g.thumbnail).startsWith(`games/${g.slug}/`)) fail("games.js", `${at}: thumbnail must be inside games/${g.slug}/`);
    else if (!fs.existsSync(g.thumbnail)) fail("games.js", `${at}: thumbnail ${g.thumbnail} doesn't exist (names are case-sensitive)`);
  }
});

// 3. Every folder in games/ is listed in games.js
for (const d of fs.readdirSync("games", { withFileTypes: true }))
  if (d.isDirectory() && !slugs.has(d.name)) fail(`games/${d.name}`, "this game folder isn't listed in games.js");

// Print as GitHub annotations, so they show up on the PR
for (const e of errors) console.log(`::error file=${e.file}::${e.msg}`);
console.log(errors.length ? `\n${errors.length} problem(s) found` : "All games look good ✓");
process.exit(errors.length ? 1 : 0);
