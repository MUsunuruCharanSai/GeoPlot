import { X } from 'lucide-react';

export default function AboutModal({ open, onClose }) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[2000] flex items-end justify-center bg-ink-900/40 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="about-title"
    >
      <button type="button" className="absolute inset-0" aria-label="Close" onClick={onClose} />
      <div className="relative max-h-[85vh] w-full max-w-lg overflow-auto rounded-2xl border border-ink-200 bg-white p-5 shadow-panel">
        <div className="flex items-start justify-between gap-3">
          <h2 id="about-title" className="text-lg font-semibold text-ink-900">
            About GeoPlot
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-ink-500 hover:bg-ink-100"
            aria-label="Close about"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-3 space-y-3 text-sm leading-relaxed text-ink-700">
          <p>
            GeoPlot is an open-source land measurement tool. Mark boundary points on the map or
            walk the perimeter with your phone&apos;s GPS. All calculations run on your device —
            we do not store your location on a server.
          </p>
          <p>
            <strong className="font-semibold text-ink-900">Accuracy disclaimer:</strong> Browser
            GPS and map-based measurements are approximate. They are not survey-grade and must not
            be used for legal boundaries, property deeds, or official surveys.
          </p>
          <p>
            Geolocation generally requires <strong className="font-semibold">HTTPS</strong> or{' '}
            <strong className="font-semibold">localhost</strong>. On a phone, use a secure tunnel
            or HTTPS host when testing Walk Around mode.
          </p>
          <p>
            Default basemap is <strong className="font-semibold">satellite imagery</strong> (Esri /
            Maxar and partners) so you can see real land features when zoomed in. Switch to Hybrid or
            Streets from the map layer control. Search uses Nominatim. Public tile servers are for
            light use — configure your own provider for heavy production traffic.
          </p>
          <p>
            Even in Precise walk mode, phone GPS typically lands within several metres — not
            centimetre survey accuracy.
          </p>
        </div>
      </div>
    </div>
  );
}
