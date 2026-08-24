import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Send, Landmark, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getConversation, getMessages, sendMessage, createDepositRequest } from '../services/chatService';
import { useChatSocket } from '../hooks/useChatSocket';
import DepositMessageBubble from '../components/DepositMessageBubble';
import Avatar from '../components/Avatar';
import CurrencyInput from '../components/CurrencyInput';

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}

export default function ChatThread() {
  const { id } = useParams();
  const { user } = useAuth();
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sendError, setSendError] = useState('');
  const [text, setText] = useState('');
  const [depositAmount, setDepositAmount] = useState('');
  const [showDepositForm, setShowDepositForm] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    setLoading(true);
    setError('');
    Promise.all([getConversation(id), getMessages(id)])
      .then(([c, msgs]) => {
        setConversation(c);
        setMessages(msgs);
      })
      .catch((err) => {
        setError(err.response?.data?.message || 'Không tải được cuộc trò chuyện, thử lại sau');
      })
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleIncoming = useCallback((incoming) => {
    setMessages((prev) => {
      const idx = prev.findIndex((m) => m.id === incoming.id);
      if (idx === -1) return [...prev, incoming];
      const next = [...prev];
      next[idx] = incoming;
      return next;
    });
  }, []);

  useChatSocket(id, handleIncoming);

  async function handleSend(e) {
    e.preventDefault();
    if (!text.trim()) return;
    const content = text;
    setSendError('');
    setText('');
    try {
      const sent = await sendMessage(id, content);
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
      const msg = await createDepositRequest(id, amount);
      handleIncoming(msg);
      setDepositAmount('');
      setShowDepositForm(false);
    } catch (err) {
      setSendError(err.response?.data?.message || 'Không gửi được yêu cầu, thử lại sau');
    }
  }

  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-10">
        <p className="text-red-600">{error}</p>
        <Link to="/messages" className="text-rose-600 hover:underline">
          Quay lại danh sách tin nhắn
        </Link>
      </div>
    );
  }

  if (loading || !conversation) {
    return <div className="mx-auto max-w-3xl px-6 py-10 text-gray-500">Đang tải...</div>;
  }

  const isRenter = conversation.viewerRole === 'RENTER';
  const isListing = conversation.contextType === 'LISTING';
  const contextLink = isListing ? `/listings/${conversation.contextId}` : `/roommates/${conversation.contextId}`;

  return (
    <div className="mx-auto max-w-3xl px-4 py-4 sm:px-6">
      <div className="flex h-[calc(100vh-6rem)] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-gray-100 px-5 py-3.5">
          <Avatar name={conversation.otherPartyName} size="lg" />
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold text-gray-900">{conversation.otherPartyName}</p>
            <Link
              to={contextLink}
              className="truncate text-sm text-gray-500 transition-colors hover:text-rose-600"
            >
              {conversation.contextTitle}
            </Link>
          </div>
          {isListing && !isRenter && (
            <button
              type="button"
              onClick={() => setShowDepositForm((s) => !s)}
              className="flex flex-shrink-0 items-center gap-1.5 rounded-full border border-rose-600 px-3.5 py-1.5 text-sm font-medium text-rose-600 transition-colors hover:bg-rose-50"
            >
              <Landmark size={15} /> Yêu cầu đặt cọc
            </button>
          )}
        </div>

        {/* Deposit request form */}
        {showDepositForm && (
          <form
            onSubmit={handleCreateDeposit}
            className="flex items-center gap-2 border-b border-gray-100 bg-rose-50/50 px-5 py-3"
          >
            <Landmark size={16} className="flex-shrink-0 text-rose-600" />
            <CurrencyInput
              autoFocus
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              placeholder="Số tiền cọc (đ)"
              className="flex-1 rounded-full border border-gray-200 bg-white px-4 py-1.5 text-sm focus:border-rose-400 focus:outline-none"
            />
            <button
              type="submit"
              className="flex-shrink-0 rounded-full bg-rose-600 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-rose-700"
            >
              Gửi yêu cầu
            </button>
            <button
              type="button"
              onClick={() => setShowDepositForm(false)}
              aria-label="Đóng"
              className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-gray-400 hover:bg-white hover:text-gray-600"
            >
              <X size={15} />
            </button>
          </form>
        )}

        {/* Messages */}
        <div className="flex-1 space-y-3 overflow-y-auto bg-gray-50/60 px-5 py-4">
          {messages.map((m) => {
            const own = m.senderId === user?.userId;
            if (m.type === 'DEPOSIT_REQUEST') {
              return (
                <div key={m.id} className={`flex ${own ? 'justify-end' : 'justify-start'}`}>
                  <DepositMessageBubble message={m} isRenter={isRenter} onUpdated={handleIncoming} />
                </div>
              );
            }
            return (
              <div key={m.id} className={`flex ${own ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-xs rounded-2xl px-4 py-2 text-sm shadow-sm ${
                    own ? 'bg-rose-600 text-white' : 'bg-white text-gray-900'
                  }`}
                >
                  <p className="whitespace-pre-line">{m.content}</p>
                  <p className={`mt-1 text-right text-xs ${own ? 'text-rose-100' : 'text-gray-400'}`}>
                    {formatTime(m.createdAt)}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="border-t border-gray-100">
          {sendError && <p className="px-4 pt-2 text-xs text-red-600">{sendError}</p>}
          <form onSubmit={handleSend} className="flex items-center gap-2 px-4 py-3">
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Nhập tin nhắn..."
              className="flex-1 rounded-full border border-gray-200 px-4 py-2 text-sm focus:border-rose-400 focus:outline-none"
            />
            <button
              type="submit"
              disabled={!text.trim()}
              className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-rose-600 text-white transition-colors hover:bg-rose-700 disabled:opacity-50"
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
