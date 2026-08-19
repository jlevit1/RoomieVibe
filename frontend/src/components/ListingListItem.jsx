import { Link } from 'react-router-dom';
import { MapPin } from 'lucide-react';
import { AMENITY_LABELS } from '../constants/amenities';
import { getMockRating } from '../utils/mockData';
import StarRating from './StarRating';
import FavoriteButton from './FavoriteButton';

function formatPrice(price) {
  return new Intl.NumberFormat('vi-VN').format(price) + ' đ/tháng';
}

export default function ListingListItem({ listing, featured = false }) {
  const { rating, count } = getMockRating(listing.id);

  return (
    <Link
      to={`/listings/${listing.id}`}
      className="group flex gap-4 rounded-2xl border border-gray-200 bg-white p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-lg"
    >
      <div className="relative h-32 w-44 flex-shrink-0 overflow-hidden rounded-xl bg-gray-100">
        {featured && (
          <span className="absolute left-2 top-2 rounded-full bg-gray-900/80 px-2.5 py-1 text-xs font-medium text-white">
            Tin nổi bật
          </span>
        )}
        {listing.imageUrls?.[0] ? (
          <img
            src={listing.imageUrls[0]}
            alt={listing.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-gray-400">
            Chưa có ảnh
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-start justify-between gap-2">
          <h3 className="truncate font-semibold text-gray-900 group-hover:text-rose-600">
            {listing.title}
          </h3>
          <StarRating rating={rating} count={count} />
        </div>
        <p className="mb-2 flex items-center gap-1 text-sm text-gray-500">
          <MapPin size={13} className="flex-shrink-0" />
          <span className="truncate">
            {listing.address ? `${listing.address}, ` : ''}
            {listing.district}, {listing.city}
          </span>
        </p>

        {listing.amenities?.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {listing.amenities.slice(0, 4).map((a) => (
              <span
                key={a}
                className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600"
              >
                {AMENITY_LABELS[a] || a}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-shrink-0 flex-col items-end justify-between text-right">
        <FavoriteButton />
        <div>
          <p className="text-xs text-gray-400">Giá thuê</p>
          <p className="text-base font-bold text-rose-600">{formatPrice(listing.price)}</p>
          <p className="text-xs text-gray-400">{listing.area} m²</p>
        </div>
        <span className="rounded-full bg-rose-600 px-3.5 py-1.5 text-sm font-medium text-white transition-colors group-hover:bg-rose-700">
          Xem chi tiết
        </span>
      </div>
    </Link>
  );
}
