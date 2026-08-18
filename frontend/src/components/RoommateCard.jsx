import { Link } from 'react-router-dom';
import FavoriteButton from './FavoriteButton';
import { STATUS_LABELS, GENDER_LABELS, OCCUPATION_LABELS } from '../constants/roommate';

function formatBudget(budget) {
  return new Intl.NumberFormat('vi-VN').format(budget) + ' đ/tháng';
}

function isNew(createdAt) {
  if (!createdAt) return false;
  const days = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24);
  return days <= 7;
}

export default function RoommateCard({ profile }) {
  const p = profile;
  const isOwnProfile = p.own;
  const linkTo = isOwnProfile ? '/roommates/profile' : `/roommates/${p.id}`;

  return (
    <Link
      to={linkTo}
      className={`group block overflow-hidden rounded-xl border bg-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg ${
        isOwnProfile ? 'border-rose-300 ring-1 ring-rose-100' : 'border-gray-200 hover:border-gray-300'
      }`}
    >
      <div className="relative flex h-40 items-center justify-center overflow-hidden bg-gray-100 text-gray-400">
        {isOwnProfile ? (
          <span className="absolute left-2 top-2 z-10 rounded-md bg-rose-600 px-2 py-0.5 text-xs font-semibold text-white">
            Hồ sơ của bạn
          </span>
        ) : (
          isNew(p.createdAt) && (
            <span className="absolute left-2 top-2 z-10 rounded-md bg-emerald-500 px-2 py-0.5 text-xs font-semibold text-white">
              Mới
            </span>
          )
        )}
        {!isOwnProfile && <FavoriteButton className="absolute right-2 top-2 z-10" />}
        {p.imageUrls?.[0] ? (
          <img
            src={p.imageUrls[0]}
            alt={p.fullName}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <span className="text-sm">Chưa có ảnh</span>
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
        <p className="mb-2 text-sm text-gray-500">
          {GENDER_LABELS[p.gender]} · {OCCUPATION_LABELS[p.occupation]}
        </p>
        <p className="mb-2 text-sm text-gray-600">{STATUS_LABELS[p.status]}</p>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">{(p.districts || []).join(', ') || p.city}</span>
          <span className="font-semibold text-rose-600">{formatBudget(p.budget)}</span>
        </div>
      </div>
    </Link>
  );
}
