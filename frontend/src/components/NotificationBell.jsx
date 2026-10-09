import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, MessageCircle, CheckCircle2, XCircle, Wallet, KeyRound } from 'lucide-react';
import { useNotifications } from '../hooks/useNotifications';

const TYPE_ICON = {
  NEW_MESSAGE: MessageCircle,
  LISTING_APPROVED: CheckCircle2,
  LISTING_REJECTED: XCircle,
  DEPOSIT_REQUEST: Wallet,
  RENTAL_CONFIRMED: KeyRound,
};

function timeAgo(iso) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'Vừa xong';
  if (mins < 60) return `${mins} phút trước`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} giờ trước`;
  return `${Math.floor(hours / 24)} ngày trước`;
}

export default function NotificationBell() {
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={unreadCount > 0 ? `Thông báo, ${unreadCount} chưa đọc` : 'Thông báo'}
        aria-expanded={open}
        className="relative flex h-9 w-9 items-center justify-center rounded-full text-gray-700 transition-colors hover:bg-gray-100"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-semibold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-11 z-20 w-[22rem] max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-[0_24px_48px_-24px_rgba(20,79,112,0.4)]">
            <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
              <p className="font-semibold text-gray-900">Thông báo</p>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllRead}
                  className="text-sm link-accent"
                >
                  Đánh dấu đã đọc
                </button>
              )}
            </div>

            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 && (
                <p className="px-4 py-10 text-center text-sm text-gray-500">Chưa có thông báo nào.</p>
              )}
              {notifications.map((n) => {
                const Icon = TYPE_ICON[n.type] || Bell;
                return (
                  <Link
                    key={n.id}
                    to={n.link || '#'}
                    onClick={() => {
                      setOpen(false);
                      if (!n.read) markRead(n.id);
                    }}
                    className="flex items-start gap-3 border-b border-gray-100 px-4 py-3 text-sm transition-colors last:border-0 hover:bg-gray-50"
                  >
                    <Icon size={16} className={`mt-0.5 flex-shrink-0 ${!n.read ? 'text-blue-700' : 'text-gray-400'}`} />
                    <span className="min-w-0 flex-1">
                      <span className={`line-clamp-2 ${!n.read ? 'font-medium text-gray-900' : 'text-gray-600'}`}>
                        {n.message}
                      </span>
                      <span className="mt-0.5 block text-xs text-gray-500">{timeAgo(n.createdAt)}</span>
                    </span>
                    {!n.read && <span className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-blue-700" aria-label="Chưa đọc" />}
                  </Link>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
