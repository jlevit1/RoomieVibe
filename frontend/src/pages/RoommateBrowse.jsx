import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Check, X } from 'lucide-react';
import { browseProfiles } from '../services/roommateService';
import RoommateCard from '../components/RoommateCard';
import CurrencyInput from '../components/CurrencyInput';
import FilterPopover from '../components/FilterPopover';
import { BandPills } from '../components/FilterModal';
import { useAuth } from '../context/AuthContext';
import { useFavorites } from '../hooks/useFavorites';
import { STATUS_SHORT_LABELS, GENDER_LABELS } from '../constants/roommate';
import { BUDGET_BANDS, priceRangeLabel } from '../constants/filters';

const SORT_OPTIONS = [
  { value: 'match', label: 'Hợp với bạn nhất', needsUser: true },
  { value: 'newest', label: 'Mới nhất' },
  { value: 'budget-asc', label: 'Ngân sách thấp trước' },
  { value: 'budget-desc', label: 'Ngân sách cao trước' },
];

const FILTER_KEYS = ['city', 'status', 'gender', 'minBudget', 'maxBudget'];

function toOptions(labels) {
  return [{ value: '', label: 'Tất cả' }, ...Object.entries(labels).map(([value, label]) => ({ value, label }))];
}

const STATUS_OPTIONS = toOptions(STATUS_SHORT_LABELS);
const GENDER_OPTIONS = toOptions(GENDER_LABELS);

function OptionList({ options, value, onSelect }) {
  return (
    <ul className="-mx-2 -my-1 max-h-72 space-y-0.5 overflow-y-auto">
      {options.map((opt) => {
        const selected = value === opt.value;
        return (
          <li key={opt.value || 'all'}>
            <button
              type="button"
              onClick={() => onSelect(opt.value)}
              aria-pressed={selected}
              className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-gray-100 ${
                selected ? 'font-semibold text-gray-900' : 'text-gray-700'
              }`}
            >
              {opt.label}
              {selected && <Check size={16} className="flex-shrink-0 text-blue-700" />}
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function sortProfiles(profiles, sort) {
  return [...profiles].sort((a, b) => {
    if (sort === 'newest') return new Date(b.createdAt) - new Date(a.createdAt);
    if (sort === 'budget-asc') return a.budget - b.budget;
    if (sort === 'budget-desc') return b.budget - a.budget;
    return (b.compatibilityScore ?? -1) - (a.compatibilityScore ?? -1);
  });
}

function matchesFilters(p, filters) {
  if (filters.city && p.city !== filters.city) return false;
  if (filters.status && p.status !== filters.status) return false;
  if (filters.gender && p.gender !== filters.gender) return false;
  if (filters.minBudget && p.budget < Number(filters.minBudget)) return false;
  if (filters.maxBudget && p.budget > Number(filters.maxBudget)) return false;
  return true;
}

export default function RoommateBrowse() {
  const { user } = useAuth();
  const roommateFavorites = useFavorites('roommate');
  const [searchParams, setSearchParams] = useSearchParams();
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openPopover, setOpenPopover] = useState(null);
  const [budgetDraft, setBudgetDraft] = useState({ minBudget: '', maxBudget: '' });

  useEffect(() => {
    browseProfiles()
      .then(setProfiles)
      .catch((err) => {
        setError(err.response?.data?.message || 'Không tải được danh sách');
      })
      .finally(() => setLoading(false));
  }, []);

  const filters = useMemo(
    () => Object.fromEntries(FILTER_KEYS.map((key) => [key, searchParams.get(key) || ''])),
    [searchParams]
  );
  const sortOptions = SORT_OPTIONS.filter((opt) => !opt.needsUser || user);
  const requestedSort = searchParams.get('sort');
  const sort = sortOptions.some((opt) => opt.value === requestedSort) ? requestedSort : sortOptions[0].value;

  const cityOptions = useMemo(() => {
    const cities = Array.from(new Set(profiles.map((p) => p.city).filter(Boolean)));
    cities.sort((a, b) => a.localeCompare(b, 'vi'));
    return [{ value: '', label: 'Tất cả' }, ...cities.map((c) => ({ value: c, label: c }))];
  }, [profiles]);

  const visibleProfiles = useMemo(() => {
    const matching = profiles.filter((p) => matchesFilters(p, filters));
    const own = matching.filter((p) => p.own);
    return [...own, ...sortProfiles(matching.filter((p) => !p.own), sort)];
  }, [profiles, filters, sort]);

  const otherCount = visibleProfiles.filter((p) => !p.own).length;

  function updateParams(patch) {
    const next = new URLSearchParams(searchParams);
    Object.entries(patch).forEach(([key, value]) => {
      if (value) next.set(key, value);
      else next.delete(key);
    });
    setSearchParams(next, { replace: true });
    setOpenPopover(null);
  }

  function clearAll() {
    updateParams(Object.fromEntries(FILTER_KEYS.map((key) => [key, ''])));
  }

  function togglePopover(name) {
    setOpenPopover((current) => (current === name ? null : name));
  }

  const closePopover = () => setOpenPopover(null);
  const hasBudget = Boolean(filters.minBudget || filters.maxBudget);
  const budgetText = priceRangeLabel(filters.minBudget, filters.maxBudget);

  const activeChips = [
    filters.city && { key: 'city', label: filters.city, clear: { city: '' } },
    filters.status && { key: 'status', label: STATUS_SHORT_LABELS[filters.status], clear: { status: '' } },
    filters.gender && { key: 'gender', label: `Giới tính: ${GENDER_LABELS[filters.gender]}`, clear: { gender: '' } },
    hasBudget && { key: 'budget', label: `Ngân sách ${budgetText}`, clear: { minBudget: '', maxBudget: '' } },
  ].filter(Boolean);

  return (
    <div>
      <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6">
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-gray-500">
          <Link to="/" className="hover:text-gray-900">
            Trang chủ
          </Link>
          <span aria-hidden="true">/</span>
          <span className="text-gray-900">Ở ghép</span>
        </nav>

        <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="page-title">{filters.city ? `Tìm người ở ghép tại ${filters.city}` : 'Tìm người ở ghép'}</h1>
            <p className="mt-1 text-gray-600">
              {loading ? 'Đang tải hồ sơ...' : `${otherCount} hồ sơ đang tìm bạn ở ghép`}
              {user && !loading ? ', xếp theo mức độ hợp với bạn' : ''}
            </p>
          </div>
          <Link to={user ? '/roommates/profile' : '/login'} className="btn-primary">
            {user ? 'Hồ sơ của tôi' : 'Tạo hồ sơ ở ghép'}
          </Link>
        </div>
      </div>

      {/* Filter bar */}
      <div className="sticky top-16 z-20 mt-5 border-y border-gray-200 bg-white">
        <div className="scrollbar-hide mx-auto flex max-w-7xl items-center gap-2 overflow-x-auto px-4 py-3 sm:flex-wrap sm:overflow-visible sm:px-6">
          <FilterPopover
            label={filters.city || 'Khu vực'}
            title="Khu vực"
            active={Boolean(filters.city)}
            open={openPopover === 'city'}
            onToggle={() => togglePopover('city')}
            onClose={closePopover}
            width="sm:w-64"
          >
            <OptionList options={cityOptions} value={filters.city} onSelect={(city) => updateParams({ city })} />
          </FilterPopover>

          <FilterPopover
            label={filters.status ? STATUS_SHORT_LABELS[filters.status] : 'Tình trạng phòng'}
            title="Tình trạng phòng"
            active={Boolean(filters.status)}
            open={openPopover === 'status'}
            onToggle={() => togglePopover('status')}
            onClose={closePopover}
            width="sm:w-64"
          >
            <OptionList options={STATUS_OPTIONS} value={filters.status} onSelect={(status) => updateParams({ status })} />
          </FilterPopover>

          <FilterPopover
            label={filters.gender ? `Giới tính: ${GENDER_LABELS[filters.gender]}` : 'Giới tính'}
            title="Giới tính"
            active={Boolean(filters.gender)}
            open={openPopover === 'gender'}
            onToggle={() => togglePopover('gender')}
            onClose={closePopover}
            width="sm:w-56"
          >
            <OptionList options={GENDER_OPTIONS} value={filters.gender} onSelect={(gender) => updateParams({ gender })} />
          </FilterPopover>

          <FilterPopover
            label={hasBudget ? budgetText : 'Ngân sách'}
            title="Ngân sách mỗi tháng"
            active={hasBudget}
            open={openPopover === 'budget'}
            onToggle={() => {
              setBudgetDraft({ minBudget: filters.minBudget, maxBudget: filters.maxBudget });
              togglePopover('budget');
            }}
            onClose={closePopover}
            width="sm:w-[22rem]"
          >
            <div className="space-y-4">
              <BandPills
                bands={BUDGET_BANDS}
                isActive={(band) => budgetDraft.minBudget === band.min && budgetDraft.maxBudget === band.max}
                onSelect={(band) => setBudgetDraft({ minBudget: band.min, maxBudget: band.max })}
              />
              <div>
                <label htmlFor="pop-min-budget" className="field-label">
                  Hoặc nhập ngân sách mỗi tháng
                </label>
                <div className="flex items-center gap-2">
                  <CurrencyInput
                    id="pop-min-budget"
                    placeholder="Từ"
                    value={budgetDraft.minBudget}
                    onChange={(e) => setBudgetDraft({ ...budgetDraft, minBudget: e.target.value })}
                    className="field-input min-w-0"
                  />
                  <span className="text-gray-400">-</span>
                  <CurrencyInput
                    aria-label="Ngân sách tối đa"
                    placeholder="Đến"
                    value={budgetDraft.maxBudget}
                    onChange={(e) => setBudgetDraft({ ...budgetDraft, maxBudget: e.target.value })}
                    className="field-input min-w-0"
                  />
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => updateParams({ minBudget: '', maxBudget: '' })}
                >
                  Xóa
                </button>
                <button type="button" className="btn-primary flex-1" onClick={() => updateParams(budgetDraft)}>
                  Áp dụng
                </button>
              </div>
            </div>
          </FilterPopover>

          <label className="flex flex-shrink-0 items-center gap-2 whitespace-nowrap rounded-full border border-gray-300 bg-white py-2 pl-4 pr-3 text-sm text-gray-600 sm:ml-auto">
            <span className="hidden sm:inline">Sắp xếp</span>
            <select
              value={sort}
              onChange={(e) => updateParams({ sort: e.target.value })}
              aria-label="Sắp xếp"
              className="cursor-pointer bg-transparent font-medium text-gray-900 focus:outline-none"
            >
              {sortOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
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
        {error && (
          <div className="mb-6 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {error}{' '}
            <Link to="/roommates/profile" className="font-semibold underline">
              Tạo hồ sơ ngay
            </Link>
          </div>
        )}

        {loading && (
          <div className="grid grid-cols-1 gap-x-5 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }, (_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-[4/3] rounded-2xl bg-gray-100" />
                <div className="mt-3 h-4 w-2/3 rounded bg-gray-100" />
                <div className="mt-2 h-3 w-1/2 rounded bg-gray-100" />
                <div className="mt-4 h-4 w-1/3 rounded bg-gray-100" />
              </div>
            ))}
          </div>
        )}

        {!loading && !error && otherCount === 0 && (
          <div className="mb-8 rounded-2xl border border-dashed border-gray-300 px-6 py-14 text-center">
            <p className="font-semibold text-gray-900">Chưa có hồ sơ nào khớp bộ lọc này</p>
            <p className="mt-1 text-sm text-gray-600">Thử bỏ bớt điều kiện hoặc mở rộng ngân sách.</p>
            {activeChips.length > 0 && (
              <button type="button" onClick={clearAll} className="btn-secondary mt-5">
                Xóa bộ lọc
              </button>
            )}
          </div>
        )}

        {!loading && visibleProfiles.length > 0 && (
          <div className="grid grid-cols-1 gap-x-5 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {visibleProfiles.map((p) => (
              <RoommateCard
                key={p.id}
                profile={p}
                favorited={roommateFavorites.isFavorited(p.id)}
                onToggleFavorite={() => roommateFavorites.toggle(p.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
