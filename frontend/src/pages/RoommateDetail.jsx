import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Phone, Cigarette, PawPrint, UtensilsCrossed, MessageCircle } from 'lucide-react';
import { getProfileById } from '../services/roommateService';
import { getOrCreateRoommateConversation } from '../services/chatService';
import FavoriteButton from '../components/FavoriteButton';
import { useFavorites } from '../hooks/useFavorites';
import { useAuth } from '../context/AuthContext';
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

function buildHabits(profile) {
  return [
    {
      Icon: Cigarette,
      active: profile.smokes,
      onLabel: 'Hút thuốc',
      offLabel: 'Không hút thuốc',
    },
    {
      Icon: Cigarette,
      active: profile.acceptsSmoking,
      onLabel: 'Chấp nhận bạn ghép hút thuốc',
      offLabel: 'Không chấp nhận hút thuốc',
    },
    {
      Icon: PawPrint,
      active: profile.hasPet,
      onLabel: 'Đang nuôi thú cưng',
      offLabel: 'Không nuôi thú cưng',
    },
    {
      Icon: PawPrint,
      active: profile.acceptsPets,
      onLabel: 'Chấp nhận thú cưng',
      offLabel: 'Không chấp nhận thú cưng',
    },
    {
      Icon: UtensilsCrossed,
      active: profile.cooksAtHome,
      onLabel: 'Thường nấu ăn tại nhà',
      offLabel: 'Ít khi nấu ăn tại nhà',
    },
  ];
}

export default function RoommateDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const roommateFavorites = useFavorites('roommate');
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState('');
  const [activeImage, setActiveImage] = useState(0);
  const [messaging, setMessaging] = useState(false);

  useEffect(() => {
    getProfileById(id)
      .then(setProfile)
      .catch((err) => setError(err.response?.data?.message || 'Không tìm thấy hồ sơ'));
  }, [id]);

  async function handleMessage() {
    if (!user) {
      navigate('/login');
      return;
    }
    setMessaging(true);
    try {
      const conversation = await getOrCreateRoommateConversation(profile.id);
      navigate(`/messages/${conversation.id}`);
    } finally {
      setMessaging(false);
    }
  }

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
  const compatibilityCta = user
    ? { to: '/roommates/profile', label: 'Tạo hồ sơ để xem % phù hợp' }
    : { to: '/login', label: 'Đăng nhập để xem % phù hợp' };

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
          <div className="relative mb-3 h-80 overflow-hidden rounded-2xl bg-gray-100">
            {!profile.own && (
              <FavoriteButton
                className="absolute right-3 top-3 z-10"
                favorited={roommateFavorites.isFavorited(profile.id)}
                onToggle={() => roommateFavorites.toggle(profile.id)}
              />
            )}
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
                  className={`h-16 w-24 flex-shrink-0 overflow-hidden rounded-xl border-2 ${
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
                    to={compatibilityCta.to}
                    className="flex-shrink-0 whitespace-nowrap rounded-full border border-rose-200 px-3 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50"
                  >
                    {compatibilityCta.label}
                  </Link>
                )
              )}
            </div>
            <p className="mb-3 text-gray-500">
              {(profile.districts || []).join(', ') || profile.city}, {profile.city}
            </p>
            <p className="text-2xl font-bold text-rose-600">{formatBudget(profile.budget)}</p>
          </div>

          <div className="mb-6 grid grid-cols-2 gap-4 rounded-2xl border border-gray-200 p-4 text-sm sm:grid-cols-4">
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

          <div className="mb-6">
            <h2 className="mb-2 font-semibold text-gray-900">Sở thích &amp; thói quen</h2>
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {buildHabits(profile).map(({ Icon, active, onLabel, offLabel }) => (
                <div
                  key={onLabel}
                  className="flex items-center gap-2.5 rounded-xl border border-gray-200 px-3.5 py-2.5"
                >
                  <span
                    className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${
                      active ? 'bg-rose-50 text-rose-600' : 'bg-gray-100 text-gray-400'
                    }`}
                  >
                    <Icon size={15} />
                  </span>
                  <span className={`text-sm ${active ? 'font-medium text-gray-900' : 'text-gray-500'}`}>
                    {active ? onLabel : offLabel}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {profile.bio && (
            <div className="mb-6">
              <h2 className="mb-2 font-semibold text-gray-900">Giới thiệu</h2>
              <p className="whitespace-pre-line text-gray-700">{profile.bio}</p>
            </div>
          )}

          <div>
            <h2 className="mb-2 font-semibold text-gray-900">Vị trí</h2>
            <div className="flex h-56 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-100 via-rose-50 to-white text-sm text-rose-700">
              Bản đồ sẽ sớm ra mắt
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="sticky top-4 space-y-3 rounded-2xl border border-gray-200 p-5">
            <p className="text-sm text-gray-500">Liên hệ</p>
            <p className="font-semibold text-gray-900">{profile.fullName}</p>
            <p className="flex items-center gap-2 text-lg font-bold text-rose-600">
              <Phone size={18} /> {profile.contactPhone}
            </p>
            <a
              href={`tel:${profile.contactPhone}`}
              className="block w-full rounded-full bg-rose-600 py-2.5 text-center text-sm font-medium text-white transition-all hover:bg-rose-700 active:scale-[0.98]"
            >
              Gọi ngay
            </a>
            {!profile.own && (
              <button
                type="button"
                onClick={handleMessage}
                disabled={messaging}
                className="flex w-full items-center justify-center gap-1.5 rounded-full border border-rose-600 py-2.5 text-sm font-medium text-rose-600 transition-colors hover:bg-rose-50 disabled:opacity-60"
              >
                <MessageCircle size={16} /> Nhắn tin
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
