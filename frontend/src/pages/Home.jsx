import { useEffect, useState } from 'react';
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
  Lock,
  Zap,
  ChevronRight,
} from 'lucide-react';
import { searchListings } from '../services/listingService';
import ListingCard from '../components/ListingCard';
import { useAuth } from '../context/AuthContext';

const FEATURES = [
  {
    title: 'Bảo mật địa chỉ',
    desc: 'Chỉ hiển thị khu vực trên tin công khai, an toàn cho cả người thuê và chủ nhà.',
    Icon: ShieldCheck,
  },
  {
    title: 'Tìm kiếm thông minh',
    desc: 'Lọc theo khu vực, giá, diện tích, tiện ích để tìm đúng phòng bạn cần.',
    Icon: SlidersHorizontal,
  },
  {
    title: 'Minh bạch, đã kiểm duyệt',
    desc: 'Mọi tin đăng đều được admin duyệt trước khi hiển thị công khai.',
    Icon: BadgeCheck,
  },
];

const STEPS = [
  { title: 'Tìm kiếm', desc: 'Lọc theo khu vực, giá, diện tích để tìm phòng ưng ý.', Icon: Search },
  { title: 'Xem chi tiết', desc: 'Xem ảnh, mô tả, tiện ích và vị trí của tin đăng.', Icon: Eye },
  { title: 'Liên hệ chủ nhà', desc: 'Gọi trực tiếp cho chủ nhà để hẹn xem phòng.', Icon: Phone },
  { title: 'Chuyển vào ở', desc: 'Thỏa thuận xong là có thể dọn vào ngay.', Icon: KeyRound },
];

export default function Home() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [filters, setFilters] = useState({ city: '', district: '', minPrice: '', maxPrice: '' });
  const [latest, setLatest] = useState([]);
  const [totalListings, setTotalListings] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    searchListings({ page: 0, size: 6, sortBy: 'createdAt', sortDir: 'desc' })
      .then((res) => {
        setLatest(res.content);
        setTotalListings(res.totalElements);
      })
      .finally(() => setLoading(false));
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
      <section className="relative overflow-hidden">
        {/* TODO: thay bằng ảnh thật khi có - hien tai la placeholder gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-rose-600 via-rose-500 to-rose-400" />
        <div className="absolute inset-0 bg-black/25" />

        <div className="relative px-6 py-20 text-center text-white sm:py-28">
          <h1 className="mx-auto max-w-2xl text-4xl font-extrabold tracking-tight sm:text-5xl">
            Tìm phòng trọ & bạn ở ghép an toàn, minh bạch
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-white/90">
            Hàng ngàn tin đăng đã kiểm duyệt, tìm đúng nơi ở phù hợp với bạn.
          </p>

          <div className="mx-auto mt-5 flex flex-wrap justify-center gap-2.5">
            {[
              { Icon: ShieldCheck, text: 'Đã kiểm duyệt' },
              { Icon: Lock, text: 'Bảo mật thông tin' },
              { Icon: Zap, text: 'Hỗ trợ nhanh chóng' },
            ].map(({ Icon, text }) => (
              <span
                key={text}
                className="flex items-center gap-2 rounded-full border border-white/25 bg-white/10 py-1.5 pl-1.5 pr-3.5 text-xs font-medium text-white backdrop-blur-sm"
              >
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/90 text-rose-600">
                  <Icon size={12} />
                </span>
                {text}
              </span>
            ))}
          </div>

          <form
            onSubmit={handleSearch}
            className="mx-auto mt-8 flex max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl sm:flex-row sm:items-stretch sm:rounded-full"
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
              <span className="text-gray-300">–</span>
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
              className="m-1.5 flex items-center justify-center gap-1.5 rounded-full bg-rose-600 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-rose-700"
            >
              <Search size={16} /> Tìm kiếm
            </button>
          </form>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-sm text-white/80">
            <span>Tìm kiếm phổ biến:</span>
            {['Hà Nội', 'TP. Hồ Chí Minh', 'Đà Nẵng'].map((cityName) => (
              <button
                type="button"
                key={cityName}
                onClick={() => navigate(`/search?city=${encodeURIComponent(cityName)}`)}
                className="flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 font-medium text-white backdrop-blur-sm hover:bg-white/20"
              >
                {cityName} <ChevronRight size={13} />
              </button>
            ))}
          </div>
        </div>

        {/* Stats row */}
        <div className="relative border-t border-white/20 bg-black/10 px-6 py-6">
          <div className="mx-auto grid max-w-3xl grid-cols-3 gap-4 text-center text-white">
            <div className="flex flex-col items-center gap-1">
              <HomeIcon size={20} />
              <p className="text-xl font-bold">{totalListings ?? '—'}+</p>
              <p className="text-xs text-white/80">Tin đăng</p>
            </div>
            <div className="flex flex-col items-center gap-1">
              <MapPinned size={20} />
              <p className="text-xl font-bold">63</p>
              <p className="text-xs text-white/80">Tỉnh/thành</p>
            </div>
            <div className="flex flex-col items-center gap-1">
              <ShieldCheck size={20} />
              <p className="text-xl font-bold">100%</p>
              <p className="text-xs text-white/80">Đã kiểm duyệt</p>
            </div>
          </div>
        </div>
      </section>

      {/* Feature highlights */}
      <section className="bg-white px-6 py-14">
        <div className="mx-auto max-w-6xl rounded-xl border border-gray-200 p-8">
          <div className="grid grid-cols-1 gap-10 sm:grid-cols-3">
            {FEATURES.map(({ title, desc, Icon }) => (
              <div key={title} className="text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 text-rose-600">
                  <Icon size={22} />
                </div>
                <h3 className="mb-1 font-semibold text-gray-900">{title}</h3>
                <p className="text-sm text-gray-500">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-gray-50 px-6 py-14">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-10 text-center text-2xl font-bold text-gray-900">Cách hoạt động</h2>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map(({ title, desc, Icon }, index) => (
              <div key={title} className="relative text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-rose-600 text-white">
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

      {/* Landlord CTA */}
      <section className="bg-white px-6 py-14">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 rounded-xl bg-gradient-to-r from-rose-600 to-rose-500 p-8 text-center text-white sm:flex-row sm:text-left">
          <div>
            <h2 className="mb-1 text-xl font-bold">Bạn là chủ nhà?</h2>
            <p className="text-white/90">Đăng tin miễn phí, tiếp cận hàng ngàn người thuê tiềm năng.</p>
          </div>
          <Link
            to={user?.role === 'LANDLORD' ? '/listings/new' : '/register'}
            className="flex-shrink-0 rounded-full bg-white px-6 py-3 text-sm font-semibold text-rose-600 hover:bg-gray-100"
          >
            Đăng tin ngay
          </Link>
        </div>
      </section>

      {/* Latest listings preview */}
      <section className="bg-white px-6 pb-14">
        <div className="mx-auto max-w-6xl rounded-xl border border-gray-200 p-8">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Phòng trọ mới đăng</h2>
            <Link to="/search" className="text-sm font-medium text-rose-600 hover:underline">
              Xem tất cả
            </Link>
          </div>

          {loading && <p className="text-gray-500">Đang tải...</p>}

          {!loading && latest.length === 0 && (
            <p className="text-gray-500">Chưa có tin đăng nào.</p>
          )}

          {!loading && latest.length > 0 && (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {latest.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
