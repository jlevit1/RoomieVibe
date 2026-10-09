import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { X } from 'lucide-react';
import { boostListing, getBoostPackages } from '../services/listingService';
import { getWallet } from '../services/walletService';

function formatCurrency(value) {
  return new Intl.NumberFormat('vi-VN').format(value) + 'đ';
}

function formatDateTime(iso) {
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(d.getHours())}:${pad(d.getMinutes())} ngày ${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

export default function BoostListingModal({ listing, onClose, onBoosted }) {
  const [packages, setPackages] = useState([]);
  const [selected, setSelected] = useState(null);
  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([getBoostPackages(), getWallet()])
      .then(([pkgs, wallet]) => {
        setPackages(pkgs);
        setSelected(pkgs[1]?.code ?? pkgs[0]?.code ?? null);
        setBalance(Number(wallet.balance));
      })
      .catch(() => setError('Không tải được bảng giá, thử lại sau.'))
      .finally(() => setLoading(false));
  }, []);

  const chosen = packages.find((p) => p.code === selected);
  const insufficient = chosen != null && balance != null && balance < Number(chosen.price);
  let payLabel = 'Thanh toán';
  if (submitting) payLabel = 'Đang thanh toán...';
  else if (chosen) payLabel = `Thanh toán ${formatCurrency(chosen.price)}`;

  async function handlePay() {
    setSubmitting(true);
    setError('');
    try {
      onBoosted(await boostListing(listing.id, selected));
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể đẩy tin, thử lại sau.');
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 px-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="boost-title"
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-[0_24px_48px_-12px_rgba(20,79,112,0.35)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-1 flex items-start justify-between gap-3">
          <h2 id="boost-title" className="text-lg font-semibold text-gray-900">
            Đẩy tin lên đầu
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="-mr-2 -mt-1 rounded-full p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900"
          >
            <X size={18} />
          </button>
        </div>
        <p className="mb-3 truncate text-sm font-medium text-gray-700">{listing.title}</p>
        <p className="mb-5 text-sm leading-relaxed text-gray-600">
          Tin được ưu tiên hiển thị đầu danh sách tìm kiếm (sắp xếp mặc định) và gắn nhãn{' '}
          <span className="rounded bg-amber-400 px-1.5 py-0.5 text-xs font-semibold text-gray-900">Nổi bật</span>.
        </p>

        {listing.promoted && (
          <p className="mb-4 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-800">
            Đang được đẩy đến {formatDateTime(listing.promotedUntil)}. Mua thêm sẽ cộng dồn thời gian.
          </p>
        )}

        {loading ? (
          <div className="mb-4 space-y-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-14 animate-pulse rounded-xl bg-gray-100" />
            ))}
          </div>
        ) : (
          <div className="mb-4 space-y-2">
            {packages.map((p) => (
              <label
                key={p.code}
                className={`flex cursor-pointer items-center justify-between gap-3 rounded-xl border px-4 py-3 transition-colors ${
                  selected === p.code ? 'border-gray-900 ring-1 ring-gray-900' : 'border-gray-200 hover:border-gray-400'
                }`}
              >
                <span className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="boost-package"
                    checked={selected === p.code}
                    onChange={() => setSelected(p.code)}
                    className="accent-gray-900"
                  />
                  <span>
                    <span className="block text-sm font-semibold text-gray-900">{p.days} ngày</span>
                    <span className="block text-xs text-gray-600">
                      ~{formatCurrency(Math.round(Number(p.price) / p.days))}/ngày
                    </span>
                  </span>
                </span>
                <span className="text-sm font-bold text-gray-900">{formatCurrency(p.price)}</span>
              </label>
            ))}
          </div>
        )}

        {balance != null && (
          <p className="mb-2 text-sm text-gray-600">
            Số dư ví: <span className="font-semibold text-gray-900">{formatCurrency(balance)}</span>
          </p>
        )}
        {insufficient && (
          <p className="mb-2 text-sm text-red-600">
            Số dư không đủ.{' '}
            <Link to="/wallet" className="font-medium underline">
              Nạp thêm tiền
            </Link>
          </p>
        )}
        {error && <p className="mb-2 text-sm text-red-600">{error}</p>}

        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="btn-secondary">
            Hủy
          </button>
          <button
            type="button"
            onClick={handlePay}
            disabled={loading || !chosen || insufficient || submitting}
            className="btn-primary"
          >
            {payLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
