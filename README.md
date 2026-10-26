# GeoPlot

GeoPlot is a simple web app for measuring land. Mark points on a map or walk the boundary with GPS to calculate area and perimeter.

**Note:** Approximate only — not for official surveys or legal boundaries.

## Features

- Mark points on a map to draw land boundaries
- Walk Around with phone GPS
- Area in acres, m², ft², hectares; perimeter in m/km
- Undo, redo, clear, export GeoJSON / JSON
- Place search (village / PIN)
- Satellite, Hybrid, and Streets basemaps
- Optional local draft restore

## Setup

```bash
npm install
npm run install:all
```

Configuration lives in:

- `.env` — server
- `client/.env` — frontend

## Development

```bash
npm run dev
```

- App: http://localhost:5173  
- API health: http://localhost:3001/api/health  

## Production

```bash
npm run build
npm start
```

Express serves `client/dist` and `/api/health` on `PORT` (default 3001).

Or in one step: `npm run start:prod`

## Deploy on Vercel

GeoPlot is a Vite SPA. Core measurement runs in the browser, so Vercel only needs the client build. HTTPS is included, which is required for GPS / My Location.

1. Push the repo to GitHub.
2. In [Vercel](https://vercel.com) → **Add New** → **Project** → import the GeoPlot repo.
3. Leave **Root Directory** as the repo root. `vercel.json` already sets:
   - Install: `npm install --prefix client`
   - Build: `npm run build --prefix client`
   - Output: `client/dist`
4. Add environment variables (Project → Settings → Environment Variables). Use the same keys as `client/.env`. Recommended production values:

| Key | Value |
| --- | --- |
| `VITE_DEFAULT_BASEMAP` | `satellite` |
| `VITE_TILE_MAX_ZOOM` | `21` |
| `VITE_TILE_MAX_NATIVE_ZOOM` | `21` |
| `VITE_SATELLITE_MAX_ZOOM` | `21` |
| `VITE_TILE_PROVIDER` | `builtin` |
| `VITE_TILE_URL` | `https://mt{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}` |
| `VITE_TILE_ATTRIBUTION` | `Imagery &copy; Google` |
| `VITE_TILE_SUBDOMAINS` | `0,1,2,3` |
| `VITE_HYBRID_TILE_URL` | `https://mt{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}` |
| `VITE_STREETS_TILE_URL` | `https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png` |
| `VITE_STREETS_ATTRIBUTION` | `&copy; OpenStreetMap contributors` |
| `VITE_GEOCODER_PHOTON_URL` | `https://photon.komoot.io/api/` |
| `VITE_GEOCODER_NOMINATIM_URL` | `https://nominatim.openstreetmap.org/search` |
| `VITE_GEOCODER_COUNTRY_CODES` | `in` |
| `VITE_ENABLE_LOCAL_PERSISTENCE` | `true` |
| `VITE_API_BASE_URL` | `/` |

5. Deploy. The live app is at `https://your-project.vercel.app`. Health check: `https://your-project.vercel.app/api/health`.

Do **not** upload `.env` files. Vercel reads project env vars at build time (`VITE_*` are baked into the frontend).

CLI alternative:

```bash
npm i -g vercel
vercel
```

## Environment

Create these files locally (they are gitignored — never commit them):

- `.env` — server (`PORT`, `CLIENT_ORIGIN`, `NODE_ENV`, `SERVE_CLIENT`)
- `client/.env` — frontend (`VITE_*` map, geocoder, persistence, API URL)

Restart the Vite dev server after changing `client/.env`.

## GPS on mobile

Use HTTPS or localhost, allow location, tap **My Location** or **Start Walk**. Accuracy depends on the device.

## Privacy

Measurements stay on the device. Nothing is stored on the GeoPlot server.

## Limitations

- Not survey-grade
- Satellite imagery may be missing in some rural areas at high zoom — switch to **Streets** or zoom out
- Public map / geocoder services have usage limits
