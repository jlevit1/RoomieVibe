import { Fragment, useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Maximize2, Send, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getConversation, getMessages, sendMessage, createDepositRequest } from '../services/chatService';
import { useChatSocket } from '../hooks/useChatSocket';
import { requestUnreadRefresh } from '../hooks/useUnreadCount';
import DepositMessageBubble from './DepositMessageBubble';
import Avatar from './Avatar';
import CurrencyInput from './CurrencyInput';

const ICON_BUTTON = 'flex-shrink-0 rounded-full p-1.5 text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900';

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}

function dayLabel(iso) {
  const date = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return 'Hôm nay';
  if (date.toDateString() === yesterday.toDateString()) return 'Hôm qua';
  return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

// One conversation thread (header, messages, composer). Used full-size on /messages/:id and
// `compact` inside the floating chat box. `onBack`/`onClose` render header buttons when given;
// `onActivity` fires whenever the message list changes so a sibling inbox can refresh.
export default function ChatConversation({ conversationId, compact = false, onBack, onClose, onActivity }) {
  const { user } = useAuth();
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sendError, setSendError] = useState('');
  const [text, setText] = useState('');
  const [depositAmount, setDepositAmount] = useState('');
  const [showDepositForm, setShowDepositForm] = useState(false);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    setLoading(true);
    setError('');
    setShowDepositForm(false);
    Promise.all([getConversation(conversationId), getMessages(conversationId)])
      .then(([c, msgs]) => {
        setConversation(c);
        setMessages(msgs);
        requestUnreadRefresh();
      })
      .catch((err) => {
        setError(err.response?.data?.message || 'Không tải được cuộc trò chuyện, thử lại sau');
      })
      .finally(() => setLoading(false));
  }, [conversationId]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
    if (!loading) onActivity?.(messages.length);
  }, [messages, loading, onActivity]);

  useEffect(() => {
    if (compact && !loading && !error) inputRef.current?.focus();
  }, [compact, loading, error]);

  const handleIncoming = useCallback((incoming) => {
    setMessages((prev) => {
      const idx = prev.findIndex((m) => m.id === incoming.id);
      if (idx === -1) return [...prev, incoming];
      const next = [...prev];
      next[idx] = incoming;
      return next;
    });
  }, []);

  useChatSocket(conversationId, handleIncoming);

  async function handleSend(e) {
    e.preventDefault();
    if (!text.trim()) return;
    const content = text;
    setSendError('');
    setText('');
    try {
      const sent = await sendMessage(conversationId, content);
      handleIncoming(sent);
    } catch (err) {
      setText(content);
      setSendError(err.response?.data?.message || 'Không gửi được tin nhắn, thử lại sau');
    }
  }

  async function handleCreateDeposit(e) {
    e.preventDefault();
    const amount = Number(depositAmount);
    if (!amount || amount <= 0) return;
    setSendError('');
    try {
      const msg = await createDepositRequest(conversationId, amount);
      handleIncoming(msg);
      setDepositAmount('');
      setShowDepositForm(false);
    } catch (err) {
      setSendError(err.response?.data?.message || 'Không gửi được yêu cầu, thử lại sau');
    }
  }

  const pad = compact ? 'px-3' : 'px-4 sm:px-5';
  const ready = !loading && !error && conversation;
  const isRenter = conversation?.viewerRole === 'RENTER';
  const isListing = conversation?.contextType === 'LISTING';
  const contextLink = isListing ? `/listings/${conversation?.contextId}` : `/roommates/${conversation?.contextId}`;

  const backButton = onBack && (
    <button type="button" onClick={onBack} aria-label="Về danh sách tin nhắn" className={`-ml-1 ${ICON_BUTTON} ${compact ? '' : 'lg:hidden'}`}>
      <ArrowLeft size={compact ? 18 : 20} />
    </button>
  );
  const closeButton = onClose && (
    <button type="button" onClick={onClose} aria-label="Đóng hộp chat" className={ICON_BUTTON}>
      <X size={18} />
    </button>
  );

  if (!ready) {
    return (
      <div className="flex h-full min-h-0 flex-col">
        {(backButton || closeButton) && (
          <div className={`flex items-center justify-between border-b border-gray-200 py-2.5 ${pad}`}>
            {backButton || <span />}
            {closeButton}
          </div>
        )}
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
          {error ? (
            <>
              <p className="text-sm text-red-600">{error}</p>
              {!compact && (
                <Link to="/messages" className="btn-secondary">
                  Về danh sách tin nhắn
                </Link>
              )}
            </>
          ) : (
            <p className="text-sm text-gray-500">Đang tải cuộc trò chuyện...</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Header */}
      <div className={`flex items-center gap-2.5 border-b border-gray-200 ${compact ? 'py-2' : 'py-3'} ${pad}`}>
        {backButton}
        <Avatar name={conversation.otherPartyName} size={compact ? 'md' : 'lg'} />
        <div className="min-w-0 flex-1">
          <p className={`truncate font-semibold text-gray-900 ${compact ? 'text-sm' : ''}`}>{conversation.otherPartyName}</p>
          <p className={`truncate text-gray-500 ${compact ? 'text-xs' : 'text-sm'}`}>
            {isRenter ? 'Chủ nhà' : 'Người thuê'} · {isListing ? 'Phòng trọ' : 'Ở ghép'}
          </p>
        </div>
        {isListing && !isRenter && (
          <button
            type="button"
            onClick={() => setShowDepositForm((s) => !s)}
            aria-expanded={showDepositForm}
            className={`btn-secondary flex-shrink-0 ${compact ? 'px-2.5 py-1.5 text-xs' : 'px-3 py-2'}`}
          >
            {compact ? (
              'Đặt cọc'
            ) : (
              <>
                <span className="sm:hidden">Đặt cọc</span>
                <span className="hidden sm:inline">Yêu cầu đặt cọc</span>
              </>
            )}
          </button>
        )}
        {compact && (
          <Link to={`/messages/${conversationId}`} aria-label="Mở rộng trong trang Tin nhắn" className={ICON_BUTTON}>
            <Maximize2 size={16} />
          </Link>
        )}
        {closeButton}
      </div>

      {/* What this conversation is about */}
      <Link
        to={contextLink}
        className={`flex items-center gap-3 border-b border-gray-200 bg-gray-50 py-2 transition-colors hover:bg-gray-100 ${pad}`}
      >
        {conversation.contextThumbnail && (
          <img
            src={conversation.contextThumbnail}
            alt=""
            className={`flex-shrink-0 rounded-lg object-cover ${compact ? 'h-8 w-10' : 'h-10 w-12'}`}
          />
        )}
        <span className={`min-w-0 flex-1 truncate font-medium text-gray-900 ${compact ? 'text-xs' : 'text-sm'}`}>
          {conversation.contextTitle}
        </span>
        <span className={`flex-shrink-0 font-semibold text-blue-700 ${compact ? 'text-xs' : 'text-sm'}`}>
          {isListing ? 'Xem phòng' : 'Xem hồ sơ'}
        </span>
      </Link>

      {showDepositForm && (
        <form onSubmit={handleCreateDeposit} className={`border-b border-gray-200 bg-white py-3 ${pad}`}>
          <label htmlFor={`deposit-amount-${conversationId}`} className="field-label">
            Số tiền cọc giữ lịch xem phòng
          </label>
          <div className="flex items-center gap-2">
            <CurrencyInput
              id={`deposit-amount-${conversationId}`}
              autoFocus
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              placeholder="VD: 500.000"
              className="field-input min-w-0 flex-1"
            />
            <button type="submit" className="btn-primary flex-shrink-0">
              Gửi
            </button>
            <button type="button" onClick={() => setShowDepositForm(false)} aria-label="Đóng" className={ICON_BUTTON}>
              <X size={18} />
            </button>
          </div>
          <p className="mt-1.5 text-xs text-gray-500">
            Người thuê trả từ ví, hệ thống giữ tiền tới khi họ xác nhận đã xem phòng.
          </p>
        </form>
      )}

      {/* Messages */}
      <div ref={scrollRef} className={`min-h-0 flex-1 overflow-y-auto bg-gray-50 ${compact ? 'px-3 py-3' : 'px-4 py-5 sm:px-6'}`}>
        {messages.length === 0 && (
          <p className="py-10 text-center text-sm text-gray-500">
            Gửi lời chào tới {conversation.otherPartyName} để bắt đầu trao đổi.
          </p>
        )}
        <div className="space-y-2">
          {messages.map((m, i) => {
            const own = m.senderId === user?.userId;
            const label = dayLabel(m.createdAt);
            const showDay = i === 0 || dayLabel(messages[i - 1].createdAt) !== label;
            return (
              <Fragment key={m.id}>
                {showDay && <p className="py-2 text-center text-xs font-medium text-gray-500">{label}</p>}
                <div className={`flex ${own ? 'justify-end' : 'justify-start'}`}>
                  {m.type === 'DEPOSIT_REQUEST' ? (
                    <DepositMessageBubble message={m} isRenter={isRenter} onUpdated={handleIncoming} />
                  ) : (
                    <div
                      className={`rounded-2xl px-3.5 py-2 text-sm ${compact ? 'max-w-[80%]' : 'max-w-[75%] sm:max-w-md'} ${
                        own ? 'rounded-br-md bg-blue-700 text-white' : 'rounded-bl-md border border-gray-200 bg-white text-gray-900'
                      }`}
                    >
                      <p className="whitespace-pre-line break-words">{m.content}</p>
                      <p className={`mt-0.5 text-right text-[11px] ${own ? 'text-blue-100' : 'text-gray-500'}`}>
                        {formatTime(m.createdAt)}
                      </p>
                    </div>
                  )}
                </div>
              </Fragment>
            );
          })}
        </div>
      </div>

      {/* Composer */}
      <div className="border-t border-gray-200 bg-white">
        {sendError && <p className={`pt-2 text-sm text-red-600 ${pad}`}>{sendError}</p>}
        <form onSubmit={handleSend} className={`flex items-center gap-2 ${compact ? 'py-2.5' : 'py-3'} ${pad}`}>
          <input
            ref={inputRef}
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={compact ? 'Aa' : `Nhắn cho ${conversation.otherPartyName}...`}
            aria-label="Nội dung tin nhắn"
            className={`field-input flex-1 ${compact ? 'rounded-full py-2' : ''}`}
          />
          <button
            type="submit"
            disabled={!text.trim()}
            aria-label="Gửi"
            className={compact ? `${ICON_BUTTON} text-blue-700 disabled:opacity-40` : 'btn-primary flex-shrink-0 px-3'}
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}
