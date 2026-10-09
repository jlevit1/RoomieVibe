import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { requestPasswordReset } from '../services/authService';

const RESEND_COOLDOWN_SECONDS = 60;

export default function ForgotPassword() {
  const location = useLocation();
  const [email, setEmail] = useState(location.state?.email || '');
  const [sentTo, setSentTo] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const timer = setTimeout(() => setCooldown((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  async function send(target) {
    setError('');
    setLoading(true);
    try {
      await requestPasswordReset(target.trim());
      setSentTo(target.trim());
      setCooldown(RESEND_COOLDOWN_SECONDS);
    } catch (err) {
      setError(err.response?.data?.message || 'Không gửi được yêu cầu, thử lại sau ít phút.');
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    send(email);
  }

  return (
    <div className="flex min-h-[calc(100dvh-4rem)] items-center justify-center bg-gray-50 px-4 py-12 sm:px-6">
      <div className="surface w-full max-w-md p-8 shadow-[0_24px_48px_-32px_rgba(20,79,112,0.4)] sm:p-10">
        {sentTo ? (
          <>
            <h1 className="page-title">Kiểm tra hộp thư</h1>
            <p className="mt-3 text-gray-700">
              Nếu <span className="font-semibold text-gray-900">{sentTo}</span> đã đăng ký RoomieVibe, bạn sẽ nhận được
              email có link đặt lại mật khẩu trong vài phút.
            </p>
            <ul className="mt-4 space-y-1.5 text-sm text-gray-600">
              <li>Link có hiệu lực trong 30 phút và chỉ dùng được một lần.</li>
              <li>Không thấy email? Xem thêm mục Thư rác hoặc Quảng cáo.</li>
            </ul>

            {error && (
              <div role="alert" className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="mt-7 flex flex-col gap-2">
              <Link to="/login" state={{ email: sentTo }} className="btn-primary w-full py-3">
                Quay lại đăng nhập
              </Link>
              <button
                type="button"
                onClick={() => send(sentTo)}
                disabled={loading || cooldown > 0}
                className="btn-secondary w-full"
              >
                {cooldown > 0 ? `Gửi lại sau ${cooldown} giây` : 'Gửi lại email'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setSentTo('');
                  setError('');
                }}
                className="mt-1 text-sm link-accent"
              >
                Dùng email khác
              </button>
            </div>
          </>
        ) : (
          <>
            <h1 className="page-title">Quên mật khẩu</h1>
            <p className="mt-1.5 text-gray-600">Nhập email bạn dùng để đăng ký, chúng tôi sẽ gửi link đặt lại mật khẩu.</p>

            {error && (
              <div role="alert" className="mt-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label htmlFor="forgot-email" className="field-label">
                  Email
                </label>
                <input
                  id="forgot-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                  className="field-input"
                />
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full py-3">
                {loading ? 'Đang gửi...' : 'Gửi link đặt lại mật khẩu'}
              </button>
            </form>

            <p className="mt-8 text-center text-sm text-gray-600">
              Nhớ ra mật khẩu rồi?{' '}
              <Link to="/login" className="link-accent">
                Đăng nhập
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
