import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Phone, MessageCircle, Zap, ShieldCheck } from 'lucide-react';
import { getListing, recordListingView } from '../services/listingService';
import { getOrCreateConversation } from '../services/chatService';
import { AMENITY_LABELS } from '../constants/amenities';
import { AMENITY_ICONS } from '../constants/amenityIcons';
import FavoriteButton from '../components/FavoriteButton';
import ReviewSection from '../components/ReviewSection';
import ListingLocation from '../components/ListingLocation';
import StarRating from '../components/StarRating';
import { useFavorites } from '../hooks/useFavorites';
import { useAuth } from '../context/AuthContext';

function formatPrice(price) {
  return new Intl.NumberFormat('vi-VN').format(price);
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
  const [messageError, setMessageError] = useState('');

  useEffect(() => {
    getListing(id)
      .then(setListing)
      .catch((err) => setError(err.response?.data?.message || 'Không tìm thấy tin đăng'));
  }, [id]);

  const loadedId = listing?.id;
  const landlordId = listing?.landlordId;
  useEffect(() => {
    // Landlords opening their own listing don't count as views.
    if (!loadedId || (user && user.userId === landlordId)) return;
    if (recordListingView(loadedId)) {
      setListing((prev) => (prev?.id === loadedId ? { ...prev, viewCount: (prev.viewCount || 0) + 1 } : prev));
    }
  }, [loadedId, landlordId, user]);

  if (error) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center sm:px-6">
        <h1 className="page-title">Không tìm thấy phòng này</h1>
        <p className="mt-2 text-gray-600">Tin có thể đã bị gỡ hoặc đang chờ duyệt.</p>
        <Link to="/search" className="btn-primary mt-6">
          Xem phòng khác
        </Link>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="h-6 w-64 animate-pulse rounded bg-gray-100" />
        <div className="mt-6 grid gap-10 lg:grid-cols-12">
          <div className="aspect-[16/10] animate-pulse rounded-2xl bg-gray-100 lg:col-span-8" />
          <div className="h-64 animate-pulse rounded-2xl bg-gray-100 lg:col-span-4" />
        </div>
      </div>
    );
  }

  const images = listing.imageUrls?.length > 0 ? listing.imageUrls : [];
  const isOwnListing = user?.userId === listing.landlordId;
  const isRented = listing.status === 'DA_CHO_THUE';
  const facts = [
    listing.area != null && `${listing.area} m²`,
    listing.maxOccupants != null && `Tối đa ${listing.maxOccupants} người`,
    `Mã tin #${listing.id}`,
    `${listing.viewCount} lượt xem`,
  ].filter(Boolean);

  async function handleMessage() {
    if (!user) {
      navigate('/login');
      return;
    }
    setMessaging(true);
    setMessageError('');
    try {
      const conversation = await getOrCreateConversation(listing.id);
      navigate(`/messages/${conversation.id}`);
    } catch (err) {
      setMessageError(err.response?.data?.message || 'Không mở được cuộc trò chuyện, thử lại sau.');
    } finally {
      setMessaging(false);
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <nav aria-label="Breadcrumb" className="mb-5 flex flex-wrap items-center gap-1.5 text-sm text-gray-500">
        <Link to="/" className="hover:text-gray-900">
          Trang chủ
        </Link>
        <span aria-hidden="true">/</span>
        <Link to={`/search?city=${encodeURIComponent(listing.city)}`} className="hover:text-gray-900">
          {listing.city}
        </Link>
        <span aria-hidden="true">/</span>
        <Link
          to={`/search?city=${encodeURIComponent(listing.city)}&district=${encodeURIComponent(listing.district)}`}
          className="hover:text-gray-900"
        >
          {listing.district}
        </Link>
      </nav>

      {isRented && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gray-200 bg-gray-50 px-5 py-4">
          <p className="font-medium text-gray-900">Phòng này đã được cho thuê.</p>
          <Link
            to={`/search?city=${encodeURIComponent(listing.city)}&district=${encodeURIComponent(listing.district)}`}
            className="text-sm link-accent"
          >
            Xem phòng khác ở {listing.district}
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
        <div className="min-w-0 lg:col-span-8">
          {/* Gallery */}
          <div className="relative aspect-[16/10] overflow-hidden rounded-2xl bg-gray-100">
            {isRented && (
              <span className="absolute left-4 top-4 z-10 rounded-full bg-gray-900/85 px-3 py-1 text-xs font-semibold text-white">
                Đã cho thuê
              </span>
            )}
            <FavoriteButton
              className="absolute right-4 top-4 z-10"
              favorited={listingFavorites.isFavorited(listing.id)}
              onToggle={() => listingFavorites.toggle(listing.id)}
            />
            {images.length > 0 ? (
              <img src={images[activeImage]} alt={listing.title} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-gray-400">Chưa có ảnh</div>
            )}
            {images.length > 1 && (
              <span className="absolute bottom-4 right-4 rounded-full bg-gray-900/75 px-2.5 py-1 text-xs font-medium text-white">
                {activeImage + 1}/{images.length}
              </span>
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

          {/* Title */}
          <div className="mt-8 border-b border-gray-200 pb-8">
            <div className="flex flex-wrap items-center gap-2">
              {listing.promoted && !isRented && (
                <span className="flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
                  <Zap size={12} fill="currentColor" /> Nổi bật
                </span>
              )}
              {listing.reviewCount > 0 && <StarRating rating={listing.averageRating} count={listing.reviewCount} />}
            </div>
            <h1 className="mt-2 text-2xl font-bold leading-tight tracking-tight text-gray-900 sm:text-3xl">
              {listing.title}
            </h1>
            <p className="mt-2 text-gray-600">
              {[listing.address, listing.ward, listing.district, listing.city].filter(Boolean).join(', ')}
            </p>
            <p className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-sm text-gray-600">
              {facts.map((fact) => (
                <span key={fact}>{fact}</span>
              ))}
            </p>
          </div>

          {/* Description */}
          <section className="border-b border-gray-200 py-8">
            <h2 className="text-lg font-semibold text-gray-900">Mô tả</h2>
            <p className="mt-3 whitespace-pre-line leading-relaxed text-gray-700">
              {listing.description || 'Chủ nhà chưa thêm mô tả.'}
            </p>
          </section>

          {/* Amenities */}
          {listing.amenities?.length > 0 && (
            <section className="border-b border-gray-200 py-8">
              <h2 className="text-lg font-semibold text-gray-900">Tiện ích</h2>
              <ul className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3">
                {listing.amenities.map((a) => {
                  const Icon = AMENITY_ICONS[a];
                  return (
                    <li key={a} className="flex items-center gap-3 text-gray-800">
                      {Icon && <Icon size={18} className="flex-shrink-0 text-blue-700" />}
                      {AMENITY_LABELS[a] || a}
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          <section className="border-b border-gray-200 py-8">
            <ListingLocation listing={listing} />
          </section>

          <section className="py-8">
            <ReviewSection targetId={listing.id} hidden={isOwnListing} />
          </section>
        </div>

        {/* Contact card */}
        <aside className="lg:col-span-4">
          <div className="surface p-6 shadow-[0_24px_48px_-32px_rgba(20,79,112,0.4)] lg:sticky lg:top-24">
            <p className="text-orange-600">
              <span className="text-2xl font-bold">{formatPrice(listing.price)}đ</span>
              <span className="font-medium text-orange-500">/tháng</span>
            </p>

            <div className="mt-5 flex items-center gap-3 border-t border-gray-100 pt-5">
              <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-blue-700 font-semibold text-white">
                {listing.landlordName?.charAt(0)?.toUpperCase()}
              </span>
              <div className="min-w-0">
                <p className="text-sm text-gray-500">Chủ nhà</p>
                <p className="truncate font-semibold text-gray-900">{listing.landlordName}</p>
              </div>
            </div>

            {isRented ? (
              <p className="mt-5 rounded-xl bg-gray-50 p-4 text-sm leading-relaxed text-gray-600">
                Phòng đã có người thuê nên chủ nhà tạm ngừng nhận liên hệ mới cho tin này.
              </p>
            ) : (
              <div className="mt-5 space-y-2.5">
                {!isOwnListing && (
                  <button type="button" onClick={handleMessage} disabled={messaging} className="btn-primary w-full py-3">
                    <MessageCircle size={17} /> {messaging ? 'Đang mở...' : 'Nhắn tin cho chủ nhà'}
                  </button>
                )}
                <a href={`tel:${listing.contactPhone}`} className="btn-secondary w-full py-3">
                  <Phone size={16} /> {listing.contactPhone}
                </a>
                {messageError && <p className="text-sm text-red-600">{messageError}</p>}
              </div>
            )}

            {!isRented && !isOwnListing && (
              <p className="mt-5 flex gap-2.5 border-t border-gray-100 pt-5 text-sm leading-relaxed text-gray-600">
                <ShieldCheck size={18} className="mt-0.5 flex-shrink-0 text-blue-700" />
                Đặt cọc xem phòng qua ví RoomieVibe: tiền được giữ hộ cho tới khi bạn xác nhận đã xem phòng.
              </p>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
