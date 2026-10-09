import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { SlidersHorizontal, X } from 'lucide-react';
import FilterPopover from '../components/FilterPopover';
import { searchListings } from '../services/listingService';
import ListingCard from '../components/ListingCard';
import Pagination from '../components/Pagination';
import CurrencyInput from '../components/CurrencyInput';
import SearchableSelect from '../components/SearchableSelect';
import ListingsMapPreview from '../components/ListingsMapPreview';
import FilterModal, { BandPills } from '../components/FilterModal';
import { PRICE_BANDS, filterPillClass, priceRangeLabel } from '../constants/filters';
import { AMENITY_LABELS } from '../constants/amenities';
import { PROVINCE_NAMES, getDistrictNamesForProvince } from '../data/vnLocations';
import { useFavorites } from '../hooks/useFavorites';

const SORT_OPTIONS = [
  { value: 'createdAt,desc', label: 'Mới nhất' },
  { value: 'price,asc', label: 'Giá thấp đến cao' },
  { value: 'price,desc', label: 'Giá cao đến thấp' },
  { value: 'area,desc', label: 'Diện tích lớn nhất' },
];

const VIEW_OPTIONS = [
  { value: 'list', label: 'Danh sách' },
  { value: 'map', label: 'Bản đồ' },
];

const FILTER_KEYS = ['city', 'district', 'ward', 'minPrice', 'maxPrice', 'minArea', 'maxArea', 'amenities'];

function areaLabel(min, max) {
  if (min && max) return `${min} - ${max} m²`;
  if (min) return `Từ ${min} m²`;
  if (max) return `Dưới ${max} m²`;
  return '';
}

function defaultView(param) {
  return VIEW_OPTIONS.some((v) => v.value === param) ? param : 'list';
}

export default function SearchResults() {
  const listingFavorites = useFavorites('listing');
  const [searchParams, setSearchParams] = useSearchParams();
  const [data, setData] = useState({ content: [], totalPages: 0, totalElements: 0 });
  const [loading, setLoading] = useState(false);
  const [openPopover, setOpenPopover] = useState(null);
  const [moreOpen, setMoreOpen] = useState(false);

  const params = Object.fromEntries(searchParams.entries());
  // View and page live in the URL so Back from a listing returns to the same page and layout.
  const view = defaultView(params.view);
  const page = Math.max(0, Number(params.page || 1) - 1);
  const { view: _view, ...queryParams } = params;
  const queryKey = new URLSearchParams(queryParams).toString();
  const city = params.city || '';
  const district = params.district || '';
  const ward = params.ward || '';
  const minPrice = params.minPrice || '';
  const maxPrice = params.maxPrice || '';
  const minArea = params.minArea || '';
  const maxArea = params.maxArea || '';
  const amenities = (params.amenities || '').split(',').filter(Boolean);
  const sort = params.sort || 'createdAt,desc';

  const [areaDraft, setAreaDraft] = useState({ city, district });
  const [priceDraft, setPriceDraft] = useState({ minPrice, maxPrice });

  useEffect(() => {
    setAreaDraft({ city, district });
    setPriceDraft({ minPrice, maxPrice });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryKey]);

  async function load() {
    setLoading(true);
    try {
      const [sortBy, sortDir] = sort.split(',');
      const query = { page, size: 12, sortBy, sortDir };
      ['city', 'district', 'ward', 'minPrice', 'maxPrice', 'minArea', 'maxArea'].forEach((key) => {
        if (params[key]) query[key] = params[key];
      });
      if (amenities.length > 0) query.amenities = amenities;
      setData(await searchListings(query));
    } finally {
      setLoading(false);
    }
  }

  function updateParams(patch, options) {
    const next = { ...params, ...patch };
    if (!('page' in patch)) next.page = '';
    Object.keys(next).forEach((key) => {
      const value = next[key];
      if (value === '' || value == null || (Array.isArray(value) && value.length === 0)) delete next[key];
      else if (Array.isArray(value)) next[key] = value.join(',');
    });
    setOpenPopover(null);
    setSearchParams(next, options);
  }

  function setView(nextView) {
    updateParams({ view: nextView === 'list' ? '' : nextView, page: params.page || '' }, { replace: true });
  }

  function clearAll() {
    const next = {};
    if (params.sort) next.sort = params.sort;
    if (params.view) next.view = params.view;
    setSearchParams(next);
  }

  function goToPage(next) {
    updateParams({ page: next > 0 ? String(next + 1) : '' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  const activeChips = [
    city && { key: 'city', label: district ? `${district}, ${city}` : city, clear: { city: '', district: '', ward: '' } },
    ward && { key: 'ward', label: ward, clear: { ward: '' } },
    (minPrice || maxPrice) && { key: 'price', label: priceRangeLabel(minPrice, maxPrice), clear: { minPrice: '', maxPrice: '' } },
    (minArea || maxArea) && { key: 'area', label: areaLabel(minArea, maxArea), clear: { minArea: '', maxArea: '' } },
    ...amenities.map((a) => ({
      key: `amenity-${a}`,
      label: AMENITY_LABELS[a] || a,
      clear: { amenities: amenities.filter((x) => x !== a) },
    })),
  ].filter(Boolean);

  const moreCount = [ward, minArea || maxArea].filter(Boolean).length + amenities.length;
  const hasFilters = FILTER_KEYS.some((key) => params[key]);

  let heading = 'Phòng trọ cho thuê';
  if (district && city) heading = `Phòng trọ ${district}, ${city}`;
  else if (city) heading = `Phòng trọ tại ${city}`;

  const showMap = view === 'map';

  return (
    <div>
      <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6">
        <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-sm text-gray-500">
          <Link to="/" className="hover:text-gray-900">
            Trang chủ
          </Link>
          <span aria-hidden="true">/</span>
          <Link to="/search" className={city ? 'hover:text-gray-900' : 'text-gray-900'}>
            Phòng trọ
          </Link>
          {city && (
            <>
              <span aria-hidden="true">/</span>
              <span className="text-gray-900">{city}</span>
            </>
          )}
        </nav>
        <h1 className="page-title mt-3">{heading}</h1>
        <p className="mt-1 text-gray-600">
          {loading ? 'Đang tìm phòng...' : `${data.totalElements} phòng đang cho thuê`}
        </p>
      </div>

      {/* Filter bar */}
      <div className="sticky top-16 z-20 mt-5 border-y border-gray-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center gap-2 px-4 py-3 sm:px-6">
          <div className="scrollbar-hide -mx-4 flex min-w-0 flex-1 items-center gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
            <FilterPopover
              label={city ? (district || city) : 'Khu vực'}
              title="Khu vực"
              active={Boolean(city)}
              open={openPopover === 'area'}
              onToggle={() => setOpenPopover(openPopover === 'area' ? null : 'area')}
              onClose={() => setOpenPopover(null)}
            >
              <div className="space-y-4">
                <div>
                  <label htmlFor="pop-city" className="field-label">
                    Tỉnh/thành phố
                  </label>
                  <SearchableSelect
                    id="pop-city"
                    name="city"
                    placeholder="Toàn quốc"
                    value={areaDraft.city}
                    onChange={(e) => setAreaDraft({ city: e.target.value, district: '' })}
                    options={PROVINCE_NAMES}
                    className="field-input"
                  />
                </div>
                <div>
                  <label htmlFor="pop-district" className="field-label">
                    Quận/huyện
                  </label>
                  <SearchableSelect
                    id="pop-district"
                    name="district"
                    placeholder={areaDraft.city ? 'Tất cả' : 'Chọn tỉnh/thành trước'}
                    value={areaDraft.district}
                    onChange={(e) => setAreaDraft({ ...areaDraft, district: e.target.value })}
                    options={getDistrictNamesForProvince(areaDraft.city)}
                    disabled={!areaDraft.city}
                    className="field-input"
                  />
                </div>
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => updateParams({ city: '', district: '', ward: '' })}
                  >
                    Xóa
                  </button>
                  <button
                    type="button"
                    className="btn-primary flex-1"
                    onClick={() => updateParams({ city: areaDraft.city, district: areaDraft.district, ward: '' })}
                  >
                    Áp dụng
                  </button>
                </div>
              </div>
            </FilterPopover>

            <FilterPopover
              label={minPrice || maxPrice ? priceRangeLabel(minPrice, maxPrice) : 'Mức giá'}
              title="Mức giá"
              active={Boolean(minPrice || maxPrice)}
              open={openPopover === 'price'}
              onToggle={() => setOpenPopover(openPopover === 'price' ? null : 'price')}
              onClose={() => setOpenPopover(null)}
              width="sm:w-[22rem]"
            >
              <div className="space-y-4">
                <BandPills
                  bands={PRICE_BANDS}
                  isActive={(band) => priceDraft.minPrice === band.min && priceDraft.maxPrice === band.max}
                  onSelect={(band) => setPriceDraft({ minPrice: band.min, maxPrice: band.max })}
                />
                <div>
                  <label htmlFor="pop-min-price" className="field-label">
                    Hoặc nhập khoảng giá
                  </label>
                  <div className="flex items-center gap-2">
                    <CurrencyInput
                      id="pop-min-price"
                      placeholder="Từ"
                      value={priceDraft.minPrice}
                      onChange={(e) => setPriceDraft({ ...priceDraft, minPrice: e.target.value })}
                      className="field-input min-w-0"
                    />
                    <span className="text-gray-400">-</span>
                    <CurrencyInput
                      aria-label="Giá tối đa"
                      placeholder="Đến"
                      value={priceDraft.maxPrice}
                      onChange={(e) => setPriceDraft({ ...priceDraft, maxPrice: e.target.value })}
                      className="field-input min-w-0"
                    />
                  </div>
                </div>
                <div className="flex gap-2 pt-1">
                  <button type="button" className="btn-secondary" onClick={() => updateParams({ minPrice: '', maxPrice: '' })}>
                    Xóa
                  </button>
                  <button type="button" className="btn-primary flex-1" onClick={() => updateParams(priceDraft)}>
                    Áp dụng
                  </button>
                </div>
              </div>
            </FilterPopover>

            <button
              type="button"
              onClick={() => setMoreOpen(true)}
              className={filterPillClass(moreCount > 0)}
            >
              <SlidersHorizontal size={15} /> Bộ lọc khác{moreCount > 0 ? ` (${moreCount})` : ''}
            </button>

            <label className="ml-1 flex flex-shrink-0 items-center gap-2 whitespace-nowrap rounded-full border border-gray-300 bg-white py-2 pl-4 pr-3 text-sm text-gray-600">
              <span className="hidden sm:inline">Sắp xếp</span>
              <select
                value={sort}
                onChange={(e) => updateParams({ sort: e.target.value })}
                aria-label="Sắp xếp"
                className="cursor-pointer bg-transparent font-medium text-gray-900 focus:outline-none"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div role="group" aria-label="Kiểu hiển thị" className="hidden flex-shrink-0 rounded-xl bg-gray-100 p-1 md:flex">
            {VIEW_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                aria-pressed={view === opt.value}
                onClick={() => setView(opt.value)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  view === opt.value ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {activeChips.length > 0 && (
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-2 px-4 pt-4 sm:px-6">
          {activeChips.map((chip) => (
            <button
              key={chip.key}
              type="button"
              onClick={() => updateParams(chip.clear)}
              aria-label={`Bỏ lọc ${chip.label}`}
              className="flex items-center gap-1.5 rounded-full bg-gray-100 py-1.5 pl-3.5 pr-2.5 text-sm text-gray-800 transition-colors hover:bg-gray-200"
            >
              {chip.label} <X size={14} className="text-gray-500" />
            </button>
          ))}
          <button type="button" onClick={clearAll} className="ml-1 text-sm link-accent">
            Xóa tất cả
          </button>
        </div>
      )}

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <div className="mb-4 flex rounded-xl bg-gray-100 p-1 md:hidden">
          {VIEW_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              aria-pressed={view === opt.value}
              onClick={() => setView(opt.value)}
              className={`flex-1 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                view === opt.value ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div className={showMap ? 'grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)]' : ''}>
          {showMap && (
            <div className="lg:order-2">
              <div className="lg:sticky lg:top-[9.5rem]">
                <ListingsMapPreview
                  listings={data.content}
                  priceMarkers
                  className="h-72 w-full lg:h-[calc(100dvh-11rem)]"
                />
              </div>
            </div>
          )}

          <div className="min-w-0 lg:order-1">
            {loading && (
              <div className={`grid grid-cols-1 gap-5 sm:grid-cols-2 ${showMap ? '' : 'lg:grid-cols-3 xl:grid-cols-4'}`}>
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="h-80 animate-pulse rounded-2xl border border-gray-200 bg-gray-50" />
                ))}
              </div>
            )}

            {!loading && data.content.length === 0 && (
              <div className="rounded-2xl border border-dashed border-gray-300 px-6 py-16 text-center">
                <p className="font-semibold text-gray-900">Chưa có phòng nào khớp bộ lọc này</p>
                <p className="mt-1 text-sm text-gray-600">Thử nới khoảng giá hoặc chọn khu vực rộng hơn.</p>
                {hasFilters && (
                  <button type="button" onClick={clearAll} className="btn-secondary mt-5">
                    Xóa bộ lọc
                  </button>
                )}
              </div>
            )}

            {!loading && data.content.length > 0 && (
              <>
                <div
                  className={`grid grid-cols-1 gap-5 sm:grid-cols-2 ${showMap ? '' : 'lg:grid-cols-3 xl:grid-cols-4'}`}
                >
                  {data.content.map((listing) => (
                    <ListingCard
                      key={listing.id}
                      listing={listing}
                      favorited={listingFavorites.isFavorited(listing.id)}
                      onToggleFavorite={() => listingFavorites.toggle(listing.id)}
                    />
                  ))}
                </div>
                <Pagination page={page} totalPages={data.totalPages} onChange={goToPage} />
              </>
            )}
          </div>
        </div>
      </div>

      <FilterModal
        isOpen={moreOpen}
        onClose={() => setMoreOpen(false)}
        initialFilters={{ city, district, ward, minPrice, maxPrice, minArea, maxArea, amenities }}
        onApply={(values) => updateParams(values)}
      />
    </div>
  );
}
