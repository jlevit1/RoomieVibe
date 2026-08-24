import { useEffect, useState } from 'react';
import { Wallet as WalletIcon, ArrowDownCircle } from 'lucide-react';
import { getWallet, topUp } from '../services/walletService';
import CurrencyInput from '../components/CurrencyInput';

const QUICK_AMOUNTS = [50000, 100000, 200000, 500000];

const TYPE_LABELS = {
  NAP_TIEN: 'Nạp tiền',
};

function formatCurrency(value) {
  return new Intl.NumberFormat('vi-VN').format(value) + ' đ';
}

export default function Wallet() {
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState(100000);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    load();
  }, []);

  function load() {
    setLoading(true);
    getWallet()
      .then(setWallet)
      .finally(() => setLoading(false));
  }

  async function handleTopUp(e) {
    e.preventDefault();
    setError('');
    if (!amount || amount < 10000) {
      setError('Số tiền nạp tối thiểu là 10,000đ');
      return;
    }
    setSubmitting(true);
    try {
      const { paymentUrl } = await topUp(amount);
      window.location.href = paymentUrl;
    } catch (err) {
      setError(err.response?.data?.message || 'Không tạo được giao dịch, thử lại sau');
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="mb-1 text-2xl font-bold tracking-tight text-gray-900">Ví của tôi</h1>
      <p className="mb-6 text-sm text-gray-500">Nạp tiền qua VNPay để dùng cho các tính năng cần đặt cọc.</p>

      <div className="mb-6 flex items-center gap-4 rounded-2xl border border-gray-200 bg-gradient-to-br from-rose-50 to-white p-6">
        <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-rose-600 text-white">
          <WalletIcon size={22} />
        </span>
        <div>
          <p className="text-sm text-gray-500">Số dư hiện tại</p>
          <p className="text-2xl font-bold text-gray-900">
            {loading || !wallet ? '...' : formatCurrency(wallet.balance)}
          </p>
        </div>
      </div>

      <form onSubmit={handleTopUp} className="mb-8 space-y-3 rounded-2xl border border-gray-200 p-5">
        <p className="font-medium text-gray-900">Nạp tiền</p>
        <div className="flex flex-wrap gap-2">
          {QUICK_AMOUNTS.map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setAmount(v)}
              className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
                amount === v
                  ? 'border-rose-600 bg-rose-600 text-white'
                  : 'border-gray-200 text-gray-700 hover:border-rose-300'
              }`}
            >
              {formatCurrency(v)}
            </button>
          ))}
        </div>
        <CurrencyInput
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value))}
          className="w-full rounded-xl border border-gray-200 p-3 text-sm focus:border-rose-400 focus:outline-none"
          placeholder="Nhập số tiền khác..."
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-full bg-rose-600 py-2.5 text-sm font-medium text-white transition-colors hover:bg-rose-700 disabled:opacity-60"
        >
          {submitting ? 'Đang chuyển đến VNPay...' : 'Nạp tiền qua VNPay'}
        </button>
      </form>

      <div>
        <h2 className="mb-3 font-semibold text-gray-900">Lịch sử giao dịch</h2>
        {loading && <p className="text-sm text-gray-400">Đang tải...</p>}
        {!loading && wallet?.transactions.length === 0 && (
          <p className="text-sm text-gray-400">Chưa có giao dịch nào.</p>
        )}
        {!loading && wallet?.transactions.length > 0 && (
          <div className="space-y-2">
            {wallet.transactions.map((t) => (
              <div
                key={t.id}
                className="flex items-center gap-3 rounded-xl border border-gray-100 px-4 py-3"
              >
                <ArrowDownCircle size={18} className="flex-shrink-0 text-green-600" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900">{TYPE_LABELS[t.type] || t.type}</p>
                  <p className="text-xs text-gray-400">
                    {new Date(t.createdAt).toLocaleString('vi-VN')}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-green-600">+{formatCurrency(t.amount)}</p>
                  <p className="text-xs text-gray-400">Số dư: {formatCurrency(t.balanceAfter)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
