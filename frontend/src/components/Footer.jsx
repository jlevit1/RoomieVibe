import { Link } from 'react-router-dom';

const EXPLORE_LINKS = [
  { to: '/search', label: 'Tìm phòng trọ' },
  { to: '/roommates', label: 'Tìm bạn ở ghép' },
  { to: '/listings/new', label: 'Đăng tin cho thuê' },
];

const ACCOUNT_LINKS = [
  { to: '/login', label: 'Đăng nhập' },
  { to: '/register', label: 'Đăng ký' },
];

export default function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-white">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-6 py-12 sm:grid-cols-4">
        <div className="col-span-2">
          <Link to="/" className="text-lg font-bold tracking-tight text-rose-600">
            RoomieVibe
          </Link>
          <p className="mt-2 max-w-xs text-sm text-gray-500">
            Nền tảng tìm phòng trọ và bạn ở ghép, tin đăng được kiểm duyệt, ưu tiên bảo mật thông
            tin liên hệ của bạn.
          </p>
        </div>

        <div>
          <p className="mb-3 text-sm font-semibold text-gray-900">Khám phá</p>
          <ul className="space-y-2">
            {EXPLORE_LINKS.map((item) => (
              <li key={item.to}>
                <Link to={item.to} className="text-sm text-gray-500 hover:text-rose-600">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="mb-3 text-sm font-semibold text-gray-900">Tài khoản</p>
          <ul className="space-y-2">
            {ACCOUNT_LINKS.map((item) => (
              <li key={item.to}>
                <Link to={item.to} className="text-sm text-gray-500 hover:text-rose-600">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-gray-100 px-6 py-4">
        <p className="mx-auto max-w-7xl text-center text-xs text-gray-400 sm:text-left">
          © {new Date().getFullYear()} RoomieVibe.
        </p>
      </div>
    </footer>
  );
}
