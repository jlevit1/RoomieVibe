import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Phone, Eye, Hash, MessageCircle } from 'lucide-react';
import { getListing } from '../services/listingService';
import { getOrCreateConversation } from '../services/chatService';
import { AMENITY_LABELS } from '../constants/amenities';
import { AMENITY_ICONS } from '../constants/amenityIcons';
import FavoriteButton from '../components/FavoriteButton';
import ReviewSection from '../components/ReviewSection';
import { useFavorites } from '../hooks/useFavorites';
import { useAuth } from '../context/AuthContext';

function formatPrice(price) {
  return new Intl.NumberFormat('vi-VN').format(price) + ' đ/tháng';
}

export default function ListingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const listingFavorites = useFavorites('listing');
  const [listing, setListing] = useState(null);
  const [error, setError] = useState('');
  const [activeImage, setActiveImage] = useState(0);
  const [messaging, setMessaging] = useState(false);

  useEffect(() => {
    getListing(id)
      .then(setListing)
      .catch((err) => setError(err.response?.data?.message || 'Không tìm thấy tin đăng'));
  }, [id]);

  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-10">
        <p className="text-red-600">{error}</p>
        <Link to="/" className="text-rose-600 hover:underline">
          Quay lại trang tìm phòng
        </Link>
      </div>
    );
  }

  if (!listing) {
    return <div className="mx-auto max-w-3xl px-6 py-10 text-gray-500">Đang tải...</div>;
  }

  const images = listing.imageUrls?.length > 0 ? listing.imageUrls : [];
  const isOwnListing = user?.userId === listing.landlordId;

  async function handleMessage() {
    if (!user) {
      navigate('/login');
      return;
    }
    setMessaging(true);
    try {
      const conversation = await getOrCreateConversation(listing.id);
      navigate(`/messages/${conversation.id}`);
    } finally {
      setMessaging(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-6">
      {/* Breadcrumb */}
      <div className="mb-3 text-sm text-gray-500">
        <Link to="/" className="hover:text-rose-600">
          Trang chủ
        </Link>{' '}
        / <Link to={`/search?city=${listing.city}`} className="hover:text-rose-600">{listing.city}</Link>{' '}
        / <Link to={`/search?district=${listing.district}`} className="hover:text-rose-600">{listing.district}</Link>{' '}
        / <span className="text-gray-700">{listing.title}</span>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Main content */}
        <div className="lg:col-span-2">
          {/* Gallery */}
          <div className="relative mb-3 h-80 overflow-hidden rounded-2xl bg-gray-100">
            <FavoriteButton
              className="absolute right-3 top-3 z-10"
              favorited={listingFavorites.isFavorited(listing.id)}
              onToggle={() => listingFavorites.toggle(listing.id)}
            />
            {images.length > 0 ? (
              <img
                src={images[activeImage]}
                alt={listing.title}
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

          {/* Title + basic info */}
          <div className="mb-6">
            <div className="mb-1 flex items-start justify-between gap-3">
              <h1 className="text-2xl font-bold text-gray-900">{listing.title}</h1>
            </div>
            <p className="mb-3 text-gray-500">{listing.address}, {listing.district}, {listing.city}</p>
            <p className="text-base font-bold text-rose-600">{formatPrice(listing.price)}</p>
          </div>

          {/* Highlights */}
          {listing.amenities?.length > 0 && (
            <div className="mb-6 grid grid-cols-2 gap-3 rounded-2xl border border-gray-200 p-4 sm:grid-cols-4">
              {listing.amenities.slice(0, 8).map((a) => {
                const Icon = AMENITY_ICONS[a];
                return (
                  <div key={a} className="flex items-center gap-2 text-sm text-gray-700">
                    {Icon && <Icon size={16} className="flex-shrink-0 text-rose-600" />}
                    {AMENITY_LABELS[a] || a}
                  </div>
                );
              })}
            </div>
          )}

          {/* Quick stats */}
          <div className="mb-6 grid grid-cols-2 gap-4 rounded-2xl border border-gray-200 p-4 text-sm sm:grid-cols-4">
            <div>
              <p className="text-gray-500">Diện tích</p>
              <p className="font-medium">{listing.area} m²</p>
            </div>
            <div>
              <p className="text-gray-500">Số người tối đa</p>
              <p className="font-medium">{listing.maxOccupants ?? '-'}</p>
            </div>
            <div>
              <p className="flex items-center gap-1 text-gray-500">
                <Hash size={13} /> Mã tin
              </p>
              <p className="font-medium">#{listing.id}</p>
            </div>
            <div>
              <p className="flex items-center gap-1 text-gray-500">
                <Eye size={13} /> Lượt xem
              </p>
              <p className="font-medium">{listing.viewCount}</p>
            </div>
          </div>

          {/* Description */}
          <div className="mb-6">
            <h2 className="mb-2 font-semibold text-gray-900">Về tin đăng này</h2>
            <p className="whitespace-pre-line text-gray-700">{listing.description}</p>
          </div>

          {/* Full amenities */}
          {listing.amenities?.length > 0 && (
            <div className="mb-6">
              <h2 className="mb-2 font-semibold text-gray-900">Tiện ích</h2>
              <div className="flex flex-wrap gap-2">
                {listing.amenities.map((a) => (
                  <span
                    key={a}
                    className="rounded-full bg-rose-50 px-3 py-1 text-sm text-rose-700"
                  >
                    {AMENITY_LABELS[a] || a}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Map placeholder */}
          <div>
            <h2 className="mb-2 font-semibold text-gray-900">Vị trí</h2>
            <div className="flex h-56 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-100 via-rose-50 to-white text-sm text-rose-700">
              Bản đồ sẽ sớm ra mắt
            </div>
          </div>
        </div>

        {/* Sticky contact card */}
        <div className="lg:col-span-1">
          <div className="sticky top-4 space-y-3 rounded-2xl border border-gray-200 p-5">
            <p className="text-sm text-gray-500">Liên hệ chủ nhà</p>
            <p className="font-semibold text-gray-900">{listing.landlordName}</p>
            <p className="flex items-center gap-2 text-lg font-bold text-rose-600">
              <Phone size={18} /> {listing.contactPhone}
            </p>
            <a
              href={`tel:${listing.contactPhone}`}
              className="block w-full rounded-full bg-rose-600 py-2.5 text-center text-sm font-medium text-white transition-all hover:bg-rose-700 active:scale-[0.98]"
            >
              Gọi ngay
            </a>
            {!isOwnListing && (
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

      <div className="mt-8 border-t border-gray-200 pt-8">
        <ReviewSection targetId={listing.id} hidden={isOwnListing} />
      </div>
    </div>
  );
}
