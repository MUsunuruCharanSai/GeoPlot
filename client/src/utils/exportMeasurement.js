import { calculateMeasurements, pointsToPolygon } from './areaCalculations.js';

export function buildGeoJson(points, meta = {}) {
  if (!Array.isArray(points) || points.length === 0) {
    throw new Error('Nothing to export — add at least one point first.');
  }

  const measurements = calculateMeasurements(points);
  const features = [];

  if (points.length >= 3) {
    const poly = pointsToPolygon(points);
    if (poly) {
      features.push({
        type: 'Feature',
        properties: {
          kind: 'boundary',
          ...measurements,
          ...meta,
        },
        geometry: poly.geometry,
      });
    }
  }

  features.push({
    type: 'Feature',
    properties: {
      kind: 'boundary-vertices',
      pointCount: points.length,
    },
    geometry: {
      type: 'MultiPoint',
      coordinates: points.map((p) => [p.lng, p.lat]),
    },
  });

  return {
    type: 'FeatureCollection',
    features,
  };
}

export function buildJsonExport(points, meta = {}) {
  const measurements = calculateMeasurements(points);
  return {
    app: 'GeoPlot',
    version: 1,
    exportedAt: new Date().toISOString(),
    disclaimer:
      'Browser GPS and map measurements are approximate and not survey-grade. Do not use for legal boundaries.',
    meta,
    points: points.map((p, index) => ({
      index: index + 1,
      id: p.id,
      lat: p.lat,
      lng: p.lng,
      accuracy: p.accuracy ?? null,
      timestamp: p.timestamp ?? null,
    })),
    measurements,
  };
}

function downloadBlob(filename, blob) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function downloadGeoJson(points, meta = {}) {
  const geojson = buildGeoJson(points, meta);
  const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
  downloadBlob(
    `geoplot-${stamp}.geojson`,
    new Blob([JSON.stringify(geojson, null, 2)], { type: 'application/geo+json' }),
  );
  return geojson;
}

export function downloadJson(points, meta = {}) {
  const payload = buildJsonExport(points, meta);
  const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
  downloadBlob(
    `geoplot-${stamp}.json`,
    new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }),
  );
  return payload;
}
