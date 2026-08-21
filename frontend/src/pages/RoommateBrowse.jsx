import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, X } from 'lucide-react';
import { browseProfiles } from '../services/roommateService';
import RoommateCard from '../components/RoommateCard';
import { useAuth } from '../context/AuthContext';
import { useFavorites } from '../hooks/useFavorites';
import { STATUS_LABELS, GENDER_LABELS } from '../constants/roommate';

const SORT_OPTIONS = [
  { value: 'match', label: 'Phù hợp nhất' },
  { value: 'newest', label: 'Mới nhất' },
  { value: 'budget-asc', label: 'Ngân sách tăng dần' },
  { value: 'budget-desc', label: 'Ngân sách giảm dần' },
];

const EMPTY_FILTERS = { city: '', status: '', gender: '', minBudget: '', maxBudget: '' };

export default function RoommateBrowse() {
  const { user } = useAuth();
  const roommateFavorites = useFavorites('roommate');
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [sort, setSort] = useState('match');

  useEffect(() => {
    browseProfiles()
      .then(setProfiles)
      .catch((err) => {
        setError(err.response?.data?.message || 'Không tải được danh sách');
      })
      .finally(() => setLoading(false));
  }, []);

  const cities = useMemo(
    () => Array.from(new Set(profiles.map((p) => p.city))).sort((a, b) => a.localeCompare(b, 'vi')),
    [profiles]
  );

  const hasActiveFilters = Object.values(filters).some(Boolean);

  function updateFilter(key, value) {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }

  function clearFilters() {
    setFilters(EMPTY_FILTERS);
  }

  const visibleProfiles = useMemo(() => {
    let result = profiles.filter((p) => {
      if (p.own) return true;
      if (filters.city && p.city !== filters.city) return false;
      if (filters.status && p.status !== filters.status) return false;
      if (filters.gender && p.gender !== filters.gender) return false;
      if (filters.minBudget && p.budget < Number(filters.minBudget)) return false;
      if (filters.maxBudget && p.budget > Number(filters.maxBudget)) return false;
      return true;
    });

    const own = result.filter((p) => p.own);
    const others = result.filter((p) => !p.own);

    const sorted = [...others].sort((a, b) => {
      if (sort === 'newest') return new Date(b.createdAt) - new Date(a.createdAt);
      if (sort === 'budget-asc') return a.budget - b.budget;
      if (sort === 'budget-desc') return b.budget - a.budget;
      return (b.compatibilityScore ?? -1) - (a.compatibilityScore ?? -1);
    });

    return [...own, ...sorted];
  }, [profiles, filters, sort]);

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-3 text-sm text-gray-500">
        <Link to="/" className="hover:text-rose-600">
          Trang chủ
        </Link>{' '}
        / <span className="text-gray-700">Tìm bạn ở ghép</span>
      </div>

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Tìm bạn ở ghép</h1>
          <p className="text-sm text-gray-500">Sắp xếp theo % tương thích với hồ sơ của bạn</p>
        </div>
        <Link
          to={user ? '/roommates/profile' : '/login'}
          className="flex-shrink-0 whitespace-nowrap rounded-full bg-rose-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-rose-700"
        >
          {user ? 'Sửa hồ sơ của tôi' : 'Đăng nhập để tạo hồ sơ'}
        </Link>
      </div>

      {error && (
        <div className="mb-4 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-700">
          {error}{' '}
          <Link to="/roommates/profile" className="font-medium underline">
            Tạo hồ sơ ngay
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        {/* Filter sidebar */}
        <aside className="lg:col-span-1">
          <div className="sticky top-20 space-y-4 rounded-2xl border border-gray-200 p-4">
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
              <label htmlFor="filter-city" className="mb-1 block text-xs font-medium text-gray-500">
                Tỉnh/thành phố
              </label>
              <select
                id="filter-city"
                value={filters.city}
                onChange={(e) => updateFilter('city', e.target.value)}
                className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm transition-colors focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
              >
                <option value="">Tất cả</option>
                {cities.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="filter-status" className="mb-1 block text-xs font-medium text-gray-500">
                Trạng thái
              </label>
              <select
                id="filter-status"
                value={filters.status}
                onChange={(e) => updateFilter('status', e.target.value)}
                className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm transition-colors focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
              >
                <option value="">Tất cả</option>
                {Object.entries(STATUS_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="filter-gender" className="mb-1 block text-xs font-medium text-gray-500">
                Giới tính
              </label>
              <select
                id="filter-gender"
                value={filters.gender}
                onChange={(e) => updateFilter('gender', e.target.value)}
                className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm transition-colors focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
              >
                <option value="">Tất cả</option>
                {Object.entries(GENDER_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="filter-min-budget" className="mb-1 block text-xs font-medium text-gray-500">
                Ngân sách
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="filter-min-budget"
                  type="number"
                  placeholder="Từ"
                  value={filters.minBudget}
                  onChange={(e) => updateFilter('minBudget', e.target.value)}
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm transition-colors focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                />
                <span className="text-gray-400">-</span>
                <input
                  type="number"
                  placeholder="Đến"
                  value={filters.maxBudget}
                  onChange={(e) => updateFilter('maxBudget', e.target.value)}
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm transition-colors focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                />
              </div>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <div className="lg:col-span-3">
          <div className="mb-5 flex flex-wrap items-center gap-2">
            <span className="text-sm text-gray-500">Sắp xếp:</span>
            {SORT_OPTIONS.map((opt) => (
              <button
                type="button"
                key={opt.value}
                onClick={() => setSort(opt.value)}
                className={`rounded-full border px-3.5 py-1.5 text-sm transition-colors ${
                  sort === opt.value
                    ? 'border-rose-600 bg-rose-600 text-white'
                    : 'border-gray-300 text-gray-700 hover:border-rose-300'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {loading && (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="animate-pulse overflow-hidden rounded-2xl border border-gray-200">
                  <div className="h-40 bg-gray-100" />
                  <div className="space-y-2 p-4">
                    <div className="h-4 w-2/3 rounded bg-gray-100" />
                    <div className="h-3 w-1/2 rounded bg-gray-100" />
                    <div className="h-3 w-3/4 rounded bg-gray-100" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && !error && visibleProfiles.length === 0 && (
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-gray-300 py-16 text-center">
              <Users size={28} className="text-gray-300" />
              <p className="text-gray-500">Không có hồ sơ nào phù hợp với bộ lọc.</p>
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

          {!loading && visibleProfiles.length > 0 && (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
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
    </div>
  );
}
