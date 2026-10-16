import {
  Check,
  Download,
  Eraser,
  Footprints,
  MapPinned,
  Redo2,
  Trash2,
  Undo2,
} from 'lucide-react';
import AreaSummary from './AreaSummary.jsx';
import GpsControls from './GpsControls.jsx';

const modes = [
  { id: 'manual', label: 'Mark Points', icon: MapPinned },
  { id: 'walk', label: 'Walk Around', icon: Footprints },
];

export default function MeasurementPanel({
  mode,
  onModeChange,
  measurements,
  drawingEnabled,
  onToggleDrawing,
  onUndo,
  onRedo,
  onRemoveLast,
  onClear,
  onFinishManual,
  canUndo,
  canRedo,
  pointCount,
  finished,
  onExportGeoJson,
  onExportJson,
  // GPS
  walkStatus,
  accuracy,
  distanceWalked,
  elapsedMs,
  onStartWalk,
  onPauseWalk,
  onResumeWalk,
  onFinishWalk,
  onStartAgain,
  geoError,
  allowPoorAccuracy,
  onTogglePoorAccuracy,
  walkPrecision,
  onWalkPrecisionChange,
  mobileCollapsed,
  onToggleMobile,
}) {
  return (
    <aside className="flex h-full flex-col bg-white">
      {/* Mobile sheet handle */}
      <button
        type="button"
        onClick={onToggleMobile}
        className="flex w-full items-center justify-center border-b border-ink-100 py-2 lg:hidden"
        aria-expanded={!mobileCollapsed}
      >
        <span className="h-1 w-10 rounded-full bg-ink-300" />
        <span className="sr-only">Toggle measurement panel</span>
      </button>

      <div
        className={`flex-1 space-y-4 overflow-auto px-4 pb-4 pt-2 ${
          mobileCollapsed ? 'hidden lg:block' : ''
        }`}
      >
        <div>
          <h2 className="text-base font-semibold text-ink-900">Measure land</h2>
          <p className="mt-0.5 text-sm text-ink-500">
            Choose how you want to mark the boundary.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 rounded-2xl bg-ink-100 p-1">
          {modes.map(({ id, label, icon: Icon }) => {
            const active = mode === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => onModeChange(id)}
                className={`inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium transition ${
                  active
                    ? 'bg-white text-brand-800 shadow-soft'
                    : 'text-ink-600 hover:text-ink-900'
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            );
          })}
        </div>

        <AreaSummary
          measurements={measurements}
          emptyHint={
            mode === 'walk'
              ? 'Start walking to collect GPS points. Finish when you have 3 or more.'
              : undefined
          }
        />

        {mode === 'manual' ? (
          <div className="space-y-3">
            <button
              type="button"
              onClick={onToggleDrawing}
              className={`inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold ${
                drawingEnabled
                  ? 'bg-brand-600 text-white hover:bg-brand-700'
                  : 'border border-ink-200 bg-white text-ink-800 hover:bg-ink-50'
              }`}
            >
              <MapPinned className="h-4 w-4" />
              {drawingEnabled ? 'Drawing on — tap the map' : 'Add Points / Draw Land'}
            </button>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={onUndo}
                disabled={!canUndo}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-ink-200 px-3 py-2 text-sm font-medium text-ink-700 hover:bg-ink-50 disabled:opacity-40"
              >
                <Undo2 className="h-4 w-4" />
                Undo
              </button>
              <button
                type="button"
                onClick={onRedo}
                disabled={!canRedo}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-ink-200 px-3 py-2 text-sm font-medium text-ink-700 hover:bg-ink-50 disabled:opacity-40"
              >
                <Redo2 className="h-4 w-4" />
                Redo
              </button>
              <button
                type="button"
                onClick={onRemoveLast}
                disabled={pointCount === 0}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-ink-200 px-3 py-2 text-sm font-medium text-ink-700 hover:bg-ink-50 disabled:opacity-40"
              >
                <Eraser className="h-4 w-4" />
                Last point
              </button>
              <button
                type="button"
                onClick={onClear}
                disabled={pointCount === 0}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-ink-200 px-3 py-2 text-sm font-medium text-ink-700 hover:bg-ink-50 disabled:opacity-40"
              >
                <Trash2 className="h-4 w-4" />
                Clear
              </button>
            </div>

            <button
              type="button"
              onClick={onFinishManual}
              disabled={pointCount < 3 || finished}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-brand-200 bg-brand-50 px-4 py-2.5 text-sm font-semibold text-brand-800 hover:bg-brand-100 disabled:opacity-40"
            >
              <Check className="h-4 w-4" />
              {finished ? 'Measurement finished' : 'Finish measurement'}
            </button>

            <p className="text-[11px] leading-relaxed text-ink-500">
              Drag numbered markers to fine-tune corners. Area updates as you edit.
            </p>
          </div>
        ) : (
          <GpsControls
            walkStatus={walkStatus}
            accuracy={accuracy}
            distanceWalked={distanceWalked}
            elapsedMs={elapsedMs}
            pointCount={pointCount}
            onStart={onStartWalk}
            onPause={onPauseWalk}
            onResume={onResumeWalk}
            onFinish={onFinishWalk}
            onStartAgain={onStartAgain}
            geoError={geoError}
            allowPoorAccuracy={allowPoorAccuracy}
            onTogglePoorAccuracy={onTogglePoorAccuracy}
            walkPrecision={walkPrecision}
            onWalkPrecisionChange={onWalkPrecisionChange}
          />
        )}

        <div className="space-y-2 border-t border-ink-100 pt-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">Export</p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={onExportGeoJson}
              disabled={pointCount === 0}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-ink-200 px-3 py-2 text-sm font-medium text-ink-800 hover:bg-ink-50 disabled:opacity-40"
            >
              <Download className="h-4 w-4" />
              GeoJSON
            </button>
            <button
              type="button"
              onClick={onExportJson}
              disabled={pointCount === 0}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-ink-200 px-3 py-2 text-sm font-medium text-ink-800 hover:bg-ink-50 disabled:opacity-40"
            >
              <Download className="h-4 w-4" />
              JSON
            </button>
          </div>
        </div>

        <p className="text-[11px] leading-relaxed text-ink-400">
          Approximate only — not for legal or survey use. Location stays on your device.
        </p>
      </div>
    </aside>
  );
}
