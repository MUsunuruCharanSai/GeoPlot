import { Flag, Pause, Play, RotateCcw, Square } from 'lucide-react';
import { formatDistance, formatDuration } from '../utils/areaCalculations.js';
import {
  LOW_ACCURACY_WARNING_M,
  VERY_POOR_ACCURACY_M,
  WALK_PRESETS,
} from '../utils/coordinateUtils.js';

export default function GpsControls({
  walkStatus,
  accuracy,
  distanceWalked,
  elapsedMs,
  pointCount,
  onStart,
  onPause,
  onResume,
  onFinish,
  onStartAgain,
  geoError,
  allowPoorAccuracy,
  onTogglePoorAccuracy,
  walkPrecision = 'precise',
  onWalkPrecisionChange,
}) {
  const accuracyLabel =
    typeof accuracy === 'number' ? `±${Math.round(accuracy)} m` : 'Waiting for GPS…';

  const preset = WALK_PRESETS[walkPrecision] || WALK_PRESETS.precise;
  const warnAt = preset.warnAccuracyM || LOW_ACCURACY_WARNING_M;
  const accuracyWarn = typeof accuracy === 'number' && accuracy >= warnAt;

  return (
    <div className="space-y-3">
      <div>
        <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-ink-500">
          Walk precision
        </p>
        <div className="grid grid-cols-2 gap-1 rounded-xl bg-ink-100 p-1">
          {Object.values(WALK_PRESETS).map((option) => {
            const active = walkPrecision === option.id;
            return (
              <button
                key={option.id}
                type="button"
                disabled={walkStatus === 'walking' || walkStatus === 'paused'}
                onClick={() => onWalkPrecisionChange?.(option.id)}
                className={`rounded-lg px-2 py-1.5 text-xs font-semibold disabled:opacity-50 ${
                  active ? 'bg-white text-brand-800 shadow-soft' : 'text-ink-600'
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
        <p className="mt-1.5 text-[11px] leading-relaxed text-ink-500">
          {walkPrecision === 'precise'
            ? 'Records points ~1.5 m apart and waits for tighter GPS (±12 m or better). Best outdoors with a clear sky.'
            : 'Slightly wider spacing and looser accuracy — useful under trees or weak GPS.'}
        </p>
      </div>

      <div className="rounded-xl border border-ink-200 bg-white px-3 py-2.5 text-sm">
        <div className="flex items-center justify-between gap-2">
          <span className="text-ink-500">GPS accuracy</span>
          <span
            className={`font-semibold ${
              typeof accuracy === 'number' && accuracy <= 8
                ? 'text-brand-700'
                : typeof accuracy === 'number' && accuracy >= VERY_POOR_ACCURACY_M
                  ? 'text-red-700'
                  : 'text-ink-900'
            }`}
          >
            {accuracyLabel}
          </span>
        </div>
        <div className="mt-1.5 flex items-center justify-between gap-2">
          <span className="text-ink-500">Distance walked</span>
          <span className="font-semibold text-ink-900">{formatDistance(distanceWalked)}</span>
        </div>
        <div className="mt-1.5 flex items-center justify-between gap-2">
          <span className="text-ink-500">Elapsed</span>
          <span className="font-semibold text-ink-900">{formatDuration(elapsedMs)}</span>
        </div>
        <div className="mt-1.5 flex items-center justify-between gap-2">
          <span className="text-ink-500">Boundary points</span>
          <span className="font-semibold text-ink-900">{pointCount}</span>
        </div>
      </div>

      {accuracyWarn && (
        <div
          className={`rounded-xl border px-3 py-2 text-xs ${
            accuracy >= VERY_POOR_ACCURACY_M
              ? 'border-red-200 bg-red-50 text-red-900'
              : 'border-amber-200 bg-amber-50 text-amber-950'
          }`}
        >
          <p className="font-medium">GPS accuracy is low ({accuracyLabel}).</p>
          <p className="mt-1">
            Stand still outdoors for 10–20 seconds until the reading improves. Browser GPS is not
            survey-grade — for legal boundaries hire a licensed surveyor.
          </p>
          <label className="mt-2 flex items-start gap-2">
            <input
              type="checkbox"
              checked={allowPoorAccuracy}
              onChange={(e) => onTogglePoorAccuracy(e.target.checked)}
              className="mt-0.5"
            />
            <span>Record points even while accuracy is poor</span>
          </label>
        </div>
      )}

      {geoError && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">
          {geoError}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        {walkStatus === 'idle' && (
          <button
            type="button"
            onClick={onStart}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
          >
            <Play className="h-4 w-4" />
            Start Walk
          </button>
        )}

        {walkStatus === 'walking' && (
          <>
            <button
              type="button"
              onClick={onPause}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-ink-200 bg-white px-4 py-2.5 text-sm font-semibold text-ink-800 hover:bg-ink-50"
            >
              <Pause className="h-4 w-4" />
              Pause
            </button>
            <button
              type="button"
              onClick={onFinish}
              disabled={pointCount < 3}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
              title={pointCount < 3 ? 'Need at least 3 points to finish' : 'Finish and close polygon'}
            >
              <Flag className="h-4 w-4" />
              Finish Walk
            </button>
          </>
        )}

        {walkStatus === 'paused' && (
          <>
            <button
              type="button"
              onClick={onResume}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
            >
              <Play className="h-4 w-4" />
              Resume
            </button>
            <button
              type="button"
              onClick={onFinish}
              disabled={pointCount < 3}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-ink-200 bg-white px-4 py-2.5 text-sm font-semibold text-ink-800 hover:bg-ink-50 disabled:opacity-50"
            >
              <Square className="h-4 w-4" />
              Finish
            </button>
          </>
        )}

        {(walkStatus === 'finished' || pointCount > 0) && (
          <button
            type="button"
            onClick={onStartAgain}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-ink-200 bg-white px-4 py-2.5 text-sm font-medium text-ink-700 hover:bg-ink-50"
          >
            <RotateCcw className="h-4 w-4" />
            Start Again
          </button>
        )}
      </div>

      <p className="text-[11px] leading-relaxed text-ink-500">
        Walk slowly along the edge. The map follows you at high zoom. Polygon closes only when you
        tap Finish. HTTPS (or localhost) is required for browser GPS.
      </p>
    </div>
  );
}
