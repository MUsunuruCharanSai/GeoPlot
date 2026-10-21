import { describe, expect, it } from 'vitest';
import {
  SQ_METRES_PER_ACRE,
  calculateMeasurements,
  pointsToPolygon,
} from '../utils/areaCalculations.js';
import { shouldAcceptGpsPoint, toLatLngPoint } from '../utils/coordinateUtils.js';
import { buildGeoJson, buildJsonExport } from '../utils/exportMeasurement.js';
import { zoomForAccuracy } from '../hooks/useGeolocation.js';
import { buildSearchVariants } from '../utils/geocodeSearch.js';

// Roughly 100m x 100m square near the equator
const square = [
  { id: '1', lat: 0, lng: 0 },
  { id: '2', lat: 0, lng: 0.0009 },
  { id: '3', lat: 0.0009, lng: 0.0009 },
  { id: '4', lat: 0.0009, lng: 0 },
];

describe('areaCalculations', () => {
  it('returns invalid for fewer than 3 points', () => {
    const result = calculateMeasurements(square.slice(0, 2));
    expect(result.isValid).toBe(false);
    expect(result.acres).toBe(0);
  });

  it('computes acres from square metres with the required conversion', () => {
    const result = calculateMeasurements(square);
    expect(result.isValid).toBe(true);
    expect(result.squareMetres).toBeGreaterThan(9000);
    expect(result.squareMetres).toBeLessThan(11000);
    expect(result.acres).toBeCloseTo(result.squareMetres / SQ_METRES_PER_ACRE, 8);
    expect(result.perimeterMetres).toBeGreaterThan(350);
  });

  it('builds a closed polygon ring', () => {
    const poly = pointsToPolygon(square);
    const ring = poly.geometry.coordinates[0];
    expect(ring[0]).toEqual(ring[ring.length - 1]);
  });
});

describe('coordinateUtils', () => {
  it('accepts the first valid GPS point', () => {
    const decision = shouldAcceptGpsPoint(toLatLngPoint(12.9, 77.6), null);
    expect(decision.accept).toBe(true);
  });

  it('rejects points that are too close', () => {
    const a = toLatLngPoint(12.9, 77.6);
    const b = toLatLngPoint(12.900001, 77.600001);
    const decision = shouldAcceptGpsPoint(b, a, { minSpacingM: 5 });
    expect(decision.accept).toBe(false);
    expect(decision.reason).toBe('too_close');
  });

  it('rejects poor accuracy unless overridden', () => {
    const a = toLatLngPoint(12.9, 77.6, { accuracy: 5 });
    const b = toLatLngPoint(12.901, 77.601, { accuracy: 40, timestamp: Date.now() });
    const blocked = shouldAcceptGpsPoint(b, a, {
      minSpacingM: 1,
      maxAccuracyM: 12,
      allowPoorAccuracy: false,
    });
    expect(blocked.accept).toBe(false);
    expect(blocked.reason).toBe('poor_accuracy');

    const allowed = shouldAcceptGpsPoint(b, a, {
      minSpacingM: 1,
      maxAccuracyM: 12,
      allowPoorAccuracy: true,
    });
    expect(allowed.accept).toBe(true);
  });
});

describe('zoomForAccuracy', () => {
  it('zooms in tighter when GPS accuracy is better', () => {
    expect(zoomForAccuracy(5)).toBeGreaterThan(zoomForAccuracy(80));
    expect(zoomForAccuracy(8)).toBeLessThanOrEqual(21);
    expect(zoomForAccuracy(8)).toBeGreaterThanOrEqual(18);
  });
});

describe('geocodeSearch', () => {
  it('builds search variants without PIN codes and with spelling swaps', () => {
    const variants = buildSearchVariants('SampleVillage 123456');
    expect(variants.some((v) => v.includes('SampleVillage'))).toBe(true);
    expect(variants.some((v) => !/\d/.test(v))).toBe(true);
  });
});

describe('exportMeasurement', () => {
  it('builds valid GeoJSON FeatureCollection', () => {
    const geojson = buildGeoJson(square, { mode: 'manual' });
    expect(geojson.type).toBe('FeatureCollection');
    expect(geojson.features.length).toBeGreaterThan(0);
    expect(geojson.features[0].geometry.type).toBe('Polygon');
  });

  it('builds JSON export with measurements', () => {
    const payload = buildJsonExport(square);
    expect(payload.app).toBe('GeoPlot');
    expect(payload.points).toHaveLength(4);
    expect(payload.measurements.isValid).toBe(true);
  });
});
