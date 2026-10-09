import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';

const ROLE_OPTIONS = [
  { value: 'USER', title: 'Tôi đang tìm phòng', desc: 'Thuê phòng hoặc tìm bạn ở ghép' },
  { value: 'LANDLORD', title: 'Tôi có phòng cho thuê', desc: 'Đăng tin và quản lý phòng' },
];

export default function Register() {
  const { register, googleLogin } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    phone: '',
    role: 'USER',
  });
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
      await register(form);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Đăng ký thất bại');
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSuccess(credentialResponse) {
    setError('');
    try {
      await googleLogin(credentialResponse.credential, form.role);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Đăng ký Google thất bại');
    }
  }

  return (
    <div className="flex min-h-[calc(100dvh-4rem)] items-center justify-center bg-gray-50 px-4 py-12 sm:px-6">
      <div className="surface w-full max-w-lg p-8 shadow-[0_24px_48px_-32px_rgba(20,79,112,0.4)] sm:p-10">
        <h1 className="page-title">Tạo tài khoản</h1>
        <p className="mt-1.5 text-gray-600">Miễn phí, chỉ mất một phút.</p>

        {error && (
          <div role="alert" className="mt-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <fieldset>
            <legend className="field-label">Bạn dùng RoomieVibe để</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {ROLE_OPTIONS.map((option) => (
                <label
                  key={option.value}
                  className={`cursor-pointer rounded-xl border p-3.5 transition-colors ${
                    form.role === option.value
                      ? 'border-blue-600 bg-blue-50 ring-1 ring-blue-600'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <input
                    type="radio"
                    name="role"
                    value={option.value}
                    checked={form.role === option.value}
                    onChange={handleChange}
                    className="sr-only"
                  />
                  <span className="block text-sm font-semibold text-gray-900">{option.title}</span>
                  <span className="mt-0.5 block text-xs text-gray-600">{option.desc}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <div>
            <label htmlFor="reg-fullname" className="field-label">
              Họ tên
            </label>
            <input
              id="reg-fullname"
              name="fullName"
              autoComplete="name"
              value={form.fullName}
              onChange={handleChange}
              required
              className="field-input"
            />
          </div>

          <div>
            <label htmlFor="reg-email" className="field-label">
              Email
            </label>
            <input
              id="reg-email"
              type="email"
              name="email"
              autoComplete="email"
              value={form.email}
              onChange={handleChange}
              required
              className="field-input"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="reg-password" className="field-label">
                Mật khẩu
              </label>
              <input
                id="reg-password"
                type="password"
                name="password"
                autoComplete="new-password"
                value={form.password}
                onChange={handleChange}
                required
                minLength={6}
                className="field-input"
              />
              <p className="mt-1 text-xs text-gray-500">Ít nhất 6 ký tự</p>
            </div>
            <div>
              <label htmlFor="reg-phone" className="field-label">
                Số điện thoại
              </label>
              <input
                id="reg-phone"
                name="phone"
                type="tel"
                placeholder="Không bắt buộc"
                autoComplete="tel"
                value={form.phone}
                onChange={handleChange}
                className="field-input"
              />
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full py-3">
            {loading ? 'Đang tạo tài khoản...' : 'Tạo tài khoản'}
          </button>
        </form>

        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-gray-200" />
          <span className="text-xs text-gray-500">hoặc</span>
          <div className="h-px flex-1 bg-gray-200" />
        </div>

        <div className="flex justify-center">
          <GoogleLogin onSuccess={handleGoogleSuccess} onError={() => setError('Đăng ký Google thất bại')} />
        </div>
        <p className="mt-2 text-center text-xs text-gray-500">Tài khoản Google sẽ dùng vai trò bạn chọn ở trên.</p>

        <p className="mt-8 text-center text-sm text-gray-600">
          Đã có tài khoản?{' '}
          <Link to="/login" className="link-accent">
            Đăng nhập
          </Link>
        </p>
      </div>
    </div>
  );
}
