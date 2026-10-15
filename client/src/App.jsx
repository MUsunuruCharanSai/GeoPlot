import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import AboutModal from './components/AboutModal.jsx';
import ConfirmDialog from './components/ConfirmDialog.jsx';
import Header from './components/Header.jsx';
import MapView from './components/MapView.jsx';
import MeasurementPanel from './components/MeasurementPanel.jsx';
import { isLocalPersistenceEnabled, STORAGE_KEY } from './config/persistence.js';
import useGeolocation, { zoomForAccuracy } from './hooks/useGeolocation.js';
import useMeasurementHistory from './hooks/useMeasurementHistory.js';
import { clampFlyToZoom, DEFAULT_BASEMAP } from './config/mapProviders.js';
import { calculateMeasurements } from './utils/areaCalculations.js';
import {
  WALK_PRESETS,
  pathLengthMetres,
  shouldAcceptGpsPoint,
  smoothGpsFix,
  toLatLngPoint,
} from './utils/coordinateUtils.js';
import { downloadGeoJson, downloadJson } from './utils/exportMeasurement.js';

function loadPersistedState() {
  if (!isLocalPersistenceEnabled()) return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export default function App() {
  const saved = useRef(loadPersistedState()).current;

  const {
    points,
    setPoints,
    undo,
    redo,
    reset,
    canUndo,
    canRedo,
  } = useMeasurementHistory(saved?.points || []);

  const geo = useGeolocation();

  const [mode, setMode] = useState(saved?.mode || 'manual');
  const [drawingEnabled, setDrawingEnabled] = useState(saved?.drawingEnabled ?? true);
  const [finished, setFinished] = useState(saved?.finished ?? false);
  const [flyTo, setFlyTo] = useState(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [toast, setToast] = useState('');
  const [mobileCollapsed, setMobileCollapsed] = useState(false);
  const [locating, setLocating] = useState(false);

  // Walk session
  const [walkStatus, setWalkStatus] = useState(saved?.walkStatus || 'idle');
  const [walkPath, setWalkPath] = useState(saved?.walkPath || []);
  const [allowPoorAccuracy, setAllowPoorAccuracy] = useState(false);
  const [walkPrecision, setWalkPrecision] = useState(saved?.walkPrecision || 'precise');
  const [basemapId, setBasemapId] = useState(saved?.basemapId || DEFAULT_BASEMAP);
  const [elapsedMs, setElapsedMs] = useState(0);
  const walkStartedAtRef = useRef(null);
  const elapsedOffsetRef = useRef(saved?.elapsedOffset || 0);
  const lastAcceptedRef = useRef(
    saved?.points?.length ? saved.points[saved.points.length - 1] : null,
  );
  const lastRawFixRef = useRef(null);
  // Keep latest walk status for the GPS watch callback without rebinding every tick
  const walkStatusRef = useRef(walkStatus);
  const walkPrecisionRef = useRef(walkPrecision);
  const allowPoorRef = useRef(allowPoorAccuracy);

  const measurements = useMemo(() => calculateMeasurements(points), [points]);
  const distanceWalked = useMemo(() => pathLengthMetres(walkPath), [walkPath]);

  const showToast = useCallback((message) => {
    setToast(message);
    window.setTimeout(() => setToast(''), 3200);
  }, []);

  // Persist unfinished work locally (optional)
  useEffect(() => {
    if (!isLocalPersistenceEnabled()) return;
    const payload = {
      mode,
      points,
      drawingEnabled,
      finished,
      walkPrecision,
      basemapId,
      walkStatus: walkStatus === 'walking' || walkStatus === 'paused' ? 'paused' : walkStatus,
      walkPath,
      elapsedOffset: elapsedOffsetRef.current + (walkStartedAtRef.current ? Date.now() - walkStartedAtRef.current : 0),
      savedAt: Date.now(),
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // quota / private mode — ignore
    }
  }, [mode, points, drawingEnabled, finished, walkStatus, walkPath, walkPrecision, basemapId]);

  // Elapsed timer while walking
  useEffect(() => {
    if (walkStatus !== 'walking') return undefined;
    const id = window.setInterval(() => {
      const running = walkStartedAtRef.current
        ? Date.now() - walkStartedAtRef.current
        : 0;
      setElapsedMs(elapsedOffsetRef.current + running);
    }, 500);
    return () => window.clearInterval(id);
  }, [walkStatus]);

  const handleMapClick = useCallback(
    ({ lat, lng }) => {
      if (mode !== 'manual' || !drawingEnabled || finished) return;
      setPoints((prev) => [...prev, toLatLngPoint(lat, lng)]);
      setFinished(false);
    },
    [mode, drawingEnabled, finished, setPoints],
  );

  const handlePointMove = useCallback(
    (id, lat, lng) => {
      setPoints(
        (prev) => prev.map((p) => (p.id === id ? { ...p, lat, lng } : p)),
        { record: true },
      );
      setFinished(false);
    },
    [setPoints],
  );

  const handleMyLocation = async () => {
    setLocating(true);
    try {
      // 1) Browser asks for location permission
      // 2) Fetch current coordinates
      const pos = await geo.getCurrentLocation();

      // 3) Zoom map to that location
      setFlyTo({
        lat: pos.lat,
        lng: pos.lng,
        zoom: zoomForAccuracy(pos.accuracy),
        requestId: `me-${Date.now()}`,
        duration: 0.8,
      });

      const acc =
        typeof pos.accuracy === 'number' ? ` (±${Math.round(pos.accuracy)} m)` : '';
      showToast(`Current location${acc}`);
    } catch (err) {
      showToast(err?.message || geo.error || 'Could not get location');
    } finally {
      setLocating(false);
    }
  };

  const handleModeChange = (next) => {
    if (walkStatus === 'walking' || walkStatus === 'paused') {
      showToast('Finish or Start Again before switching modes.');
      return;
    }
    setMode(next);
    if (next === 'manual') {
      setDrawingEnabled(true);
    } else {
      setDrawingEnabled(false);
    }
  };

  const clearEverything = () => {
    geo.stopWatch();
    reset([]);
    setWalkPath([]);
    setWalkStatus('idle');
    setFinished(false);
    setDrawingEnabled(mode === 'manual');
    setElapsedMs(0);
    elapsedOffsetRef.current = 0;
    walkStartedAtRef.current = null;
    lastAcceptedRef.current = null;
    lastRawFixRef.current = null;
    if (isLocalPersistenceEnabled()) {
      localStorage.removeItem(STORAGE_KEY);
    }
    setConfirmClear(false);
  };

  const ingestGpsFix = useCallback(
    (fix) => {
      const preset = WALK_PRESETS[walkPrecisionRef.current] || WALK_PRESETS.precise;
      const smoothed = smoothGpsFix(lastRawFixRef.current, fix) || fix;
      lastRawFixRef.current = fix;
      setWalkPath((prev) => [...prev, smoothed]);

      const decision = shouldAcceptGpsPoint(smoothed, lastAcceptedRef.current, {
        minSpacingM: preset.minSpacingM,
        maxAccuracyM: preset.maxAcceptAccuracyM,
        allowPoorAccuracy: allowPoorRef.current,
      });

      if (!decision.accept) return;

      const boundaryPoint = toLatLngPoint(smoothed.lat, smoothed.lng, {
        accuracy: smoothed.accuracy,
        timestamp: smoothed.timestamp,
        source: 'gps',
      });
      lastAcceptedRef.current = boundaryPoint;
      setPoints((prev) => [...prev, boundaryPoint], { record: false });
    },
    [setPoints],
  );

  const startWalk = async () => {
    if (points.length > 0) {
      // Fresh walk session
      reset([]);
      setWalkPath([]);
      setFinished(false);
      lastAcceptedRef.current = null;
    }

    try {
      const pos = await geo.getCurrentLocation();
      setFlyTo({
        lat: pos.lat,
        lng: pos.lng,
        zoom: zoomForAccuracy(pos.accuracy),
        requestId: `walk-${Date.now()}`,
        duration: 0.8,
      });
    } catch {
      // permission / GPS error already set on geo
    }

    lastRawFixRef.current = null;
    const ok = geo.startWatch((fix) => {
      if (walkStatusRef.current !== 'walking') return;
      ingestGpsFix(fix);
    });

    if (!ok) return;

    walkStatusRef.current = 'walking';
    setWalkStatus('walking');
    setMode('walk');
    setDrawingEnabled(false);
    walkStartedAtRef.current = Date.now();
    elapsedOffsetRef.current = 0;
    setElapsedMs(0);
    showToast('Walk started');
  };

  useEffect(() => {
    walkStatusRef.current = walkStatus;
  }, [walkStatus]);

  useEffect(() => {
    walkPrecisionRef.current = walkPrecision;
  }, [walkPrecision]);

  useEffect(() => {
    allowPoorRef.current = allowPoorAccuracy;
  }, [allowPoorAccuracy]);

  const pauseWalk = () => {
    if (walkStartedAtRef.current) {
      elapsedOffsetRef.current += Date.now() - walkStartedAtRef.current;
      walkStartedAtRef.current = null;
    }
    setElapsedMs(elapsedOffsetRef.current);
    geo.stopWatch();
    setWalkStatus('paused');
    walkStatusRef.current = 'paused';
  };

  const resumeWalk = () => {
    const ok = geo.startWatch((fix) => {
      if (walkStatusRef.current !== 'walking') return;
      ingestGpsFix(fix);
    });
    if (!ok) return;
    walkStartedAtRef.current = Date.now();
    setWalkStatus('walking');
    walkStatusRef.current = 'walking';
  };

  const finishWalk = () => {
    if (points.length < 3) {
      showToast('Need at least 3 boundary points before finishing.');
      return;
    }
    if (walkStartedAtRef.current) {
      elapsedOffsetRef.current += Date.now() - walkStartedAtRef.current;
      walkStartedAtRef.current = null;
    }
    setElapsedMs(elapsedOffsetRef.current);
    geo.stopWatch();
    setWalkStatus('finished');
    walkStatusRef.current = 'finished';
    setFinished(true);
    setDrawingEnabled(false);
    showToast('Walk finished — boundary closed. Drag points to adjust.');
  };

  const startAgain = () => {
    geo.stopWatch();
    reset([]);
    setWalkPath([]);
    setWalkStatus('idle');
    walkStatusRef.current = 'idle';
    setFinished(false);
    setElapsedMs(0);
    elapsedOffsetRef.current = 0;
    walkStartedAtRef.current = null;
    lastAcceptedRef.current = null;
    lastRawFixRef.current = null;
    setAllowPoorAccuracy(false);
  };

  const finishManual = () => {
    if (points.length < 3) {
      showToast('Add at least 3 points to finish.');
      return;
    }
    setDrawingEnabled(false);
    setFinished(true);
    showToast('Measurement finished. Export or drag markers to adjust.');
  };

  const exportMeta = {
    mode,
    walkStatus,
    walkPrecision,
    basemapId,
    distanceWalked,
  };

  return (
    <div className="flex h-[100dvh] flex-col bg-ink-50 text-ink-900">
      <Header
        onSearchSelect={(place) => {
          setFlyTo({
            lat: place.lat,
            lng: place.lng,
            zoom: clampFlyToZoom(place.zoom || 16, basemapId),
            requestId: `search-${Date.now()}`,
            duration: 0.8,
          });
          showToast(place.label?.split(',')[0] || 'Location found');
        }}
        onMyLocation={handleMyLocation}
        locating={locating}
        onOpenHelp={() => setHelpOpen(true)}
      />

      <main className="relative mx-auto flex min-h-0 w-full max-w-[1600px] flex-1 flex-col lg:flex-row lg:gap-4 lg:p-4">
        <div className="relative min-h-0 flex-1 lg:min-h-[calc(100dvh-7rem)]">
          <MapView
            points={points}
            mode={mode}
            drawingEnabled={mode === 'manual' && drawingEnabled && !finished}
            walkPath={walkPath}
            walkStatus={walkStatus}
            userLocation={geo.position}
            flyTo={flyTo}
            onMapClick={handleMapClick}
            onPointMove={handlePointMove}
            basemapId={basemapId}
            onBasemapChange={setBasemapId}
          />
        </div>

        <div className="z-10 max-h-[48vh] shrink-0 border-t border-ink-200 shadow-panel lg:max-h-none lg:w-[360px] lg:overflow-hidden lg:rounded-2xl lg:border lg:border-ink-200 lg:shadow-soft">
          <MeasurementPanel
            mode={mode}
            onModeChange={handleModeChange}
            measurements={measurements}
            drawingEnabled={drawingEnabled && !finished}
            onToggleDrawing={() => {
              setFinished(false);
              setDrawingEnabled((v) => !v);
            }}
            onUndo={undo}
            onRedo={redo}
            onRemoveLast={() => setPoints((prev) => prev.slice(0, -1))}
            onClear={() => setConfirmClear(true)}
            onFinishManual={finishManual}
            canUndo={canUndo}
            canRedo={canRedo}
            pointCount={points.length}
            finished={finished}
            onExportGeoJson={() => {
              try {
                downloadGeoJson(points, exportMeta);
              } catch (err) {
                showToast(err.message);
              }
            }}
            onExportJson={() => {
              try {
                downloadJson(points, exportMeta);
              } catch (err) {
                showToast(err.message);
              }
            }}
            walkStatus={walkStatus}
            accuracy={geo.accuracy}
            distanceWalked={distanceWalked}
            elapsedMs={elapsedMs}
            onStartWalk={startWalk}
            onPauseWalk={pauseWalk}
            onResumeWalk={resumeWalk}
            onFinishWalk={finishWalk}
            onStartAgain={startAgain}
            geoError={geo.error}
            allowPoorAccuracy={allowPoorAccuracy}
            onTogglePoorAccuracy={setAllowPoorAccuracy}
            walkPrecision={walkPrecision}
            onWalkPrecisionChange={setWalkPrecision}
            mobileCollapsed={mobileCollapsed}
            onToggleMobile={() => setMobileCollapsed((v) => !v)}
          />
        </div>
      </main>

      <footer className="hidden border-t border-ink-200 bg-white px-4 py-2 text-center text-[11px] text-ink-500 sm:block">
        GeoPlot is open source · Measurements are approximate, not survey-grade · Imagery © Esri /
        Maxar & map data ©{' '}
        <a
          className="underline hover:text-ink-700"
          href="https://www.openstreetmap.org/copyright"
          target="_blank"
          rel="noreferrer"
        >
          OpenStreetMap
        </a>
      </footer>

      <AboutModal open={helpOpen} onClose={() => setHelpOpen(false)} />
      <ConfirmDialog
        open={confirmClear}
        title="Clear this measurement?"
        message="This removes all boundary points and any saved local draft on this device."
        confirmLabel="Clear all"
        danger
        onCancel={() => setConfirmClear(false)}
        onConfirm={clearEverything}
      />

      {toast && (
        <div
          className="fixed bottom-4 left-1/2 z-[2100] max-w-[90vw] -translate-x-1/2 rounded-xl bg-ink-900 px-4 py-2 text-sm text-white shadow-panel"
          role="status"
        >
          {toast}
        </div>
      )}
    </div>
  );
}
