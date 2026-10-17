import { HelpCircle, LocateFixed, MapPinned } from 'lucide-react';
import MapSearch from './MapSearch.jsx';

export default function Header({
  onSearchSelect,
  onMyLocation,
  locating,
  onOpenHelp,
}) {
  return (
    <header className="relative z-[5000] overflow-visible border-b border-ink-200 bg-white/95 backdrop-blur">
      <div className="relative z-[5001] mx-auto flex max-w-[1600px] flex-col gap-3 overflow-visible px-3 py-3 sm:px-4 lg:flex-row lg:items-center lg:gap-4">
        <div className="flex items-center justify-between gap-3 lg:justify-start">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white shadow-soft">
              <MapPinned className="h-5 w-5" aria-hidden />
            </div>
            <div>
              <h1 className="text-lg font-semibold leading-tight text-ink-900">GeoPlot</h1>
              <p className="text-xs text-ink-500">Land measurement</p>
            </div>
          </div>

          <div className="flex items-center gap-2 lg:hidden">
            <button
              type="button"
              onClick={onMyLocation}
              disabled={locating}
              className="inline-flex items-center gap-1.5 rounded-xl border border-ink-200 bg-white px-3 py-2 text-sm font-medium text-ink-800 hover:bg-ink-50 disabled:opacity-60"
              title="Find my location"
            >
              <LocateFixed className={`h-4 w-4 text-brand-600 ${locating ? 'animate-pulse' : ''}`} />
              <span className="sr-only sm:not-sr-only">My Location</span>
            </button>
            <button
              type="button"
              onClick={onOpenHelp}
              className="rounded-xl border border-ink-200 bg-white p-2 text-ink-600 hover:bg-ink-50"
              aria-label="Help and about"
            >
              <HelpCircle className="h-4 w-4" />
            </button>
          </div>
        </div>

        <MapSearch onSelect={onSearchSelect} className="w-full flex-1 lg:max-w-xl" />

        <div className="hidden items-center gap-2 lg:flex">
          <button
            type="button"
            onClick={onMyLocation}
            disabled={locating}
            className="inline-flex items-center gap-2 rounded-xl border border-ink-200 bg-white px-3.5 py-2 text-sm font-medium text-ink-800 shadow-soft hover:bg-ink-50 disabled:opacity-60"
          >
            <LocateFixed className={`h-4 w-4 text-brand-600 ${locating ? 'animate-pulse' : ''}`} />
            {locating ? 'Locating…' : 'My Location'}
          </button>
          <button
            type="button"
            onClick={onOpenHelp}
            className="inline-flex items-center gap-2 rounded-xl border border-ink-200 bg-white px-3.5 py-2 text-sm font-medium text-ink-700 hover:bg-ink-50"
          >
            <HelpCircle className="h-4 w-4" />
            Help
          </button>
        </div>
      </div>
    </header>
  );
}
