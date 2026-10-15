import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Fix Vite/bundler breakage of Leaflet's default marker image paths
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

export function createNumberedIcon(number, { muted = false } = {}) {
  const bg = muted ? '#66766e' : '#2f7a42';
  return L.divIcon({
    className: 'geoplot-number-marker',
    html: `<div style="
      width:26px;height:26px;border-radius:999px;
      background:${bg};color:#fff;border:2px solid #fff;
      box-shadow:0 1px 4px rgba(0,0,0,.25);
      display:flex;align-items:center;justify-content:center;
      font:600 11px/1 'Source Sans 3',sans-serif;
    ">${number}</div>`,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
  });
}

export function createUserLocationIcon() {
  return L.divIcon({
    className: 'geoplot-user-marker',
    html: `<div style="position:relative;width:22px;height:22px;">
      <div style="
        position:absolute;inset:0;border-radius:999px;
        background:rgba(37,99,235,.25);
        animation:geoplot-pulse 1.6s ease-out infinite;
      "></div>
      <div style="
        position:absolute;left:3px;top:3px;width:16px;height:16px;border-radius:999px;
        background:#2563eb;border:3px solid #fff;
        box-shadow:0 1px 4px rgba(0,0,0,.35);
      "></div>
    </div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  });
}
