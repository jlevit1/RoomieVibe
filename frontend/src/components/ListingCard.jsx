import { Link } from 'react-router-dom';

function formatPrice(price) {
  return new Intl.NumberFormat('vi-VN').format(price) + ' đ/tháng';
}

export default function ListingCard({ listing }) {
  return (
    <Link
      to={`/listings/${listing.id}`}
      className="block overflow-hidden rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
    >
      <div className="flex h-40 items-center justify-center bg-gray-100 text-gray-400">
        {listing.imageUrls?.[0] ? (
          <img
            src={listing.imageUrls[0]}
            alt={listing.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <span>Chưa có ảnh</span>
        )}
      </div>

      <div className="p-4">
        <h3 className="mb-1 line-clamp-2 font-semibold text-gray-900">{listing.title}</h3>
        <p className="mb-1 text-lg font-bold text-blue-600">{formatPrice(listing.price)}</p>
        <p className="text-sm text-gray-500">
          {listing.area} m² · {listing.district}, {listing.city}
        </p>
      </div>
    </Link>
  );
}
