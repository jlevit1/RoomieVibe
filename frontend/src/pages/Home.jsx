import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  Home as HomeIcon,
  MapPinned,
  ShieldCheck,
  SlidersHorizontal,
  BadgeCheck,
  Eye,
  Phone,
  KeyRound,
  MapPin,
  Wallet,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';
import { searchListings } from '../services/listingService';
import { browseProfiles } from '../services/roommateService';
import ListingCard from '../components/ListingCard';
import RoommateCard from '../components/RoommateCard';
import { useAuth } from '../context/AuthContext';
import { useFavorites } from '../hooks/useFavorites';

const FEATURES = [
  {
    title: 'Bảo mật địa chỉ',
    desc: 'Tin đăng chỉ hiển thị khu vực, không lộ địa chỉ chi tiết cho tới khi hai bên chủ động liên hệ.',
    Icon: ShieldCheck,
  },
  {
    title: 'Tìm kiếm thông minh',
    desc: 'Lọc theo khu vực, giá, diện tích và tiện ích để ra đúng phòng bạn cần.',
    Icon: SlidersHorizontal,
  },
  {
    title: 'Minh bạch, đã kiểm duyệt',
    desc: 'Mọi tin đăng đều qua admin duyệt trước khi hiển thị công khai.',
    Icon: BadgeCheck,
  },
];

const PREVIEW_CITIES = ['Hà Nội', 'TP. Hồ Chí Minh', 'Đà Nẵng', 'Cần Thơ', 'Hải Phòng', 'Bình Dương'];

const STEPS = [
  { title: 'Tìm kiếm', desc: 'Lọc theo khu vực, giá, diện tích để tìm phòng ưng ý.', Icon: Search },
  { title: 'Xem chi tiết', desc: 'Xem ảnh, mô tả, tiện ích và vị trí của tin đăng.', Icon: Eye },
  { title: 'Liên hệ chủ nhà', desc: 'Gọi trực tiếp cho chủ nhà để hẹn xem phòng.', Icon: Phone },
  { title: 'Chuyển vào ở', desc: 'Thỏa thuận xong là có thể dọn vào ngay.', Icon: KeyRound },
];

export default function Home() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const listingFavorites = useFavorites('listing');
  const roommateFavorites = useFavorites('roommate');
  const [mode, setMode] = useState('room');
  const [filters, setFilters] = useState({ city: '', district: '', minPrice: '', maxPrice: '' });
  const [latest, setLatest] = useState([]);
  const [totalListings, setTotalListings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [allRoommateProfiles, setAllRoommateProfiles] = useState([]);
  const [loadingRoommates, setLoadingRoommates] = useState(true);
  const [previewCity, setPreviewCity] = useState('');
  const [previewRoommateCity, setPreviewRoommateCity] = useState('');
  const listingsScrollRef = useRef(null);
  const roommateScrollRef = useRef(null);

  function scrollListings(direction) {
    listingsScrollRef.current?.scrollBy({ left: direction * 320, behavior: 'smooth' });
  }

  function scrollRoommates(direction) {
    roommateScrollRef.current?.scrollBy({ left: direction * 320, behavior: 'smooth' });
  }

  const roommateProfiles = (
    previewRoommateCity
      ? allRoommateProfiles.filter((p) => p.city === previewRoommateCity)
      : allRoommateProfiles
  ).slice(0, 6);

  useEffect(() => {
    setLoading(true);
    const params = { page: 0, size: 6, sortBy: 'createdAt', sortDir: 'desc' };
    if (previewCity) params.city = previewCity;
    searchListings(params)
      .then((res) => {
        setLatest(res.content);
        setTotalListings(res.totalElements);
      })
      .finally(() => setLoading(false));
  }, [previewCity]);

  useEffect(() => {
    browseProfiles()
      .then((profiles) => {
        setAllRoommateProfiles(profiles.filter((p) => !p.own));
      })
      .catch(() => {})
      .finally(() => setLoadingRoommates(false));
  }, []);

  function handleFilterChange(e) {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  }

  function handleSearch(e) {
    e.preventDefault();
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== '') params.set(key, value);
    });
    navigate(`/search?${params.toString()}`);
  }

  return (
    <div>
      {/* Hero banner */}
      <section className="relative isolate overflow-hidden bg-rose-600">
        <div className="absolute inset-0 bg-gradient-to-br from-rose-600 via-rose-600 to-rose-500" />
        {/* soft asymmetric glow, off-center so it never reads as a centered AI blob */}
        <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-rose-400/40 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 left-1/4 h-72 w-72 rounded-full bg-rose-900/20 blur-3xl" />
        {/* subtle dot-grid texture so the hero isn't a flat gradient */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.15]"
          style={{
            backgroundImage: 'radial-gradient(rgba(255,255,255,0.7) 1px, transparent 1px)',
            backgroundSize: '22px 22px',
          }}
        />

        <div className="relative px-6 pt-16 pb-12 text-center text-white sm:pt-20">
          <h1 className="motion-safe:animate-fade-up mx-auto max-w-2xl text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
            Tìm phòng trọ &amp; bạn ở ghép
          </h1>
          <p className="motion-safe:animate-fade-up mx-auto mt-4 max-w-xl text-white/90 [animation-delay:80ms]">
            Hàng ngàn tin đăng đã kiểm duyệt, tìm đúng nơi ở phù hợp với bạn.
          </p>

          <div className="motion-safe:animate-fade-up mx-auto mt-7 inline-flex rounded-full bg-white/15 p-1 backdrop-blur-sm [animation-delay:100ms]">
            <button
              type="button"
              onClick={() => setMode('room')}
              className={`rounded-full px-5 py-2 text-sm font-medium transition-colors ${
                mode === 'room' ? 'bg-white text-rose-600' : 'text-white/80 hover:text-white'
              }`}
            >
              Tìm phòng trọ
            </button>
            <button
              type="button"
              onClick={() => setMode('roommate')}
              className={`rounded-full px-5 py-2 text-sm font-medium transition-colors ${
                mode === 'roommate' ? 'bg-white text-rose-600' : 'text-white/80 hover:text-white'
              }`}
            >
              Tìm bạn ở ghép
            </button>
          </div>

          {mode === 'room' ? (
            <form
              onSubmit={handleSearch}
              className="motion-safe:animate-fade-up mx-auto mt-5 flex max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl sm:flex-row sm:items-stretch sm:rounded-full [animation-delay:140ms]"
            >
              <div className="flex flex-1 items-center gap-2 border-b border-gray-100 px-5 py-3.5 sm:border-b-0 sm:border-r">
                <MapPin size={16} className="flex-shrink-0 text-gray-400" />
                <input
                  name="city"
                  placeholder="Tỉnh/thành phố"
                  value={filters.city}
                  onChange={handleFilterChange}
                  className="w-full text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none"
                />
              </div>
              <div className="flex flex-1 items-center gap-2 border-b border-gray-100 px-5 py-3.5 sm:border-b-0 sm:border-r">
                <MapPinned size={16} className="flex-shrink-0 text-gray-400" />
                <input
                  name="district"
                  placeholder="Quận/huyện"
                  value={filters.district}
                  onChange={handleFilterChange}
                  className="w-full text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none"
                />
              </div>
              <div className="flex flex-1 items-center gap-2 px-5 py-3.5">
                <Wallet size={16} className="flex-shrink-0 text-gray-400" />
                <input
                  name="minPrice"
                  type="number"
                  placeholder="Giá từ"
                  value={filters.minPrice}
                  onChange={handleFilterChange}
                  className="w-full min-w-0 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none"
                />
                <span className="text-gray-300">-</span>
                <input
                  name="maxPrice"
                  type="number"
                  placeholder="đến"
                  value={filters.maxPrice}
                  onChange={handleFilterChange}
                  className="w-full min-w-0 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none"
                />
              </div>
              <button
                type="submit"
                className="m-1.5 flex items-center justify-center gap-1.5 rounded-full bg-rose-600 px-6 py-3 text-sm font-medium text-white transition-all hover:bg-rose-700 active:scale-[0.98]"
              >
                <Search size={16} /> Tìm kiếm
              </button>
            </form>
          ) : (
            <div className="motion-safe:animate-fade-up mx-auto mt-5 flex max-w-3xl flex-col items-center gap-4 rounded-2xl bg-white px-8 py-7 text-left shadow-xl sm:flex-row sm:justify-between [animation-delay:140ms]">
              <div>
                <p className="font-semibold text-gray-900">Tìm người ở ghép hợp phong cách sống</p>
                <p className="mt-0.5 text-sm text-gray-500">
                  Duyệt hồ sơ xếp hạng theo % tương thích, hoặc tạo hồ sơ để người khác tìm thấy bạn.
                </p>
              </div>
              <div className="flex flex-shrink-0 gap-2">
                <Link
                  to="/roommates"
                  className="rounded-full bg-rose-600 px-5 py-2.5 text-center text-sm font-medium text-white transition-colors hover:bg-rose-700"
                >
                  Tìm ngay
                </Link>
                <Link
                  to={user ? '/roommates/profile' : '/login'}
                  className="rounded-full border border-gray-300 px-5 py-2.5 text-center text-sm font-medium text-gray-700 transition-colors hover:border-rose-300 hover:text-rose-600"
                >
                  Tạo hồ sơ
                </Link>
              </div>
            </div>
          )}

          <div
            className={`motion-safe:animate-fade-up mt-4 flex flex-wrap items-center justify-center gap-2 text-sm text-white/80 [animation-delay:180ms] ${
              mode === 'roommate' ? 'invisible' : ''
            }`}
          >
            <span>Tìm kiếm phổ biến:</span>
            {['Hà Nội', 'TP. Hồ Chí Minh', 'Đà Nẵng'].map((cityName) => (
              <button
                type="button"
                key={cityName}
                onClick={() => navigate(`/search?city=${encodeURIComponent(cityName)}`)}
                className="flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 font-medium text-white backdrop-blur-sm transition-colors hover:bg-white/20"
              >
                {cityName} <ChevronRight size={13} />
              </button>
            ))}
          </div>
        </div>

        {/* Stats strip */}
        <div className="relative border-t border-white/15 px-6 py-5">
          <div className="mx-auto grid max-w-3xl grid-cols-3 gap-4 text-center text-white">
            <div className="flex flex-col items-center gap-1">
              <HomeIcon size={18} className="text-white/70" />
              <p className="text-xl font-bold">{totalListings ?? '-'}+</p>
              <p className="text-xs text-white/70">Tin đăng</p>
            </div>
            <div className="flex flex-col items-center gap-1">
              <MapPinned size={18} className="text-white/70" />
              <p className="text-xl font-bold">63</p>
              <p className="text-xs text-white/70">Tỉnh/thành</p>
            </div>
            <div className="flex flex-col items-center gap-1">
              <ShieldCheck size={18} className="text-white/70" />
              <p className="text-xl font-bold">100%</p>
              <p className="text-xs text-white/70">Đã kiểm duyệt</p>
            </div>
          </div>
        </div>
      </section>

      {/* Feature highlights */}
      <section className="bg-white px-6 py-14 sm:py-16">
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {FEATURES.map(({ title, desc, Icon }) => (
              <div
                key={title}
                className="rounded-2xl border border-gray-200 p-6 transition-colors hover:border-rose-200"
              >
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-rose-50 text-rose-600">
                  <Icon size={20} />
                </div>
                <h3 className="mb-1 font-semibold text-gray-900">{title}</h3>
                <p className="text-sm text-gray-500">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-gray-50 px-6 py-14 sm:py-16">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-12 text-center text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
            Cách hoạt động
          </h2>
          <div className="relative grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
            <div className="absolute left-0 right-0 top-7 hidden h-px bg-gray-200 lg:block" />
            {STEPS.map(({ title, desc, Icon }, index) => (
              <div key={title} className="relative text-center">
                <div className="relative z-10 mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-rose-600 text-white">
                  <Icon size={22} />
                </div>
                <p className="mb-1 text-xs font-semibold text-rose-600">Bước {index + 1}</p>
                <h3 className="mb-1 font-semibold text-gray-900">{title}</h3>
                <p className="text-sm text-gray-500">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Latest listings preview */}
      <section className="bg-white py-14 sm:py-16">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-1 flex items-center justify-between">
            <h2 className="text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">
              Phòng trọ mới đăng
            </h2>
            <div className="flex items-center gap-3">
              <Link
                to={previewCity ? `/search?city=${encodeURIComponent(previewCity)}` : '/search'}
                className="text-sm font-medium text-rose-600 transition-colors hover:text-rose-700 hover:underline"
              >
                Xem tất cả
              </Link>
              <div className="hidden gap-1 sm:flex">
                <button
                  type="button"
                  onClick={() => scrollListings(-1)}
                  aria-label="Cuộn sang trái"
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-300 text-gray-500 transition-colors hover:border-rose-300 hover:text-rose-600"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => scrollListings(1)}
                  aria-label="Cuộn sang phải"
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-300 text-gray-500 transition-colors hover:border-rose-300 hover:text-rose-600"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
          <p className="mb-5 text-sm text-gray-500">Chọn nhanh theo tỉnh/thành phố</p>

          <div className="scrollbar-hide mb-5 flex gap-2 overflow-x-auto pb-1">
            <button
              type="button"
              onClick={() => setPreviewCity('')}
              className={`flex-shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
                previewCity === ''
                  ? 'border-rose-600 bg-rose-50 text-rose-600'
                  : 'border-gray-300 text-gray-700 hover:border-rose-300 hover:text-rose-600'
              }`}
            >
              Tất cả
            </button>
            {PREVIEW_CITIES.map((cityName) => (
              <button
                type="button"
                key={cityName}
                onClick={() => setPreviewCity(cityName)}
                className={`flex-shrink-0 rounded-full border px-4 py-1.5 text-sm transition-colors ${
                  previewCity === cityName
                    ? 'border-rose-600 bg-rose-50 font-medium text-rose-600'
                    : 'border-gray-300 text-gray-700 hover:border-rose-300 hover:text-rose-600'
                }`}
              >
                {cityName}
              </button>
            ))}
          </div>

          {loading && (
            <div className="flex gap-5 overflow-x-hidden">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-64 flex-shrink-0 animate-pulse overflow-hidden rounded-2xl border border-gray-200 sm:w-72"
                >
                  <div className="h-44 bg-gray-100" />
                  <div className="space-y-2 p-4">
                    <div className="h-4 w-3/4 rounded bg-gray-100" />
                    <div className="h-4 w-1/2 rounded bg-gray-100" />
                    <div className="h-3 w-2/3 rounded bg-gray-100" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && latest.length === 0 && (
            <p className="text-gray-500">Chưa có tin đăng nào.</p>
          )}

          {!loading && latest.length > 0 && (
            <div
              ref={listingsScrollRef}
              className="scrollbar-hide flex snap-x snap-mandatory gap-5 overflow-x-auto pb-2"
            >
              {latest.map((listing) => (
                <div key={listing.id} className="w-64 flex-shrink-0 snap-start sm:w-72">
                  <ListingCard
                    listing={listing}
                    favorited={listingFavorites.isFavorited(listing.id)}
                    onToggleFavorite={() => listingFavorites.toggle(listing.id)}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Roommate profiles preview */}
      <section className="bg-gray-50 py-14 sm:py-16">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-1 flex items-center justify-between">
            <h2 className="text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">
              Tìm bạn ở ghép
            </h2>
            <div className="flex items-center gap-3">
              <Link
                to="/roommates"
                className="text-sm font-medium text-rose-600 transition-colors hover:text-rose-700 hover:underline"
              >
                Xem tất cả
              </Link>
              <div className="hidden gap-1 sm:flex">
                <button
                  type="button"
                  onClick={() => scrollRoommates(-1)}
                  aria-label="Cuộn sang trái"
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-300 text-gray-500 transition-colors hover:border-rose-300 hover:text-rose-600"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => scrollRoommates(1)}
                  aria-label="Cuộn sang phải"
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-300 text-gray-500 transition-colors hover:border-rose-300 hover:text-rose-600"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
          <p className="mb-5 text-sm text-gray-500">Xếp hạng theo % tương thích khi bạn đã có hồ sơ</p>

          <div className="scrollbar-hide mb-5 flex gap-2 overflow-x-auto pb-1">
            <button
              type="button"
              onClick={() => setPreviewRoommateCity('')}
              className={`flex-shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
                previewRoommateCity === ''
                  ? 'border-rose-600 bg-rose-50 text-rose-600'
                  : 'border-gray-300 bg-white text-gray-700 hover:border-rose-300 hover:text-rose-600'
              }`}
            >
              Tất cả
            </button>
            {PREVIEW_CITIES.map((cityName) => (
              <button
                type="button"
                key={cityName}
                onClick={() => setPreviewRoommateCity(cityName)}
                className={`flex-shrink-0 rounded-full border px-4 py-1.5 text-sm transition-colors ${
                  previewRoommateCity === cityName
                    ? 'border-rose-600 bg-rose-50 font-medium text-rose-600'
                    : 'border-gray-300 bg-white text-gray-700 hover:border-rose-300 hover:text-rose-600'
                }`}
              >
                {cityName}
              </button>
            ))}
          </div>

          {loadingRoommates && (
            <div className="flex gap-5 overflow-x-hidden">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-64 flex-shrink-0 animate-pulse overflow-hidden rounded-2xl border border-gray-200 bg-white sm:w-72"
                >
                  <div className="h-40 bg-gray-100" />
                  <div className="space-y-2 p-4">
                    <div className="h-4 w-3/4 rounded bg-gray-100" />
                    <div className="h-4 w-1/2 rounded bg-gray-100" />
                    <div className="h-3 w-2/3 rounded bg-gray-100" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loadingRoommates && roommateProfiles.length === 0 && (
            <p className="text-gray-500">Chưa có hồ sơ tìm bạn ở ghép nào.</p>
          )}

          {!loadingRoommates && roommateProfiles.length > 0 && (
            <div
              ref={roommateScrollRef}
              className="scrollbar-hide flex snap-x snap-mandatory gap-5 overflow-x-auto pb-2"
            >
              {roommateProfiles.map((profile) => (
                <div key={profile.id} className="w-64 flex-shrink-0 snap-start sm:w-72">
                  <RoommateCard
                    profile={profile}
                    favorited={roommateFavorites.isFavorited(profile.id)}
                    onToggleFavorite={() => roommateFavorites.toggle(profile.id)}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Landlord CTA - compact closing banner before footer, deliberately tighter than content sections for rhythm */}
      <section className="bg-white px-6 py-14">
        <div className="relative mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 overflow-hidden rounded-2xl bg-gradient-to-r from-rose-600 to-rose-500 p-8 text-center text-white sm:flex-row sm:text-left sm:p-10">
          <div
            className="pointer-events-none absolute inset-0 opacity-10"
            style={{
              backgroundImage: 'radial-gradient(rgba(255,255,255,0.9) 1px, transparent 1px)',
              backgroundSize: '18px 18px',
            }}
          />
          <div className="relative">
            <h2 className="mb-1 text-xl font-bold">Bạn là chủ nhà?</h2>
            <p className="text-white/90">Đăng tin miễn phí, tiếp cận hàng ngàn người thuê tiềm năng.</p>
          </div>
          <Link
            to={user?.role === 'LANDLORD' ? '/listings/new' : '/register'}
            className="relative flex-shrink-0 rounded-full bg-white px-6 py-3 text-sm font-semibold text-rose-600 transition-all hover:bg-gray-100 active:scale-[0.98]"
          >
            Đăng tin ngay
          </Link>
        </div>
      </section>
    </div>
  );
}
