import { NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, ListChecks, Users } from 'lucide-react';

const NAV_ITEMS = [
  { to: '/admin', label: 'Dashboard', Icon: LayoutDashboard, end: true },
  { to: '/admin/pending', label: 'Duyệt tin', Icon: ListChecks },
  { to: '/admin/users', label: 'Người dùng', Icon: Users },
];

export default function AdminLayout() {
  return (
    <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-6 py-8 md:grid-cols-4">
      <aside className="md:col-span-1">
        <nav className="sticky top-20 space-y-1 rounded-2xl border border-gray-200 p-2">
          {NAV_ITEMS.map(({ to, label, Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
                  isActive ? 'bg-rose-50 text-rose-700' : 'text-gray-600 hover:bg-gray-50'
                }`
              }
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="md:col-span-3">
        <Outlet />
      </div>
    </div>
  );
}
