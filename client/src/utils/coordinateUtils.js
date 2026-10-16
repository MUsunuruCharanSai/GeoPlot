import distance from '@turf/distance';
import { point } from '@turf/helpers';

/** Default minimum spacing between accepted GPS boundary points (metres) */
export const DEFAULT_MIN_POINT_SPACING_M = 3;

/** Precision walk: closer points for tighter boundaries */
export const PRECISION_MIN_POINT_SPACING_M = 1.5;

/** Accuracy above this shows a visible low-accuracy warning (metres) */
export const LOW_ACCURACY_WARNING_M = 15;

/** Accuracy above this is considered very poor (metres) */
export const VERY_POOR_ACCURACY_M = 30;

/** In precision mode, prefer not recording beyond this unless user overrides */
export const PRECISION_MAX_ACCURACY_M = 12;

export const WALK_PRESETS = {
  precise: {
    id: 'precise',
    label: 'Precise',
    minSpacingM: PRECISION_MIN_POINT_SPACING_M,
    maxAcceptAccuracyM: PRECISION_MAX_ACCURACY_M,
    warnAccuracyM: LOW_ACCURACY_WARNING_M,
  },
  balanced: {
    id: 'balanced',
    label: 'Balanced',
    minSpacingM: DEFAULT_MIN_POINT_SPACING_M,
    maxAcceptAccuracyM: LOW_ACCURACY_WARNING_M,
    warnAccuracyM: LOW_ACCURACY_WARNING_M,
  },
};

export function isValidCoordinate(lat, lng) {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

export function distanceMetres(a, b) {
  if (!a || !b) return Infinity;
  if (!isValidCoordinate(a.lat, a.lng) || !isValidCoordinate(b.lat, b.lng)) {
    return Infinity;
  }
  return distance(point([a.lng, a.lat]), point([b.lng, b.lat]), { units: 'meters' });
}

export function pathLengthMetres(points) {
  if (!Array.isArray(points) || points.length < 2) return 0;
  let total = 0;
  for (let i = 1; i < points.length; i += 1) {
    total += distanceMetres(points[i - 1], points[i]);
  }
  return total;
}

/**
 * Blend a new GPS fix toward the previous accepted point when accuracy is noisy.
 * Better accuracy → trust the new fix more.
 */
export function smoothGpsFix(previous, next) {
  if (!next || !isValidCoordinate(next.lat, next.lng)) return null;
  if (!previous || !isValidCoordinate(previous.lat, previous.lng)) return { ...next };

  const prevAcc = typeof previous.accuracy === 'number' ? previous.accuracy : 25;
  const nextAcc = typeof next.accuracy === 'number' ? next.accuracy : 25;

  // Weight by inverse accuracy (clamped)
  const wPrev = 1 / Math.max(prevAcc, 2);
  const wNext = 1 / Math.max(nextAcc, 2);
  const sum = wPrev + wNext;
  const alpha = wNext / sum;

  return {
    ...next,
    lat: previous.lat * (1 - alpha) + next.lat * alpha,
    lng: previous.lng * (1 - alpha) + next.lng * alpha,
    accuracy: Math.min(prevAcc, nextAcc),
    rawLat: next.lat,
    rawLng: next.lng,
    smoothed: true,
  };
}

/**
 * Decide whether a new GPS fix should become a boundary point.
 * Poor accuracy does not auto-reject forever — callers can warn and let the user continue.
 */
export function shouldAcceptGpsPoint(candidate, lastAccepted, options = {}) {
  const {
    minSpacingM = DEFAULT_MIN_POINT_SPACING_M,
    maxAgeMs = 12000,
    maxAccuracyM = null,
    allowPoorAccuracy = false,
  } = options;

  if (!candidate || !isValidCoordinate(candidate.lat, candidate.lng)) {
    return { accept: false, reason: 'invalid' };
  }

  if (candidate.timestamp && Date.now() - candidate.timestamp > maxAgeMs) {
    return { accept: false, reason: 'stale' };
  }

  if (
    !allowPoorAccuracy &&
    typeof maxAccuracyM === 'number' &&
    typeof candidate.accuracy === 'number' &&
    candidate.accuracy > maxAccuracyM
  ) {
    return { accept: false, reason: 'poor_accuracy', accuracy: candidate.accuracy };
  }

  if (!lastAccepted) {
    return { accept: true, reason: 'first' };
  }

  const gap = distanceMetres(lastAccepted, candidate);
  if (gap < minSpacingM) {
    return { accept: false, reason: 'too_close', distance: gap };
  }

  // Reject huge jumps that are likely GPS jumps (unless accuracy is excellent)
  const maxJump =
    typeof candidate.accuracy === 'number'
      ? Math.max(40, candidate.accuracy * 4)
      : 60;
  if (gap > maxJump && (candidate.accuracy == null || candidate.accuracy > 8)) {
    return { accept: false, reason: 'jump', distance: gap };
  }

  return { accept: true, reason: 'ok', distance: gap };
}

export function createPointId() {
  return `pt_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function toLatLngPoint(lat, lng, extras = {}) {
  return {
    id: extras.id || createPointId(),
    lat: Number(lat),
    lng: Number(lng),
    ...extras,
  };
}

export function geolocationErrorMessage(error) {
  if (!error) return 'Unable to read your location.';

  switch (error.code) {
    case 1:
      return 'Location permission denied. Allow location access in your browser settings and try again.';
    case 2:
      return 'Location unavailable. Move outdoors or check that GPS/location services are on.';
    case 3:
      return 'Location request timed out. Try again with a clearer sky view.';
    default:
      return error.message || 'Unable to read your location.';
  }
}

export function isSecureGeolocationContext() {
  if (typeof window === 'undefined') return false;
  if (window.isSecureContext) return true;
  const host = window.location.hostname;
  return host === 'localhost' || host === '127.0.0.1';
}
