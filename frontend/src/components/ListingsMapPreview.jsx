import { useEffect, useRef, useState } from 'react';
import { Layers } from 'lucide-react';
import goongjs from '@goongmaps/goong-js';
import '@goongmaps/goong-js/dist/goong-js.css';

const MAPTILES_KEY = import.meta.env.VITE_GOONG_MAPTILES_KEY;
const STYLE_URLS = {
  street: 'https://tiles.goong.io/assets/goong_map_web.json',
  satellite: 'https://tiles.goong.io/assets/goong_satellite.json',
};
const SOURCE_ID = 'listing-points';

// goong-js rewrites the satellite raster tiles to tiles.goong.io/{z}/{x}/{y}.webp, which 404s and leaves the
// satellite view as bare labels. Point those requests back at the real imagery host.
const BROKEN_SATELLITE_TILE = /^https:\/\/tiles\.goong\.io\/(\d+)\/(\d+)\/(\d+)\.(?:webp|png|jpg)(?:\?|$)/;

function fixSatelliteTiles(url) {
  const match = BROKEN_SATELLITE_TILE.exec(url);
  if (!match) return { url };
  const [, z, x, y] = match;
  return { url: `https://satellite.goong.io/${z}/${x}/${y}.png?api_key=${MAPTILES_KEY}` };
}
const FOCUS_AREA_SOURCE = 'focus-area';

function escapeHtml(text) {
  return String(text)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function popupHtml(listing) {
  const price = new Intl.NumberFormat('vi-VN').format(listing.price);
  const thumb = listing.thumbnailUrl || listing.imageUrls?.[0];
  return `
    <a href="/listings/${listing.id}" style="display:block;min-width:180px;text-decoration:none;color:inherit;font-family:inherit">
      ${thumb ? `<img src="${escapeHtml(thumb)}" style="width:100%;height:96px;object-fit:cover;border-radius:8px 8px 0 0;display:block" />` : ''}
      <div style="padding:8px 10px">
        <p style="margin:0;font-size:12px;font-weight:600;color:#111827;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${escapeHtml(listing.title)}</p>
        <p style="margin:2px 0 0;font-size:13px;font-weight:700;color:#f97316">${price} đ/tháng</p>
      </div>
    </a>`;
}

const PRICE_MARKER_CLASS =
  'cursor-pointer rounded-full bg-white px-2.5 py-1 text-xs font-bold text-gray-900 shadow-md ring-1 ring-gray-300 transition-colors hover:z-10 hover:bg-gray-900 hover:text-white';

function shortPrice(price) {
  const value = Number(price);
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toLocaleString('vi-VN', { maximumFractionDigits: 1 })} tr`;
  }
  return `${Math.round(value / 1000)}k`;
}

function circlePolygon(latitude, longitude, radiusKm, steps = 64) {
  const latDelta = radiusKm / 110.574;
  const lngDelta = radiusKm / (111.32 * Math.cos((latitude * Math.PI) / 180));
  const ring = [];
  for (let i = 0; i <= steps; i++) {
    const theta = (i / steps) * 2 * Math.PI;
    ring.push([longitude + lngDelta * Math.cos(theta), latitude + latDelta * Math.sin(theta)]);
  }
  return { type: 'Feature', geometry: { type: 'Polygon', coordinates: [ring] } };
}

// Individual listing pins with click-to-preview popups - the flatmate.com-style
// "browse on a map" pattern.
//
// Uses a clustered GeoJSON source (native Mapbox-GL/goong-js feature) rather than plain
// Markers: the "latest" listings shown here can legitimately span the whole country (e.g.
// Hai Phong + Binh Duong + Can Tho on the same page), which forces a zoomed-out view where
// listings a few km apart in the same city would otherwise render as fully overlapping pins
// and look like markers are "missing". Clusters show a count bubble and split apart as the
// user zooms in.
// `focus` (optional): { latitude, longitude, name, radiusKm } - a searched place drawn with its search radius.
// `priceMarkers`: every listing shows as its own clickable price pill (no count bubbles).
export default function ListingsMapPreview({ listings, focus = null, priceMarkers = false, className = 'h-[420px] w-full' }) {
  const containerRef = useRef(null);
  const [styleMode, setStyleMode] = useState('street');

  useEffect(() => {
    if (!containerRef.current || !MAPTILES_KEY) return undefined;

    const points = listings.filter((l) => l.latitude != null && l.longitude != null);
    if (points.length === 0 && !focus) return undefined;

    goongjs.accessToken = MAPTILES_KEY;
    const center = focus ? [focus.longitude, focus.latitude] : [points[0].longitude, points[0].latitude];
    const map = new goongjs.Map({
      container: containerRef.current,
      style: STYLE_URLS[styleMode],
      center,
      zoom: 12,
      transformRequest: fixSatelliteTiles,
    });
    let focusMarker;
    map.addControl(new goongjs.NavigationControl(), 'top-right');

    let popup;
    const markerById = new Map();

    function fitTo(coords, padding, maxZoom) {
      const lngs = coords.map((c) => c[0]);
      const lats = coords.map((c) => c[1]);
      map.fitBounds(
        [
          [Math.min(...lngs), Math.min(...lats)],
          [Math.max(...lngs), Math.max(...lats)],
        ],
        { padding, maxZoom },
      );
    }

    function createPriceMarker(listing) {
      const el = document.createElement('button');
      el.type = 'button';
      el.className = PRICE_MARKER_CLASS;
      el.textContent = shortPrice(listing.price);
      el.setAttribute('aria-label', `${listing.title}, ${shortPrice(listing.price)}`);
      return new goongjs.Marker({ element: el })
        .setLngLat([listing.longitude, listing.latitude])
        .setPopup(new goongjs.Popup({ offset: 18, closeButton: false }).setHTML(popupHtml(listing)));
    }

    function addPriceMarkers() {
      points.forEach((listing) => markerById.set(listing.id, createPriceMarker(listing).addTo(map)));
    }

    function addClusters() {
      const geojson = {
        type: 'FeatureCollection',
        features: points.map((listing) => ({
          type: 'Feature',
          properties: { id: listing.id },
          geometry: { type: 'Point', coordinates: [listing.longitude, listing.latitude] },
        })),
      };

      map.addSource(SOURCE_ID, {
        type: 'geojson',
        data: geojson,
        cluster: true,
        clusterMaxZoom: 15,
        clusterRadius: 45,
      });

      map.addLayer({
        id: 'clusters',
        type: 'circle',
        source: SOURCE_ID,
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': '#1f84b8',
          'circle-radius': ['step', ['get', 'point_count'], 16, 5, 20, 15, 26],
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff',
        },
      });

      map.addLayer({
        id: 'cluster-count',
        type: 'symbol',
        source: SOURCE_ID,
        filter: ['has', 'point_count'],
        layout: {
          'text-field': ['get', 'point_count_abbreviated'],
          'text-size': 13,
          // Never let base-map labels hide the count.
          'text-allow-overlap': true,
          'text-ignore-placement': true,
        },
        paint: { 'text-color': '#ffffff' },
      });

      map.on('click', 'clusters', (e) => {
        const [feature] = map.queryRenderedFeatures(e.point, { layers: ['clusters'] });
        const clusterId = feature.properties.cluster_id;
        map.getSource(SOURCE_ID).getClusterExpansionZoom(clusterId, (err, zoom) => {
          if (err) return;
          map.easeTo({ center: feature.geometry.coordinates, zoom });
        });
      });
      map.on('mouseenter', 'clusters', () => { map.getCanvas().style.cursor = 'pointer'; });
      map.on('mouseleave', 'clusters', () => { map.getCanvas().style.cursor = ''; });

      map.addLayer({
        id: 'unclustered-point',
        type: 'circle',
        source: SOURCE_ID,
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-color': '#29a1db',
          'circle-radius': 9,
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff',
        },
      });

      map.on('click', 'unclustered-point', (e) => {
        const feature = e.features[0];
        const listing = points.find((p) => p.id === feature.properties.id);
        if (!listing) return;
        if (popup) popup.remove();
        popup = new goongjs.Popup({ offset: 12, closeButton: false })
          .setLngLat(feature.geometry.coordinates)
          .setHTML(popupHtml(listing))
          .addTo(map);
      });

      map.on('mouseenter', 'unclustered-point', () => { map.getCanvas().style.cursor = 'pointer'; });
      map.on('mouseleave', 'unclustered-point', () => { map.getCanvas().style.cursor = ''; });
    }

    // Draws the searched place with its radius and returns the circle's ring coordinates.
    function drawFocus() {
      const area = circlePolygon(focus.latitude, focus.longitude, focus.radiusKm);
      const beforeId = map.getLayer('clusters') ? 'clusters' : undefined;
      map.addSource(FOCUS_AREA_SOURCE, { type: 'geojson', data: area });
      map.addLayer(
        {
          id: 'focus-area-fill',
          type: 'fill',
          source: FOCUS_AREA_SOURCE,
          paint: { 'fill-color': '#e11d48', 'fill-opacity': 0.08 },
        },
        beforeId,
      );
      map.addLayer(
        {
          id: 'focus-area-outline',
          type: 'line',
          source: FOCUS_AREA_SOURCE,
          paint: { 'line-color': '#e11d48', 'line-width': 1.5, 'line-dasharray': [2, 2] },
        },
        beforeId,
      );
      focusMarker = new goongjs.Marker({ color: '#e11d48' })
        .setLngLat([focus.longitude, focus.latitude])
        .setPopup(new goongjs.Popup({ offset: 24, closeButton: false }).setText(focus.name))
        .addTo(map);
      return area.geometry.coordinates[0];
    }

    function setup() {
      // The satellite imagery already has roads and place names baked in; drawing the vector labels on top doubles them.
      if (styleMode === 'satellite') {
        map.getStyle().layers.forEach((layer) => {
          if (layer.type !== 'raster') map.setLayoutProperty(layer.id, 'visibility', 'none');
        });
      }
      if (priceMarkers) addPriceMarkers();
      else addClusters();

      const pointCoords = points.map((p) => [p.longitude, p.latitude]);
      if (focus) {
        fitTo([...drawFocus(), ...pointCoords], 40, 15);
      } else if (points.length > 1) {
        fitTo(pointCoords, priceMarkers ? 70 : 60, 14);
      }
    }

    if (map.loaded()) {
      setup();
    } else {
      map.once('load', setup);
    }

    return () => {
      map.off('load', setup);
      focusMarker?.remove();
      markerById.forEach((m) => m.remove());
      map.remove();
    };
  }, [listings, styleMode, focus, priceMarkers]);

  const hasPoints = listings.some((l) => l.latitude != null && l.longitude != null) || focus != null;

  if (!MAPTILES_KEY) {
    return (
      <div className={`${className} flex items-center justify-center rounded-2xl bg-gray-50 text-sm text-gray-500`}>
        Bản đồ chưa được cấu hình
      </div>
    );
  }

  if (!hasPoints) {
    return (
      <div className={`${className} flex items-center justify-center rounded-2xl bg-gray-50 text-sm text-gray-500`}>
        Chưa có tin đăng nào có tọa độ để hiển thị.
      </div>
    );
  }

  return (
    <div className={`${className} relative`}>
      <div ref={containerRef} className="h-full w-full overflow-hidden rounded-2xl border border-gray-200" />
      <button
        type="button"
        onClick={() => setStyleMode((m) => (m === 'street' ? 'satellite' : 'street'))}
        className="absolute left-2.5 top-2.5 z-10 flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-md transition-colors hover:border-blue-300 hover:text-blue-600"
      >
        <Layers size={13} />
        {styleMode === 'street' ? 'Vệ tinh' : 'Bản đồ thường'}
      </button>
    </div>
  );
}
