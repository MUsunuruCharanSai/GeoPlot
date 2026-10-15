import { useEffect } from 'react';
import {
  Circle,
  MapContainer,
  Marker,
  Polygon,
  Polyline,
  TileLayer,
  Tooltip,
  useMap,
  useMapEvents,
} from 'react-leaflet';
import { Layers2 } from 'lucide-react';
import {
  BASEMAPS,
  DEFAULT_BASEMAP,
  clampFlyToZoom,
  clampMapZoom,
  getBasemap,
} from '../config/mapProviders.js';
import { createNumberedIcon, createUserLocationIcon } from '../utils/leafletIcons.js';
import 'leaflet/dist/leaflet.css';

const DEFAULT_CENTER = [20.5937, 78.9629];
const DEFAULT_ZOOM = 5;

function MapClickHandler({ enabled, onMapClick }) {
  useMapEvents({
    click(e) {
      if (!enabled) return;
      onMapClick?.({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

function MapFlyTo({ target, basemapId }) {
  const map = useMap();

  useEffect(() => {
    if (!target) return;
    const zoom = target.zoom ?? Math.max(map.getZoom(), 15);
    // Land a bit below max zoom so the user can still zoom in manually
    const nextZoom = clampFlyToZoom(Math.min(zoom, map.getMaxZoom()), basemapId);
    map.stop();
    map.invalidateSize({ animate: false });

    if (target.instant || (target.duration != null && target.duration < 0.45)) {
      map.setView([target.lat, target.lng], nextZoom, { animate: true });
    } else {
      map.flyTo([target.lat, target.lng], nextZoom, {
        duration: target.duration ?? 0.7,
      });
    }
  }, [
    map,
    basemapId,
    target?.requestId,
    target?.lat,
    target?.lng,
    target?.zoom,
    target?.instant,
    target?.duration,
  ]);

  return null;
}

function FollowUser({ enabled, position, basemapId }) {
  const map = useMap();

  useEffect(() => {
    if (!enabled || !position) return;
    const zoom = clampMapZoom(Math.max(map.getZoom(), 18), basemapId);
    map.panTo([position.lat, position.lng], { animate: true, duration: 0.35 });
    if (map.getZoom() < 17) {
      map.setZoom(zoom);
    }
  }, [basemapId, enabled, map, position]);

  return null;
}

function MapInvalidateSize() {
  const map = useMap();

  useEffect(() => {
    const node = map.getContainer();
    const observer = new ResizeObserver(() => {
      map.invalidateSize({ debounceMoveStart: true });
    });
    observer.observe(node);
    const t = setTimeout(() => map.invalidateSize(), 150);
    return () => {
      observer.disconnect();
      clearTimeout(t);
    };
  }, [map]);

  return null;
}

function MaxZoomSync({ maxZoom }) {
  const map = useMap();
  useEffect(() => {
    map.setMaxZoom(maxZoom);
    if (map.getZoom() > maxZoom) {
      map.setZoom(maxZoom);
    }
  }, [map, maxZoom]);
  return null;
}

function DraggableBoundaryMarker({ point, index, editable, onMove }) {
  return (
    <Marker
      position={[point.lat, point.lng]}
      draggable={editable}
      icon={createNumberedIcon(index + 1)}
      eventHandlers={{
        dragend: (e) => {
          const { lat, lng } = e.target.getLatLng();
          onMove?.(point.id, lat, lng);
        },
      }}
    >
      <Tooltip direction="top" offset={[0, -10]} opacity={0.95}>
        Point {index + 1}
        {typeof point.accuracy === 'number' ? ` · GPS ±${Math.round(point.accuracy)} m` : ''}
      </Tooltip>
    </Marker>
  );
}

function BasemapSwitcher({ basemapId, onChange }) {
  return (
    <div className="absolute right-3 top-3 z-[500] flex flex-col gap-1 rounded-xl border border-ink-200 bg-white/95 p-1 shadow-soft backdrop-blur">
      <div className="flex items-center gap-1 px-2 pt-1 text-[10px] font-semibold uppercase tracking-wide text-ink-500">
        <Layers2 className="h-3 w-3" aria-hidden />
        Map
      </div>
      {Object.values(BASEMAPS).map((layer) => {
        const active = basemapId === layer.id;
        return (
          <button
            key={layer.id}
            type="button"
            title={layer.description}
            onClick={() => onChange(layer.id)}
            className={`rounded-lg px-2.5 py-1.5 text-left text-xs font-medium ${
              active
                ? 'bg-brand-600 text-white'
                : 'text-ink-700 hover:bg-ink-100'
            }`}
          >
            {layer.name}
          </button>
        );
      })}
    </div>
  );
}

export default function MapView({
  points,
  mode,
  drawingEnabled,
  walkPath,
  walkStatus,
  userLocation,
  flyTo,
  onMapClick,
  onPointMove,
  basemapId = DEFAULT_BASEMAP,
  onBasemapChange,
}) {
  const tiles = getBasemap(basemapId);
  const mapMaxZoom = tiles.maxZoom || 21;
  const nativeZoom = tiles.maxNativeZoom || mapMaxZoom;
  const subdomains = tiles.subdomains || ['a', 'b', 'c'];
  const latLngs = points.map((p) => [p.lat, p.lng]);
  const showPolygon = points.length >= 3;
  const showOpenLine = points.length >= 2 && !showPolygon;
  const walkLatLngs = (walkPath || []).map((p) => [p.lat, p.lng]);
  const editable = mode === 'manual' || walkStatus === 'finished';
  const followWalking = walkStatus === 'walking' && !!userLocation;

  return (
    <div
      className={`relative z-0 h-full w-full overflow-hidden rounded-none lg:rounded-2xl lg:border lg:border-ink-200 ${
        drawingEnabled ? 'geoplot-crosshair' : ''
      }`}
    >
      <MapContainer
        center={DEFAULT_CENTER}
        zoom={DEFAULT_ZOOM}
        maxZoom={mapMaxZoom}
        zoomSnap={0.25}
        zoomDelta={0.5}
        wheelPxPerZoomLevel={80}
        className="h-full w-full"
        zoomControl
        attributionControl
      >
        <TileLayer
          key={`${tiles.id}-base-${tiles.url}`}
          url={tiles.url}
          attribution={tiles.attribution}
          maxZoom={mapMaxZoom}
          maxNativeZoom={nativeZoom}
          subdomains={subdomains}
        />

        {(tiles.overlays || []).map((overlay) => (
          <TileLayer
            key={`${tiles.id}-${overlay.id}`}
            url={overlay.url}
            attribution={overlay.attribution || tiles.attribution}
            maxZoom={overlay.maxZoom || mapMaxZoom}
            maxNativeZoom={overlay.maxNativeZoom || nativeZoom}
            subdomains={overlay.subdomains || subdomains}
            opacity={overlay.opacity ?? 1}
            zIndex={400}
          />
        ))}
        <MaxZoomSync maxZoom={mapMaxZoom} />
        <MapInvalidateSize />
        <MapFlyTo target={flyTo} basemapId={basemapId} />
        <FollowUser enabled={followWalking} position={userLocation} basemapId={basemapId} />
        <MapClickHandler enabled={drawingEnabled} onMapClick={onMapClick} />

        {showOpenLine && (
          <Polyline
            positions={latLngs}
            pathOptions={{ color: '#2f7a42', weight: 3, opacity: 0.95 }}
          />
        )}

        {showPolygon && (
          <Polygon
            positions={latLngs}
            pathOptions={{
              color: '#f8faf8',
              weight: 2.5,
              fillColor: '#3f9654',
              fillOpacity: basemapId === 'streets' ? 0.28 : 0.35,
              opacity: 0.95,
            }}
          />
        )}

        {walkLatLngs.length >= 2 && walkStatus !== 'finished' && (
          <Polyline
            positions={walkLatLngs}
            pathOptions={{
              color: '#38bdf8',
              weight: 4,
              opacity: 0.9,
              dashArray: '8 6',
            }}
          />
        )}

        {points.map((point, index) => (
          <DraggableBoundaryMarker
            key={point.id}
            point={point}
            index={index}
            editable={editable && walkStatus !== 'walking' && walkStatus !== 'paused'}
            onMove={onPointMove}
          />
        ))}

        {userLocation && (
          <>
            <Marker
              position={[userLocation.lat, userLocation.lng]}
              icon={createUserLocationIcon()}
              zIndexOffset={1000}
            >
              <Tooltip permanent direction="right" offset={[12, 0]} opacity={0.95}>
                You
                {typeof userLocation.accuracy === 'number'
                  ? ` · ±${Math.round(userLocation.accuracy)} m`
                  : ''}
              </Tooltip>
            </Marker>
            {typeof userLocation.accuracy === 'number' && userLocation.accuracy > 0 && (
              <Circle
                center={[userLocation.lat, userLocation.lng]}
                radius={userLocation.accuracy}
                pathOptions={{
                  color: '#38bdf8',
                  weight: 1,
                  fillColor: '#0ea5e9',
                  fillOpacity: 0.1,
                }}
              />
            )}
          </>
        )}
      </MapContainer>

      {onBasemapChange && (
        <BasemapSwitcher basemapId={basemapId} onChange={onBasemapChange} />
      )}

    </div>
  );
}
