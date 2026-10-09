import { useState } from 'react';
import { Navigation, ExternalLink, LoaderCircle, Motorbike } from 'lucide-react';
import ListingMap from './ListingMap';
import { getDirections } from '../services/goongService';

function formatDistance(meters) {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toLocaleString('vi-VN', { maximumFractionDigits: 1 })} km`;
}

function formatDuration(seconds) {
  const minutes = Math.max(1, Math.round(seconds / 60));
  if (minutes < 60) return `${minutes} phút`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours} giờ ${rest} phút` : `${hours} giờ`;
}

function googleMapsDirectionsUrl(listing) {
  const destination =
    listing.latitude != null && listing.longitude != null
      ? `${listing.latitude},${listing.longitude}`
      : [listing.address, listing.ward, listing.district, listing.city].filter(Boolean).join(', ');
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}&travelmode=two-wheeler`;
}

export default function ListingLocation({ listing }) {
  const [route, setRoute] = useState(null);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState('');
  const hasCoords = listing.latitude != null && listing.longitude != null;

  function showRoute() {
    if (!navigator.geolocation) {
      setError('Trình duyệt của bạn không hỗ trợ định vị. Hãy mở Google Maps để xem đường đi.');
      return;
    }
    setLocating(true);
    setError('');
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const origin = { latitude: position.coords.latitude, longitude: position.coords.longitude };
        try {
          const result = await getDirections(origin, { latitude: listing.latitude, longitude: listing.longitude });
          if (!result) throw new Error('no route');
          setRoute({ ...result, origin });
        } catch {
          setError('Không tìm được đường đi từ vị trí của bạn. Hãy thử mở Google Maps.');
        } finally {
          setLocating(false);
        }
      },
      (geoError) => {
        setError(
          geoError.code === geoError.PERMISSION_DENIED
            ? 'Bạn chưa cho phép truy cập vị trí. Hãy bật quyền vị trí cho trang này hoặc mở Google Maps.'
            : 'Không lấy được vị trí hiện tại của bạn, thử lại sau nhé.',
        );
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-gray-900">Vị trí</h2>
        <div className="flex flex-wrap gap-2">
          {hasCoords && (
            <button type="button" onClick={showRoute} disabled={locating} className="btn-secondary py-2">
              {locating ? <LoaderCircle size={15} className="animate-spin" /> : <Navigation size={15} />}
              {route ? 'Cập nhật đường đi' : 'Chỉ đường từ vị trí của tôi'}
            </button>
          )}
          <a
            href={googleMapsDirectionsUrl(listing)}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary py-2"
          >
            <ExternalLink size={15} /> Mở Google Maps
          </a>
        </div>
      </div>

      {route && (
        <p className="mb-3 flex flex-wrap items-center gap-1.5 text-sm text-gray-700">
          <Motorbike size={16} className="text-blue-700" />
          Khoảng <span className="font-semibold">{formatDistance(route.distanceMeters)}</span> ·{' '}
          <span className="font-semibold">{formatDuration(route.durationSeconds)}</span> đi xe máy từ vị trí của bạn
        </p>
      )}
      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

      <ListingMap latitude={listing.latitude} longitude={listing.longitude} route={route} className="h-72 w-full" />
    </div>
  );
}
