import { useState } from 'react';
import { X } from 'lucide-react';
import { markListingRented } from '../services/listingService';

export default function MarkRentedModal({ listing, onClose, onDone }) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handleConfirm() {
    setSubmitting(true);
    setError('');
    try {
      onDone(await markListingRented(listing.id, null));
    } catch (err) {
      setError(err.response?.data?.message || 'Không cập nhật được trạng thái, thử lại sau.');
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 px-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="mark-rented-title"
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-[0_24px_48px_-12px_rgba(20,79,112,0.35)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-1 flex items-start justify-between gap-3">
          <h2 id="mark-rented-title" className="text-lg font-semibold text-gray-900">
            Đánh dấu đã cho thuê
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
          Tin sẽ được ẩn khỏi kết quả tìm kiếm và không nhận liên hệ mới. Bạn có thể mở cho thuê lại bất cứ lúc nào.
        </p>

        {listing.promoted && (
          <p className="mb-3 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-800">
            Lưu ý: thời gian đẩy tin còn lại vẫn tiếp tục được tính trong lúc tin bị ẩn.
          </p>
        )}
        {error && <p className="mb-2 text-sm text-red-600">{error}</p>}

        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="btn-secondary">
            Hủy
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={submitting}
            className="btn-primary"
          >
            {submitting ? 'Đang cập nhật...' : 'Xác nhận đã cho thuê'}
          </button>
        </div>
      </div>
    </div>
  );
}
