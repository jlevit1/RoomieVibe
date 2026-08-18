import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getListing } from '../services/listingService';
import { AMENITY_LABELS } from '../constants/amenities';

function formatPrice(price) {
  return new Intl.NumberFormat('vi-VN').format(price) + ' đ/tháng';
}

export default function ListingDetail() {
  const { id } = useParams();
  const [listing, setListing] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    getListing(id)
      .then(setListing)
      .catch((err) => setError(err.response?.data?.message || 'Không tìm thấy tin đăng'));
  }, [id]);

  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-10">
        <p className="text-red-600">{error}</p>
        <Link to="/" className="text-rose-600 hover:underline">
          Quay lại trang tìm phòng
        </Link>
      </div>
    );
  }

  if (!listing) {
    return <div className="mx-auto max-w-3xl px-6 py-10 text-gray-500">Đang tải...</div>;
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <h1 className="mb-2 text-2xl font-bold text-gray-900">{listing.title}</h1>
      <p className="mb-4 text-2xl font-bold text-rose-600">{formatPrice(listing.price)}</p>

      <div className="mb-6 h-72 overflow-hidden rounded-lg bg-gray-100">
        {listing.imageUrls?.[0] ? (
          <img
            src={listing.imageUrls[0]}
            alt={listing.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-gray-400">Chưa có ảnh</div>
        )}
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 rounded-lg border border-gray-200 p-4 text-sm sm:grid-cols-4">
        <div>
          <p className="text-gray-500">Diện tích</p>
          <p className="font-medium">{listing.area} m²</p>
        </div>
        <div>
          <p className="text-gray-500">Số người tối đa</p>
          <p className="font-medium">{listing.maxOccupants ?? '-'}</p>
        </div>
        <div>
          <p className="text-gray-500">Khu vực</p>
          <p className="font-medium">
            {listing.district}, {listing.city}
          </p>
        </div>
        <div>
          <p className="text-gray-500">Liên hệ</p>
          <p className="font-medium">{listing.contactPhone}</p>
        </div>
      </div>

      <div className="mb-6">
        <h2 className="mb-2 font-semibold text-gray-900">Địa chỉ</h2>
        <p className="text-gray-700">{listing.address}</p>
      </div>

      <div className="mb-6">
        <h2 className="mb-2 font-semibold text-gray-900">Mô tả</h2>
        <p className="whitespace-pre-line text-gray-700">{listing.description}</p>
      </div>

      {listing.amenities?.length > 0 && (
        <div className="mb-6">
          <h2 className="mb-2 font-semibold text-gray-900">Tiện ích</h2>
          <div className="flex flex-wrap gap-2">
            {listing.amenities.map((a) => (
              <span
                key={a}
                className="rounded-full bg-rose-50 px-3 py-1 text-sm text-rose-700"
              >
                {AMENITY_LABELS[a] || a}
              </span>
            ))}
          </div>
        </div>
      )}

      <p className="text-xs text-gray-400">Mã tin: #{listing.id} · {listing.viewCount} lượt xem</p>
    </div>
  );
}
