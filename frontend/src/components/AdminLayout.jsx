import { useCallback, useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { LayoutDashboard, ListChecks, Users, Scale } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getStats } from '../services/adminService';
import { getDisputedDeposits } from '../services/depositService';

const NAV_ITEMS = [
  { to: '/admin', label: 'Tổng quan', Icon: LayoutDashboard, end: true },
  { to: '/admin/pending', label: 'Duyệt tin', Icon: ListChecks, countKey: 'pending' },
  { to: '/admin/disputes', label: 'Tranh chấp cọc', Icon: Scale, countKey: 'disputes' },
  { to: '/admin/users', label: 'Người dùng', Icon: Users },
];

function navClass({ isActive }) {
  return `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
    isActive ? 'bg-gray-900 text-white' : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
  }`;
}

function mobileNavClass({ isActive }) {
  return `flex flex-shrink-0 items-center gap-1.5 whitespace-nowrap border-b-2 pb-3 text-sm font-medium transition-colors ${
    isActive ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-800'
  }`;
}

function CountBadge({ value, inverted }) {
  if (!value) return null;
  return (
    <span
      className={`ml-auto min-w-5 rounded-full px-1.5 text-center text-xs font-semibold leading-5 ${
        inverted ? 'bg-white/20 text-white' : 'bg-red-600 text-white'
      }`}
    >
      {value}
    </span>
  );
}

export default function AdminLayout() {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const [counts, setCounts] = useState({ pending: 0, disputes: 0 });

  const refreshCounts = useCallback(() => {
    Promise.all([getStats(), getDisputedDeposits()])
      .then(([stats, disputes]) => setCounts({ pending: stats.pendingListings, disputes: disputes.length }))
      .catch(() => {});
  }, []);

  useEffect(() => {
    refreshCounts();
  }, [refreshCounts, pathname]);

  return (
    <div className="min-h-[calc(100dvh-4rem)] bg-gray-50">
      <div className="mx-auto flex max-w-7xl">
        <aside className="hidden w-60 flex-shrink-0 border-r border-gray-200 bg-white lg:block">
          <div className="sticky top-16 flex h-[calc(100dvh-4rem)] flex-col px-4 py-6">
            <p className="px-3 text-xs font-semibold text-gray-500">Quản trị RoomieVibe</p>
            <nav className="mt-3 space-y-1">
              {NAV_ITEMS.map(({ to, label, Icon, end, countKey }) => (
                <NavLink key={to} to={to} end={end} className={navClass}>
                  {({ isActive }) => (
                    <>
                      <Icon size={17} />
                      {label}
                      {countKey && <CountBadge value={counts[countKey]} inverted={isActive} />}
                    </>
                  )}
                </NavLink>
              ))}
            </nav>
            <div className="mt-auto border-t border-gray-100 px-3 pt-4">
              <p className="truncate text-sm font-semibold text-gray-900">{user?.fullName || 'Quản trị viên'}</p>
              <p className="truncate text-xs text-gray-500">{user?.email}</p>
            </div>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <nav className="scrollbar-hide flex gap-6 overflow-x-auto border-b border-gray-200 bg-white px-4 pt-4 sm:px-6 lg:hidden">
            {NAV_ITEMS.map(({ to, label, end, countKey }) => (
              <NavLink key={to} to={to} end={end} className={mobileNavClass}>
                {label}
                {countKey && counts[countKey] > 0 && (
                  <span className="rounded-full bg-red-600 px-1.5 text-xs font-semibold leading-5 text-white">
                    {counts[countKey]}
                  </span>
                )}
              </NavLink>
            ))}
          </nav>
          <div className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            <Outlet context={{ refreshCounts, counts }} />
          </div>
        </div>
      </div>
    </div>
  );
}
