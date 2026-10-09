import { useEffect, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { ArrowDownRight, ArrowUpRight, ChevronRight } from 'lucide-react';
import { getStats, getAnalytics } from '../../services/adminService';
import { DualTrendAreaChart, TrendBarChart, ListingStatusBreakdown } from '../../components/admin/AnalyticsCharts';
import PeriodSelect from '../../components/admin/PeriodSelect';

function sumBy(points, key) {
  return points.reduce((sum, p) => sum + Number(p[key] || 0), 0);
}

// Honest trend: compares the first half of the selected period against the
// second half (no fabricated numbers - only derived from the real daily series).
function computeTrend(points, key) {
  if (!points || points.length < 4) return null;
  const mid = Math.floor(points.length / 2);
  const firstHalf = sumBy(points.slice(0, mid), key);
  const secondHalf = sumBy(points.slice(mid), key);
  if (firstHalf === 0) return secondHalf > 0 ? { pct: 100, up: true } : null;
  const pct = ((secondHalf - firstHalf) / firstHalf) * 100;
  return { pct: Math.round(Math.abs(pct)), up: pct >= 0 };
}

function formatNumber(value) {
  return new Intl.NumberFormat('vi-VN').format(value);
}

function formatMoney(value) {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toLocaleString('vi-VN', { maximumFractionDigits: 1 })} tỷ đ`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toLocaleString('vi-VN', { maximumFractionDigits: 1 })} triệu đ`;
  return `${formatNumber(value)} đ`;
}

function Trend({ trend }) {
  if (!trend) {
    return <p className="mt-1 text-sm text-gray-500">Chưa đủ dữ liệu so sánh</p>;
  }
  const Icon = trend.up ? ArrowUpRight : ArrowDownRight;
  return (
    <p className={`mt-1 flex items-center gap-1 text-sm ${trend.up ? 'text-emerald-700' : 'text-red-700'}`}>
      <Icon size={15} />
      <span className="font-semibold">{trend.pct}%</span>
      <span className="hidden text-gray-500 sm:inline">so với nửa đầu kỳ</span>
    </p>
  );
}

export default function Dashboard() {
  const outlet = useOutletContext();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);
  const [analytics, setAnalytics] = useState(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(true);

  useEffect(() => {
    getStats()
      .then(setStats)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    setLoadingAnalytics(true);
    getAnalytics(days)
      .then(setAnalytics)
      .finally(() => setLoadingAnalytics(false));
  }, [days]);

  const signupsByDay =
    analytics &&
    analytics.userSignups.map((point, i) => ({
      date: point.date,
      users: point.count,
      listings: analytics.listingSignups[i]?.count ?? 0,
    }));

  const walletTotal = analytics ? sumBy(analytics.walletTopUps, 'amount') : 0;
  const ready = !loading && !loadingAnalytics && stats && analytics;

  const kpis = ready && [
    {
      key: 'totalUsers',
      label: 'Người dùng',
      value: formatNumber(stats.totalUsers),
      trend: computeTrend(analytics.userSignups, 'count'),
    },
    {
      key: 'totalLandlords',
      label: 'Chủ nhà',
      value: formatNumber(stats.totalLandlords),
      note: `${Math.round((stats.totalLandlords / Math.max(stats.totalUsers, 1)) * 100)}% tổng người dùng`,
    },
    {
      key: 'totalListings',
      label: 'Tin đăng',
      value: formatNumber(stats.totalListings),
      trend: computeTrend(analytics.listingSignups, 'count'),
    },
    {
      key: 'walletTopUps',
      label: `Nạp ví ${days} ngày`,
      value: formatMoney(walletTotal),
      trend: computeTrend(analytics.walletTopUps, 'amount'),
    },
  ];

  const todo = [
    { to: '/admin/pending', label: 'Tin đăng chờ duyệt', value: outlet?.counts?.pending ?? stats?.pendingListings ?? 0 },
    { to: '/admin/disputes', label: 'Tranh chấp đặt cọc', value: outlet?.counts?.disputes ?? 0 },
  ];

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="page-title">Tổng quan</h1>
          <p className="mt-1 text-gray-600">Số liệu cập nhật theo thời gian thực từ hệ thống.</p>
        </div>
        <PeriodSelect value={days} onChange={setDays} />
      </div>

      <div className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-gray-200 bg-gray-200 lg:grid-cols-4">
        {ready
          ? kpis.map((k) => (
              <div key={k.key} className="bg-white p-5">
                <p className="text-sm text-gray-600">{k.label}</p>
                <p className="mt-1 truncate text-2xl font-bold tabular-nums tracking-tight text-gray-900">{k.value}</p>
                {k.note ? <p className="mt-1 text-sm text-gray-500">{k.note}</p> : <Trend trend={k.trend} />}
              </div>
            ))
          : [0, 1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse bg-white p-5">
                <div className="h-3.5 w-1/2 rounded bg-gray-100" />
                <div className="mt-3 h-7 w-2/3 rounded bg-gray-100" />
                <div className="mt-3 h-3 w-3/4 rounded bg-gray-100" />
              </div>
            ))}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="surface p-5">
          <h2 className="font-semibold text-gray-900">Việc cần xử lý</h2>
          <ul className="mt-3 divide-y divide-gray-100">
            {todo.map((t) => (
              <li key={t.to}>
                <Link to={t.to} className="group flex items-center gap-3 py-3">
                  <span className="flex-1 text-sm text-gray-700 group-hover:text-gray-900">{t.label}</span>
                  <span
                    className={`min-w-7 rounded-full px-2 text-center text-sm font-semibold leading-6 ${
                      t.value > 0 ? 'bg-red-50 text-red-700' : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {t.value}
                  </span>
                  <ChevronRight size={16} className="text-gray-400 group-hover:text-gray-700" />
                </Link>
              </li>
            ))}
          </ul>
          {todo.every((t) => t.value === 0) && (
            <p className="mt-2 text-sm text-gray-500">Không còn việc tồn đọng.</p>
          )}
        </div>

        {stats ? (
          <div className="lg:col-span-2">
            <ListingStatusBreakdown
              approved={stats.approvedListings}
              rented={stats.rentedListings}
              pending={stats.pendingListings}
              rejected={stats.rejectedListings}
            />
          </div>
        ) : (
          <div className="h-64 animate-pulse rounded-2xl border border-gray-200 bg-white lg:col-span-2" />
        )}
      </div>

      <h2 className="mt-10 text-lg font-semibold text-gray-900">Hoạt động {days} ngày gần đây</h2>

      {loadingAnalytics || !analytics ? (
        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="h-72 animate-pulse rounded-2xl border border-gray-200 bg-white" />
          <div className="h-72 animate-pulse rounded-2xl border border-gray-200 bg-white" />
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <TrendBarChart
            title="Nạp tiền vào ví"
            desc="Tổng tiền nạp mỗi ngày"
            data={analytics.walletTopUps}
            valueLabel="Nạp tiền"
          />
          <DualTrendAreaChart
            title="Người dùng và tin đăng mới"
            desc="Số lượt tạo mới mỗi ngày"
            data={signupsByDay}
            seriesA="users"
            seriesB="listings"
            labelA="Người dùng"
            labelB="Tin đăng"
          />
        </div>
      )}
    </div>
  );
}
