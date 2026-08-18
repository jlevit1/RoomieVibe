import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ListChecks, PlusCircle, ShieldCheck, LogOut, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import ModeSwitcher from './ModeSwitcher';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  async function handleLogout() {
    setMenuOpen(false);
    await logout();
    navigate('/');
  }

  const initial = user?.fullName?.charAt(0)?.toUpperCase() || '?';

  return (
    <nav className="sticky top-0 z-20 flex items-center justify-between border-b border-gray-200 bg-white px-6 py-3 shadow-sm">
      <Link to="/" className="text-xl font-bold text-rose-600">
        RoomieVibe
      </Link>

      <div className="flex items-center gap-5 text-sm">
        <ModeSwitcher />

        {user?.role === 'LANDLORD' && (
          <>
            <Link
              to="/listings/mine"
              className="flex items-center gap-1.5 text-gray-700 hover:text-rose-600"
            >
              <ListChecks size={15} /> Tin của tôi
            </Link>
            <Link
              to="/listings/new"
              className="flex items-center gap-1.5 rounded-full bg-rose-50 px-3.5 py-1.5 font-medium text-rose-600 hover:bg-rose-100"
            >
              <PlusCircle size={15} /> Đăng tin
            </Link>
          </>
        )}

        {user?.role === 'ADMIN' && (
          <Link
            to="/admin"
            className="flex items-center gap-1.5 text-gray-700 hover:text-rose-600"
          >
            <ShieldCheck size={15} /> Quản trị
          </Link>
        )}

        {user ? (
          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((o) => !o)}
              className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2 hover:bg-gray-50"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-600 text-sm font-semibold text-white">
                {initial}
              </span>
              <ChevronDown size={14} className="text-gray-500" />
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-11 w-44 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
                <p className="truncate px-3 py-2 text-sm font-medium text-gray-900">
                  {user.fullName}
                </p>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                >
                  <LogOut size={14} /> Đăng xuất
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link to="/login" className="text-gray-700 hover:text-rose-600">
              Đăng nhập
            </Link>
            <Link
              to="/register"
              className="rounded-full bg-rose-600 px-4 py-1.5 font-medium text-white hover:bg-rose-700"
            >
              Đăng ký
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
