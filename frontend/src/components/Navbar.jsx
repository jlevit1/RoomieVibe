import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ChevronDown, Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';

const PRIMARY_LINKS = [
  { to: '/search', label: 'Phòng trọ', isActive: (path) => path === '/search' || /^\/listings\/\d+$/.test(path) },
  { to: '/roommates', label: 'Ở ghép', isActive: (path) => path.startsWith('/roommates') },
  { to: '/ai-search', label: 'Trợ lý AI', isActive: (path) => path === '/ai-search' },
];

const ROLE_LABELS = { LANDLORD: 'Chủ nhà', USER: 'Người thuê', ADMIN: 'Quản trị viên' };

function accountLinks(user) {
  return [
    { to: '/favorites', label: 'Phòng đã lưu' },
    { to: '/messages', label: 'Tin nhắn' },
    { to: '/wallet', label: 'Ví của tôi' },
    ...(user.role === 'LANDLORD' ? [{ to: '/listings/mine', label: 'Tin đăng của tôi' }] : []),
    ...(user.role === 'ADMIN' ? [{ to: '/admin', label: 'Trang quản trị' }] : []),
    { to: '/roommates/profile', label: 'Hồ sơ ở ghép' },
  ];
}

const PRIMARY_BUTTON_CLASS =
  'rounded-xl bg-blue-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-800';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    setMenuOpen(false);
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return undefined;
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  async function handleLogout() {
    setMenuOpen(false);
    setMobileOpen(false);
    await logout();
    navigate('/');
  }

  const initial = user?.fullName?.charAt(0)?.toUpperCase() || '?';
  const isLandlord = user?.role === 'LANDLORD';

  return (
    <nav className="sticky top-0 z-30 border-b border-gray-200 bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-6 px-4 sm:px-6">
        <div className="flex items-center gap-10">
          <Link to="/" className="text-xl font-bold tracking-tight text-blue-600">
            RoomieVibe
          </Link>

          <div className="hidden items-center gap-7 md:flex">
            {PRIMARY_LINKS.map(({ to, label, isActive }) => {
              const active = isActive(pathname);
              return (
                <Link
                  key={to}
                  to={to}
                  aria-current={active ? 'page' : undefined}
                  className={`relative text-sm font-medium transition-colors after:absolute after:-bottom-[22px] after:left-0 after:right-0 after:h-0.5 after:rounded-full ${
                    active ? 'text-gray-900 after:bg-blue-700' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {label}
                </Link>
              );
            })}
          </div>
        </div>

        <div className="hidden items-center gap-5 md:flex">
          {!user && (
            <>
              <Link to="/register" className="text-sm font-medium text-gray-600 transition-colors hover:text-gray-900">
                Đăng tin cho thuê
              </Link>
              <Link to="/login" className="text-sm font-medium text-gray-600 transition-colors hover:text-gray-900">
                Đăng nhập
              </Link>
              <Link to="/register" className={PRIMARY_BUTTON_CLASS}>
                Đăng ký
              </Link>
            </>
          )}

          {isLandlord && (
            <>
              <Link
                to="/listings/mine"
                className="hidden text-sm font-medium text-gray-600 transition-colors hover:text-gray-900 lg:inline"
              >
                Tin của tôi
              </Link>
              <Link to="/listings/new" className={PRIMARY_BUTTON_CLASS}>
                Đăng tin
              </Link>
            </>
          )}

          {user?.role === 'ADMIN' && (
            <Link to="/admin" className="text-sm font-medium text-gray-600 transition-colors hover:text-gray-900">
              Quản trị
            </Link>
          )}

          {user && <NotificationBell />}

          {user && (
            <div ref={menuRef} className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen((o) => !o)}
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                aria-label="Tài khoản"
                className="flex items-center gap-1.5 rounded-full py-1 pl-1 pr-2 transition-colors hover:bg-gray-100"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-700 text-sm font-semibold text-white">
                  {initial}
                </span>
                <ChevronDown size={14} className="text-gray-500" />
              </button>

              {menuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 top-12 w-60 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-[0_16px_40px_-16px_rgba(20,79,112,0.3)]"
                >
                  <div className="border-b border-gray-100 px-4 py-3">
                    <p className="truncate text-sm font-semibold text-gray-900">{user.fullName}</p>
                    <p className="text-xs text-gray-500">{ROLE_LABELS[user.role] || ''}</p>
                  </div>
                  <div className="py-1.5">
                    {accountLinks(user).map((item) => (
                      <Link
                        key={item.to}
                        to={item.to}
                        role="menuitem"
                        className="block px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50 hover:text-gray-900"
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                  <div className="border-t border-gray-100 py-1.5">
                    <button
                      type="button"
                      role="menuitem"
                      onClick={handleLogout}
                      className="block w-full px-4 py-2 text-left text-sm text-gray-700 transition-colors hover:bg-gray-50 hover:text-gray-900"
                    >
                      Đăng xuất
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-1 md:hidden">
          {user && <NotificationBell />}
          <button
            type="button"
            onClick={() => setMobileOpen((o) => !o)}
            aria-label={mobileOpen ? 'Đóng menu' : 'Mở menu'}
            aria-expanded={mobileOpen}
            className="flex h-10 w-10 items-center justify-center rounded-full text-gray-700 transition-colors hover:bg-gray-100"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-gray-200 bg-white px-4 pb-5 pt-2 md:hidden">
          <div className="divide-y divide-gray-100">
            {PRIMARY_LINKS.map(({ to, label, isActive }) => (
              <Link
                key={to}
                to={to}
                className={`block py-3 text-base font-medium ${isActive(pathname) ? 'text-blue-700' : 'text-gray-900'}`}
              >
                {label}
              </Link>
            ))}
          </div>

          {user ? (
            <div className="mt-3 rounded-2xl bg-gray-50 p-2">
              <div className="flex items-center gap-3 px-2 py-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-700 text-sm font-semibold text-white">
                  {initial}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-gray-900">{user.fullName}</p>
                  <p className="text-xs text-gray-500">{ROLE_LABELS[user.role] || ''}</p>
                </div>
              </div>
              {isLandlord && (
                <Link to="/listings/new" className="mx-2 my-2 block rounded-xl bg-blue-700 py-2.5 text-center text-sm font-semibold text-white">
                  Đăng tin
                </Link>
              )}
              {accountLinks(user).map((item) => (
                <Link key={item.to} to={item.to} className="block rounded-xl px-2 py-2.5 text-sm text-gray-700 hover:bg-white">
                  {item.label}
                </Link>
              ))}
              <button
                type="button"
                onClick={handleLogout}
                className="block w-full rounded-xl px-2 py-2.5 text-left text-sm text-gray-700 hover:bg-white"
              >
                Đăng xuất
              </button>
            </div>
          ) : (
            <div className="mt-4 space-y-2">
              <div className="flex gap-2">
                <Link
                  to="/login"
                  className="flex-1 rounded-xl border border-gray-300 py-2.5 text-center text-sm font-semibold text-gray-800"
                >
                  Đăng nhập
                </Link>
                <Link to="/register" className="flex-1 rounded-xl bg-blue-700 py-2.5 text-center text-sm font-semibold text-white">
                  Đăng ký
                </Link>
              </div>
              <Link to="/register" className="block py-2 text-center text-sm font-medium text-gray-600">
                Bạn là chủ nhà? Đăng tin cho thuê
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
