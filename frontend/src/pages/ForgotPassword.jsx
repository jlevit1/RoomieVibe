import { Link, useLocation, useNavigate } from 'react-router-dom';
import PasswordCodeFlow from '../components/PasswordCodeFlow';

export default function ForgotPassword() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <div className="flex min-h-[calc(100dvh-4rem)] items-center justify-center bg-gray-50 px-4 py-12 sm:px-6">
      <div className="surface w-full max-w-md p-8 shadow-[0_24px_48px_-32px_rgba(20,79,112,0.4)] sm:p-10">
        <PasswordCodeFlow
          title="Quên mật khẩu"
          initialEmail={location.state?.email || ''}
          onDone={(email) => navigate('/login', { replace: true, state: { passwordReset: true, email } })}
        />
        <p className="mt-8 text-center text-sm text-gray-600">
          Nhớ ra mật khẩu rồi?{' '}
          <Link to="/login" className="link-accent">
            Đăng nhập
          </Link>
        </p>
      </div>
    </div>
  );
}
