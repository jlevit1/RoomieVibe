import { Link } from 'react-router-dom';
import { MapPin, Zap } from 'lucide-react';
import { AMENITY_LABELS } from '../constants/amenities';
import StarRating from './StarRating';
import FavoriteButton from './FavoriteButton';

function formatPrice(price) {
  return new Intl.NumberFormat('vi-VN').format(price);
}

export default function ListingListItem({ listing, featured = false, favorited, onToggleFavorite }) {
  return (
    <Link
      to={`/listings/${listing.id}`}
      className="group flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-3 transition-all duration-200 hover:border-gray-300 hover:shadow-[0_16px_32px_-20px_rgba(20,79,112,0.35)] sm:flex-row"
    >
      <div className="relative aspect-[4/3] w-full flex-shrink-0 overflow-hidden rounded-xl bg-gray-100 sm:aspect-auto sm:h-40 sm:w-56">
        {featured && (
          <span className="absolute left-2.5 top-2.5 z-10 flex items-center gap-1 rounded-full bg-amber-400 px-2.5 py-0.5 text-xs font-semibold text-amber-950">
            <Zap size={11} fill="currentColor" /> Nổi bật
          </span>
        )}
        {listing.imageUrls?.[0] ? (
          <img
            src={listing.imageUrls[0]}
            alt={listing.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-gray-400">Chưa có ảnh</div>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col py-1 sm:pr-2">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="line-clamp-2 font-semibold leading-snug text-gray-900 group-hover:text-blue-700">
              {listing.title}
            </h3>
            <p className="mt-1 flex items-center gap-1 text-sm text-gray-500">
              <MapPin size={14} className="flex-shrink-0 text-gray-400" />
              <span className="truncate">
                {listing.address ? `${listing.address}, ` : ''}
                {listing.district}, {listing.city}
              </span>
            </p>
          </div>
          <FavoriteButton className="flex-shrink-0 border border-gray-200" favorited={favorited} onToggle={onToggleFavorite} />
        </div>

        {listing.amenities?.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {listing.amenities.slice(0, 4).map((a) => (
              <span key={a} className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-700">
                {AMENITY_LABELS[a] || a}
              </span>
            ))}
          </div>
        )}

        <div className="mt-auto flex flex-wrap items-end justify-between gap-2 pt-3">
          <p>
            <span className="text-lg font-bold text-orange-600">{formatPrice(listing.price)}đ</span>
            <span className="text-sm font-medium text-orange-500">/tháng</span>
            {listing.area != null && <span className="ml-2 text-sm text-gray-500">{listing.area} m²</span>}
          </p>
          {listing.reviewCount > 0 && <StarRating rating={listing.averageRating} count={listing.reviewCount} />}
        </div>
      </div>
    </Link>
  );
}
