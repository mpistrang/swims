# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A static Leaflet map that plots David's swims worldwide, hosted at https://davidswims.onrender.com/. Built with Vite (vanilla JS, no framework). Data flows one way: Google Sheet → `build_geojson.py` → `public/swims.geojson` → `src/main.js` fetches it at runtime.

## Common commands

Install JS deps (once, and after pulling changes that touch `package.json`):

```
npm install
```

Run the dev server (hot reload, defaults to http://localhost:5173 or next free port):

```
npm run dev
```

Produce a static production bundle in `dist/`:

```
npm run build
```

Serve the built bundle locally to sanity-check it:

```
npm run preview
```

Regenerate the GeoJSON from the source spreadsheet. Requires `DAVID_SWIMS_SPREADSHEET_ID`, `DAVID_SWIMS_DATA_RANGE`, and either `GOOGLE_SERVICE_ACCOUNT_JSON` (JSON blob) or `GOOGLE_APPLICATION_CREDENTIALS` (path to key file — e.g. `credentials/swims-service-account-api-key.json`) in the environment:

```
pip install -r requirements.txt
python build_geojson.py
```

In production, regeneration happens via the `Build GeoJSON` GitHub Action (`.github/workflows/build-geojson.yml`), which is `workflow_dispatch`-only — trigger it manually from the Actions tab. The workflow commits the updated `public/swims.geojson` back to the repo, and Render redeploys from there.

## Architecture notes

- **`build_geojson.py`** pulls rows from a Google Sheet via a service account, expects columns `Swim #`, `Year`, `Month`, `Day`, `Coordinates` (as `"lat,lon"` — note: sheet order is lat,lon, but GeoJSON writes `[lon, lat]`). Rows missing/malformed `Coordinates` are logged and skipped rather than failing the build.
- **`src/main.js`** builds one Leaflet sub-group per year from the single FeatureCollection, assigns each year a color from a hardcoded 37-entry palette (cycles if there are more years), and registers each year as a toggleable overlay in the layers control. The Select all / Deselect all buttons are injected into the layers-control DOM so they collapse with it; they both flip the actual layers and sync the checkbox state. Marker clustering is provided by `Leaflet.markercluster` + `Leaflet.FeatureGroup.SubGroup` so clusters respect the per-year toggles.
- **Mapbox access token** is currently hardcoded in `src/main.js`. It is a public `pk.` token scoped for browser use.
- **No `vite.config.js`** — Vite's defaults handle root `index.html`, `public/` static assets, and `dist/` build output. Add one only if a customization actually requires it.

## Render deployment

Render serves this as a **Static Site**. The build command is `npm run build` and the publish directory is `dist/`. (Pre-Vite, the service was configured to serve `site-content/` directly — when this branch ships, that needs to be updated in the Render dashboard.)

## Conventions

- Never commit `credentials/` contents — the directory is gitignored. The service account key lives there for local runs only.
- JS deps live in `package.json` and are pinned via `package-lock.json`. No CDN imports, no integrity hashes to maintain.
- `public/swims.geojson` is a generated artifact but is checked in — that's intentional, it's how the Render deploy gets the data. Don't hand-edit it; rerun `build_geojson.py` (or the GitHub Action) instead.
- The frontend has no tests. After UI changes, verify in a browser via `npm run dev`.
