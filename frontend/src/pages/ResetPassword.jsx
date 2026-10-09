import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { resetPassword, validateResetToken } from '../services/authService';

const MIN_LENGTH = 6;

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const navigate = useNavigate();
  const [status, setStatus] = useState(token ? 'checking' : 'invalid');
  const [invalidMessage, setInvalidMessage] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) return;
    validateResetToken(token)
      .then(() => setStatus('ready'))
      .catch((err) => {
        setInvalidMessage(err.response?.data?.message || '');
        setStatus('invalid');
      });
  }, [token]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (password.length < MIN_LENGTH) {
      setError(`Mật khẩu phải có ít nhất ${MIN_LENGTH} ký tự.`);
      return;
    }
    if (password !== confirm) {
      setError('Hai mật khẩu chưa khớp nhau.');
      return;
    }
    setLoading(true);
    try {
      await resetPassword(token, password);
      navigate('/login', { replace: true, state: { passwordReset: true } });
    } catch (err) {
      const message = err.response?.data?.message || 'Không đặt lại được mật khẩu, thử lại sau.';
      if (err.response?.status === 400 && message.includes('Link')) {
        setInvalidMessage(message);
        setStatus('invalid');
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-[calc(100dvh-4rem)] items-center justify-center bg-gray-50 px-4 py-12 sm:px-6">
      <div className="surface w-full max-w-md p-8 shadow-[0_24px_48px_-32px_rgba(20,79,112,0.4)] sm:p-10">
        {status === 'checking' && <p className="py-8 text-center text-gray-600">Đang kiểm tra link...</p>}

        {status === 'invalid' && (
          <>
            <h1 className="page-title">Link không còn dùng được</h1>
            <p className="mt-3 text-gray-700">
              {invalidMessage ||
                'Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn. Vui lòng yêu cầu link mới.'}
            </p>
            <p className="mt-2 text-sm text-gray-600">
              Mỗi link chỉ dùng được một lần, trong 30 phút. Nếu bạn đã yêu cầu nhiều lần, hãy dùng email mới nhất.
            </p>
            <Link to="/forgot-password" className="btn-primary mt-7 w-full py-3">
              Gửi link mới
            </Link>
          </>
        )}

        {status === 'ready' && (
          <>
            <h1 className="page-title">Đặt mật khẩu mới</h1>
            <p className="mt-1.5 text-gray-600">Sau khi đổi, hãy đăng nhập lại bằng mật khẩu mới.</p>

            {error && (
              <div role="alert" className="mt-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label htmlFor="new-password" className="field-label">
                  Mật khẩu mới
                </label>
                <div className="relative">
                  <input
                    id="new-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={MIN_LENGTH}
                    autoFocus
                    className="field-input pr-11"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-gray-500 hover:text-gray-900"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <p className="mt-1.5 text-xs text-gray-500">Ít nhất {MIN_LENGTH} ký tự.</p>
              </div>
              <div>
                <label htmlFor="confirm-password" className="field-label">
                  Nhập lại mật khẩu mới
                </label>
                <input
                  id="confirm-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  className="field-input"
                />
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full py-3">
                {loading ? 'Đang lưu...' : 'Đổi mật khẩu'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
