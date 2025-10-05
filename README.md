# 🐟 FishTankTracker

Static, zero-backend aquarium tracker.

This project renders a JSON file (`aquatrack.json`) into a clean, responsive webpage (`index.html`) that shows:

- Tank details (name, volume, notes, start date)
- Residents (fish, shrimp, snails, plants)
- Measurements (pH, temp, GH, KH, NO₃, NO₂, NH₃, notes)
- Events (water changes, treatments, filter cleans, notes)
- Photo gallery (with optional captions, dates, resident references)

All logic is client-side. Nothing is stored or written—**display-only**. You update `aquatrack.json` whenever you want to log new entries.

---

## How it works

1. Open [`index.html`](index.html) in a browser.
2. Load data from a JSON file by any of these methods:
   - Pass it via URL query:
     ```
     index.html?data=aquatrack.json
     ```
   - Click **Load JSON** on the page.
   - Drag & drop a JSON file onto the page.
3. If you keep photos locally in `/photos/`, add a base parameter to the URL:
   ```
   index.html?data=aquatrack.json&base=/photos/
   ```
   Or define `"photosBase": "/photos/"` inside the JSON file.

---

## JSON schema (minimal)

```json
{
  "tank": {
    "name": "54L living room",
    "volumeL": 54,
    "start": "2025-10-01",
    "notes": "Black sand, wood, Anubias"
  },
  "residents": [
    {
      "label": "Betta Pedro",
      "common": "Betta",
      "sci": "Betta splendens",
      "type": "fish",
      "count": 1,
      "date": "2025-10-05"
    },
    {
      "label": "Cory group",
      "common": "Corydoras",
      "type": "fish",
      "count": 6,
      "date": "2025-10-05"
    }
  ],
  "measurements": [
    {
      "t": "2025-10-05T09:15:00Z",
      "ph": 7.2,
      "temp": 24.0,
      "gh": 13,
      "kh": 9,
      "no3": 10,
      "no2": 0,
      "nh3": 0,
      "notes": "post water change"
    }
  ],
  "events": [
    {
      "t": "2025-10-05T08:00:00Z",
      "type": "water_change",
      "v1": "25%",
      "notes": "Prime 1 ml / 40 L"
    }
  ],
  "photosBase": "/photos/",
  "photos": [
    {
      "url": "betta-2025-10-05.jpg",
      "caption": "Betta Pedro day 1",
      "takenAt": "2025-10-05"
    },
    {
      "url": "https://example.com/cory-group.jpg",
      "caption": "Corydoras exploring",
      "takenAt": "2025-10-06",
      "resident": "Cory group"
    }
  ]
}
```

---

## Deployment

You can host anywhere that serves static files:

- **GitHub Pages**
  - Push `index.html`, `aquatrack.json`, and the optional `photos/` folder to this repo.
  - Go to **Settings → Pages** and set the branch to `main`.
  - Access at `https://<yourname>.github.io/FishTankTracker/index.html?data=aquatrack.json`.
- **Netlify / Cloudflare Pages**
  - Link the repo, set the framework to **None**, and publish the repository root.
- **Self-hosted (Nginx/Apache)**
  - Copy the files into `/var/www/fishtank/`.
  - Serve `index.html`.

---

## Workflow with Codex/ChatGPT

- Keep `aquatrack.json` as the single source of truth.
- When you log something new (e.g., “add 24.5 °C, pH 7.2, 2025-10-06”), Codex/ChatGPT can rewrite the JSON with the new entry.
- Commit and push the updated JSON to GitHub.
- Reload the page—new data appears instantly.

---

## Project goals

- Stay static and minimal: no backend, no database, no local writes.
- Be easily extendable with more JSON sections (dosing, monthly summaries).
- Work offline if the JSON is bundled next to the HTML.
