import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, XCircle } from 'lucide-react';
import { getWallet } from '../services/walletService';

function formatCurrency(value) {
  return new Intl.NumberFormat('vi-VN').format(value) + 'đ';
}

export default function TopUpResult() {
  const [searchParams] = useSearchParams();
  const success = searchParams.get('vnp_ResponseCode') === '00';
  const [balance, setBalance] = useState(null);

  useEffect(() => {
    getWallet()
      .then((w) => setBalance(w.balance))
      .catch(() => {});
  }, []);

  return (
    <div className="flex min-h-[calc(100dvh-4rem)] items-center justify-center bg-gray-50 px-4 py-12 sm:px-6">
      <div className="surface w-full max-w-md p-8 text-center sm:p-10">
        {success ? (
          <CheckCircle2 size={44} className="mx-auto text-emerald-600" />
        ) : (
          <XCircle size={44} className="mx-auto text-red-600" />
        )}
        <h1 className="mt-4 text-2xl font-bold tracking-tight text-gray-900">
          {success ? 'Nạp tiền thành công' : 'Giao dịch chưa thành công'}
        </h1>
        <p className="mt-2 text-gray-600">
          {success
            ? 'Số dư ví đã được cập nhật.'
            : 'Giao dịch đã bị hủy hoặc gặp lỗi, tiền chưa bị trừ. Bạn có thể thử lại.'}
        </p>
        {balance != null && (
          <p className="mt-6 rounded-xl bg-gray-50 px-4 py-3 text-gray-700">
            Số dư hiện tại <span className="font-bold text-gray-900">{formatCurrency(balance)}</span>
          </p>
        )}
        <Link to="/wallet" className="btn-primary mt-6 w-full py-3">
          Về ví của tôi
        </Link>
      </div>
    </div>
  );
}
