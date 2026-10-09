import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login, googleLogin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const passwordReset = Boolean(location.state?.passwordReset);
  const [form, setForm] = useState({ email: location.state?.email || '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Đăng nhập thất bại');
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSuccess(credentialResponse) {
    setError('');
    try {
      await googleLogin(credentialResponse.credential);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Đăng nhập Google thất bại');
    }
  }

  return (
    <div className="flex min-h-[calc(100dvh-4rem)] items-center justify-center bg-gray-50 px-4 py-12 sm:px-6">
      <div className="surface w-full max-w-md p-8 shadow-[0_24px_48px_-32px_rgba(20,79,112,0.4)] sm:p-10">
        <h1 className="page-title">Đăng nhập</h1>
        <p className="mt-1.5 text-gray-600">Chào mừng bạn quay lại RoomieVibe.</p>

        {passwordReset && !error && (
          <div role="status" className="mt-6 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            Đã đặt lại mật khẩu. Đăng nhập bằng mật khẩu mới của bạn.
          </div>
        )}

        {error && (
          <div role="alert" className="mt-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="login-email" className="field-label">
              Email
            </label>
            <input
              id="login-email"
              type="email"
              name="email"
              autoComplete="email"
              value={form.email}
              onChange={handleChange}
              required
              className="field-input"
            />
          </div>

          <div>
            <div className="flex items-baseline justify-between gap-3">
              <label htmlFor="login-password" className="field-label">
                Mật khẩu
              </label>
              <Link to="/forgot-password" state={{ email: form.email }} className="text-sm link-accent">
                Quên mật khẩu?
              </Link>
            </div>
            <input
              id="login-password"
              type="password"
              name="password"
              autoComplete="current-password"
              value={form.password}
              onChange={handleChange}
              required
              className="field-input"
            />
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full py-3">
            {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>
        </form>

        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-gray-200" />
          <span className="text-xs text-gray-500">hoặc</span>
          <div className="h-px flex-1 bg-gray-200" />
        </div>

        <div className="flex justify-center">
          <GoogleLogin onSuccess={handleGoogleSuccess} onError={() => setError('Đăng nhập Google thất bại')} />
        </div>

        <p className="mt-8 text-center text-sm text-gray-600">
          Chưa có tài khoản?{' '}
          <Link to="/register" className="link-accent">
            Đăng ký
          </Link>
        </p>
      </div>
    </div>
  );
}
