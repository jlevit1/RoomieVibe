import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
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

  return (
    <div className="mx-auto mt-12 max-w-md rounded-lg border border-gray-200 p-8">
      <h1 className="mb-6 text-2xl font-bold">Đăng nhập</h1>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 px-4 py-2 text-sm text-red-600">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Email</label>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            required
            className="w-full rounded-md border border-gray-300 px-3 py-2"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Mật khẩu</label>
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            required
            className="w-full rounded-md border border-gray-300 px-3 py-2"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-blue-600 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Đang xử lý...' : 'Đăng nhập'}
        </button>
      </form>

      <p className="mt-4 text-sm text-gray-600">
        Chưa có tài khoản?{' '}
        <Link to="/register" className="text-blue-600 hover:underline">
          Đăng ký
        </Link>
      </p>
    </div>
  );
}
