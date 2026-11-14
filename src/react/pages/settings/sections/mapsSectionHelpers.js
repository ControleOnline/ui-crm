/*
 * @agents Pure helpers for General Settings → Mapas (#360).
 * Coordinate parsing, static map URLs and shop primary-entry labels.
 */
import {
  SHOP_HOME_OPTION_FRANCHISE_LOCATOR,
  SHOP_HOME_OPTION_SALES,
} from '@controleonline/ui-common/src/react/utils/shopConfig';

export const PRIMARY_ENTRY_LABELS = {
  [SHOP_HOME_OPTION_SALES]: 'Vitrine do shop',
  [SHOP_HOME_OPTION_FRANCHISE_LOCATOR]: 'Mapa das franquias',
};

export const parseCoord = value => {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  const n = Number(value);
  if (!Number.isFinite(n) || Math.abs(n) < 0.000001) {
    return null;
  }
  return n;
};

export const resolveAddressCoords = address => {
  const lat = parseCoord(
    address?.latitude ??
      address?.lat ??
      address?.map?.latitude ??
      address?.map?.lat ??
      address?.geo?.latitude,
  );
  const lng = parseCoord(
    address?.longitude ??
      address?.lng ??
      address?.lon ??
      address?.map?.longitude ??
      address?.map?.lng ??
      address?.map?.lon ??
      address?.geo?.longitude,
  );
  if (lat === null || lng === null) {
    return null;
  }
  return {lat, lng};
};

export const buildStaticMapUrl = ({apiKey, markers, size = '640x320'}) => {
  if (!apiKey || !Array.isArray(markers) || markers.length === 0) {
    return null;
  }
  const markerParams = markers
    .slice(0, 40)
    .map(
      m =>
        `markers=color:red%7C${encodeURIComponent(`${m.lat},${m.lng}`)}`,
    )
    .join('&');
  const center = markers[0];
  return `https://maps.googleapis.com/maps/api/staticmap?size=${size}&maptype=roadmap&center=${center.lat},${center.lng}&zoom=${markers.length === 1 ? 14 : 11}&${markerParams}&key=${encodeURIComponent(apiKey)}`;
};

/** Fallback without Google key — OpenStreetMap static (multi-marker). */
export const buildOsmStaticMapUrl = (markers, size = '640x320') => {
  if (!Array.isArray(markers) || markers.length === 0) {
    return null;
  }
  const center = markers[0];
  const zoom = markers.length === 1 ? 14 : 11;
  const markerParams = markers
    .slice(0, 40)
    .map(m => `markers=${m.lat},${m.lng},red-pushpin`)
    .join('&');
  return `https://staticmap.openstreetmap.de/staticmap.php?center=${center.lat},${center.lng}&zoom=${zoom}&size=${size}&maptype=mapnik&${markerParams}`;
};

/** Interactive Leaflet map HTML for web iframe (no API key). */
export const buildLeafletMapHtml = markers => {
  if (!Array.isArray(markers) || markers.length === 0) {
    return '';
  }
  const points = markers.slice(0, 40).map(m => ({
    lat: Number(m.lat),
    lng: Number(m.lng),
    label: String(m.companyLabel || m.label || 'Franquia'),
  }));
  const center = points[0];
  const markersJs = points
    .map(
      p =>
        `L.marker([${p.lat}, ${p.lng}]).addTo(map).bindPopup(${JSON.stringify(
          p.label,
        )});`,
    )
    .join('\n');
  const fitJs =
    points.length > 1
      ? `map.fitBounds([${points
          .map(p => `[${p.lat}, ${p.lng}]`)
          .join(', ')}], {padding: [28, 28]});`
      : '';
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>
html,body{margin:0;padding:0;height:100%;width:100%;overflow:hidden;}
#map{position:absolute;inset:0;width:100%;height:100%;}
.leaflet-container{width:100%!important;height:100%!important;font:12px/1.4 system-ui,sans-serif;}
</style>
</head>
<body style="position:relative;width:100%;height:100%;">
<div id="map"></div>
<script>
var map = L.map('map').setView([${center.lat}, ${center.lng}], ${points.length === 1 ? 14 : 11});
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '&copy; OpenStreetMap'
}).addTo(map);
${markersJs}
${fitJs}
function resizeMap(){ map.invalidateSize(true); }
setTimeout(resizeMap, 0);
setTimeout(resizeMap, 100);
setTimeout(resizeMap, 400);
window.addEventListener('resize', resizeMap);
if (typeof ResizeObserver !== 'undefined') {
  new ResizeObserver(resizeMap).observe(document.getElementById('map'));
}
</script>
</body>
</html>`;
};
