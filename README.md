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
