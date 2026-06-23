// Build-time snapshot of each Fly app's live/asleep classification.
// "live" = configured to stay up (autostop disabled or min_machines_running >= 1);
// everything else is on-demand ("asleep"). This is config-based and stable, so a
// snapshot taken at deploy time is accurate and avoids fragile runtime API calls
// from inside the Fly machine. Writes public/statuses.json.
import { readFileSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const MACHINES_API = "https://api.machines.dev/v1/apps";

const token =
  process.env.FLY_API_TOKEN ||
  execFileSync("fly", ["auth", "token"], { encoding: "utf8" }).trim();

const projects = JSON.parse(readFileSync(resolve(root, "public/projects.json"), "utf8"));
const apps = [...new Set(projects.map((p) => p.flyApp).filter(Boolean))];

const isPinned = (m) =>
  (m?.config?.services || []).some(
    (s) => s.autostop !== true || (s.min_machines_running ?? 0) >= 1
  );

const out = {};
for (const app of apps) {
  try {
    const res = await fetch(`${MACHINES_API}/${app}/machines`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      out[app] = "unknown";
      console.log(`${app}: HTTP ${res.status}`);
      continue;
    }
    const machines = await res.json();
    out[app] = Array.isArray(machines) && machines.some(isPinned) ? "deployed" : "suspended";
  } catch (e) {
    out[app] = "unknown";
    console.log(`${app}: ${e.message}`);
  }
}

writeFileSync(resolve(root, "public/statuses.json"), JSON.stringify(out, null, 2) + "\n");
const live = Object.entries(out).filter(([, v]) => v === "deployed").map(([k]) => k);
console.log(`wrote statuses.json — live (${live.length}): ${live.join(", ")}`);
