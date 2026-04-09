# CurioCity

CurioCity is a premium, AI-enhanced geographical discovery engine built for hackathon-grade storytelling.
It helps users explore any place in the world, discover nearby obscure lore from Wikipedia, visualize geography on an interactive 2D/3D map, and transform dry facts into engaging narratives.

---

## Vision

Most map apps answer "where". CurioCity answers "what happened here?"

Core idea:
- Let users free-surf the world map.
- Read the exact center target.
- Scan nearby historical/cultural points.
- Rank discoveries by obscurity.
- Turn raw facts into compelling, factual narrative experiences.

This project combines geospatial search, map rendering, AI-assisted query understanding, AI narrative generation, gamification, and immersive UI.

---

## Tech Stack

- **Frontend**: React + Vite
- **Map Engine**: `react-map-gl` with MapLibre (`maplibre-gl`)
- **Styling**: Tailwind CSS + custom glassmorphism CSS
- **Animation**: Framer Motion
- **Geocoding**: OpenStreetMap Nominatim + Photon fallback
- **Lore Source**: Wikipedia Geosearch API + Wikipedia/Wikimedia Pageviews API
- **GenAI**: Groq OpenAI-compatible chat completions endpoint
- **Audio**: Native browser `window.speechSynthesis`

---

## Core Product Features

### 1) Interactive Map Experience

- Dark/light map themes.
- 2D/3D mode toggle.
- 3D camera (pitch/bearing), terrain depth, and building extrusion.
- Arrow-key panning for keyboard navigation.
- Fixed center crosshair target.
- "Free surfing" map behavior (no forced recenter while dragging).

### 2) Smart Place Search

- Supports standard place names and messy locality strings.
- AI Search Assist can normalize weird input formatting and likely spelling issues.
- Multi-stage geocoding pipeline:
  - Nominatim strict (with polygon),
  - Nominatim relaxed,
  - Photon fuzzy fallback.
- "Nearest matches" suggestion chips when exact lookup fails.
- Supports direct coordinate input (`lat,lng`).

### 3) Boundary Visualization

- Draws glowing red polygon/multipolygon boundary when geojson exists.
- Generates a fallback boundary ring if official polygon is unavailable.
- Auto-fits map to boundary with sidebar-aware padding.

### 4) Lore Discovery Engine

- "Scan Target Coordinates" reads map center and fetches nearby pages (10km radius).
- Fetches title, extract, thumbnail, and article URL.
- Crash-safe coordinate filtering to avoid invalid marker rendering.
- Result cards include:
  - image
  - summary
  - Know More link
  - Find on Map action

### 5) Obscurity Gamification

- Each lore point receives:
  - `obscurityScore` (0-100),
  - rarity tier (`common`, `rare`, `legendary`).
- Score combines:
  - article brevity signal
  - pageview rarity signal (Wikimedia pageviews)
- Card visual tiers:
  - common: gray
  - rare: blue
  - legendary: gold glow
- Persistent **Curiosity Score** increments when users discover rare/legendary pages.

### 6) AI Narrative Layer

- Narrative modes:
  - Off
  - Dossier
  - Adaptive Story
- `Generate Dossier` rewrites the source summary into style-specific output.
- Uses Groq model when API key is available.
- Prompt constraints enforce factual fidelity:
  - no invented events/dates/claims
  - source-bound rewriting
  - concise single-paragraph outputs
- Adaptive Story style changes tone based on place context (dramatic, romantic, student-friendly, reverent, cinematic).

### 7) Audio Immersion

- Text-to-speech per card.
- Clear female-voice preference (when voice exists on host OS/browser).
- Controls:
  - Play/Replay
  - Pause
  - Resume

### 8) Loading UX

- Strict 7-second minimum loading timer.
- Rotating geography fun facts.
- Sidebar skeleton cards while loading.
- Radar sweep animation on map center while loading.

---

## UI/UX Design System

- Glassmorphism panels and cards.
- Deep dark base (`#09090B`) and muted gold accent (`#EAB308`).
- Crisp borders and custom scrollbar.
- Sidebar architecture:
  - fixed utility/search header
  - scrollable discovery feed
- Staggered lore card entrance animations.
- Accessibility-oriented controls and clear visual states.

---

## API Integrations

## Geocoding APIs

### Nominatim
Used for primary place lookup and optional polygon boundaries.

### Photon
Used as fuzzy fallback when Nominatim fails or is too strict.

## Lore APIs

### Wikipedia Geosearch
Fetches nearby articles for map center or searched location.

### Wikimedia Pageviews
Used to estimate rarity/obscurity.

## AI API

### Groq Chat Completions
Used for narrative rewriting and AI search normalization.

---

## Search Pipeline (Detailed)

1. User enters query.
2. If query matches `lat,lng`, parse directly and skip geocoding.
3. If AI Search Assist is ON:
   - call Groq normalization endpoint
   - produce cleaned search variants.
4. Merge AI variants with deterministic variants (aliases, reordering, punctuation cleanup).
5. Execute geocoding:
   - strict Nominatim
   - relaxed Nominatim
   - Photon fallback
6. Pick top match -> fly map -> set/draw boundary.
7. Show additional suggestions (top alternatives).
8. Fetch nearby lore and render cards/markers.

---

## Narrative Pipeline (Detailed)

1. User sets mode (`Dossier` or `Adaptive Story`).
2. User clicks `Generate Dossier` on a lore card.
3. App sends title + source extract + mode instructions to Groq.
4. Groq returns factual style-transformed text.
5. Card stores output as `dossierText`.
6. Audio playback uses `dossierText` when present; otherwise original extract.

---

## Environment Variables

Create `.env` in project root:

```bash
# Required for AI narrative + AI search normalization
VITE_GROQ_API_KEY=your_groq_api_key_here

# Optional model override
VITE_GROQ_MODEL=llama-3.1-8b-instant

# Optional endpoint override
VITE_GROQ_BASE_URL=https://api.groq.com/openai/v1/chat/completions
```

If `VITE_GROQ_API_KEY` is missing, AI features gracefully degrade:
- AI narrative generation disabled.
- AI search normalization skipped.
- Core map/lore discovery continues working.

---

## Local Development

```bash
npm install
npm run dev
```

Build production bundle:

```bash
npm run build
```

Preview production build:

```bash
npm run preview
```

---

## How to Use

1. Search a place or enter coordinates.
2. Inspect nearest suggestions if needed.
3. Use `Scan Target Coordinates` to discover lore around map center.
4. Explore cards and markers.
5. Click `Find on Map` to jump to a card location.
6. Use `Back to Previous View` to return.
7. Generate narrative scripts with AI modes.
8. Play/pause/resume lore audio.
9. Toggle 2D/3D and light/dark themes.

---

## Project Structure

```text
src/
  components/
    Loader.jsx
    LoreCard.jsx
    MapView.jsx
    Sidebar.jsx
  constants/
    funFacts.js
  services/
    aiDossier.js
    aiSearch.js
    geocoding.js
    wikipedia.js
  App.jsx
  index.css
```

---

## Hackathon Innovation Summary

CurioCity is not just "map + cards". It is a chained intelligence system:

- **Spatial understanding** (MapLibre + boundary fitting + scanning)
- **Knowledge mining** (Wikipedia geosearch + pageviews rarity scoring)
- **Search intelligence** (AI-assisted normalization + fallback geocoding strategy)
- **Narrative intelligence** (factual AI rewriting with adaptive tone)
- **Immersive delivery** (3D map, radar sweep, audio guide, gamified scoring)

This combination creates a compelling user story: users do not merely find places, they uncover layered, meaningful local lore.
