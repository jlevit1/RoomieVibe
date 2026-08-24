import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, XCircle } from 'lucide-react';
import { getWallet } from '../services/walletService';

function formatCurrency(value) {
  return new Intl.NumberFormat('vi-VN').format(value) + ' đ';
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
    <div className="mx-auto max-w-md px-6 py-16 text-center">
      {success ? (
        <CheckCircle2 size={48} className="mx-auto mb-4 text-green-600" />
      ) : (
        <XCircle size={48} className="mx-auto mb-4 text-red-600" />
      )}
      <h1 className="mb-2 text-xl font-bold text-gray-900">
        {success ? 'Nạp tiền thành công' : 'Giao dịch không thành công'}
      </h1>
      <p className="mb-6 text-sm text-gray-500">
        {success
          ? 'Số dư ví của bạn đã được cập nhật.'
          : 'Giao dịch đã bị hủy hoặc gặp lỗi. Bạn có thể thử lại.'}
      </p>
      {balance != null && (
        <p className="mb-6 text-lg font-semibold text-gray-900">
          Số dư hiện tại: {formatCurrency(balance)}
        </p>
      )}
      <Link
        to="/wallet"
        className="inline-block rounded-full bg-rose-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-rose-700"
      >
        Quay lại Ví của tôi
      </Link>
    </div>
  );
}
