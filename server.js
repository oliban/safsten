import express from "express";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.static(resolve(__dirname, "public")));

// --- Live status ---
// Served from public/statuses.json, a snapshot baked at deploy time by
// scripts/statuses.mjs. An app is "deployed" (green) only when configured to
// stay up (autostop disabled or min_machines_running >= 1); on-demand apps are
// "suspended" even if transiently awake from a recent visit. Because that's a
// config-level property it's stable between deploys, so a static snapshot is
// both accurate and far more reliable than calling the Fly API at runtime from
// inside the machine. Re-run `npm run statuses` and redeploy to refresh.
const STATUSES_FILE = resolve(__dirname, "public/statuses.json");

app.get("/api/status", (_req, res) => {
  let data = {};
  try {
    data = JSON.parse(readFileSync(STATUSES_FILE, "utf8"));
  } catch {
    /* fall back to empty -> frontend shows neutral dots */
  }
  res.set("Cache-Control", "public, max-age=60");
  res.json(data);
});

app.get("/healthz", (_req, res) => res.send("ok"));

app.listen(PORT, () => console.log(`safsten hub on :${PORT}`));
