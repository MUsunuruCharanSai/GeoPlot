import { Ruler } from 'lucide-react';
import { formatArea, formatDistance } from '../utils/areaCalculations.js';

export default function AreaSummary({ measurements, emptyHint }) {
  const ready = measurements?.isValid;

  return (
    <section className="rounded-2xl border border-ink-200 bg-brand-50/60 p-4">
      <div className="mb-3 flex items-center gap-2 text-brand-800">
        <Ruler className="h-4 w-4" aria-hidden />
        <h2 className="text-sm font-semibold uppercase tracking-wide">Measurement</h2>
      </div>

      {!ready ? (
        <p className="text-sm text-ink-600">
          {emptyHint || 'Add at least 3 boundary points to see area and perimeter.'}
        </p>
      ) : (
        <>
          <p className="text-3xl font-semibold tracking-tight text-ink-900">
            {formatArea(measurements.acres, 3)}
            <span className="ml-1.5 text-base font-medium text-ink-500">acres</span>
          </p>

          <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
            <div className="rounded-xl bg-white/80 px-3 py-2">
              <dt className="text-ink-500">Square metres</dt>
              <dd className="font-semibold text-ink-900">{formatArea(measurements.squareMetres, 1)}</dd>
            </div>
            <div className="rounded-xl bg-white/80 px-3 py-2">
              <dt className="text-ink-500">Square feet</dt>
              <dd className="font-semibold text-ink-900">{formatArea(measurements.squareFeet, 0)}</dd>
            </div>
            <div className="rounded-xl bg-white/80 px-3 py-2">
              <dt className="text-ink-500">Hectares</dt>
              <dd className="font-semibold text-ink-900">{formatArea(measurements.hectares, 3)}</dd>
            </div>
            <div className="rounded-xl bg-white/80 px-3 py-2">
              <dt className="text-ink-500">Perimeter</dt>
              <dd className="font-semibold text-ink-900">
                {formatDistance(measurements.perimeterMetres)}
              </dd>
            </div>
          </dl>

          {measurements.selfIntersects && (
            <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
              This boundary crosses itself. Area may be unreliable — adjust overlapping edges.
            </p>
          )}
        </>
      )}

      <p className="mt-3 text-xs text-ink-500">
        Points: {measurements?.pointCount ?? 0}
        {!ready && measurements?.pointCount > 0 ? ` · need ${3 - measurements.pointCount} more` : ''}
      </p>
    </section>
  );
}
