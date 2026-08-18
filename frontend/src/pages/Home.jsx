import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Home as HomeIcon, MapPinned, ShieldCheck } from 'lucide-react';
import { searchListings } from '../services/listingService';
import ListingCard from '../components/ListingCard';

const FEATURES = [
  {
    title: 'Bảo mật địa chỉ',
    desc: 'Chỉ hiển thị khu vực trên tin công khai, an toàn cho cả người thuê và chủ nhà.',
  },
  {
    title: 'Tìm kiếm thông minh',
    desc: 'Lọc theo khu vực, giá, diện tích, tiện ích để tìm đúng phòng bạn cần.',
  },
  {
    title: 'Minh bạch, đã kiểm duyệt',
    desc: 'Mọi tin đăng đều được admin duyệt trước khi hiển thị công khai.',
  },
];

export default function Home() {
  const navigate = useNavigate();
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

          <form
            onSubmit={handleSearch}
            className="mx-auto mt-8 grid max-w-4xl grid-cols-2 gap-3 rounded-xl bg-white p-4 shadow-lg md:grid-cols-5"
          >
            <input
              name="city"
              placeholder="Tỉnh/thành phố"
              value={filters.city}
              onChange={handleFilterChange}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900"
            />
            <input
              name="district"
              placeholder="Quận/huyện"
              value={filters.district}
              onChange={handleFilterChange}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900"
            />
            <input
              name="minPrice"
              type="number"
              placeholder="Giá từ"
              value={filters.minPrice}
              onChange={handleFilterChange}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900"
            />
            <input
              name="maxPrice"
              type="number"
              placeholder="Giá đến"
              value={filters.maxPrice}
              onChange={handleFilterChange}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900"
            />
            <button
              type="submit"
              className="flex items-center justify-center gap-1.5 rounded-md bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700"
            >
              <Search size={16} /> Tìm kiếm
            </button>
          </form>
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
      <section className="border-b border-gray-100 bg-white px-6 py-10">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 sm:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title}>
              <h3 className="mb-1 font-semibold text-gray-900">{f.title}</h3>
              <p className="text-sm text-gray-500">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Latest listings preview */}
      <section className="mx-auto max-w-6xl px-6 py-10">
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
      </section>
    </div>
  );
}
