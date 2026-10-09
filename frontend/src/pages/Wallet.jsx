import { useEffect, useState } from 'react';
import { getWallet, topUp } from '../services/walletService';
import CurrencyInput from '../components/CurrencyInput';

const QUICK_AMOUNTS = [50000, 100000, 200000, 500000];

const TYPE_META = {
  NAP_TIEN: { label: 'Nạp tiền qua VNPay', credit: true },
  GIU_COC: { label: 'Giữ tiền đặt cọc', credit: false },
  HOAN_COC: { label: 'Hoàn tiền đặt cọc', credit: true },
  NHAN_COC: { label: 'Nhận tiền đặt cọc', credit: true },
  DAY_TIN: { label: 'Phí đẩy tin', credit: false },
};

function formatCurrency(value) {
  return new Intl.NumberFormat('vi-VN').format(value) + 'đ';
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
      setError('Số tiền nạp tối thiểu là 10.000đ');
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
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <h1 className="page-title">Ví của tôi</h1>
      <p className="mt-1 text-gray-600">Dùng để đặt cọc xem phòng hoặc đẩy tin đăng lên đầu.</p>

      <div className="mt-8 grid gap-8 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-5">
          <div className="surface p-6">
            <p className="text-sm text-gray-500">Số dư hiện tại</p>
            <p className="mt-1 text-3xl font-bold tracking-tight text-gray-900">
              {loading || !wallet ? '...' : formatCurrency(wallet.balance)}
            </p>
          </div>

          <form onSubmit={handleTopUp} className="surface space-y-4 p-6">
            <h2 className="font-semibold text-gray-900">Nạp tiền</h2>
            <div className="grid grid-cols-2 gap-2">
              {QUICK_AMOUNTS.map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setAmount(v)}
                  aria-pressed={amount === v}
                  className={`rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors ${
                    amount === v
                      ? 'border-gray-900 bg-gray-900 text-white'
                      : 'border-gray-300 text-gray-800 hover:border-gray-400'
                  }`}
                >
                  {formatCurrency(v)}
                </button>
              ))}
            </div>
            <div>
              <label htmlFor="topup-amount" className="field-label">
                Hoặc nhập số khác
              </label>
              <CurrencyInput
                id="topup-amount"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="field-input"
                placeholder="Tối thiểu 10.000đ"
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button type="submit" disabled={submitting} className="btn-primary w-full py-3">
              {submitting ? 'Đang chuyển đến VNPay...' : 'Nạp tiền qua VNPay'}
            </button>
          </form>
        </div>

        <div className="lg:col-span-7">
          <h2 className="font-semibold text-gray-900">Lịch sử giao dịch</h2>
          {loading && (
            <div className="mt-4 space-y-2">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-14 animate-pulse rounded-xl bg-gray-100" />
              ))}
            </div>
          )}
          {!loading && wallet?.transactions.length === 0 && (
            <p className="mt-4 rounded-2xl border border-dashed border-gray-300 px-6 py-10 text-center text-sm text-gray-600">
              Chưa có giao dịch nào.
            </p>
          )}
          {!loading && wallet?.transactions.length > 0 && (
            <ul className="surface mt-4 divide-y divide-gray-100">
              {wallet.transactions.map((t) => {
                const meta = TYPE_META[t.type] || { label: t.type, credit: true };
                return (
                  <li key={t.id} className="flex items-center justify-between gap-4 px-5 py-4">
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900">{meta.label}</p>
                      <p className="text-sm text-gray-500">{new Date(t.createdAt).toLocaleString('vi-VN')}</p>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold tabular-nums ${meta.credit ? 'text-emerald-700' : 'text-gray-900'}`}>
                        {meta.credit ? '+' : '-'}
                        {formatCurrency(t.amount)}
                      </p>
                      <p className="text-sm tabular-nums text-gray-500">Số dư {formatCurrency(t.balanceAfter)}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
