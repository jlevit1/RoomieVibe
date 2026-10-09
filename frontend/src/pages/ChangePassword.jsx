import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import PasswordCodeFlow from '../components/PasswordCodeFlow';

export default function ChangePassword() {
  const { user } = useAuth();
  const [done, setDone] = useState(false);

  return (
    <div className="flex min-h-[calc(100dvh-4rem)] items-center justify-center bg-gray-50 px-4 py-12 sm:px-6">
      <div className="surface w-full max-w-md p-8 shadow-[0_24px_48px_-32px_rgba(20,79,112,0.4)] sm:p-10">
        {done ? (
          <div className="text-center">
            <CheckCircle2 size={40} className="mx-auto text-emerald-600" />
            <h1 className="page-title mt-4">Đã đổi mật khẩu</h1>
            <p className="mt-2 text-gray-600">
              Lần đăng nhập sau, hãy dùng mật khẩu mới. Chúng tôi cũng đã gửi email xác nhận tới {user?.email}.
            </p>
            <Link to="/" className="btn-primary mt-7 w-full py-3">
              Về trang chủ
            </Link>
          </div>
        ) : (
          <PasswordCodeFlow
            title="Đổi mật khẩu"
            intro="Để bảo vệ tài khoản, chúng tôi sẽ gửi một mã xác nhận gồm 6 chữ số tới email của bạn."
            initialEmail={user?.email || ''}
            emailLocked
            onDone={() => setDone(true)}
          />
        )}
      </div>
    </div>
  );
}
