import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Landmark, Clock, ShieldCheck, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { payDeposit, cancelDeposit, completeDeposit, disputeDeposit } from '../services/depositService';
import ConfirmModal from './ConfirmModal';

function formatCurrency(value) {
  return new Intl.NumberFormat('vi-VN').format(value) + ' đ';
}

const STATUS_META = {
  CHO_THANH_TOAN: { label: 'Chờ thanh toán', badge: 'bg-amber-100 text-amber-700', card: 'border-amber-200 bg-amber-50/60', Icon: Clock },
  DA_THANH_TOAN: { label: 'Đã đặt cọc', badge: 'bg-blue-100 text-blue-700', card: 'border-blue-200 bg-blue-50/60', Icon: ShieldCheck },
  HOAN_THANH: { label: 'Hoàn tất', badge: 'bg-green-100 text-green-700', card: 'border-green-200 bg-green-50/60', Icon: CheckCircle2 },
  DA_HUY: { label: 'Đã hủy', badge: 'bg-gray-100 text-gray-600', card: 'border-gray-200 bg-gray-50', Icon: XCircle },
  TRANH_CHAP: { label: 'Đang tranh chấp', badge: 'bg-red-100 text-red-700', card: 'border-red-200 bg-red-50/60', Icon: AlertTriangle },
  DA_HOAN_TIEN: { label: 'Đã hoàn tiền', badge: 'bg-gray-100 text-gray-600', card: 'border-gray-200 bg-gray-50', Icon: CheckCircle2 },
  DA_CHUYEN_CHU_NHA: { label: 'Đã chuyển chủ nhà', badge: 'bg-green-100 text-green-700', card: 'border-green-200 bg-green-50/60', Icon: CheckCircle2 },
};

export default function DepositMessageBubble({ message, isRenter, onUpdated }) {
  const deposit = message.deposit;
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);

  const meta = STATUS_META[deposit.status] || STATUS_META.DA_HUY;
  const StatusIcon = meta.Icon;

  async function run(action) {
    setError('');
    setSubmitting(true);
    try {
      const updated = await action();
      onUpdated?.(updated);
    } catch (err) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra, thử lại sau');
    } finally {
      setSubmitting(false);
    }
  }

  function handleConfirmed(inputValue) {
    const action = pendingAction;
    setPendingAction(null);
    if (action === 'pay') run(() => payDeposit(deposit.id));
    else if (action === 'complete') run(() => completeDeposit(deposit.id));
    else if (action === 'renterCancel' || action === 'landlordCancel') run(() => cancelDeposit(deposit.id));
    else if (action === 'dispute') run(() => disputeDeposit(deposit.id, inputValue));
  }

  return (
    <div className={`w-full max-w-sm overflow-hidden rounded-2xl border shadow-sm ${meta.card}`}>
      <div className="flex items-center gap-3 border-b border-black/5 px-4 py-3">
        <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-white text-rose-600 shadow-sm">
          <Landmark size={17} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-gray-900">Yêu cầu đặt cọc</p>
          <p className="text-base font-bold text-gray-900">{formatCurrency(deposit.amount)}</p>
        </div>
        <span className={`flex flex-shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${meta.badge}`}>
          <StatusIcon size={12} /> {meta.label}
        </span>
      </div>

      <div className="px-4 py-3">
        {deposit.status === 'CHO_THANH_TOAN' && (
          <div className="space-y-3">
            <p className="text-sm text-gray-600">
              {isRenter ? 'Chủ nhà yêu cầu đặt cọc để giữ lịch xem phòng.' : 'Đang chờ người thuê thanh toán...'}
            </p>
            {isRenter ? (
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => setPendingAction('pay')}
                  className="rounded-full bg-rose-600 px-3.5 py-1.5 text-sm font-medium text-white transition-colors hover:bg-rose-700 disabled:opacity-60"
                >
                  Thanh toán
                </button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => run(() => cancelDeposit(deposit.id))}
                  className="rounded-full border border-gray-300 bg-white px-3.5 py-1.5 text-sm text-gray-700 transition-colors hover:bg-gray-100"
                >
                  Từ chối
                </button>
              </div>
            ) : (
              <button
                type="button"
                disabled={submitting}
                onClick={() => run(() => cancelDeposit(deposit.id))}
                className="rounded-full border border-gray-300 bg-white px-3.5 py-1.5 text-sm text-gray-700 transition-colors hover:bg-gray-100"
              >
                Hủy yêu cầu
              </button>
            )}
          </div>
        )}

        {deposit.status === 'DA_THANH_TOAN' && (
          <div className="space-y-3">
            <p className="text-sm text-gray-600">
              {isRenter
                ? 'Bạn đã thanh toán, tiền đang được hệ thống giữ. Sau khi xem phòng, xác nhận bên dưới.'
                : 'Người thuê đã thanh toán, tiền đang được hệ thống giữ chờ xác nhận.'}
            </p>
            {isRenter ? (
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => setPendingAction('complete')}
                  className="rounded-full bg-green-600 px-3.5 py-1.5 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:opacity-60"
                >
                  Đã xem, chốt thuê
                </button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => setPendingAction('renterCancel')}
                  className="rounded-full border border-gray-300 bg-white px-3.5 py-1.5 text-sm text-gray-700 transition-colors hover:bg-gray-100"
                >
                  Hủy (mất cọc)
                </button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => setPendingAction('dispute')}
                  className="rounded-full border border-red-300 bg-white px-3.5 py-1.5 text-sm text-red-600 transition-colors hover:bg-red-50"
                >
                  Báo cáo vấn đề
                </button>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => setPendingAction('landlordCancel')}
                  className="rounded-full border border-gray-300 bg-white px-3.5 py-1.5 text-sm text-gray-700 transition-colors hover:bg-gray-100"
                >
                  Hủy & hoàn cọc cho người thuê
                </button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => setPendingAction('dispute')}
                  className="rounded-full border border-red-300 bg-white px-3.5 py-1.5 text-sm text-red-600 transition-colors hover:bg-red-50"
                >
                  Báo cáo vấn đề
                </button>
              </div>
            )}
          </div>
        )}

        {deposit.status === 'HOAN_THANH' && (
          <p className="text-sm text-green-700">Đã hoàn tất — tiền cọc đã chuyển cho chủ nhà.</p>
        )}

        {deposit.status === 'DA_HUY' && <p className="text-sm text-gray-500">Yêu cầu đặt cọc đã bị hủy.</p>}

        {deposit.status === 'TRANH_CHAP' && (
          <p className="text-sm text-red-700">
            {deposit.disputeReason} — quản trị viên sẽ xem xét và xử lý.
          </p>
        )}

        {deposit.status === 'DA_HOAN_TIEN' && (
          <p className="text-sm text-gray-600">
            Quản trị viên đã xử lý: hoàn tiền cho người thuê.
            {deposit.resolutionNote && ` (${deposit.resolutionNote})`}
          </p>
        )}

        {deposit.status === 'DA_CHUYEN_CHU_NHA' && (
          <p className="text-sm text-green-700">
            Quản trị viên đã xử lý: chuyển tiền cho chủ nhà.
            {deposit.resolutionNote && ` (${deposit.resolutionNote})`}
          </p>
        )}

        {error && (
          <p className="mt-2 text-sm text-red-600">
            {error}{' '}
            {error.includes('nạp') && (
              <Link to="/wallet" className="font-medium underline">
                Nạp tiền ngay
              </Link>
            )}
          </p>
        )}
      </div>

      <ConfirmModal
        open={pendingAction === 'pay'}
        title="Xác nhận thanh toán tiền cọc"
        message={`Bạn sẽ thanh toán ${formatCurrency(deposit.amount)} từ ví. Số tiền này sẽ được hệ thống giữ cho tới khi bạn xác nhận đã xem phòng.`}
        confirmLabel="Thanh toán"
        onConfirm={handleConfirmed}
        onCancel={() => setPendingAction(null)}
      />
      <ConfirmModal
        open={pendingAction === 'complete'}
        title="Xác nhận đã xem phòng & chốt thuê"
        message={`Tiền cọc ${formatCurrency(deposit.amount)} sẽ được chuyển cho chủ nhà. Hành động này không thể hoàn tác.`}
        confirmLabel="Xác nhận"
        onConfirm={handleConfirmed}
        onCancel={() => setPendingAction(null)}
      />
      <ConfirmModal
        open={pendingAction === 'renterCancel'}
        title="Hủy đặt cọc"
        message={`Bạn sẽ MẤT ${formatCurrency(deposit.amount)} đã cọc — số tiền này sẽ chuyển cho chủ nhà. Bạn chắc chắn muốn hủy?`}
        confirmLabel="Hủy & mất cọc"
        danger
        onConfirm={handleConfirmed}
        onCancel={() => setPendingAction(null)}
      />
      <ConfirmModal
        open={pendingAction === 'landlordCancel'}
        title="Hủy yêu cầu đặt cọc"
        message={`Hoàn lại ${formatCurrency(deposit.amount)} cho người thuê và hủy yêu cầu này?`}
        confirmLabel="Xác nhận hủy"
        onConfirm={handleConfirmed}
        onCancel={() => setPendingAction(null)}
      />
      <ConfirmModal
        open={pendingAction === 'dispute'}
        title="Báo cáo vấn đề"
        message="Mô tả ngắn gọn vấn đề bạn gặp phải để quản trị viên xem xét:"
        confirmLabel="Gửi báo cáo"
        danger
        requireInput
        inputPlaceholder="VD: đối phương không phản hồi, không xuất hiện đúng hẹn..."
        onConfirm={handleConfirmed}
        onCancel={() => setPendingAction(null)}
      />
    </div>
  );
}
