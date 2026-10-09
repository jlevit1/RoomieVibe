import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronDown, Maximize2, MessageCircle, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useUnreadCount } from '../hooks/useUnreadCount';
import ConversationList from './ConversationList';
import ChatConversation from './ChatConversation';

const ICON_BUTTON = 'rounded-full p-1.5 text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900';

// Messenger-style chat box: the floating button opens a small inbox in the corner and
// conversations open inside it, so users can chat without leaving the page they are on.
export default function FloatingMessageButton() {
  const { user } = useAuth();
  const unreadCount = useUnreadCount();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const [activeId, setActiveId] = useState(null);
  const [listVersion, setListVersion] = useState(0);
  const onMessagesPage = pathname.startsWith('/messages');

  useEffect(() => {
    if (onMessagesPage) setOpen(false);
  }, [onMessagesPage]);

  useEffect(() => {
    if (!user) {
      setOpen(false);
      setActiveId(null);
    }
  }, [user]);

  useEffect(() => {
    if (!open) return undefined;
    function handleKey(e) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open]);

  if (!user || onMessagesPage) {
    return null;
  }

  function backToList() {
    setActiveId(null);
    setListVersion((v) => v + 1);
  }

  return (
    <>
      {open && (
        <div
          role="dialog"
          aria-label="Hộp chat"
          className="fixed inset-0 z-50 flex flex-col overflow-hidden bg-white sm:inset-auto sm:bottom-24 sm:right-6 sm:h-[34rem] sm:max-h-[calc(100dvh-8rem)] sm:w-[23rem] sm:rounded-2xl sm:border sm:border-gray-200 sm:shadow-[0_24px_56px_-16px_rgba(20,79,112,0.45)]"
        >
          {activeId ? (
            <ChatConversation
              key={activeId}
              conversationId={activeId}
              compact
              onBack={backToList}
              onClose={() => setOpen(false)}
            />
          ) : (
            <>
              <div className="flex items-center gap-1 border-b border-gray-200 px-4 py-3">
                <h2 className="flex-1 text-lg font-bold tracking-tight text-gray-900">Tin nhắn</h2>
                <Link to="/messages" aria-label="Mở trang Tin nhắn" className={ICON_BUTTON}>
                  <Maximize2 size={16} />
                </Link>
                <button type="button" onClick={() => setOpen(false)} aria-label="Đóng hộp chat" className={ICON_BUTTON}>
                  <X size={18} />
                </button>
              </div>
              <div className="min-h-0 flex-1">
                <ConversationList hideHeader onSelect={setActiveId} refreshKey={`${listVersion}-${unreadCount}`} />
              </div>
            </>
          )}
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? 'Thu gọn hộp chat' : 'Mở hộp chat'}
        aria-expanded={open}
        className={`fixed bottom-5 right-5 z-40 h-13 w-13 items-center justify-center rounded-full bg-blue-700 text-white shadow-[0_12px_28px_-8px_rgba(20,79,112,0.55)] transition-all hover:-translate-y-0.5 hover:bg-blue-800 active:translate-y-0 active:scale-95 sm:bottom-6 sm:right-6 ${
          open ? 'hidden sm:flex' : 'flex'
        }`}
      >
        {open ? <ChevronDown size={24} /> : <MessageCircle size={22} />}
        {!open && unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-white bg-red-600 px-1 text-[10px] font-semibold leading-none text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
    </>
  );
}
