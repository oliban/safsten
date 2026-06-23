// Capture one screenshot per project using the system's headless Chrome.
// Suspended Fly apps are warmed with a fetch (which wakes them) before shooting.
// Usage: node scripts/shoot.mjs [id1 id2 ...]   (no args = all projects)
import { readFileSync, mkdirSync } from "node:fs";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const execFileP = promisify(execFile);
const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

const projects = JSON.parse(readFileSync(resolve(root, "public/projects.json"), "utf8"));
const only = process.argv.slice(2);
const targets = only.length ? projects.filter((p) => only.includes(p.id)) : projects;

mkdirSync(resolve(root, "public/screenshots"), { recursive: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Warm a (possibly suspended) app: retry until it responds or we give up.
async function warm(url) {
  for (let i = 0; i < 8; i++) {
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 20000);
      const res = await fetch(url, { signal: ctrl.signal, redirect: "follow" });
      clearTimeout(t);
      if (res.ok) return true;
    } catch {}
    await sleep(2500);
  }
  return false;
}

async function shoot(p) {
  const out = resolve(root, "public", p.screenshot);
  const warmed = await warm(p.url);
  // give SPA/canvas a moment to paint after first byte
  await sleep(2500);
  try {
    await execFileP(CHROME, [
      "--headless=new",
      "--disable-gpu",
      "--hide-scrollbars",
      "--no-sandbox",
      "--window-size=1280,800",
      "--force-device-scale-factor=1",
      "--virtual-time-budget=9000",
      `--screenshot=${out}`,
      p.url,
    ], { timeout: 60000 });
    console.log(`${warmed ? "✓" : "⚠"} ${p.id} -> ${p.screenshot}`);
  } catch (e) {
    console.log(`✗ ${p.id}: ${e.message.split("\n")[0]}`);
  }
}

for (const p of targets) {
  await shoot(p);
}
console.log("done");
