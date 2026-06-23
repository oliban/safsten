# SÄFSTEN ARCADE

A coin-op arcade hub for everything I've shipped — live at **[safsten.fly.dev](https://safsten.fly.dev)**.

A neon marquee (with a Pac-Man chasing monsters and eating dots), a randomized
"NOW PLAYING" cabinet, and a grid of project cabinets across **Games**,
**Calculators**, **Apps & Tools** and **Misc**. Each card shows an elevator pitch,
a screenshot/poster, and a live-status dot — insert a coin to play.

## How it works

- **Frontend** — static `public/` (vanilla HTML/CSS/JS). `public/projects.json` is the
  single source of truth: add/remove/reorder a card by editing that one file.
- **Server** — small Node/Express (`server.js`) serving `public/` plus `GET /api/status`,
  which returns `public/statuses.json` (a deploy-time snapshot of which Fly apps are
  configured to stay up vs. sleep on demand).
- **Insert-coin** — clicking a card spins a coin into the slot, then opens the project
  in a new tab.

## Scripts

| Command | What it does |
|---|---|
| `npm start` | Run the hub locally on `:8080` |
| `npm run shoot [ids...]` | Capture project screenshots via headless Chrome |
| `npm run statuses` | Refresh `public/statuses.json` from the Fly Machines API |

## Deploy

Deployed to Fly.io (`fly deploy`). App config in `fly.toml`, image in `Dockerfile`.
