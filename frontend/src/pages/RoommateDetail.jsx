import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Phone,
  Cigarette,
  CigaretteOff,
  PawPrint,
  UtensilsCrossed,
  MessageCircle,
  UserRound,
  Briefcase,
  MoonStar,
  Sparkles,
} from 'lucide-react';
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
  return new Intl.NumberFormat('vi-VN').format(budget);
}

function buildHabits(profile) {
  return [
    { Icon: profile.smokes ? Cigarette : CigaretteOff, active: profile.smokes, onLabel: 'Hút thuốc', offLabel: 'Không hút thuốc' },
    {
      Icon: profile.acceptsSmoking ? Cigarette : CigaretteOff,
      active: profile.acceptsSmoking,
      onLabel: 'Chấp nhận bạn ghép hút thuốc',
      offLabel: 'Không chấp nhận hút thuốc',
    },
    { Icon: PawPrint, active: profile.hasPet, onLabel: 'Đang nuôi thú cưng', offLabel: 'Không nuôi thú cưng' },
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
  const [messageError, setMessageError] = useState('');

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
    setMessageError('');
    try {
      const conversation = await getOrCreateRoommateConversation(profile.id);
      navigate(`/messages/${conversation.id}`);
    } catch (err) {
      setMessageError(err.response?.data?.message || 'Không mở được cuộc trò chuyện, thử lại sau.');
    } finally {
      setMessaging(false);
    }
  }

  if (error) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center sm:px-6">
        <h1 className="page-title">Không tìm thấy hồ sơ này</h1>
        <p className="mt-2 text-gray-600">Hồ sơ có thể đã được ẩn hoặc xóa.</p>
        <Link to="/roommates" className="btn-primary mt-6">
          Xem hồ sơ khác
        </Link>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-12">
          <div className="aspect-[16/10] animate-pulse rounded-2xl bg-gray-100 lg:col-span-8" />
          <div className="h-64 animate-pulse rounded-2xl bg-gray-100 lg:col-span-4" />
        </div>
      </div>
    );
  }

  const images = profile.imageUrls?.length > 0 ? profile.imageUrls : [];
  const areas = profile.districts?.length > 0 ? profile.districts : [profile.city];
  const lifestyle = [
    { Icon: UserRound, label: 'Giới tính', value: GENDER_LABELS[profile.gender] },
    { Icon: Briefcase, label: 'Nghề nghiệp', value: OCCUPATION_LABELS[profile.occupation] },
    { Icon: MoonStar, label: 'Giờ giấc', value: SLEEP_LABELS[profile.sleepSchedule] },
    { Icon: Sparkles, label: 'Mức gọn gàng', value: CLEANLINESS_LABELS[profile.cleanliness] },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <nav aria-label="Breadcrumb" className="mb-5 flex items-center gap-1.5 text-sm text-gray-500">
        <Link to="/roommates" className="hover:text-gray-900">
          Ở ghép
        </Link>
        <span aria-hidden="true">/</span>
        <span className="text-gray-900">{profile.fullName}</span>
      </nav>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
        <div className="min-w-0 lg:col-span-8">
          <div className="relative aspect-[16/10] overflow-hidden rounded-2xl bg-gray-100">
            {!profile.own && (
              <FavoriteButton
                className="absolute right-4 top-4 z-10"
                favorited={roommateFavorites.isFavorited(profile.id)}
                onToggle={() => roommateFavorites.toggle(profile.id)}
              />
            )}
            {images.length > 0 ? (
              <img src={images[activeImage]} alt={profile.fullName} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-gray-400">Chưa có ảnh</div>
            )}
          </div>

          {images.length > 1 && (
            <div className="scrollbar-hide mt-3 flex gap-2 overflow-x-auto">
              {images.map((img, idx) => (
                <button
                  type="button"
                  key={img}
                  onClick={() => setActiveImage(idx)}
                  aria-label={`Xem ảnh ${idx + 1}`}
                  className={`h-16 w-24 flex-shrink-0 overflow-hidden rounded-xl transition-opacity ${
                    idx === activeImage ? 'ring-2 ring-gray-900 ring-offset-2' : 'opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}

          <div className="mt-8 border-b border-gray-200 pb-8">
            <p className="text-sm font-medium text-gray-500">{STATUS_LABELS[profile.status]}</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">{profile.fullName}</h1>
            <p className="mt-2 text-gray-600">
              Muốn ở: {areas.join(', ')}
              {profile.districts?.length > 0 ? `, ${profile.city}` : ''}
            </p>
          </div>

          <section className="border-b border-gray-200 py-8">
            <h2 className="text-lg font-semibold text-gray-900">Lối sống</h2>
            <dl className="mt-4 grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
              {lifestyle.map(({ Icon, label, value }) => (
                <div key={label} className="flex items-start gap-3">
                  <Icon size={18} className="mt-0.5 flex-shrink-0 text-blue-700" />
                  <div>
                    <dt className="text-sm text-gray-500">{label}</dt>
                    <dd className="mt-0.5 font-medium text-gray-900">{value || 'Chưa rõ'}</dd>
                  </div>
                </div>
              ))}
            </dl>
          </section>

          <section className="border-b border-gray-200 py-8">
            <h2 className="text-lg font-semibold text-gray-900">Thói quen</h2>
            <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {buildHabits(profile).map(({ Icon, active, onLabel, offLabel }) => (
                <li key={onLabel} className="flex items-center gap-3">
                  <Icon size={18} className="flex-shrink-0 text-blue-700" />
                  <span className="text-gray-900">{active ? onLabel : offLabel}</span>
                </li>
              ))}
            </ul>
          </section>

          {profile.bio && (
            <section className="py-8">
              <h2 className="text-lg font-semibold text-gray-900">Giới thiệu</h2>
              <p className="mt-3 whitespace-pre-line leading-relaxed text-gray-700">{profile.bio}</p>
            </section>
          )}
        </div>

        <aside className="lg:col-span-4">
          <div className="surface p-6 shadow-[0_24px_48px_-32px_rgba(20,79,112,0.4)] lg:sticky lg:top-24">
            <p className="text-sm text-gray-500">Ngân sách</p>
            <p className="text-orange-600">
              <span className="text-2xl font-bold">{formatBudget(profile.budget)}đ</span>
              <span className="font-medium text-orange-500">/tháng</span>
            </p>

            {profile.compatibilityScore != null ? (
              <p className="mt-4 rounded-xl bg-blue-50 px-4 py-3 text-sm text-blue-900">
                Hợp với bạn <span className="font-bold">{profile.compatibilityScore}%</span> về giờ giấc, thói quen
                và ngân sách.
              </p>
            ) : (
              !profile.own && (
                <p className="mt-4 rounded-xl bg-gray-50 px-4 py-3 text-sm text-gray-600">
                  <Link to={user ? '/roommates/profile' : '/login'} className="link-accent">
                    {user ? 'Tạo hồ sơ' : 'Đăng nhập'}
                  </Link>{' '}
                  để xem mức độ hợp nhau với người này.
                </p>
              )
            )}

            <div className="mt-5 space-y-2.5 border-t border-gray-100 pt-5">
              {!profile.own && (
                <button type="button" onClick={handleMessage} disabled={messaging} className="btn-primary w-full py-3">
                  <MessageCircle size={17} /> {messaging ? 'Đang mở...' : 'Nhắn tin'}
                </button>
              )}
              <a href={`tel:${profile.contactPhone}`} className="btn-secondary w-full py-3">
                <Phone size={16} /> {profile.contactPhone}
              </a>
              {messageError && <p className="text-sm text-red-600">{messageError}</p>}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
