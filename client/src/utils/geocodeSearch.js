/**
 * Place search helpers (Photon + Nominatim).
 * Photon often finds small villages that Nominatim misses.
 */

function envString(key, fallback) {
  const value = import.meta.env[key];
  return value == null || value === '' ? fallback : String(value);
}

const PHOTON_URL = envString('VITE_GEOCODER_PHOTON_URL', 'https://photon.komoot.io/api/');
const NOMINATIM_URL = envString(
  'VITE_GEOCODER_NOMINATIM_URL',
  'https://nominatim.openstreetmap.org/search',
);
const COUNTRY_CODES = envString('VITE_GEOCODER_COUNTRY_CODES', 'in');

function uniqueKey(item) {
  return `${item.lat.toFixed(5)},${item.lng.toFixed(5)},${item.label}`;
}

function normalizePhotonFeature(feature) {
  const [lng, lat] = feature.geometry?.coordinates || [];
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  const p = feature.properties || {};
  const parts = [p.name, p.street, p.city || p.county, p.state, p.postcode, p.country].filter(
    Boolean,
  );

  return {
    id: `photon-${p.osm_type || 'x'}-${p.osm_id || `${lat}-${lng}`}`,
    lat,
    lng,
    label: parts.join(', ') || p.name || 'Unknown place',
    source: 'photon',
    type: p.osm_value || p.type || '',
  };
}

function normalizeNominatimResult(item) {
  const lat = Number(item.lat);
  const lng = Number(item.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  return {
    id: `nominatim-${item.place_id || item.osm_id}`,
    lat,
    lng,
    label: item.display_name,
    source: 'nominatim',
    type: item.type || item.class || '',
  };
}

/** Build alternate queries: drop PIN codes, try common spelling swaps, add country hint */
export function buildSearchVariants(rawQuery) {
  const q = String(rawQuery || '').trim().replace(/\s+/g, ' ');
  if (!q) return [];

  const variants = [q];

  const withoutCodes = q.replace(/\b\d{5,6}\b/g, '').replace(/\s+/g, ' ').trim();
  if (withoutCodes && withoutCodes !== q) variants.push(withoutCodes);

  const base = withoutCodes || q;
  if (/vari/i.test(base)) variants.push(base.replace(/vari/gi, 'wari'));
  if (/wari/i.test(base)) variants.push(base.replace(/wari/gi, 'vari'));

  if (withoutCodes && !/\bindia\b/i.test(withoutCodes)) {
    variants.push(`${withoutCodes} India`);
  }

  return [...new Set(variants.filter((v) => v.length >= 2))];
}

async function searchPhoton(query, signal) {
  const url = new URL(PHOTON_URL);
  url.searchParams.set('q', query);
  url.searchParams.set('limit', '8');
  url.searchParams.set('lang', 'en');

  const res = await fetch(url.toString(), { signal, headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error('Photon search failed');
  const data = await res.json();
  return (data.features || []).map(normalizePhotonFeature).filter(Boolean);
}

async function searchNominatim(query, signal) {
  const url = new URL(NOMINATIM_URL);
  url.searchParams.set('q', query);
  url.searchParams.set('format', 'json');
  url.searchParams.set('addressdetails', '1');
  url.searchParams.set('limit', '5');
  if (COUNTRY_CODES) url.searchParams.set('countrycodes', COUNTRY_CODES);

  const res = await fetch(url.toString(), {
    signal,
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) throw new Error('Nominatim search failed');
  const data = await res.json();
  return (Array.isArray(data) ? data : []).map(normalizeNominatimResult).filter(Boolean);
}

export async function searchPlaces(rawQuery, { signal } = {}) {
  const variants = buildSearchVariants(rawQuery);
  if (variants.length === 0) return [];

  const merged = [];
  const seen = new Set();

  const pushAll = (items) => {
    for (const item of items) {
      const key = uniqueKey(item);
      if (seen.has(key)) continue;
      seen.add(key);
      merged.push(item);
    }
  };

  for (const variant of variants) {
    try {
      pushAll(await searchPhoton(variant, signal));
      if (merged.length >= 5) break;
    } catch (err) {
      if (err.name === 'AbortError') throw err;
    }
  }

  if (merged.length < 3) {
    for (const variant of variants.slice(0, 3)) {
      try {
        pushAll(await searchNominatim(variant, signal));
        if (merged.length >= 8) break;
      } catch (err) {
        if (err.name === 'AbortError') throw err;
      }
    }
  }

  return merged.slice(0, 8);
}

export function zoomForPlaceType(type = '') {
  const t = String(type).toLowerCase();
  if (['village', 'hamlet', 'locality', 'suburb', 'neighbourhood'].includes(t)) return 18;
  if (['town', 'city', 'municipality'].includes(t)) return 15;
  if (['state', 'country'].includes(t)) return 8;
  return 17;
}
