import { useEffect, useRef } from 'react';
import goongjs from '@goongmaps/goong-js';
import '@goongmaps/goong-js/dist/goong-js.css';

const MAPTILES_KEY = import.meta.env.VITE_GOONG_MAPTILES_KEY;
const STYLE_URL = 'https://tiles.goong.io/assets/goong_map_web.json';

export default function ListingMap({ latitude, longitude, className = 'h-56 w-full' }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current || !MAPTILES_KEY || latitude == null || longitude == null) return;

    goongjs.accessToken = MAPTILES_KEY;
    const map = new goongjs.Map({
      container: containerRef.current,
      style: STYLE_URL,
      center: [longitude, latitude],
      zoom: 15,
    });
    map.addControl(new goongjs.NavigationControl(), 'top-right');
    new goongjs.Marker({ color: '#e11d48' }).setLngLat([longitude, latitude]).addTo(map);

    return () => map.remove();
  }, [latitude, longitude]);

  if (latitude == null || longitude == null) {
    return (
      <div
        className={`${className} flex items-center justify-center rounded-2xl bg-gradient-to-br from-rose-100 via-rose-50 to-white text-sm text-rose-700`}
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
