import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import FavoriteButton from './FavoriteButton';
import { GENDER_LABELS, OCCUPATION_LABELS } from '../constants/roommate';

const STATUS_BADGE = {
  HAS_ROOM: { text: 'Đã có phòng', className: 'bg-emerald-50 text-emerald-700' },
  LOOKING_FOR_ROOM: { text: 'Đang tìm phòng', className: 'bg-amber-50 text-amber-700' },
};

function formatBudget(budget) {
  return new Intl.NumberFormat('vi-VN').format(budget) + ' đ/tháng';
}

function isNew(createdAt) {
  if (!createdAt) return false;
  const days = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24);
  return days <= 7;
}

export default function RoommateCard({ profile, favorited, onToggleFavorite }) {
  const p = profile;
  const isOwnProfile = p.own;
  const linkTo = isOwnProfile ? '/roommates/profile' : `/roommates/${p.id}`;
  const [activeImage, setActiveImage] = useState(0);
  const images = p.imageUrls || [];

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
      to={linkTo}
      className={`group block overflow-hidden rounded-2xl border bg-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg ${
        isOwnProfile ? 'border-rose-300 ring-1 ring-rose-100' : 'border-gray-200 hover:border-gray-300'
      }`}
    >
      <div className="relative flex h-40 items-center justify-center overflow-hidden bg-gray-100 text-gray-400">
        {isOwnProfile ? (
          <span className="absolute left-2 top-2 z-10 rounded-full bg-rose-600 px-2.5 py-0.5 text-xs font-semibold text-white">
            Hồ sơ của bạn
          </span>
        ) : (
          isNew(p.createdAt) && (
            <span className="absolute left-2 top-2 z-10 rounded-full bg-emerald-500 px-2.5 py-0.5 text-xs font-semibold text-white">
              Mới
            </span>
          )
        )}
        {!isOwnProfile && (
          <FavoriteButton
            className="absolute right-2 top-2 z-10"
            favorited={favorited}
            onToggle={onToggleFavorite}
          />
        )}
        {images.length > 0 ? (
          <img
            src={images[activeImage]}
            alt={p.fullName}
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

      <div className="p-4">
        <div className="mb-1 flex items-start justify-between gap-2">
          <h3 className="font-semibold text-gray-900 group-hover:text-rose-600">{p.fullName}</h3>
          {!isOwnProfile && p.compatibilityScore != null && (
            <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-rose-600 text-xs font-bold text-white">
              {p.compatibilityScore}%
            </span>
          )}
        </div>
        <div className="mb-3 flex flex-wrap items-center gap-1.5">
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE[p.status]?.className}`}
          >
            {STATUS_BADGE[p.status]?.text}
          </span>
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
            {GENDER_LABELS[p.gender]}
          </span>
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
            {OCCUPATION_LABELS[p.occupation]}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2 border-t border-gray-100 pt-2.5 text-sm">
          <span className="min-w-0 truncate text-gray-500">
            {(p.districts || []).join(', ') || p.city}
          </span>
          <span className="flex-shrink-0 whitespace-nowrap font-semibold text-rose-600">
            {formatBudget(p.budget)}
          </span>
        </div>
      </div>
    </Link>
  );
}
