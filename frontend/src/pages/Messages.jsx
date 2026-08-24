import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle, Home, Users2, Search } from 'lucide-react';
import { getMyConversations } from '../services/chatService';
import Avatar from '../components/Avatar';

const CONTEXT_META = {
  LISTING: { Icon: Home, label: 'Phòng trọ' },
  ROOMMATE: { Icon: Users2, label: 'Ở ghép' },
};

function formatTime(iso) {
  if (!iso) return '';
  const date = new Date(iso);
  const now = new Date();
  const sameDay = date.toDateString() === now.toDateString();
  if (sameDay) {
    return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  }
  return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
}

export default function Messages() {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyConversations()
      .then(setConversations)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const unreadTotal = conversations.filter((c) => c.unread).length;

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <div className="mb-7 flex items-end justify-between gap-3">
        <div>
          <div className="mb-1 flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">Tin nhắn</h1>
            {unreadTotal > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-600 px-1.5 text-xs font-semibold text-white">
                {unreadTotal}
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500">Trao đổi về tin đăng phòng trọ và tìm bạn ở ghép.</p>
        </div>
      </div>

      {loading && (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex items-center gap-4 rounded-2xl border border-gray-200 p-4">
              <div className="h-16 w-16 flex-shrink-0 animate-pulse rounded-2xl bg-gray-100" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-1/3 animate-pulse rounded-full bg-gray-100" />
                <div className="h-3 w-2/3 animate-pulse rounded-full bg-gray-100" />
                <div className="h-3 w-1/2 animate-pulse rounded-full bg-gray-100" />
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && conversations.length === 0 && (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-gray-300 py-20 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-rose-50 text-rose-400">
            <MessageCircle size={26} />
          </span>
          <div>
            <p className="font-medium text-gray-900">Chưa có cuộc trò chuyện nào</p>
            <p className="mt-1 text-sm text-gray-500">
              Nhắn tin với chủ nhà hoặc bạn ở ghép để bắt đầu trao đổi.
            </p>
          </div>
          <div className="mt-1 flex flex-wrap items-center justify-center gap-2">
            <Link
              to="/search"
              className="flex items-center gap-1.5 rounded-full bg-rose-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-rose-700"
            >
              <Search size={14} /> Tìm phòng trọ
            </Link>
            <Link
              to="/roommates"
              className="flex items-center gap-1.5 rounded-full border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:border-rose-300 hover:text-rose-600"
            >
              <Users2 size={14} /> Tìm bạn ở ghép
            </Link>
          </div>
        </div>
      )}

      {!loading && conversations.length > 0 && (
        <div className="space-y-2.5">
          {conversations.map((c) => {
            const meta = CONTEXT_META[c.contextType] || CONTEXT_META.LISTING;
            return (
              <Link
                key={c.id}
                to={`/messages/${c.id}`}
                className={`group relative flex items-center gap-4 overflow-hidden rounded-2xl border bg-white p-3.5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 active:scale-[0.99] ${
                  c.unread ? 'border-rose-200 bg-rose-50/30' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {c.unread && <span className="absolute inset-y-0 left-0 w-1 bg-rose-600" />}

                <div className="relative h-16 w-16 flex-shrink-0">
                  <div className="h-16 w-16 overflow-hidden rounded-2xl bg-gray-100">
                    {c.contextThumbnail ? (
                      <img src={c.contextThumbnail} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-gray-300">
                        <MessageCircle size={22} />
                      </div>
                    )}
                  </div>
                  <div className="absolute -bottom-1 -right-1 rounded-full ring-2 ring-white">
                    <Avatar name={c.otherPartyName} size="sm" />
                  </div>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="mb-0.5 flex items-center justify-between gap-2">
                    <p
                      className={`truncate ${c.unread ? 'font-semibold text-gray-900' : 'font-medium text-gray-900'}`}
                    >
                      {c.otherPartyName}
                    </p>
                    <span
                      className={`flex-shrink-0 text-xs ${c.unread ? 'font-semibold text-rose-600' : 'text-gray-400'}`}
                    >
                      {formatTime(c.lastMessageAt)}
                    </span>
                  </div>
                  <div className="mb-1 flex items-center gap-1 text-xs text-gray-400">
                    <meta.Icon size={12} className="flex-shrink-0" />
                    <span className="truncate">{c.contextTitle}</span>
                  </div>
                  {c.lastMessagePreview && (
                    <p
                      className={`truncate text-sm ${c.unread ? 'font-medium text-gray-700' : 'text-gray-500'}`}
                    >
                      {c.lastMessagePreview}
                    </p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
