import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ListChecks, PlusCircle, ShieldCheck, LogOut, ChevronDown, Menu, X, Heart } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import ModeSwitcher from './ModeSwitcher';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  async function handleLogout() {
    setMenuOpen(false);
    setMobileOpen(false);
    await logout();
    navigate('/');
  }

  function closeMobile() {
    setMobileOpen(false);
  }

  const initial = user?.fullName?.charAt(0)?.toUpperCase() || '?';

  return (
    <nav className="sticky top-0 z-30 border-b border-gray-200 bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link to="/" onClick={closeMobile} className="text-xl font-bold tracking-tight text-rose-600">
          RoomieVibe
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-5 text-sm md:flex">
          <ModeSwitcher />

          {user && (
            <Link
              to="/favorites"
              title="Đã lưu"
              className="flex items-center gap-1.5 text-gray-700 transition-colors hover:text-rose-600"
            >
              <Heart size={16} /> Đã lưu
            </Link>
          )}

          {user?.role === 'LANDLORD' && (
            <>
              <Link
                to="/listings/mine"
                className="flex items-center gap-1.5 text-gray-700 transition-colors hover:text-rose-600"
              >
                <ListChecks size={15} /> Tin của tôi
              </Link>
              <Link
                to="/listings/new"
                className="flex items-center gap-1.5 rounded-full bg-rose-50 px-3.5 py-1.5 font-medium text-rose-600 transition-colors hover:bg-rose-100"
              >
                <PlusCircle size={15} /> Đăng tin
              </Link>
            </>
          )}

          {user?.role === 'ADMIN' && (
            <Link
              to="/admin"
              className="flex items-center gap-1.5 text-gray-700 transition-colors hover:text-rose-600"
            >
              <ShieldCheck size={15} /> Quản trị
            </Link>
          )}

          {user ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen((o) => !o)}
                className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2 transition-colors hover:bg-gray-50"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-600 text-sm font-semibold text-white">
                  {initial}
                </span>
                <ChevronDown size={14} className="text-gray-500" />
              </button>

              {menuOpen && (
                <div className="absolute right-0 top-11 w-44 rounded-xl border border-gray-200 bg-white py-1 shadow-lg">
                  <p className="truncate px-3 py-2 text-sm font-medium text-gray-900">
                    {user.fullName}
                  </p>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 transition-colors hover:bg-gray-50"
                  >
                    <LogOut size={14} /> Đăng xuất
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login" className="text-gray-700 transition-colors hover:text-rose-600">
                Đăng nhập
              </Link>
              <Link
                to="/register"
                className="rounded-full bg-rose-600 px-4 py-1.5 font-medium text-white transition-colors hover:bg-rose-700"
              >
                Đăng ký
              </Link>
            </div>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          type="button"
          onClick={() => setMobileOpen((o) => !o)}
          aria-label={mobileOpen ? 'Đóng menu' : 'Mở menu'}
          className="flex h-9 w-9 items-center justify-center rounded-full text-gray-700 transition-colors hover:bg-gray-100 md:hidden"
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile panel */}
      {mobileOpen && (
        <div className="space-y-1 border-t border-gray-200 bg-white px-4 py-3 md:hidden">
          <div className="pb-2">
            <ModeSwitcher />
          </div>

          {user && (
            <Link
              to="/favorites"
              onClick={closeMobile}
              className="flex items-center gap-2 rounded-xl px-2 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
            >
              <Heart size={16} /> Đã lưu
            </Link>
          )}

          {user?.role === 'LANDLORD' && (
            <>
              <Link
                to="/listings/mine"
                onClick={closeMobile}
                className="flex items-center gap-2 rounded-xl px-2 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
              >
                <ListChecks size={16} /> Tin của tôi
              </Link>
              <Link
                to="/listings/new"
                onClick={closeMobile}
                className="flex items-center gap-2 rounded-xl px-2 py-2.5 text-sm font-medium text-rose-600 hover:bg-rose-50"
              >
                <PlusCircle size={16} /> Đăng tin
              </Link>
            </>
          )}

          {user?.role === 'ADMIN' && (
            <Link
              to="/admin"
              onClick={closeMobile}
              className="flex items-center gap-2 rounded-xl px-2 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
            >
              <ShieldCheck size={16} /> Quản trị
            </Link>
          )}

          {user ? (
            <>
              <div className="flex items-center gap-2 px-2 pt-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-600 text-sm font-semibold text-white">
                  {initial}
                </span>
                <span className="truncate text-sm font-medium text-gray-900">{user.fullName}</span>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center gap-2 rounded-xl px-2 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50"
              >
                <LogOut size={16} /> Đăng xuất
              </button>
            </>
          ) : (
            <div className="flex gap-2 pt-2">
              <Link
                to="/login"
                onClick={closeMobile}
                className="flex-1 rounded-full border border-gray-300 py-2 text-center text-sm font-medium text-gray-700"
              >
                Đăng nhập
              </Link>
              <Link
                to="/register"
                onClick={closeMobile}
                className="flex-1 rounded-full bg-rose-600 py-2 text-center text-sm font-medium text-white"
              >
                Đăng ký
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
