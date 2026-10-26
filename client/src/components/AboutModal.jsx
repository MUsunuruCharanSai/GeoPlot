
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
      <button
        type="button"
        className="absolute inset-0"
        aria-label="Close dialog"
        onClick={onClose}
      />

      <div className="relative max-h-[85vh] w-full max-w-lg overflow-auto rounded-2xl border border-ink-200 bg-white p-5 shadow-panel">
        <div className="flex items-start justify-between gap-3">
          <h2
            id="about-title"
            className="text-lg font-semibold text-ink-900"
          >
            About GeoPlot
          </h2>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-ink-500 hover:bg-ink-100"
            aria-label="Close About dialog"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-3 space-y-3 text-sm leading-relaxed text-ink-700">
          <p>
            GeoPlot is an open-source land measurement tool designed
            to help you calculate land area and perimeter with ease.
            Mark boundary points directly on the map or walk along
            the perimeter using your phone's GPS. All measurements
            and calculations are processed on your device, and your
            location data is not stored on our servers.
          </p>

          <p>
            <strong className="font-semibold text-ink-900">
              Accuracy and Limitations:
            </strong>{' '}
            Map-based measurements and browser GPS readings are
            approximate and may vary depending on device capabilities,
            signal quality, terrain, and environmental conditions.
            GeoPlot is not a substitute for professional land surveying
            and should not be relied upon for legal property boundaries,
            land registration, property deeds, or official survey work.
          </p>

          <p>
            <strong className="font-semibold text-ink-900">
              Location Access Requirements:
            </strong>{' '}
            Browser geolocation generally requires a secure HTTPS
            connection or a local development environment such as
            localhost. To test Walk Around mode on your phone, access
            GeoPlot through an HTTPS-enabled deployment or a secure
            development tunnel.
          </p>

          <p>
            <strong className="font-semibold text-ink-900">
              Maps and Search:
            </strong>{' '}
            GeoPlot uses satellite imagery from Esri, Maxar, and their
            partners as its default basemap, allowing you to identify
            visible land features at higher zoom levels. You can switch
            between Hybrid and Streets views using the map layer
            controls. Location search is powered by Nominatim.
            Public map tile services are intended for limited usage;
            for high-traffic production deployments, configure a
            suitable map provider and comply with its usage policies.
          </p>

          <p>
            <strong className="font-semibold text-ink-900">
              Understanding GPS Precision:
            </strong>{' '}
            Even when using Precise Walk mode, a phone's GPS may have
            errors of several metres or more. Results depend on local
            conditions and should be treated as estimates rather than
            centimetre-level survey measurements.
          </p>
        </div>
      </div>
    </div>
  );
}
