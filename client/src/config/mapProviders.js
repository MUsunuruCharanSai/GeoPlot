/**
 * Tile / basemap config — values come from client/.env
 * Satellite uses high-zoom imagery so close zoom stays in satellite view.
 */

function envNumber(key, fallback) {
  const value = Number(import.meta.env[key]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function envString(key, fallback) {
  const value = import.meta.env[key];
  if (value == null || value === '') return fallback;
  return String(value);
}

function envList(key, fallback) {
  const raw = envString(key, fallback.join(','));
  return raw
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
}

const MAP_MAX_ZOOM = envNumber('VITE_TILE_MAX_ZOOM', 21);
const MAP_NATIVE_ZOOM = envNumber('VITE_TILE_MAX_NATIVE_ZOOM', 21);
const SATELLITE_MAX_ZOOM = envNumber('VITE_SATELLITE_MAX_ZOOM', 21);

const SATELLITE_URL = envString(
  'VITE_TILE_URL',
  'https://mt{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
);
const SATELLITE_ATTRIBUTION = envString('VITE_TILE_ATTRIBUTION', 'Imagery &copy; Google');
const SATELLITE_SUBDOMAINS = envList('VITE_TILE_SUBDOMAINS', ['0', '1', '2', '3']);

const HYBRID_URL = envString(
  'VITE_HYBRID_TILE_URL',
  'https://mt{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
);

const STREETS_URL = envString(
  'VITE_STREETS_TILE_URL',
  'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
);
const STREETS_ATTRIBUTION = envString(
  'VITE_STREETS_ATTRIBUTION',
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
);

const ENV_PROVIDER = envString('VITE_TILE_PROVIDER', 'builtin');

export const BASEMAPS = {
  satellite: {
    id: 'satellite',
    name: 'Satellite',
    description: 'High-zoom aerial imagery',
    url: SATELLITE_URL,
    attribution: SATELLITE_ATTRIBUTION,
    subdomains: SATELLITE_SUBDOMAINS,
    maxZoom: Math.max(MAP_MAX_ZOOM, SATELLITE_MAX_ZOOM),
    maxNativeZoom: Math.max(MAP_NATIVE_ZOOM, SATELLITE_MAX_ZOOM),
    overlays: [],
  },
  hybrid: {
    id: 'hybrid',
    name: 'Hybrid',
    description: 'Satellite with labels',
    url: HYBRID_URL,
    attribution: SATELLITE_ATTRIBUTION,
    subdomains: SATELLITE_SUBDOMAINS,
    maxZoom: Math.max(MAP_MAX_ZOOM, SATELLITE_MAX_ZOOM),
    maxNativeZoom: Math.max(MAP_NATIVE_ZOOM, SATELLITE_MAX_ZOOM),
    overlays: [],
  },
  streets: {
    id: 'streets',
    name: 'Streets',
    description: 'OpenStreetMap street map',
    url: STREETS_URL,
    attribution: STREETS_ATTRIBUTION,
    subdomains: ['a', 'b', 'c'],
    maxZoom: MAP_MAX_ZOOM,
    maxNativeZoom: 19,
    overlays: [],
  },
};

export const DEFAULT_BASEMAP = envString('VITE_DEFAULT_BASEMAP', 'satellite');

export function getBasemap(basemapId = DEFAULT_BASEMAP) {
  if (ENV_PROVIDER === 'osm') {
    return { ...BASEMAPS.streets };
  }

  if (ENV_PROVIDER === 'custom') {
    return {
      id: 'custom',
      name: 'Custom',
      url: SATELLITE_URL,
      attribution: SATELLITE_ATTRIBUTION,
      subdomains: SATELLITE_SUBDOMAINS,
      maxZoom: MAP_MAX_ZOOM,
      maxNativeZoom: MAP_NATIVE_ZOOM,
      overlays: [],
    };
  }

  return { ...(BASEMAPS[basemapId] || BASEMAPS.satellite) };
}

export function getActiveTileProvider() {
  return getBasemap(DEFAULT_BASEMAP);
}

export function clampMapZoom(zoom, basemapId = DEFAULT_BASEMAP) {
  const tiles = getBasemap(basemapId);
  const cap = tiles.maxZoom || 21;
  const value = Number(zoom);
  if (!Number.isFinite(value)) return Math.min(18, cap);
  return Math.max(1, Math.min(value, cap));
}

/** After search, fly in close on satellite so land boundaries are visible */
export function clampFlyToZoom(zoom, basemapId = DEFAULT_BASEMAP) {
  const tiles = getBasemap(basemapId);
  const cap = tiles.maxZoom || 21;
  const value = Number(zoom);
  // Prefer a close satellite view; user can zoom further up to max
  const preferred = Number.isFinite(value) ? value : 18;
  return Math.max(14, Math.min(preferred, 19, cap));
}
