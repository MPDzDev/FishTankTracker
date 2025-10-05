# Codex Instructions — Update `aquatrack.json` for FishTankTracker

You are updating a **display-only** static site. Do NOT modify `index.html` or any JavaScript.  
Your only job is to **rewrite `aquatrack.json`** based on my natural-language log entries.

## Constraints
- Output **valid JSON**, no comments.
- Keep the **schema** exactly as specified.
- Use **ISO 8601** timestamps where a time exists (e.g., `"2025-10-05T09:15:00Z"`). Dates without time use `"YYYY-MM-DD"`.
- **Ordering:**
  - `measurements`: newest → oldest (unshift new items).
  - `events`: newest → oldest.
  - `residents`: sort by `type` (fish, shrimp, snail, plant), then `common` ascending.
- **Photos**:
  - Keep `"photosBase"` if present.
  - `photos` can use relative paths (resolved against `photosBase`) or absolute URLs.
  - Do not inline or compress images; just reference by URL.
- Preserve existing data unless directed to correct or remove it.

## Schema (authoritative)
```json
{
  "tank": {
    "name": "string",
    "volumeL": 0,
    "start": "YYYY-MM-DD",
    "notes": "string"
  },
  "residents": [
    {
      "label": "string",          // e.g., "Betta Pedro" or "Cory group"
      "common": "string",         // e.g., "Betta"
      "sci": "string",            // optional, scientific name
      "type": "fish|shrimp|snail|plant",
      "count": 1,
      "date": "YYYY-MM-DD"        // date added
    }
  ],
  "measurements": [
    {
      "t": "YYYY-MM-DDTHH:MM:SSZ",
      "ph": 0.0,
      "temp": 0.0,                // Celsius
      "gh": 0,
      "kh": 0,
      "no3": 0.0,
      "no2": 0.0,
      "nh3": 0.0,
      "notes": "string"
    }
  ],
  "events": [
    {
      "t": "YYYY-MM-DDTHH:MM:SSZ",
      "type": "water_change|filter_clean|dose|treatment|note|add_resident|remove_resident",
      "v1": "string",             // e.g., "25%", product name, dose, etc.
      "notes": "string"
    }
  ],
  "photosBase": "/photos/",       // optional
  "photos": [
    {
      "url": "string",            // relative or absolute
      "caption": "string",
      "takenAt": "YYYY-MM-DD",
      "resident": "string"        // optional reference like "Cory group"
    }
  ]
}
```

### Update Rules (decision logic)

Add measurement: insert as first element of measurements. Include only provided fields; unknown values can be omitted.

Water change: add an events item with type:"water_change", v1 set to the percentage or volume, add notes like conditioners used.

Resident changes:

New fish/shrimp/snail/plant ⇒ append to residents (then re-sort).

Removal or death ⇒ add an events entry with type:"remove_resident"; do not delete from history unless asked.

Photos: append to photos. If a relative path is provided and photosBase exists, leave only the filename in url.

Corrections: when I say “fix last pH to 7.1”, modify that specific record; do not reorder except by the rules above.

### Example: Natural input → JSON rewrite

Input (from user)

Add measurement: 2025-10-06 09:30 local, pH 7.1, temp 24.5, NO3 15, note "after top-up".
Add water change 30% with Prime 1 ml / 40 L at 2025-10-06 10:00 local.
Add 6 Neon tetras (Paracheirodon innesi) as a group on 2025-10-06.
Add photo "neons-day1.jpg" caption "New neons exploring" taken 2025-10-06 for resident "Neon group".

Apply conversions

Convert local times to UTC if specified; otherwise keep date-time as given (use Z only if UTC).
If timezone isn’t provided, treat it as local and keep as-is or include offset notation if known.

Output (full aquatrack.json, preserving prior entries and adding new ones in correct order)

{
  "tank": { "...": "unchanged" },
  "residents": [
    { "... existing residents ..." },
    {
      "label": "Neon group",
      "common": "Neon tetra",
      "sci": "Paracheirodon innesi",
      "type": "fish",
      "count": 6,
      "date": "2025-10-06"
    }
  ],
  "measurements": [
    {
      "t": "2025-10-06T09:30:00",
      "ph": 7.1,
      "temp": 24.5,
      "no3": 15,
      "notes": "after top-up"
    },
    { "... previous measurements (new → old) ..." }
  ],
  "events": [
    {
      "t": "2025-10-06T10:00:00",
      "type": "water_change",
      "v1": "30%",
      "notes": "Prime 1 ml / 40 L"
    },
    { "... previous events (new → old) ..." }
  ],
  "photosBase": "/photos/",
  "photos": [
    {
      "url": "neons-day1.jpg",
      "caption": "New neons exploring",
      "takenAt": "2025-10-06",
      "resident": "Neon group"
    },
    { "... previous photos ..." }
  ]
}

### Validation Checklist (Codex must self-check before responding)

- JSON parses with no errors.
- Arrays respect ordering requirements.
- Date/time formats are correct and consistent.
- No schema keys were added/renamed/removed outside the spec.
- Only aquatrack.json content was changed (no HTML/JS edits).
- Relative photo paths make sense with photosBase.

### Commit Message Template
`chore(aquatrack): log <what> on <YYYY-MM-DD> — +<n> items updated`

### Short Prompts You Accept

“Log measurement: 24.7 °C, pH 7.3 now, note after feeding.”

“Add 5 Amano shrimp (Caridina multidentata) on 2025-10-07.”

“Water change 25% at 2025-10-08 18:00; Seachem Prime 1 ml / 40 L.”

“Add photo betta-2025-10-09.jpg, ‘Flare practice’, 2025-10-09, resident Betta Pedro.”

“Correct last temp to 24.1.”
