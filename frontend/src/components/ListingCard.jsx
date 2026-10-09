import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, MapPin, Zap } from 'lucide-react';
import { AMENITY_LABELS } from '../constants/amenities';
import StarRating from './StarRating';
import FavoriteButton from './FavoriteButton';

function formatPrice(price) {
  return new Intl.NumberFormat('vi-VN').format(price);
}

function isNew(createdAt) {
  if (!createdAt) return false;
  const days = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24);
  return days <= 2;
}

function formatDistance(km) {
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toLocaleString('vi-VN', { maximumFractionDigits: 1 })} km`;
}

export default function ListingCard({ listing, favorited, onToggleFavorite }) {
  const [activeImage, setActiveImage] = useState(0);
  const images = listing.imageUrls || [];

  function selectImage(e, idx) {
    e.preventDefault();
    e.stopPropagation();
    setActiveImage(idx);
  }

  function stepImage(e, direction) {
    e.preventDefault();
    e.stopPropagation();
    setActiveImage((i) => (i + direction + images.length) % images.length);
  }

  return (
    <Link
      to={`/listings/${listing.id}`}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white transition-all duration-200 hover:border-gray-300 hover:shadow-[0_16px_32px_-20px_rgba(20,79,112,0.35)]"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
        <div className="absolute left-3 top-3 z-10 flex gap-1.5">
          {listing.promoted && (
            <span className="flex items-center gap-1 rounded-full bg-amber-400 px-2.5 py-0.5 text-xs font-semibold text-amber-950">
              <Zap size={11} fill="currentColor" /> Nổi bật
            </span>
          )}
          {isNew(listing.createdAt) && (
            <span className="rounded-full bg-white px-2.5 py-0.5 text-xs font-semibold text-gray-900">Mới</span>
          )}
        </div>
        {listing.status === 'DA_CHO_THUE' && (
          <div className="absolute inset-0 z-[5] flex items-center justify-center bg-gray-900/45">
            <span className="rounded-full bg-white/95 px-3 py-1 text-sm font-semibold text-gray-800">Đã cho thuê</span>
          </div>
        )}
        <FavoriteButton className="absolute right-3 top-3 z-10" favorited={favorited} onToggle={onToggleFavorite} />
        {images.length > 0 ? (
          <img
            src={images[activeImage]}
            alt={listing.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-gray-400">Chưa có ảnh</div>
        )}
        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={(e) => stepImage(e, -1)}
              aria-label="Ảnh trước"
              className="absolute left-2 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-gray-800 opacity-0 shadow transition-opacity group-hover:opacity-100"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              onClick={(e) => stepImage(e, 1)}
              aria-label="Ảnh sau"
              className="absolute right-2 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-gray-800 opacity-0 shadow transition-opacity group-hover:opacity-100"
            >
              <ChevronRight size={16} />
            </button>
            <div className="absolute bottom-2.5 left-1/2 z-10 flex -translate-x-1/2 gap-1">
              {images.map((img, idx) => (
                <button
                  key={img}
                  type="button"
                  onClick={(e) => selectImage(e, idx)}
                  aria-label={`Ảnh ${idx + 1}`}
                  className={`h-1.5 rounded-full transition-all ${
                    idx === activeImage ? 'w-4 bg-white' : 'w-1.5 bg-white/60 hover:bg-white/80'
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="line-clamp-2 font-semibold leading-snug text-gray-900 group-hover:text-blue-700">
          {listing.title}
        </h3>
        <p className="mt-1.5 flex items-center gap-1 text-sm text-gray-500">
          <MapPin size={14} className="flex-shrink-0 text-gray-400" />
          <span className="truncate">
            {listing.district}, {listing.city}
          </span>
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          {listing.distanceKm != null && (
            <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-800">
              Cách {formatDistance(listing.distanceKm)}
            </span>
          )}
          {listing.area != null && (
            <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-700">{listing.area} m²</span>
          )}
          {(listing.amenities || []).slice(0, 2).map((a) => (
            <span key={a} className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-700">
              {AMENITY_LABELS[a] || a}
            </span>
          ))}
        </div>

        <div className="mt-auto pt-4">
          <div className="flex items-end justify-between gap-2 border-t border-gray-100 pt-3">
            <p className="text-orange-600">
              <span className="text-lg font-bold">{formatPrice(listing.price)}đ</span>
              <span className="text-sm font-medium text-orange-500">/tháng</span>
            </p>
            {listing.reviewCount > 0 && <StarRating rating={listing.averageRating} count={listing.reviewCount} />}
          </div>
        </div>
      </div>
    </Link>
  );
}
