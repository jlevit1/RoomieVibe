import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getMockRating } from '../utils/mockData';
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

export default function ListingCard({ listing, favorited, onToggleFavorite }) {
  const { rating, count } = getMockRating(listing.id);
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
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white transition-all duration-200 hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-lg"
    >
      <div className="relative flex h-44 items-center justify-center overflow-hidden bg-gray-100 text-gray-400">
        {isNew(listing.createdAt) && (
          <span className="absolute left-2 top-2 z-10 rounded-full bg-emerald-500 px-2.5 py-0.5 text-xs font-semibold text-white">
            Mới
          </span>
        )}
        <FavoriteButton
          className="absolute right-2 top-2 z-10"
          favorited={favorited}
          onToggle={onToggleFavorite}
        />
        {images.length > 0 ? (
          <img
            src={images[activeImage]}
            alt={listing.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <span className="text-sm">Chưa có ảnh</span>
        )}
        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={(e) => stepImage(e, -1)}
              aria-label="Ảnh trước"
              className="absolute left-2 top-1/2 z-10 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white opacity-0 transition-opacity hover:bg-black/60 group-hover:opacity-100"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              onClick={(e) => stepImage(e, 1)}
              aria-label="Ảnh sau"
              className="absolute right-2 top-1/2 z-10 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white opacity-0 transition-opacity hover:bg-black/60 group-hover:opacity-100"
            >
              <ChevronRight size={16} />
            </button>
            <div className="absolute bottom-2 left-1/2 z-10 flex -translate-x-1/2 gap-1">
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
        <div className="mb-2 flex items-start justify-between gap-2">
          <h3 className="line-clamp-2 font-semibold text-gray-900 group-hover:text-rose-600">
            {listing.title}
          </h3>
        </div>

        <div className="mb-3 flex flex-wrap items-center gap-1.5">
          <StarRating rating={rating} count={count} />
          {listing.area != null && (
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
              {listing.area} m²
            </span>
          )}
          {(listing.amenities || []).slice(0, 2).map((a) => (
            <span key={a} className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
              {AMENITY_LABELS[a] || a}
            </span>
          ))}
        </div>

        <div className="mt-auto flex items-center justify-between gap-2 border-t border-gray-100 pt-2.5 text-sm">
          <span className="min-w-0 truncate text-gray-500">
            {listing.district}, {listing.city}
          </span>
          <span className="flex-shrink-0 whitespace-nowrap text-rose-600">
            <span className="text-base font-bold">{formatPrice(listing.price)}</span>
            <span className="text-sm font-medium text-rose-500"> đ/tháng</span>
          </span>
        </div>
      </div>
    </Link>
  );
}
