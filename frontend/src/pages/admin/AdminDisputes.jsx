import { useEffect, useState } from 'react';
import { Landmark } from 'lucide-react';
import { getDisputedDeposits, resolveDispute } from '../../services/depositService';

function formatCurrency(value) {
  return new Intl.NumberFormat('vi-VN').format(value) + ' đ';
}

export default function AdminDisputes() {
  const [deposits, setDeposits] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  function load() {
    setLoading(true);
    getDisputedDeposits()
      .then(setDeposits)
      .finally(() => setLoading(false));
  }

  async function handleResolve(id, releaseToLandlord) {
    const note = prompt('Ghi chú xử lý (không bắt buộc):') || '';
    await resolveDispute(id, releaseToLandlord, note);
    load();
  }

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold tracking-tight text-gray-900">Tranh chấp đặt cọc</h1>
      <p className="mb-6 text-sm text-gray-500">{deposits.length} giao dịch đang chờ xử lý.</p>

      {loading && (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl border border-gray-200 bg-gray-50" />
          ))}
        </div>
      )}

      {!loading && deposits.length === 0 && (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-gray-300 py-16 text-center">
          <Landmark size={28} className="text-gray-300" />
          <p className="text-gray-500">Không có tranh chấp nào.</p>
        </div>
      )}

      {!loading && deposits.length > 0 && (
        <div className="space-y-3">
          {deposits.map((d) => (
            <div key={d.id} className="rounded-2xl border border-gray-200 p-5 transition-colors hover:border-gray-300">
              <div className="mb-2 flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-gray-900">{d.listingTitle}</p>
                  <p className="text-sm text-gray-500">
                    Người thuê: {d.renterName} · Chủ nhà: {d.landlordName}
                  </p>
                  <p className="text-sm font-medium text-rose-600">{formatCurrency(d.amount)}</p>
                </div>

                <div className="flex flex-shrink-0 gap-2">
                  <button
                    type="button"
                    onClick={() => handleResolve(d.id, false)}
                    className="rounded-full bg-gray-600 px-3.5 py-1.5 text-sm text-white transition-colors hover:bg-gray-700"
                  >
                    Hoàn tiền người thuê
                  </button>
                  <button
                    type="button"
                    onClick={() => handleResolve(d.id, true)}
                    className="rounded-full bg-green-600 px-3.5 py-1.5 text-sm text-white transition-colors hover:bg-green-700"
                  >
                    Chuyển cho chủ nhà
                  </button>
                </div>
              </div>
              {d.disputeReason && <p className="text-sm text-gray-600">Lý do: {d.disputeReason}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
