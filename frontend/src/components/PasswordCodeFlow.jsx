import { useEffect, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { requestPasswordReset, resetPassword, verifyResetCode } from '../services/authService';

const RESEND_COOLDOWN_SECONDS = 60;
const CODE_VALID_MINUTES = 10;
const MIN_PASSWORD_LENGTH = 6;

function errorMessage(err, fallback) {
  return err.response?.data?.message || fallback;
}

function StepLabel({ step }) {
  return <p className="text-sm font-medium text-gray-500">Bước {step}/3</p>;
}

// Shared by "Quên mật khẩu" (email typed in) and "Đổi mật khẩu" (email of the signed-in user, locked):
// 1) send a 6-digit code to the email, 2) check the code, 3) set the new password.
export default function PasswordCodeFlow({ title, intro, initialEmail = '', emailLocked = false, onDone }) {
  const [step, setStep] = useState('email');
  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const timer = setTimeout(() => setCooldown((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  async function sendCode(e) {
    e?.preventDefault();
    setError('');
    setNotice('');
    setLoading(true);
    try {
      await requestPasswordReset(email.trim());
      setCode('');
      setStep('code');
      setCooldown(RESEND_COOLDOWN_SECONDS);
      if (e?.type !== 'submit') setNotice('Đã gửi mã mới. Mã cũ không còn dùng được.');
    } catch (err) {
      setError(errorMessage(err, 'Không gửi được mã, thử lại sau ít phút.'));
    } finally {
      setLoading(false);
    }
  }

  async function checkCode(value) {
    if (value.length !== 6 || loading) return;
    setError('');
    setNotice('');
    setLoading(true);
    try {
      const { resetToken: token } = await verifyResetCode(email.trim(), value);
      setResetToken(token);
      setStep('password');
    } catch (err) {
      setError(errorMessage(err, 'Mã xác nhận không đúng hoặc đã hết hạn.'));
      setCode('');
    } finally {
      setLoading(false);
    }
  }

  function handleCodeChange(e) {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 6);
    setCode(digits);
    if (digits.length === 6) checkCode(digits);
  }

  async function savePassword(e) {
    e.preventDefault();
    setError('');
    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Mật khẩu phải có ít nhất ${MIN_PASSWORD_LENGTH} ký tự.`);
      return;
    }
    if (password !== confirm) {
      setError('Hai mật khẩu chưa khớp nhau.');
      return;
    }
    setLoading(true);
    try {
      await resetPassword(resetToken, password);
      onDone?.(email.trim());
    } catch (err) {
      const message = errorMessage(err, 'Không lưu được mật khẩu mới, thử lại sau.');
      if (err.response?.status === 400 && message.includes('Phiên')) {
        setStep('code');
        setCode('');
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  const alert = error && (
    <div role="alert" className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
      {error}
    </div>
  );
  const info = notice && !error && (
    <div role="status" className="mt-5 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
      {notice}
    </div>
  );

  if (step === 'email') {
    return (
      <>
        <StepLabel step={1} />
        <h1 className="page-title mt-1">{title}</h1>
        <p className="mt-1.5 text-gray-600">
          {intro || 'Nhập email bạn dùng để đăng ký, chúng tôi sẽ gửi mã xác nhận gồm 6 chữ số.'}
        </p>
        {alert}
        <form onSubmit={sendCode} className="mt-6 space-y-4">
          {emailLocked ? (
            <p className="rounded-xl bg-gray-50 px-4 py-3 text-sm text-gray-700">
              Mã sẽ được gửi tới <span className="font-semibold text-gray-900">{email}</span>
            </p>
          ) : (
            <div>
              <label htmlFor="reset-email" className="field-label">
                Email
              </label>
              <input
                id="reset-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
                className="field-input"
              />
            </div>
          )}
          <button type="submit" disabled={loading} className="btn-primary w-full py-3">
            {loading ? 'Đang gửi...' : 'Gửi mã xác nhận'}
          </button>
        </form>
      </>
    );
  }

  if (step === 'code') {
    return (
      <>
        <StepLabel step={2} />
        <h1 className="page-title mt-1">Nhập mã xác nhận</h1>
        <p className="mt-1.5 text-gray-600">
          Mã 6 số đã được gửi tới <span className="font-semibold text-gray-900">{email}</span>. Mã có hiệu lực trong{' '}
          {CODE_VALID_MINUTES} phút.
        </p>
        {alert}
        {info}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            checkCode(code);
          }}
          className="mt-6 space-y-4"
        >
          <div>
            <label htmlFor="reset-code" className="field-label">
              Mã xác nhận
            </label>
            <input
              id="reset-code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="\d{6}"
              maxLength={6}
              value={code}
              onChange={handleCodeChange}
              autoFocus
              placeholder="••••••"
              className="field-input py-3 text-center text-2xl font-semibold tracking-[0.5em] tabular-nums"
            />
            <p className="mt-1.5 text-xs text-gray-500">Không thấy mail? Xem thêm mục Thư rác hoặc Quảng cáo.</p>
          </div>
          <button type="submit" disabled={loading || code.length !== 6} className="btn-primary w-full py-3">
            {loading ? 'Đang kiểm tra...' : 'Xác nhận'}
          </button>
        </form>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-sm">
          <button
            type="button"
            onClick={() => sendCode()}
            disabled={loading || cooldown > 0}
            className="link-accent disabled:cursor-not-allowed disabled:text-gray-400"
          >
            {cooldown > 0 ? `Gửi lại mã sau ${cooldown} giây` : 'Gửi lại mã'}
          </button>
          {!emailLocked && (
            <button
              type="button"
              onClick={() => {
                setStep('email');
                setError('');
                setNotice('');
              }}
              className="text-gray-600 hover:text-gray-900"
            >
              Đổi email
            </button>
          )}
        </div>
      </>
    );
  }

  return (
    <>
      <StepLabel step={3} />
      <h1 className="page-title mt-1">Đặt mật khẩu mới</h1>
      <p className="mt-1.5 text-gray-600">Mã đã đúng. Nhập mật khẩu mới cho tài khoản {email}.</p>
      {alert}
      <form onSubmit={savePassword} className="mt-6 space-y-4">
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
              minLength={MIN_PASSWORD_LENGTH}
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
          <p className="mt-1.5 text-xs text-gray-500">Ít nhất {MIN_PASSWORD_LENGTH} ký tự.</p>
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
          {loading ? 'Đang lưu...' : 'Lưu mật khẩu mới'}
        </button>
      </form>
    </>
  );
}
