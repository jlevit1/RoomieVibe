import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const CITY_LINKS = ['Hà Nội', 'TP. Hồ Chí Minh', 'Đà Nẵng', 'Cần Thơ', 'Hải Phòng', 'Bình Dương'];

function linkGroups(user) {
  const isLandlord = user?.role === 'LANDLORD';
  return [
    {
      title: 'Người thuê',
      links: [
        { to: '/search', label: 'Tìm phòng trọ' },
        { to: '/ai-search', label: 'Tìm bằng Trợ lý AI' },
        { to: '/roommates', label: 'Tìm bạn ở ghép' },
      ],
    },
    {
      title: 'Chủ nhà',
      links: [
        { to: isLandlord ? '/listings/new' : '/register', label: 'Đăng tin cho thuê' },
        ...(isLandlord ? [{ to: '/listings/mine', label: 'Quản lý và đẩy tin' }] : []),
      ],
    },
    {
      title: 'Tài khoản',
      links: user
        ? [
            { to: '/favorites', label: 'Phòng đã lưu' },
            { to: '/messages', label: 'Tin nhắn' },
            { to: '/wallet', label: 'Ví của tôi' },
          ]
        : [
            { to: '/login', label: 'Đăng nhập' },
            { to: '/register', label: 'Đăng ký' },
          ],
    },
  ];
}

export default function Footer() {
  const { user } = useAuth();

  return (
    <footer className="border-t border-gray-200 bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 pb-8 pt-14 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <Link to="/" className="text-xl font-bold tracking-tight text-blue-600">
              RoomieVibe
            </Link>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-gray-600">
              Tìm phòng trọ và bạn ở ghép. Tin đăng được kiểm duyệt, tiền cọc xem phòng được giữ hộ cho tới khi bạn đã
              xem tận nơi.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:col-span-7">
            {linkGroups(user).map((group) => (
              <div key={group.title}>
                <p className="text-sm font-semibold text-gray-900">{group.title}</p>
                <ul className="mt-4 space-y-2.5">
                  {group.links.map((item) => (
                    <li key={item.label}>
                      <Link to={item.to} className="text-sm text-gray-600 transition-colors hover:text-gray-900">
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 border-t border-gray-200 pt-8">
          <p className="text-sm font-semibold text-gray-900">Phòng trọ theo thành phố</p>
          <ul className="mt-3 flex flex-wrap gap-x-6 gap-y-2">
            {CITY_LINKS.map((city) => (
              <li key={city}>
                <Link
                  to={`/search?city=${encodeURIComponent(city)}`}
                  className="text-sm text-gray-600 transition-colors hover:text-gray-900"
                >
                  Phòng trọ {city}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-10 flex flex-col gap-2 border-t border-gray-200 pt-6 text-xs text-gray-500 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} RoomieVibe</p>
          <p>Ảnh minh họa trang chủ từ Unsplash</p>
        </div>
      </div>
    </footer>
  );
}
