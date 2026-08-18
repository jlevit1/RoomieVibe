import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Phone } from 'lucide-react';
import { getProfileById } from '../services/roommateService';
import FavoriteButton from '../components/FavoriteButton';
import {
  STATUS_LABELS,
  GENDER_LABELS,
  OCCUPATION_LABELS,
  SLEEP_LABELS,
  CLEANLINESS_LABELS,
} from '../constants/roommate';

function formatBudget(budget) {
  return new Intl.NumberFormat('vi-VN').format(budget) + ' đ/tháng';
}

export default function RoommateDetail() {
  const { id } = useParams();
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState('');
  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => {
    getProfileById(id)
      .then(setProfile)
      .catch((err) => setError(err.response?.data?.message || 'Không tìm thấy hồ sơ'));
  }, [id]);

  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-10">
        <p className="text-red-600">{error}</p>
        <Link to="/roommates" className="text-rose-600 hover:underline">
          Quay lại danh sách
        </Link>
      </div>
    );
  }

  if (!profile) {
    return <div className="mx-auto max-w-3xl px-6 py-10 text-gray-500">Đang tải...</div>;
  }

  const images = profile.imageUrls?.length > 0 ? profile.imageUrls : [];

  return (
    <div className="mx-auto max-w-6xl px-6 py-6">
      <div className="mb-3 text-sm text-gray-500">
        <Link to="/roommates" className="hover:text-rose-600">
          Tìm bạn ở ghép
        </Link>{' '}
        / <span className="text-gray-700">{profile.fullName}</span>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="relative mb-3 h-80 overflow-hidden rounded-xl bg-gray-100">
            <FavoriteButton className="absolute right-3 top-3 z-10" />
            {images.length > 0 ? (
              <img
                src={images[activeImage]}
                alt={profile.fullName}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-gray-400">
                Chưa có ảnh
              </div>
            )}
          </div>

          {images.length > 1 && (
            <div className="mb-6 flex gap-2 overflow-x-auto">
              {images.map((img, idx) => (
                <button
                  type="button"
                  key={img}
                  onClick={() => setActiveImage(idx)}
                  className={`h-16 w-24 flex-shrink-0 overflow-hidden rounded-md border-2 ${
                    idx === activeImage ? 'border-rose-600' : 'border-transparent'
                  }`}
                >
                  <img src={img} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}

          <div className="mb-6">
            <div className="mb-1 flex items-start justify-between gap-3">
              <h1 className="text-2xl font-bold text-gray-900">
                {profile.fullName} đang {STATUS_LABELS[profile.status].toLowerCase()}
              </h1>
              {profile.compatibilityScore != null ? (
                <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-rose-600 text-sm font-bold text-white">
                  {profile.compatibilityScore}%
                </span>
              ) : (
                !profile.own && (
                  <Link
                    to="/login"
                    className="flex-shrink-0 whitespace-nowrap rounded-full border border-rose-200 px-3 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50"
                  >
                    Đăng nhập để xem % phù hợp
                  </Link>
                )
              )}
            </div>
            <p className="mb-3 text-gray-500">
              {(profile.districts || []).join(', ') || profile.city}, {profile.city}
            </p>
            <p className="text-2xl font-bold text-rose-600">{formatBudget(profile.budget)}</p>
          </div>

          <div className="mb-6 grid grid-cols-2 gap-4 rounded-lg border border-gray-200 p-4 text-sm sm:grid-cols-4">
            <div>
              <p className="text-gray-500">Giới tính</p>
              <p className="font-medium">{GENDER_LABELS[profile.gender]}</p>
            </div>
            <div>
              <p className="text-gray-500">Nghề nghiệp</p>
              <p className="font-medium">{OCCUPATION_LABELS[profile.occupation]}</p>
            </div>
            <div>
              <p className="text-gray-500">Giờ giấc</p>
              <p className="font-medium">{SLEEP_LABELS[profile.sleepSchedule]}</p>
            </div>
            <div>
              <p className="text-gray-500">Gọn gàng</p>
              <p className="font-medium">{CLEANLINESS_LABELS[profile.cleanliness]}</p>
            </div>
          </div>

          <div className="mb-6 grid grid-cols-2 gap-3 rounded-lg border border-gray-200 p-4 text-sm sm:grid-cols-3">
            <span>{profile.smokes ? 'Có hút thuốc' : 'Không hút thuốc'}</span>
            <span>{profile.hasPet ? 'Có nuôi thú cưng' : 'Không nuôi thú cưng'}</span>
            <span>{profile.cooksAtHome ? 'Thường nấu ăn tại nhà' : 'Ít nấu ăn tại nhà'}</span>
          </div>

          {profile.bio && (
            <div className="mb-6">
              <h2 className="mb-2 font-semibold text-gray-900">Giới thiệu</h2>
              <p className="whitespace-pre-line text-gray-700">{profile.bio}</p>
            </div>
          )}

          <div>
            <h2 className="mb-2 font-semibold text-gray-900">Vị trí</h2>
            <div className="flex h-56 items-center justify-center rounded-lg bg-gradient-to-br from-rose-100 via-rose-50 to-white text-sm text-rose-700">
              🗺️ Bản đồ sẽ sớm ra mắt
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="sticky top-4 space-y-3 rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-500">Liên hệ</p>
            <p className="font-semibold text-gray-900">{profile.fullName}</p>
            <p className="flex items-center gap-2 text-lg font-bold text-rose-600">
              <Phone size={18} /> {profile.contactPhone}
            </p>
            <a
              href={`tel:${profile.contactPhone}`}
              className="block w-full rounded-md bg-rose-600 py-2.5 text-center text-sm font-medium text-white hover:bg-rose-700"
            >
              Gọi ngay
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
