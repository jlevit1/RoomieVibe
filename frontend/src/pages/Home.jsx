import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  Home as HomeIcon,
  ShieldCheck,
  SlidersHorizontal,
  BadgeCheck,
  MessageCircle,
  CheckCircle2,
  MapPin,
  ChevronRight,
  ChevronLeft,
  List,
  Sparkles,
  Users,
  ArrowRight,
} from 'lucide-react';
import { searchListings, getRecommendedListings, getListingMapPoints } from '../services/listingService';
import { browseProfiles } from '../services/roommateService';
import ListingCard from '../components/ListingCard';
import RoommateCard from '../components/RoommateCard';
import CurrencyInput from '../components/CurrencyInput';
import SearchableSelect from '../components/SearchableSelect';
import FilterModal from '../components/FilterModal';
import { PROVINCE_NAMES, getDistrictNamesForProvince } from '../data/vnLocations';
import { useAuth } from '../context/AuthContext';
import { useFavorites } from '../hooks/useFavorites';
import ListingsMapPreview from '../components/ListingsMapPreview';
import { useHistoryState } from '../hooks/useHistoryState';
import Reveal from '../components/Reveal';

// City photos: Unsplash (free license), self-hosted under public/images/home.
const CITY_TILES = [
  {
    city: 'Hà Nội',
    image: '/images/home/city-hanoi.webp',
    alt: 'Phố cổ Hà Nội đông xe máy qua lại',
    className: 'col-span-2 lg:row-span-2',
    large: true,
  },
  {
    city: 'TP. Hồ Chí Minh',
    image: '/images/home/city-hcm.webp',
    alt: 'Tòa nhà Bitexco bên sông Sài Gòn',
    className: 'lg:col-span-2',
  },
  {
    city: 'Đà Nẵng',
    image: '/images/home/city-danang.webp',
    alt: 'Cầu Rồng bắc qua sông Hàn',
    className: 'lg:col-span-2',
  },
  { city: 'Cần Thơ', image: '/images/home/city-cantho.webp', alt: 'Bến sông ở Cần Thơ', className: '' },
  {
    city: 'Hải Phòng',
    image: '/images/home/city-haiphong.webp',
    alt: 'Phố xá Hải Phòng nhìn từ trên cao',
    className: '',
  },
  {
    city: 'Bình Dương',
    image: '/images/home/city-binhduong.webp',
    alt: 'Hồ nước giữa cây xanh ở Bình Dương',
    className: 'col-span-2',
  },
];

const DEPOSIT_STEPS = [
  { title: 'Nhắn tin với chủ nhà', desc: 'Hỏi thêm về phòng ngay trong app, chưa cần cho số điện thoại.' },
  { title: 'Đặt cọc qua ví RoomieVibe', desc: 'Tiền cọc được giữ hộ, chủ nhà chưa nhận ngay.' },
  {
    title: 'Xem phòng rồi mới xác nhận',
    desc: 'Phòng đúng như tin đăng thì bạn bấm xác nhận, lúc đó tiền mới chuyển cho chủ nhà.',
  },
  {
    title: 'Không như mô tả thì báo tranh chấp',
    desc: 'Admin xem xét từng trường hợp và có thể hoàn lại tiền cọc cho bạn.',
  },
];

const TRUST_POINTS = [
  {
    title: 'Đánh giá từ người thuê thật',
    desc: 'Chỉ người đã thuê hoặc đã đặt cọc xem phòng mới được để lại đánh giá.',
    Icon: BadgeCheck,
  },
  {
    title: 'Tìm bằng một câu nói',
    desc: 'Gõ “phòng gần Lăng Bác dưới 5 triệu”, Trợ lý AI tự lọc khu vực và mức giá cho bạn.',
    Icon: Sparkles,
    link: { to: '/ai-search', label: 'Thử Trợ lý AI' },
  },
  {
    title: 'Nhắn tin mà không lộ số',
    desc: 'Trò chuyện với chủ nhà trong app trước khi quyết định gọi điện.',
    Icon: MessageCircle,
  },
  {
    title: 'Tin đăng có người duyệt',
    desc: 'Mỗi tin đều được admin kiểm tra trước khi hiển thị cho người thuê.',
    Icon: ShieldCheck,
  },
];

const LANDLORD_POINTS = [
  'Đăng tin miễn phí, tối đa 6 ảnh cho mỗi phòng',
  'Nhận đặt cọc xem phòng qua ví, tiền về khi khách xác nhận',
  'Muốn nhiều người thấy hơn thì đẩy tin lên đầu, từ 15.000đ',
];

const PREVIEW_CITIES = ['Hà Nội', 'TP. Hồ Chí Minh', 'Đà Nẵng', 'Cần Thơ', 'Hải Phòng', 'Bình Dương'];

const HERO_TABS = [
  { value: 'room', label: 'Phòng trọ', Icon: HomeIcon },
  { value: 'roommate', label: 'Bạn ở ghép', Icon: Users },
];

const HERO_INPUT_CLASS = 'w-full bg-transparent text-sm text-gray-900 placeholder:text-gray-500 focus:outline-none';

function HeroField({ label, htmlFor, children }) {
  return (
    <div className="rounded-2xl border border-gray-200 px-4 py-2.5 transition-colors focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20">
      <label htmlFor={htmlFor} className="mb-0.5 block text-xs font-semibold text-gray-800">
        {label}
      </label>
      {children}
    </div>
  );
}

const SECTION_TITLE_CLASS = 'text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl';

function SegmentedButton({ active, onClick, label, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
        active ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-800'
      }`}
    >
      {children}
    </button>
  );
}

function CityChips({ value, onChange }) {
  return (
    <div className="scrollbar-hide flex gap-2 overflow-x-auto pb-1 lg:flex-wrap">
      {['', ...PREVIEW_CITIES].map((cityName) => (
        <button
          type="button"
          key={cityName || 'all'}
          onClick={() => onChange(cityName)}
          className={`flex-shrink-0 rounded-full border px-3.5 py-1.5 text-sm transition-colors ${
            value === cityName
              ? 'border-gray-900 bg-gray-900 font-medium text-white'
              : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
          }`}
        >
          {cityName || 'Tất cả'}
        </button>
      ))}
    </div>
  );
}

function RailArrows({ onScroll }) {
  return (
    <div className="hidden gap-2 sm:flex">
      {[-1, 1].map((direction) => (
        <button
          key={direction}
          type="button"
          onClick={() => onScroll(direction)}
          aria-label={direction < 0 ? 'Cuộn sang trái' : 'Cuộn sang phải'}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-300 bg-white text-gray-600 transition-colors hover:border-gray-400 hover:text-gray-900"
        >
          {direction < 0 ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
        </button>
      ))}
    </div>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const listingFavorites = useFavorites('listing');
  const roommateFavorites = useFavorites('roommate');
  const [mode, setMode] = useState('room');
  const [filters, setFilters] = useState({
    city: '',
    district: '',
    ward: '',
    minPrice: '',
    maxPrice: '',
    minArea: '',
    maxArea: '',
    amenities: [],
  });
  const [filterOpen, setFilterOpen] = useState(false);
  const [latest, setLatest] = useState([]);
  const [totalListings, setTotalListings] = useState(null);
  const [allMapPoints, setAllMapPoints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [allRoommateProfiles, setAllRoommateProfiles] = useState([]);
  const [loadingRoommates, setLoadingRoommates] = useState(true);
  const [previewCity, setPreviewCity] = useHistoryState('home-city', '');
  const [listingsView, setListingsView] = useHistoryState('home-view', 'list');
  const [previewRoommateCity, setPreviewRoommateCity] = useHistoryState('home-roommate-city', '');
  const [recommended, setRecommended] = useState([]);
  const roommateScrollRef = useRef(null);
  const recommendedScrollRef = useRef(null);

  function scrollRecommended(direction) {
    recommendedScrollRef.current?.scrollBy({ left: direction * 320, behavior: 'smooth' });
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
    const params = { page: 0, size: 8, sortBy: 'createdAt', sortDir: 'desc' };
    if (previewCity) params.city = previewCity;
    searchListings(params)
      .then((res) => {
        setLatest(res.content);
        if (!previewCity) setTotalListings(res.totalElements);
      })
      .finally(() => setLoading(false));
  }, [previewCity]);

  // The map view shows every listing that has coordinates, not just the "latest 6" used by
  // the list view - with data spread nationwide, the 6 most recent could easily all land in
  // one or two cities and leave the rest of the map looking empty even though those cities
  // have plenty of listings, which defeats the point of "find a room near you" on a map.
  useEffect(() => {
    getListingMapPoints().then(setAllMapPoints).catch(() => {});
  }, []);

  const showMap = listingsView === 'map';
  const mapPoints = previewCity ? allMapPoints.filter((p) => p.city === previewCity) : allMapPoints;

  const cityCounts = allMapPoints.reduce((counts, p) => ({ ...counts, [p.city]: (counts[p.city] || 0) + 1 }), {});
  const cityCount = Object.keys(cityCounts).length;
  const heroSubtitle =
    totalListings != null && cityCount > 0
      ? `${totalListings} phòng đã qua kiểm duyệt tại ${cityCount} tỉnh thành. Tiền cọc xem phòng được giữ hộ cho tới khi bạn đã xem tận nơi.`
      : 'Phòng đã qua kiểm duyệt. Tiền cọc xem phòng được giữ hộ cho tới khi bạn đã xem tận nơi.';

  useEffect(() => {
    if (!user) {
      setRecommended([]);
      return;
    }
    getRecommendedListings()
      .then(setRecommended)
      .catch(() => {});
  }, [user]);

  useEffect(() => {
    browseProfiles()
      .then((profiles) => {
        const newestFirst = profiles
          .filter((p) => !p.own)
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setAllRoommateProfiles(newestFirst);
      })
      .catch(() => {})
      .finally(() => setLoadingRoommates(false));
  }, []);

  function handleFilterChange(e) {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  }

  function handleCityFilterChange(e) {
    setFilters({ ...filters, city: e.target.value, district: '' });
  }

  function navigateToSearch(values) {
    const params = new URLSearchParams();
    Object.entries(values).forEach(([key, value]) => {
      if (key === 'amenities') {
        if (value?.length > 0) params.set('amenities', value.join(','));
      } else if (value !== '') {
        params.set(key, value);
      }
    });
    navigate(`/search?${params.toString()}`);
  }

  function handleSearch(e) {
    e.preventDefault();
    navigateToSearch(filters);
  }

  function handleApplyAdvancedFilters(values) {
    setFilters(values);
    navigateToSearch(values);
  }

  return (
    <div>
      {/* Hero */}
      <section className="bg-white">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 pb-14 pt-8 sm:px-6 lg:grid-cols-12 lg:gap-12 lg:pb-20 lg:pt-14">
          <div className="lg:col-span-6">
            <h1 className="motion-safe:animate-fade-up text-[2rem] font-bold leading-[1.15] tracking-tight text-gray-900 sm:text-5xl lg:text-[3.4rem]">
              Tìm phòng trọ ưng ý, <span className="block text-balance text-blue-700">ở cùng người hợp tính.</span>
            </h1>
            <p className="motion-safe:animate-fade-up mt-5 max-w-[46ch] text-base leading-relaxed text-gray-600 sm:text-lg [animation-delay:80ms]">
              {heroSubtitle}
            </p>

            <div className="motion-safe:animate-fade-up mt-8 rounded-3xl border border-gray-200 bg-white p-2 shadow-[0_30px_60px_-30px_rgba(20,79,112,0.35)] [animation-delay:140ms]">
              <div role="tablist" aria-label="Bạn đang tìm" className="flex gap-1 rounded-2xl bg-gray-100 p-1">
                {HERO_TABS.map(({ value, label, Icon }) => (
                  <button
                    key={value}
                    type="button"
                    role="tab"
                    aria-selected={mode === value}
                    onClick={() => setMode(value)}
                    className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-colors ${
                      mode === value ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-800'
                    }`}
                  >
                    <Icon size={16} /> {label}
                  </button>
                ))}
              </div>

              {mode === 'room' ? (
                <form onSubmit={handleSearch} className="grid gap-2 px-1 pb-1 pt-3 sm:grid-cols-2">
                  <HeroField label="Tỉnh/thành phố" htmlFor="hero-city">
                    <SearchableSelect
                      id="hero-city"
                      name="city"
                      placeholder="Chọn tỉnh/thành"
                      value={filters.city}
                      onChange={handleCityFilterChange}
                      options={PROVINCE_NAMES}
                      className={HERO_INPUT_CLASS}
                    />
                  </HeroField>
                  <HeroField label="Quận/huyện" htmlFor="hero-district">
                    <SearchableSelect
                      id="hero-district"
                      name="district"
                      placeholder={filters.city ? 'Tất cả quận/huyện' : 'Chọn tỉnh/thành trước'}
                      value={filters.district}
                      onChange={handleFilterChange}
                      options={getDistrictNamesForProvince(filters.city)}
                      disabled={!filters.city}
                      className={`${HERO_INPUT_CLASS} disabled:cursor-not-allowed disabled:bg-transparent`}
                    />
                  </HeroField>
                  <HeroField label="Giá thuê mỗi tháng" htmlFor="hero-min-price">
                    <div className="flex items-center gap-2">
                      <CurrencyInput
                        id="hero-min-price"
                        name="minPrice"
                        placeholder="Từ"
                        value={filters.minPrice}
                        onChange={handleFilterChange}
                        className={`${HERO_INPUT_CLASS} min-w-0`}
                      />
                      <span className="text-gray-400">-</span>
                      <CurrencyInput
                        name="maxPrice"
                        aria-label="Giá thuê tối đa"
                        placeholder="Đến"
                        value={filters.maxPrice}
                        onChange={handleFilterChange}
                        className={`${HERO_INPUT_CLASS} min-w-0`}
                      />
                    </div>
                  </HeroField>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setFilterOpen(true)}
                      aria-label="Bộ lọc nâng cao"
                      title="Bộ lọc nâng cao"
                      className="flex min-h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl border border-gray-200 text-gray-600 transition-colors hover:border-blue-300 hover:text-blue-700"
                    >
                      <SlidersHorizontal size={18} />
                    </button>
                    <button
                      type="submit"
                      className="flex min-h-14 flex-1 items-center justify-center gap-2 rounded-2xl bg-blue-700 text-base font-semibold text-white transition-all hover:bg-blue-800 active:scale-[0.98]"
                    >
                      <Search size={18} /> Tìm phòng
                    </button>
                  </div>
                </form>
              ) : (
                <div className="px-3 pb-2 pt-5">
                  <p className="font-semibold text-gray-900">Tìm người ở ghép hợp lối sống</p>
                  <p className="mt-1 text-sm leading-relaxed text-gray-600">
                    Hồ sơ được xếp theo mức độ hợp nhau về giờ giấc, thói quen và ngân sách.
                  </p>
                  <div className="mt-4 flex gap-2">
                    <Link
                      to="/roommates"
                      className="flex min-h-14 flex-1 items-center justify-center rounded-2xl bg-blue-700 text-base font-semibold text-white transition-all hover:bg-blue-800 active:scale-[0.98]"
                    >
                      Xem tất cả hồ sơ
                    </Link>
                    <Link
                      to={user ? '/roommates/profile' : '/login'}
                      className="flex min-h-14 flex-1 items-center justify-center rounded-2xl border border-gray-200 text-base font-semibold text-gray-800 transition-colors hover:border-blue-300 hover:text-blue-700"
                    >
                      Tạo hồ sơ của bạn
                    </Link>
                  </div>
                </div>
              )}

              {mode === 'room' && (
                <Link
                  to="/ai-search"
                  className="mt-1 flex items-center justify-between gap-3 rounded-2xl px-3 py-3 text-sm text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900"
                >
                  <span className="flex items-center gap-2">
                    <Sparkles size={15} className="flex-shrink-0 text-blue-700" />
                    Hoặc tìm bằng Trợ lý AI
                  </span>
                  <ArrowRight size={15} className="flex-shrink-0" />
                </Link>
              )}
            </div>
          </div>

          <div className="motion-safe:animate-fade-up lg:col-span-6 [animation-delay:120ms]">
            <div className="relative mx-auto max-w-[480px] lg:mr-0">
              <div
                aria-hidden="true"
                className="absolute -right-4 -top-4 bottom-10 left-12 hidden rounded-[32px] bg-blue-50 sm:block"
              />
              <img
                src="/images/home/hero-room.webp"
                alt="Phòng ngủ có bàn làm việc, nắng chiều chiếu qua rèm cửa"
                width={1100}
                height={1464}
                fetchPriority="high"
                className="relative aspect-[4/3] w-full rounded-[28px] object-cover sm:aspect-[4/5]"
              />
              <img
                src="/images/home/hero-balcony.webp"
                alt="Ban công khu tập thể cũ ở Hà Nội với giàn hoa giấy"
                width={720}
                height={440}
                loading="lazy"
                className="absolute -left-8 bottom-10 hidden w-56 rounded-2xl border-4 border-white object-cover shadow-[0_20px_40px_-16px_rgba(20,79,112,0.45)] sm:block xl:-left-16 xl:w-64"
              />
            </div>
          </div>
        </div>

        <FilterModal
          isOpen={filterOpen}
          onClose={() => setFilterOpen(false)}
          initialFilters={filters}
          onApply={handleApplyAdvancedFilters}
        />
      </section>

      {/* Cities */}
      <section className="px-4 py-16 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-7xl">
          <Reveal className="mb-8">
            <h2 className={SECTION_TITLE_CLASS}>Phòng trọ ở các thành phố</h2>
            <p className="mt-2 text-gray-600">Chọn nơi bạn sắp chuyển tới để xem phòng đang cho thuê.</p>
          </Reveal>

          <Reveal
            delay={80}
            className="grid auto-rows-[150px] grid-cols-2 gap-3 sm:auto-rows-[190px] lg:h-[460px] lg:grid-cols-6 lg:grid-rows-2 lg:gap-4"
          >
            {CITY_TILES.map(({ city, image, alt, className, large }) => (
              <Link
                key={city}
                to={`/search?city=${encodeURIComponent(city)}`}
                className={`group relative overflow-hidden rounded-2xl bg-gray-200 ${className}`}
              >
                <img
                  src={image}
                  alt={alt}
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-x-0 bottom-0 h-3/4 bg-gradient-to-t from-gray-950/75 via-gray-950/25 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
                  <p className={`font-semibold text-white ${large ? 'text-2xl sm:text-3xl' : 'text-lg'}`}>{city}</p>
                  {cityCounts[city] > 0 && (
                    <p className="mt-0.5 text-sm text-white/85">{cityCounts[city]} phòng</p>
                  )}
                </div>
              </Link>
            ))}
          </Reveal>
        </div>
      </section>

      {/* Latest listings - grid or every listing pinned on a map */}
      <section className="px-4 pb-16 sm:px-6 sm:pb-20">
        <div className="mx-auto max-w-7xl">
          <Reveal className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className={SECTION_TITLE_CLASS}>Phòng mới đăng</h2>
              <p className="mt-2 text-gray-600">
                {showMap
                  ? `Bản đồ hiện tất cả ${mapPoints.length} phòng đang cho thuê${previewCity ? ` ở ${previewCity}` : ''}. Bấm vào giá để xem nhanh phòng.`
                  : 'Tin mới nhất đã qua kiểm duyệt.'}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex rounded-xl bg-gray-100 p-1">
                <SegmentedButton
                  active={listingsView === 'list'}
                  onClick={() => setListingsView('list')}
                  label="Xem dạng lưới"
                >
                  <List size={15} /> <span className="hidden sm:inline">Danh sách</span>
                </SegmentedButton>
                <SegmentedButton
                  active={listingsView === 'map'}
                  onClick={() => setListingsView('map')}
                  label="Xem trên bản đồ"
                >
                  <MapPin size={15} /> <span className="hidden sm:inline">Bản đồ</span>
                </SegmentedButton>
              </div>
              <Link
                to={previewCity ? `/search?city=${encodeURIComponent(previewCity)}` : '/search'}
                className="flex items-center gap-1 text-sm font-semibold text-blue-700 hover:text-blue-800"
              >
                Xem tất cả phòng <ArrowRight size={15} />
              </Link>
            </div>
          </Reveal>

          <div className="mb-6">
            <CityChips value={previewCity} onChange={setPreviewCity} />
          </div>

          {!loading && latest.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-300 px-6 py-14 text-center">
              <p className="font-medium text-gray-900">Chưa có phòng nào{previewCity ? ` ở ${previewCity}` : ''}.</p>
              <p className="mt-1 text-sm text-gray-600">Thử chọn thành phố khác hoặc quay lại sau nhé.</p>
            </div>
          ) : (
            // Same layout as the map mode on /search: newest cards on the left, every listing with coordinates on the map.
            <div className={showMap ? 'grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)]' : ''}>
              {showMap && (
                <div className="lg:order-2">
                  <div className="lg:sticky lg:top-24">
                    <ListingsMapPreview
                      listings={mapPoints}
                      priceMarkers
                      className="h-72 w-full lg:h-[calc(100dvh-8rem)]"
                    />
                  </div>
                </div>
              )}

              <div className="min-w-0 lg:order-1">
                <div className={`grid grid-cols-1 gap-5 sm:grid-cols-2 ${showMap ? '' : 'lg:grid-cols-4'}`}>
                  {loading
                    ? [0, 1, 2, 3].map((i) => (
                        <div key={i} className="h-80 animate-pulse rounded-2xl border border-gray-200 bg-gray-50" />
                      ))
                    : latest.map((listing) => (
                        <ListingCard
                          key={listing.id}
                          listing={listing}
                          favorited={listingFavorites.isFavorited(listing.id)}
                          onToggleFavorite={() => listingFavorites.toggle(listing.id)}
                        />
                      ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Recommended for you - content-based filtering on the user's favorited listings */}
      {recommended.length > 0 && (
        <section className="px-4 pb-16 sm:px-6 sm:pb-20">
          <div className="mx-auto max-w-7xl">
            <Reveal className="mb-6 flex items-end justify-between gap-4">
              <div>
                <h2 className={SECTION_TITLE_CLASS}>Có thể bạn quan tâm</h2>
                <p className="mt-2 text-gray-600">Gợi ý dựa trên các phòng bạn đã lưu.</p>
              </div>
              <RailArrows onScroll={scrollRecommended} />
            </Reveal>
            <div
              ref={recommendedScrollRef}
              className="scrollbar-hide flex snap-x snap-mandatory gap-5 overflow-x-auto pb-2"
            >
              {recommended.map((listing) => (
                <div key={listing.id} className="w-64 flex-shrink-0 snap-start sm:w-72">
                  <ListingCard
                    listing={listing}
                    favorited={listingFavorites.isFavorited(listing.id)}
                    onToggleFavorite={() => listingFavorites.toggle(listing.id)}
                  />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Deposit escrow - the main reason to rent through RoomieVibe */}
      <section className="bg-gray-50 px-4 py-16 sm:px-6 sm:py-24">
        <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-12 lg:gap-16">
          <Reveal className="lg:col-span-5">
            <img
              src="/images/home/deposit-keys.webp"
              alt="Bàn tay cầm chìa khóa nhà có móc khóa hình ngôi nhà"
              width={1000}
              height={667}
              loading="lazy"
              className="aspect-[4/3] w-full rounded-3xl object-cover object-[35%_50%] lg:aspect-[4/5]"
            />
          </Reveal>
          <Reveal delay={80} className="lg:col-span-7">
            <h2 className={`${SECTION_TITLE_CLASS} max-w-[22ch]`}>Đặt cọc xem phòng mà không lo mất tiền oan</h2>
            <p className="mt-3 max-w-[60ch] leading-relaxed text-gray-600">
              Khi chủ nhà gửi yêu cầu đặt cọc trong khung chat, tiền của bạn được RoomieVibe giữ lại. Chủ nhà chỉ
              nhận được sau khi bạn đã xem phòng.
            </p>
            <ol className="mt-8">
              {DEPOSIT_STEPS.map((step, index) => (
                <li key={step.title} className="relative flex gap-4 pb-7 last:pb-0">
                  {index < DEPOSIT_STEPS.length - 1 && (
                    <span aria-hidden="true" className="absolute bottom-1 left-[17px] top-10 w-px bg-gray-300" />
                  )}
                  <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border border-gray-300 bg-white text-sm font-semibold text-gray-900">
                    {index + 1}
                  </span>
                  <div className="pt-1.5">
                    <p className="font-semibold text-gray-900">{step.title}</p>
                    <p className="mt-1 text-sm leading-relaxed text-gray-600">{step.desc}</p>
                  </div>
                </li>
              ))}
            </ol>
          </Reveal>
        </div>
      </section>

      {/* Other trust features */}
      <section className="px-4 py-16 sm:px-6 sm:py-20">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-12 lg:gap-16">
          <Reveal className="lg:col-span-4">
            <h2 className={`${SECTION_TITLE_CLASS} max-w-[16ch]`}>Những thứ giúp bạn chọn đúng phòng</h2>
          </Reveal>
          <Reveal delay={80} className="grid gap-x-10 gap-y-9 sm:grid-cols-2 lg:col-span-8">
            {TRUST_POINTS.map(({ title, desc, Icon, link }) => (
              <div key={title} className="border-t border-gray-200 pt-6">
                <Icon size={22} className="text-blue-700" />
                <h3 className="mt-4 font-semibold text-gray-900">{title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-gray-600">{desc}</p>
                {link && (
                  <Link
                    to={link.to}
                    className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-blue-700 hover:text-blue-800"
                  >
                    {link.label} <ArrowRight size={14} />
                  </Link>
                )}
              </div>
            ))}
          </Reveal>
        </div>
      </section>

      {/* Roommate profiles - intro column + horizontal rail */}
      <section className="bg-gray-50 px-4 py-16 sm:px-6 sm:py-20">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-12 lg:gap-10">
          <Reveal className="lg:col-span-4">
            <h2 className={SECTION_TITLE_CLASS}>Tìm người ở ghép hợp tính</h2>
            <p className="mt-3 leading-relaxed text-gray-600">
              Khi bạn đã có hồ sơ, danh sách được xếp theo mức độ hợp nhau về giờ giấc, thói quen và ngân sách.
            </p>
            <div className="mt-6">
              <CityChips value={previewRoommateCity} onChange={setPreviewRoommateCity} />
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                to="/roommates"
                className="rounded-2xl bg-blue-700 px-5 py-3 text-sm font-semibold text-white transition-all hover:bg-blue-800 active:scale-[0.98]"
              >
                Xem tất cả hồ sơ
              </Link>
              <Link
                to={user ? '/roommates/profile' : '/login'}
                className="rounded-2xl border border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-gray-800 transition-colors hover:border-gray-400"
              >
                Tạo hồ sơ của bạn
              </Link>
            </div>
          </Reveal>

          <div className="min-w-0 lg:col-span-8">
            {loadingRoommates && (
              <div className="flex gap-5 overflow-hidden">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-64 flex-shrink-0 animate-pulse overflow-hidden rounded-2xl border border-gray-200 bg-white sm:w-72"
                  >
                    <div className="h-40 bg-gray-100" />
                    <div className="space-y-2 p-4">
                      <div className="h-4 w-3/4 rounded bg-gray-100" />
                      <div className="h-4 w-1/2 rounded bg-gray-100" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!loadingRoommates && roommateProfiles.length === 0 && (
              <div className="flex h-full min-h-48 items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-white px-6 text-center">
                <p className="text-gray-600">
                  Chưa có hồ sơ nào{previewRoommateCity ? ` ở ${previewRoommateCity}` : ''}. Hãy là người đầu tiên tạo
                  hồ sơ.
                </p>
              </div>
            )}

            {!loadingRoommates && roommateProfiles.length > 0 && (
              <>
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
                <div className="mt-4 flex justify-end">
                  <RailArrows onScroll={scrollRoommates} />
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Landlord CTA */}
      <section className="px-4 py-16 sm:px-6 sm:py-20">
        <Reveal className="mx-auto grid max-w-7xl overflow-hidden rounded-3xl bg-blue-50 lg:grid-cols-2">
          <div className="relative h-64 sm:h-80 lg:h-auto">
            <img
              src="/images/home/landlord-balconies.webp"
              alt="Dãy ban công của một khu chung cư nhiều tầng"
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover object-[75%_50%]"
            />
          </div>
          <div className="p-8 sm:p-12 lg:py-16">
            <h2 className={`${SECTION_TITLE_CLASS} max-w-[18ch]`}>Có phòng trống? Đăng tin miễn phí.</h2>
            <p className="mt-3 max-w-[50ch] leading-relaxed text-gray-600">
              Tiếp cận người đang tìm phòng ở {cityCount || 6} thành phố, nhận tin nhắn và tiền cọc xem phòng ngay
              trong app.
            </p>
            <ul className="mt-7 space-y-3.5">
              {LANDLORD_POINTS.map((point) => (
                <li key={point} className="flex items-start gap-3 text-gray-800">
                  <CheckCircle2 size={20} className="mt-0.5 flex-shrink-0 text-blue-700" />
                  {point}
                </li>
              ))}
            </ul>
            <Link
              to={user?.role === 'LANDLORD' ? '/listings/new' : '/register'}
              className="mt-9 inline-flex rounded-2xl bg-blue-700 px-6 py-3.5 text-base font-semibold text-white transition-all hover:bg-blue-800 active:scale-[0.98]"
            >
              Đăng tin cho thuê
            </Link>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
