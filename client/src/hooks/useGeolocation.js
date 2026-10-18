import { useCallback, useEffect, useRef, useState } from 'react';
import {
  geolocationErrorMessage,
  isSecureGeolocationContext,
  isValidCoordinate,
} from '../utils/coordinateUtils.js';

const GEO_OPTIONS = {
  enableHighAccuracy: true,
  maximumAge: 0,
  timeout: 20000,
};

/**
 * Simple browser geolocation:
 * 1) Ask browser for location permission
 * 2) Read current coordinates
 */
export default function useGeolocation() {
  const [position, setPosition] = useState(null);
  const [accuracy, setAccuracy] = useState(null);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState('idle');
  const watchIdRef = useRef(null);
  const onWatchRef = useRef(null);

  const clearWatch = useCallback(() => {
    if (watchIdRef.current != null && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  }, []);

  const applyPosition = useCallback((geoPos) => {
    const { latitude, longitude, accuracy: acc } = geoPos.coords;
    if (!isValidCoordinate(latitude, longitude)) {
      setError('Invalid location from device.');
      return null;
    }

    const next = {
      lat: latitude,
      lng: longitude,
      accuracy: typeof acc === 'number' ? acc : null,
      timestamp: geoPos.timestamp || Date.now(),
    };

    setPosition(next);
    setAccuracy(next.accuracy);
    setError(null);
    return next;
  }, []);

  const assertReady = useCallback(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      const message = 'This browser does not support location.';
      setStatus('unsupported');
      setError(message);
      return { ok: false, message };
    }
    if (!isSecureGeolocationContext()) {
      const message = 'Location needs HTTPS or localhost.';
      setStatus('insecure');
      setError(message);
      return { ok: false, message };
    }
    return { ok: true };
  }, []);

  /**
   * Step 1 + 2: browser permission prompt, then return current location.
   */
  const getCurrentLocation = useCallback(() => {
    const gate = assertReady();
    if (!gate.ok) {
      return Promise.reject(new Error(gate.message));
    }

    setStatus('locating');
    setError(null);

    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (geoPos) => {
          const next = applyPosition(geoPos);
          setStatus('idle');
          if (next) resolve(next);
          else reject(new Error('Could not read your location.'));
        },
        (err) => {
          const message = geolocationErrorMessage(err);
          setError(message);
          setStatus(err.code === 1 ? 'denied' : 'idle');
          reject(new Error(message));
        },
        GEO_OPTIONS,
      );
    });
  }, [applyPosition, assertReady]);

  const startWatch = useCallback(
    (onUpdate) => {
      const gate = assertReady();
      if (!gate.ok) return false;

      clearWatch();
      onWatchRef.current = onUpdate || null;
      setStatus('watching');
      setError(null);

      watchIdRef.current = navigator.geolocation.watchPosition(
        (geoPos) => {
          const next = applyPosition(geoPos);
          if (next && onWatchRef.current) onWatchRef.current(next);
        },
        (err) => {
          setError(geolocationErrorMessage(err));
          if (err.code === 1) {
            setStatus('denied');
            clearWatch();
          }
        },
        GEO_OPTIONS,
      );

      return true;
    },
    [applyPosition, assertReady, clearWatch],
  );

  const stopWatch = useCallback(() => {
    clearWatch();
    onWatchRef.current = null;
    setStatus((prev) => (prev === 'watching' ? 'idle' : prev));
  }, [clearWatch]);

  useEffect(() => () => clearWatch(), [clearWatch]);

  return {
    position,
    accuracy,
    error,
    status,
    getCurrentLocation,
    locateOnce: getCurrentLocation,
    startWatch,
    stopWatch,
    clearError: () => setError(null),
  };
}

/** Suggested fly-to zoom from GPS accuracy (user can zoom further up to 21). */
export function zoomForAccuracy(accuracyM, maxZoom = 21) {
  if (!Number.isFinite(accuracyM) || accuracyM <= 0) return Math.min(17, maxZoom);
  if (accuracyM <= 15) return Math.min(19, maxZoom);
  if (accuracyM <= 40) return Math.min(18, maxZoom);
  if (accuracyM <= 100) return Math.min(17, maxZoom);
  return Math.min(15, maxZoom);
}
