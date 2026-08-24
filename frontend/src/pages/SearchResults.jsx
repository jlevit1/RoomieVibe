import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { List, LayoutGrid, BadgeCheck, Lock, Gift, Zap, X } from 'lucide-react';
import { searchListings } from '../services/listingService';
import ListingCard from '../components/ListingCard';
import ListingListItem from '../components/ListingListItem';
import Pagination from '../components/Pagination';
import CurrencyInput from '../components/CurrencyInput';
import { useFavorites } from '../hooks/useFavorites';

const SORT_OPTIONS = [
  { value: 'createdAt,desc', label: 'Mới nhất' },
  { value: 'price,asc', label: 'Giá tăng dần' },
  { value: 'price,desc', label: 'Giá giảm dần' },
];

const TRUST_ITEMS = [
  { Icon: BadgeCheck, text: 'Tin đăng đã được kiểm duyệt' },
  { Icon: Lock, text: 'Bảo mật thông tin liên hệ' },
  { Icon: Gift, text: 'Đăng tin miễn phí cho chủ nhà' },
  { Icon: Zap, text: 'Phản hồi nhanh từ chủ nhà' },
];

export default function SearchResults() {
  const listingFavorites = useFavorites('listing');
  const [searchParams, setSearchParams] = useSearchParams();
  const [view, setView] = useState('list');
  const [page, setPage] = useState(0);
  const [data, setData] = useState({ content: [], totalPages: 0, totalElements: 0 });
  const [loading, setLoading] = useState(false);

  const city = searchParams.get('city') || '';
  const district = searchParams.get('district') || '';
  const minPrice = searchParams.get('minPrice') || '';
  const maxPrice = searchParams.get('maxPrice') || '';
  const sort = searchParams.get('sort') || 'createdAt,desc';

  const [draft, setDraft] = useState({ city, district, minPrice, maxPrice });

  useEffect(() => {
    setDraft({ city, district, minPrice, maxPrice });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [city, district, minPrice, maxPrice, sort, page]);

  async function load() {
    setLoading(true);
    try {
      const [sortBy, sortDir] = sort.split(',');
      const params = { page, size: 12, sortBy, sortDir };
      if (city) params.city = city;
      if (district) params.district = district;
      if (minPrice) params.minPrice = minPrice;
      if (maxPrice) params.maxPrice = maxPrice;
      const result = await searchListings(params);
      setData(result);
    } finally {
      setLoading(false);
    }
  }

  function applyFilters(e) {
    e.preventDefault();
    setPage(0);
    setSearchParams({ ...draft, sort });
  }

  function changeSort(value) {
    setPage(0);
    setSearchParams({ city, district, minPrice, maxPrice, sort: value });
  }

  function clearFilters() {
    setPage(0);
    setSearchParams({});
  }

  function goToPage(next) {
    setPage(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  let heading = 'Tất cả phòng trọ';
  if (district && city) {
    heading = `Phòng trọ tại ${district}, ${city}`;
  } else if (district || city) {
    heading = `Phòng trọ tại ${district || city}`;
  }

  const hasActiveFilters = city || district || minPrice || maxPrice;

  return (
    <div className="mx-auto max-w-6xl px-6 py-6">
      {/* Breadcrumb */}
      <div className="mb-3 text-sm text-gray-500">
        <Link to="/" className="hover:text-rose-600">
          Trang chủ
        </Link>
        {city && <span> / {city}</span>}
        {district && <span> / {district}</span>}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        {/* Filter sidebar */}
        <aside className="lg:col-span-1">
          <form
            onSubmit={applyFilters}
            className="sticky top-4 space-y-4 rounded-2xl border border-gray-200 p-5"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Bộ lọc</h2>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="flex items-center gap-1 text-xs text-gray-500 hover:text-rose-600"
                >
                  <X size={12} /> Xóa tất cả
                </button>
              )}
            </div>

            <div>
              <label
                htmlFor="filter-city"
                className="mb-1 block text-xs font-medium text-gray-500"
              >
                Tỉnh/thành phố
              </label>
              <input
                id="filter-city"
                value={draft.city}
                onChange={(e) => setDraft({ ...draft, city: e.target.value })}
                className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm transition-colors focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
              />
            </div>

            <div>
              <label
                htmlFor="filter-district"
                className="mb-1 block text-xs font-medium text-gray-500"
              >
                Quận/huyện
              </label>
              <input
                id="filter-district"
                value={draft.district}
                onChange={(e) => setDraft({ ...draft, district: e.target.value })}
                className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm transition-colors focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
              />
            </div>

            <div>
              <label
                htmlFor="filter-min-price"
                className="mb-1 block text-xs font-medium text-gray-500"
              >
                Khoảng giá
              </label>
              <div className="flex items-center gap-2">
                <CurrencyInput
                  id="filter-min-price"
                  placeholder="Từ"
                  value={draft.minPrice}
                  onChange={(e) => setDraft({ ...draft, minPrice: e.target.value })}
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm transition-colors focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                />
                <span className="text-gray-400">-</span>
                <CurrencyInput
                  placeholder="Đến"
                  value={draft.maxPrice}
                  onChange={(e) => setDraft({ ...draft, maxPrice: e.target.value })}
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm transition-colors focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full rounded-full bg-rose-600 py-2.5 text-sm font-medium text-white transition-all hover:bg-rose-700 active:scale-[0.98]"
            >
              Áp dụng bộ lọc
            </button>

            <div className="divide-y divide-gray-100 border-t border-gray-100 pt-2">
              {TRUST_ITEMS.map(({ Icon, text }) => (
                <div key={text} className="flex items-center gap-2 py-2 text-xs text-gray-600">
                  <Icon size={14} className="flex-shrink-0 text-rose-500" />
                  <span>{text}</span>
                </div>
              ))}
            </div>
          </form>
        </aside>

        {/* Main content */}
        <div className="lg:col-span-3">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{heading}</h1>
              {!loading && (
                <p className="text-sm text-gray-500">Tìm thấy {data.totalElements} tin đăng</p>
              )}
            </div>

            <div className="flex overflow-hidden rounded-full border border-gray-300">
              <button
                type="button"
                onClick={() => setView('list')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 text-sm transition-colors ${view === 'list' ? 'bg-rose-600 text-white' : 'bg-white text-gray-600'}`}
              >
                <List size={15} /> Danh sách
              </button>
              <button
                type="button"
                onClick={() => setView('grid')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 text-sm transition-colors ${view === 'grid' ? 'bg-rose-600 text-white' : 'bg-white text-gray-600'}`}
              >
                <LayoutGrid size={15} /> Lưới
              </button>
            </div>
          </div>

          <div className="mb-6 flex flex-wrap items-center gap-2">
            <span className="text-sm text-gray-500">Sắp xếp:</span>
            {SORT_OPTIONS.map((opt) => (
              <button
                type="button"
                key={opt.value}
                onClick={() => changeSort(opt.value)}
                className={`rounded-full border px-4 py-1.5 text-sm ${
                  sort === opt.value
                    ? 'border-rose-600 bg-rose-600 text-white'
                    : 'border-gray-300 text-gray-700'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {loading && (
            <div className="space-y-4">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="h-32 animate-pulse rounded-2xl border border-gray-200 bg-gray-50" />
              ))}
            </div>
          )}

          {!loading && data.content.length === 0 && (
            <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-gray-300 py-16 text-center">
              <p className="text-gray-500">Không tìm thấy tin đăng nào phù hợp.</p>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="text-sm font-medium text-rose-600 hover:underline"
                >
                  Xóa bộ lọc
                </button>
              )}
            </div>
          )}

          {!loading && data.content.length > 0 && (
            <>
              {view === 'list' ? (
                <div className="space-y-4">
                  {data.content.map((listing, index) => (
                    <ListingListItem
                      key={listing.id}
                      listing={listing}
                      featured={page === 0 && index === 0}
                      favorited={listingFavorites.isFavorited(listing.id)}
                      onToggleFavorite={() => listingFavorites.toggle(listing.id)}
                    />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  {data.content.map((listing) => (
                    <ListingCard
                      key={listing.id}
                      listing={listing}
                      favorited={listingFavorites.isFavorited(listing.id)}
                      onToggleFavorite={() => listingFavorites.toggle(listing.id)}
                    />
                  ))}
                </div>
              )}

              <Pagination page={page} totalPages={data.totalPages} onChange={goToPage} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
