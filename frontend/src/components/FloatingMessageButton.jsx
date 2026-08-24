import { Link, useLocation } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useUnreadCount } from '../hooks/useUnreadCount';

export default function FloatingMessageButton() {
  const { user } = useAuth();
  const unreadCount = useUnreadCount();
  const location = useLocation();

  if (!user || location.pathname.startsWith('/messages')) {
    return null;
  }

  return (
    <Link
      to="/messages"
      aria-label="Tin nhắn"
      className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-rose-600 text-white shadow-lg shadow-rose-600/30 transition-all hover:-translate-y-0.5 hover:bg-rose-700 hover:shadow-xl active:translate-y-0 active:scale-95"
    >
      <MessageCircle size={24} />
      {unreadCount > 0 && (
        <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-white bg-red-500 px-1 text-[10px] font-semibold leading-none text-white">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </Link>
  );
}
