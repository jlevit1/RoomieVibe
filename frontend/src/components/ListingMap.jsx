import { useEffect, useRef, useState } from 'react';
import goongjs from '@goongmaps/goong-js';
import '@goongmaps/goong-js/dist/goong-js.css';

const MAPTILES_KEY = import.meta.env.VITE_GOONG_MAPTILES_KEY;
const STYLE_URL = 'https://tiles.goong.io/assets/goong_map_web.json';
const ROUTE_SOURCE = 'route';
const ROUTE_LAYER = 'route-line';

export default function ListingMap({ latitude, longitude, route = null, className = 'h-56 w-full' }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    if (!containerRef.current || !MAPTILES_KEY || latitude == null || longitude == null) return undefined;

    goongjs.accessToken = MAPTILES_KEY;
    const map = new goongjs.Map({
      container: containerRef.current,
      style: STYLE_URL,
      center: [longitude, latitude],
      zoom: 15,
    });
    map.addControl(new goongjs.NavigationControl(), 'top-right');
    new goongjs.Marker({ color: '#2563eb' }).setLngLat([longitude, latitude]).addTo(map);
    mapRef.current = map;
    map.once('load', () => setMapReady(true));

    return () => {
      mapRef.current = null;
      setMapReady(false);
      map.remove();
    };
  }, [latitude, longitude]);

  useEffect(() => {
    const map = mapRef.current;
    if (!mapReady || !map || !route) return undefined;

    map.addSource(ROUTE_SOURCE, {
      type: 'geojson',
      data: { type: 'Feature', geometry: { type: 'LineString', coordinates: route.coordinates } },
    });
    map.addLayer({
      id: ROUTE_LAYER,
      type: 'line',
      source: ROUTE_SOURCE,
      layout: { 'line-join': 'round', 'line-cap': 'round' },
      paint: { 'line-color': '#2563eb', 'line-width': 5, 'line-opacity': 0.85 },
    });
    const originMarker = new goongjs.Marker({ color: '#16a34a' })
      .setLngLat([route.origin.longitude, route.origin.latitude])
      .addTo(map);

    const lngs = [...route.coordinates.map((c) => c[0]), longitude, route.origin.longitude];
    const lats = [...route.coordinates.map((c) => c[1]), latitude, route.origin.latitude];
    map.fitBounds(
      [
        [Math.min(...lngs), Math.min(...lats)],
        [Math.max(...lngs), Math.max(...lats)],
      ],
      { padding: 48, maxZoom: 16 },
    );

    return () => {
      originMarker.remove();
      // The map itself may already be gone if the listing changed at the same time.
      if (mapRef.current !== map) return;
      if (map.getLayer(ROUTE_LAYER)) map.removeLayer(ROUTE_LAYER);
      if (map.getSource(ROUTE_SOURCE)) map.removeSource(ROUTE_SOURCE);
    };
  }, [mapReady, route, latitude, longitude]);

  if (latitude == null || longitude == null) {
    return (
      <div
        className={`${className} flex items-center justify-center rounded-2xl bg-gradient-to-br from-blue-100 via-blue-50 to-white text-sm text-blue-700`}
      >
        Chưa có tọa độ cho vị trí này
      </div>
    );
  }

  if (!MAPTILES_KEY) {
    return (
      <div className={`${className} flex items-center justify-center rounded-2xl bg-gray-50 text-sm text-gray-500`}>
        Bản đồ chưa được cấu hình
      </div>
    );
  }

  return <div ref={containerRef} className={`${className} overflow-hidden rounded-2xl`} />;
}
