/*
 * Static / Leaflet map URL helpers for franchise locator preview (MapsSection).
 */

const parseCoord = value => {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  const n = Number(value);
  if (!Number.isFinite(n) || Math.abs(n) < 0.000001) {
    return null;
  }
  return n;
};

const resolveAddressCoords = address => {
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

const buildStaticMapUrl = ({apiKey, markers, size = '640x320'}) => {
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
const buildOsmStaticMapUrl = (markers, size = '640x320') => {
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

/** Interactive Leaflet map HTML for web iframe (no API key).
 * Pass explicit width/height (px) so the map fills the iframe — % height
 * often resolves to 0/wrong size inside srcDoc iframes.
 */
const buildLeafletMapHtml = (markers, {width = 0, height = 360} = {}) => {
  if (!Array.isArray(markers) || markers.length === 0) {
    return '';
  }
  const points = markers.slice(0, 40).map(m => ({
    lat: Number(m.lat),
    lng: Number(m.lng),
    label: String(m.companyLabel || m.label || 'Franquia'),
  }));
  const center = points[0];
  const w = width > 0 ? Math.round(width) : 0;
  const h = height > 0 ? Math.round(height) : 360;
  const sizeCss =
    w > 0
      ? `html,body,#map{margin:0;padding:0;width:${w}px;height:${h}px;overflow:hidden;}`
      : `html,body{margin:0;padding:0;width:100%;height:100%;overflow:hidden;}#map{position:absolute;inset:0;width:100%;height:100%;}`;
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
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1"/>
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>
${sizeCss}
.leaflet-container{width:100%!important;height:100%!important;font:12px/1.4 system-ui,sans-serif;}
</style>
</head>
<body>
<div id="map"></div>
<script>
var map = L.map('map', {preferCanvas: false}).setView([${center.lat}, ${center.lng}], ${points.length === 1 ? 14 : 11});
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '&copy; OpenStreetMap'
}).addTo(map);
${markersJs}
${fitJs}
function resizeMap(){
  try {
    var el = document.getElementById('map');
    if (el && ${w} > 0) {
      el.style.width = '${w}px';
      el.style.height = '${h}px';
    }
    map.invalidateSize(true);
  } catch (e) {}
}
setTimeout(resizeMap, 0);
setTimeout(resizeMap, 50);
setTimeout(resizeMap, 200);
setTimeout(resizeMap, 500);
window.addEventListener('resize', resizeMap);
if (typeof ResizeObserver !== 'undefined') {
  new ResizeObserver(resizeMap).observe(document.body);
}
</script>
</body>
</html>`;
};



export {
  parseCoord,
  resolveAddressCoords,
  buildStaticMapUrl,
  buildOsmStaticMapUrl,
  buildLeafletMapHtml,
};
