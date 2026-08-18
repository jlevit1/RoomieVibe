import { Link } from 'react-router-dom';
import { getMockRating } from '../utils/mockData';
import StarRating from './StarRating';
import FavoriteButton from './FavoriteButton';

function formatPrice(price) {
  return new Intl.NumberFormat('vi-VN').format(price) + ' đ/tháng';
}

export default function ListingCard({ listing }) {
  const { rating, count } = getMockRating(listing.id);

  return (
    <Link
      to={`/listings/${listing.id}`}
      className="group block overflow-hidden rounded-xl border border-gray-200 bg-white transition-all duration-200 hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-lg"
    >
      <div className="relative flex h-44 items-center justify-center overflow-hidden bg-gray-100 text-gray-400">
        <FavoriteButton className="absolute right-2 top-2 z-10" />
        {listing.imageUrls?.[0] ? (
          <img
            src={listing.imageUrls[0]}
            alt={listing.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <span className="text-sm">Chưa có ảnh</span>
        )}
      </div>

      <div className="p-4">
        <div className="mb-1.5 flex items-start justify-between gap-2">
          <h3 className="line-clamp-2 font-semibold text-gray-900 group-hover:text-rose-600">
            {listing.title}
          </h3>
        </div>
        <div className="mb-1.5 flex items-center justify-between">
          <p className="text-lg font-bold text-rose-600">{formatPrice(listing.price)}</p>
          <StarRating rating={rating} count={count} />
        </div>
        <p className="text-sm text-gray-500">
          {listing.area} m² · {listing.district}, {listing.city}
        </p>
      </div>
    </Link>
  );
}
