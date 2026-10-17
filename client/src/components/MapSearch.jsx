import { Loader2, Search, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { searchPlaces, zoomForPlaceType } from '../utils/geocodeSearch.js';

/**
 * Place search — Photon + Nominatim, with India village / PIN-friendly query variants.
 */
export default function MapSearch({ onSelect, className = '' }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);
  const abortRef = useRef(null);
  const wrapRef = useRef(null);

  useEffect(() => {
    function onDocClick(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 3) {
      setResults([]);
      setError('');
      setLoading(false);
      return undefined;
    }

    const timer = setTimeout(async () => {
      if (abortRef.current) abortRef.current.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setLoading(true);
      setError('');

      try {
        const data = await searchPlaces(trimmed, { signal: controller.signal });
        setResults(data);
        setOpen(true);
        if (data.length === 0) {
          setError('No places found. Try the village name without PIN, or a nearby town.');
        }
      } catch (err) {
        if (err.name === 'AbortError') return;
        setResults([]);
        setError('Could not search right now. Check your internet and try again.');
      } finally {
        setLoading(false);
      }
    }, 350);

    return () => {
      clearTimeout(timer);
      if (abortRef.current) abortRef.current.abort();
    };
  }, [query]);

  function pick(result) {
    onSelect?.({
      lat: result.lat,
      lng: result.lng,
      label: result.label,
      zoom: zoomForPlaceType(result.type),
    });
    setQuery(result.label.split(',')[0] || result.label);
    setOpen(false);
  }

  return (
    <div ref={wrapRef} className={`relative z-[5002] ${className}`}>
      <label htmlFor="geoplot-search" className="sr-only">
        Search for a place
      </label>
      <div className="flex items-center gap-2 rounded-xl border border-ink-200 bg-white px-3 py-2 shadow-soft">
        {loading ? (
          <Loader2 className="h-4 w-4 shrink-0 animate-spin text-brand-600" aria-hidden />
        ) : (
          <Search className="h-4 w-4 shrink-0 text-ink-400" aria-hidden />
        )}
        <input
          id="geoplot-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => (results.length > 0 || error) && setOpen(true)}
          placeholder="Search village, place or PIN…"
          className="w-full min-w-0 bg-transparent text-sm text-ink-900 outline-none placeholder:text-ink-400"
          autoComplete="off"
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setResults([]);
              setError('');
              setOpen(false);
            }}
            className="rounded-md p-0.5 text-ink-400 hover:bg-ink-100 hover:text-ink-700"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {open && (results.length > 0 || error) && (
        <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-[6000] overflow-hidden rounded-xl border border-ink-200 bg-white shadow-panel">
          {error && results.length === 0 ? (
            <p className="px-3 py-2 text-sm text-ink-600">{error}</p>
          ) : (
            <ul className="max-h-64 overflow-auto py-1">
              {results.map((r) => (
                <li key={r.id}>
                  <button
                    type="button"
                    onClick={() => pick(r)}
                    className="w-full px-3 py-2 text-left text-sm text-ink-800 hover:bg-brand-50"
                  >
                    {r.label}
                  </button>
                </li>
              ))}
            </ul>
          )}
          <p className="border-t border-ink-100 px-3 py-1.5 text-[11px] text-ink-400">
            Place search · OpenStreetMap data
          </p>
        </div>
      )}
    </div>
  );
}
