import { Link, useLocation } from 'react-router-dom';
import { Home, Users } from 'lucide-react';

export default function ModeSwitcher() {
  const location = useLocation();
  const isRoommateMode = location.pathname.startsWith('/roommates');

  return (
    <div className="flex items-center gap-1 rounded-full bg-rose-600 p-1">
      <Link
        to="/search"
        title="Tìm phòng trọ"
        className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors ${
          !isRoommateMode ? 'bg-white text-rose-600' : 'text-white/70 hover:text-white'
        }`}
      >
        <Home size={16} />
      </Link>
      <Link
        to="/roommates"
        title="Tìm bạn ở ghép"
        className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors ${
          isRoommateMode ? 'bg-white text-rose-600' : 'text-white/70 hover:text-white'
        }`}
      >
        <Users size={16} />
      </Link>
    </div>
  );
}
