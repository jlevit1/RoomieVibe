import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate('/');
  }

  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
      <Link to="/" className="text-xl font-bold text-blue-600">
        RoomieVibe
      </Link>

      <div className="flex items-center gap-4 text-sm">
        <Link to="/" className="text-gray-700 hover:text-blue-600">
          Tìm phòng
        </Link>

        {user?.role === 'LANDLORD' && (
          <>
            <Link to="/listings/mine" className="text-gray-700 hover:text-blue-600">
              Tin của tôi
            </Link>
            <Link to="/listings/new" className="text-gray-700 hover:text-blue-600">
              Đăng tin
            </Link>
          </>
        )}

        {user?.role === 'ADMIN' && (
          <Link to="/admin/pending" className="text-gray-700 hover:text-blue-600">
            Duyệt tin
          </Link>
        )}

        {user ? (
          <div className="flex items-center gap-3">
            <span className="text-gray-500">{user.fullName}</span>
            <button
              onClick={handleLogout}
              className="rounded-md bg-gray-100 px-3 py-1.5 text-gray-700 hover:bg-gray-200"
            >
              Đăng xuất
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link to="/login" className="text-gray-700 hover:text-blue-600">
              Đăng nhập
            </Link>
            <Link
              to="/register"
              className="rounded-md bg-blue-600 px-3 py-1.5 text-white hover:bg-blue-700"
            >
              Đăng ký
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
