import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { getDisputedDeposits, resolveDispute } from '../../services/depositService';
import ConfirmModal from '../../components/ConfirmModal';

function formatCurrency(value) {
  return new Intl.NumberFormat('vi-VN').format(value) + 'đ';
}

function formatDateTime(iso) {
  return new Date(iso).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' });
}

export default function AdminDisputes() {
  const outlet = useOutletContext();
  const [deposits, setDeposits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    getDisputedDeposits()
      .then(setDeposits)
      .finally(() => setLoading(false));
  }, []);

  async function handleResolve(note) {
    const { deposit, releaseToLandlord } = pending;
    setPending(null);
    setError('');
    try {
      await resolveDispute(deposit.id, releaseToLandlord, (note || '').trim());
      setDeposits((prev) => prev.filter((d) => d.id !== deposit.id));
      outlet?.refreshCounts?.();
    } catch (err) {
      setError(err.response?.data?.message || 'Không xử lý được tranh chấp, thử lại sau.');
    }
  }

  const target = pending?.deposit;
  let resolveMessage = '';
  if (target) {
    const receiver = pending.releaseToLandlord ? target.landlordName : target.renterName;
    resolveMessage = `${formatCurrency(target.amount)} sẽ được chuyển vào ví của ${receiver}. Không thể hoàn tác.`;
  }

  return (
    <div>
      <h1 className="page-title">Tranh chấp đặt cọc</h1>
      <p className="mt-1 text-gray-600">Tiền cọc được hệ thống giữ cho tới khi bạn chọn cách xử lý.</p>

      {error && <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      {loading && (
        <div className="mt-6 space-y-4">
          {[0, 1].map((i) => (
            <div key={i} className="h-40 animate-pulse rounded-2xl border border-gray-200 bg-white" />
          ))}
        </div>
      )}

      {!loading && deposits.length === 0 && (
        <div className="mt-6 rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center">
          <p className="font-semibold text-gray-900">Không có tranh chấp nào</p>
          <p className="mt-1 text-sm text-gray-600">Khi người thuê hoặc chủ nhà báo cáo vấn đề, giao dịch sẽ hiện ở đây.</p>
        </div>
      )}

      {!loading && deposits.length > 0 && (
        <ul className="mt-6 space-y-4">
          {deposits.map((d) => (
            <li key={d.id} className="surface p-5">
              <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-2">
                <div className="min-w-0">
                  <h2 className="font-semibold text-gray-900">{d.listingTitle}</h2>
                  <p className="mt-0.5 text-sm text-gray-500">
                    Mã giao dịch #{d.id} · báo cáo lúc {formatDateTime(d.updatedAt || d.createdAt)}
                  </p>
                </div>
                <p className="text-xl font-bold tabular-nums text-gray-900">{formatCurrency(d.amount)}</p>
              </div>

              <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                <div className="rounded-xl bg-gray-50 px-4 py-3">
                  <dt className="text-gray-500">Người thuê</dt>
                  <dd className="mt-0.5 font-medium text-gray-900">{d.renterName}</dd>
                </div>
                <div className="rounded-xl bg-gray-50 px-4 py-3">
                  <dt className="text-gray-500">Chủ nhà</dt>
                  <dd className="mt-0.5 font-medium text-gray-900">{d.landlordName}</dd>
                </div>
              </dl>

              {d.disputeReason && (
                <blockquote className="mt-4 border-l-2 border-red-300 pl-4 text-sm text-gray-800">
                  <p className="text-xs font-semibold text-gray-500">Lý do báo cáo</p>
                  <p className="mt-0.5">{d.disputeReason}</p>
                </blockquote>
              )}

              <div className="mt-5 flex flex-wrap justify-end gap-2 border-t border-gray-100 pt-4">
                <button
                  type="button"
                  onClick={() => setPending({ deposit: d, releaseToLandlord: false })}
                  className="btn-secondary"
                >
                  Hoàn tiền cho người thuê
                </button>
                <button
                  type="button"
                  onClick={() => setPending({ deposit: d, releaseToLandlord: true })}
                  className="btn-secondary"
                >
                  Chuyển cho chủ nhà
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <ConfirmModal
        open={Boolean(pending)}
        title={pending?.releaseToLandlord ? 'Chuyển tiền cọc cho chủ nhà' : 'Hoàn tiền cọc cho người thuê'}
        message={resolveMessage}
        confirmLabel="Xác nhận xử lý"
        requireInput
        inputOptional
        inputPlaceholder="Ghi chú cho hai bên (không bắt buộc)"
        onConfirm={handleResolve}
        onCancel={() => setPending(null)}
      />
    </div>
  );
}
