import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, MapPin } from 'lucide-react';
import FavoriteButton from './FavoriteButton';
import { GENDER_LABELS, OCCUPATION_LABELS } from '../constants/roommate';

const STATUS_BADGE = {
  HAS_ROOM: { text: 'Đã có phòng', className: 'bg-emerald-600 text-white' },
  LOOKING_FOR_ROOM: { text: 'Đang tìm phòng', className: 'bg-white text-gray-900' },
};

function formatBudget(budget) {
  return new Intl.NumberFormat('vi-VN').format(budget);
}

function isNew(createdAt) {
  if (!createdAt) return false;
  const days = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24);
  return days <= 2;
}

export default function RoommateCard({ profile, favorited, onToggleFavorite }) {
  const p = profile;
  const isOwnProfile = p.own;
  const linkTo = isOwnProfile ? '/roommates/profile' : `/roommates/${p.id}`;
  const [activeImage, setActiveImage] = useState(0);
  const images = p.imageUrls || [];
  const status = STATUS_BADGE[p.status];

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
      className={`group flex h-full flex-col overflow-hidden rounded-2xl border bg-white transition-all duration-200 hover:shadow-[0_16px_32px_-20px_rgba(20,79,112,0.35)] ${
        isOwnProfile ? 'border-blue-600 ring-1 ring-blue-600' : 'border-gray-200 hover:border-gray-300'
      }`}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
        <div className="absolute left-3 top-3 z-10 flex gap-1.5">
          {isOwnProfile && (
            <span className="rounded-full bg-blue-700 px-2.5 py-0.5 text-xs font-semibold text-white">
              Hồ sơ của bạn
            </span>
          )}
          {status && (
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${status.className}`}>{status.text}</span>
          )}
          {!isOwnProfile && isNew(p.createdAt) && (
            <span className="rounded-full bg-white px-2.5 py-0.5 text-xs font-semibold text-gray-900">Mới</span>
          )}
        </div>
        {!isOwnProfile && (
          <FavoriteButton className="absolute right-3 top-3 z-10" favorited={favorited} onToggle={onToggleFavorite} />
        )}
        {images.length > 0 ? (
          <img
            src={images[activeImage]}
            alt={p.fullName}
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
        <div className="flex items-center justify-between gap-2">
          <h3 className="truncate font-semibold text-gray-900 group-hover:text-blue-700">{p.fullName}</h3>
          {!isOwnProfile && p.compatibilityScore != null && (
            <span className="flex-shrink-0 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-800">
              Hợp {p.compatibilityScore}%
            </span>
          )}
        </div>
        <p className="mt-1 text-sm text-gray-500">
          {[GENDER_LABELS[p.gender], OCCUPATION_LABELS[p.occupation]].filter(Boolean).join(' · ')}
        </p>
        <p className="mt-2 flex items-center gap-1 text-sm text-gray-500">
          <MapPin size={14} className="flex-shrink-0 text-gray-400" />
          <span className="truncate">{(p.districts || []).join(', ') || p.city}</span>
        </p>

        <div className="mt-auto pt-4">
          <div className="border-t border-gray-100 pt-3 text-orange-600">
            <span className="text-xs font-medium text-gray-500">Ngân sách </span>
            <span className="text-lg font-bold">{formatBudget(p.budget)}đ</span>
            <span className="text-sm font-medium text-orange-500">/tháng</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
