import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getMyConversations } from '../services/chatService';
import Avatar from './Avatar';

const CONTEXT_LABELS = {
  LISTING: 'Phòng trọ',
  ROOMMATE: 'Ở ghép',
};

function formatTime(iso) {
  if (!iso) return '';
  const date = new Date(iso);
  if (date.toDateString() === new Date().toDateString()) {
    return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  }
  return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
}

// Inbox shared by /messages, /messages/:id and the floating chat box. `refreshKey` refetches so previews and
// unread dots stay current. With `onSelect` rows open the conversation in place instead of navigating.
export default function ConversationList({ activeId, refreshKey, onSelect, hideHeader = false }) {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyConversations()
      .then(setConversations)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [refreshKey]);

  const unreadTotal = conversations.filter((c) => c.unread).length;

  return (
    <div className="flex h-full min-h-0 flex-col">
      {!hideHeader && (
        <div className="flex items-baseline justify-between gap-3 border-b border-gray-200 px-5 py-4">
          <h1 className="text-xl font-bold tracking-tight text-gray-900">Tin nhắn</h1>
          {unreadTotal > 0 && <span className="text-sm font-medium text-blue-700">{unreadTotal} chưa đọc</span>}
        </div>
      )}

      <div className="min-h-0 flex-1 overflow-y-auto">
        {loading && (
          <div className="divide-y divide-gray-100">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="flex animate-pulse items-center gap-3 px-5 py-4">
                <div className="h-11 w-11 rounded-full bg-gray-100" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 w-1/2 rounded bg-gray-100" />
                  <div className="h-3 w-3/4 rounded bg-gray-100" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && conversations.length === 0 && (
          <div className="px-5 py-12 text-center">
            <p className="font-semibold text-gray-900">Chưa có cuộc trò chuyện nào</p>
            <p className="mt-1 text-sm text-gray-600">
              Bấm “Nhắn tin” trên một tin đăng hoặc hồ sơ ở ghép để bắt đầu.
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              <Link to="/search" className="btn-primary">
                Tìm phòng trọ
              </Link>
              <Link to="/roommates" className="btn-secondary">
                Tìm bạn ở ghép
              </Link>
            </div>
          </div>
        )}

        {!loading && conversations.length > 0 && (
          <ul>
            {conversations.map((c) => {
              const active = c.id === activeId;
              const rowClass = `flex w-full gap-3 border-l-2 text-left transition-colors ${
                onSelect ? 'px-4 py-3' : 'px-5 py-3.5'
              } ${active ? 'border-blue-700 bg-blue-50/60' : 'border-transparent hover:bg-gray-50'}`;
              const Row = onSelect ? 'button' : Link;
              const rowProps = onSelect
                ? { type: 'button', onClick: () => onSelect(c.id) }
                : { to: `/messages/${c.id}`, 'aria-current': active ? 'page' : undefined };
              return (
                <li key={c.id}>
                  <Row {...rowProps} className={rowClass}>
                    <div className="relative flex-shrink-0">
                      <Avatar name={c.otherPartyName} size="lg" />
                      {c.contextThumbnail && (
                        <img
                          src={c.contextThumbnail}
                          alt=""
                          className="absolute -bottom-1 -right-1 h-6 w-6 rounded-md object-cover ring-2 ring-white"
                        />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <p className={`truncate text-gray-900 ${c.unread ? 'font-bold' : 'font-semibold'}`}>
                          {c.otherPartyName}
                        </p>
                        <span className={`flex-shrink-0 text-xs ${c.unread ? 'font-semibold text-blue-700' : 'text-gray-500'}`}>
                          {formatTime(c.lastMessageAt)}
                        </span>
                      </div>
                      <p className="truncate text-xs text-gray-500">
                        {CONTEXT_LABELS[c.contextType] || 'Phòng trọ'} · {c.contextTitle}
                      </p>
                      <div className="mt-0.5 flex items-center gap-2">
                        <p className={`min-w-0 flex-1 truncate text-sm ${c.unread ? 'font-medium text-gray-900' : 'text-gray-600'}`}>
                          {c.lastMessagePreview || 'Chưa có tin nhắn'}
                        </p>
                        {c.unread && <span className="h-2 w-2 flex-shrink-0 rounded-full bg-blue-700" aria-label="Chưa đọc" />}
                      </div>
                    </div>
                  </Row>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
