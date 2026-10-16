import area from '@turf/area';
import length from '@turf/length';
import kinks from '@turf/kinks';
import { lineString, polygon } from '@turf/helpers';

/** International acre in square metres */
export const SQ_METRES_PER_ACRE = 4046.8564224;
export const SQ_FEET_PER_SQ_METRE = 10.76391041671;
export const SQ_METRES_PER_HECTARE = 10000;

/**
 * Build a closed Turf polygon from [lat, lng] points.
 * Returns null when there are fewer than 3 points.
 */
export function pointsToPolygon(points) {
  if (!Array.isArray(points) || points.length < 3) return null;

  const ring = points.map((p) => [Number(p.lng), Number(p.lat)]);
  const first = ring[0];
  const last = ring[ring.length - 1];

  if (first[0] !== last[0] || first[1] !== last[1]) {
    ring.push([...first]);
  }

  try {
    return polygon([ring]);
  } catch {
    return null;
  }
}

export function hasSelfIntersections(points) {
  const poly = pointsToPolygon(points);
  if (!poly) return false;
  try {
    return kinks(poly).features.length > 0;
  } catch {
    return false;
  }
}

/**
 * Calculate area and perimeter for a closed boundary.
 * Area uses Turf area() (geodesic). Perimeter uses Turf length() on the closed ring.
 */
export function calculateMeasurements(points) {
  const empty = {
    squareMetres: 0,
    acres: 0,
    squareFeet: 0,
    hectares: 0,
    perimeterMetres: 0,
    isValid: false,
    selfIntersects: false,
    pointCount: Array.isArray(points) ? points.length : 0,
  };

  if (!Array.isArray(points) || points.length < 3) {
    return empty;
  }

  const poly = pointsToPolygon(points);
  if (!poly) return empty;

  let squareMetres = 0;
  let perimeterMetres = 0;
  let selfIntersects = false;

  try {
    squareMetres = area(poly);
    selfIntersects = kinks(poly).features.length > 0;

    const ring = poly.geometry.coordinates[0];
    perimeterMetres = length(lineString(ring), { units: 'meters' });
  } catch {
    return empty;
  }

  if (!Number.isFinite(squareMetres) || squareMetres <= 0) {
    return { ...empty, selfIntersects, pointCount: points.length };
  }

  return {
    squareMetres,
    acres: squareMetres / SQ_METRES_PER_ACRE,
    squareFeet: squareMetres * SQ_FEET_PER_SQ_METRE,
    hectares: squareMetres / SQ_METRES_PER_HECTARE,
    perimeterMetres,
    isValid: true,
    selfIntersects,
    pointCount: points.length,
  };
}

export function formatArea(value, digits = 2) {
  if (!Number.isFinite(value) || value <= 0) return '—';
  if (value >= 1000) return value.toLocaleString(undefined, { maximumFractionDigits: 1 });
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: digits,
  });
}

export function formatDistance(metres) {
  if (!Number.isFinite(metres) || metres <= 0) return '—';
  if (metres >= 1000) {
    return `${(metres / 1000).toLocaleString(undefined, { maximumFractionDigits: 2 })} km`;
  }
  return `${metres.toLocaleString(undefined, { maximumFractionDigits: 1 })} m`;
}

export function formatDuration(ms) {
  if (!Number.isFinite(ms) || ms < 0) return '0:00';
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  return `${m}:${String(s).padStart(2, '0')}`;
}
