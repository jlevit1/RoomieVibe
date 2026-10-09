import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { MapPin } from 'lucide-react';
import { approveListing, getPendingListings, rejectListing } from '../../services/listingService';
import { AMENITY_LABELS } from '../../constants/amenities';
import ConfirmModal from '../../components/ConfirmModal';

function formatPrice(price) {
  return new Intl.NumberFormat('vi-VN').format(price);
}

function formatDateTime(iso) {
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)} lúc ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fullAddress(listing) {
  const parts = [listing.address, listing.ward, listing.district, listing.city].filter(Boolean);
  // Addresses picked from autocomplete often already contain the district and city.
  return parts.filter((part, i) => i === 0 || !parts[0].includes(part)).join(', ');
}

export default function AdminPending() {
  const outlet = useOutletContext();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rejecting, setRejecting] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    getPendingListings()
      .then(setListings)
      .finally(() => setLoading(false));
  }, []);

  function removeFromQueue(id) {
    setListings((prev) => prev.filter((l) => l.id !== id));
    outlet?.refreshCounts?.();
  }

  async function handleApprove(id) {
    setError('');
    setBusyId(id);
    try {
      await approveListing(id);
      removeFromQueue(id);
    } catch (err) {
      setError(err.response?.data?.message || 'Không duyệt được tin, thử lại sau.');
    } finally {
      setBusyId(null);
    }
  }

  async function handleReject(reason) {
    const target = rejecting;
    setRejecting(null);
    setError('');
    setBusyId(target.id);
    try {
      await rejectListing(target.id, reason.trim());
      removeFromQueue(target.id);
    } catch (err) {
      setError(err.response?.data?.message || 'Không từ chối được tin, thử lại sau.');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <h1 className="page-title">Duyệt tin đăng</h1>
      <p className="mt-1 text-gray-600">
        {loading ? 'Đang tải...' : `${listings.length} tin đang chờ, cũ nhất ở cuối danh sách.`}
      </p>

      {error && <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      {loading && (
        <div className="mt-6 space-y-4">
          {[0, 1].map((i) => (
            <div key={i} className="h-56 animate-pulse rounded-2xl border border-gray-200 bg-white" />
          ))}
        </div>
      )}

      {!loading && listings.length === 0 && (
        <div className="mt-6 rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center">
          <p className="font-semibold text-gray-900">Đã duyệt hết</p>
          <p className="mt-1 text-sm text-gray-600">Tin mới gửi lên sẽ xuất hiện ở đây.</p>
        </div>
      )}

      {!loading && listings.length > 0 && (
        <ul className="mt-6 space-y-4">
          {listings.map((listing) => {
            const images = Array.from(listing.imageUrls || []);
            const amenities = Array.from(listing.amenities || []);
            const busy = busyId === listing.id;
            return (
              <li key={listing.id} className="surface overflow-hidden">
                {images.length > 0 ? (
                  <div className="scrollbar-hide flex gap-1 overflow-x-auto bg-gray-100">
                    {images.map((url, i) => (
                      <img
                        key={url}
                        src={url}
                        alt={`Ảnh ${i + 1}`}
                        className="h-36 w-48 flex-shrink-0 object-cover"
                        loading="lazy"
                      />
                    ))}
                  </div>
                ) : (
                  <p className="bg-amber-50 px-5 py-2.5 text-sm text-amber-800">Tin không có ảnh.</p>
                )}

                <div className="p-5">
                  <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-2">
                    <div className="min-w-0">
                      <h2 className="font-semibold text-gray-900">{listing.title}</h2>
                      <p className="mt-1 flex items-center gap-1 text-sm text-gray-600">
                        <MapPin size={14} className="flex-shrink-0 text-gray-400" />
                        {fullAddress(listing)}
                      </p>
                    </div>
                    <p className="text-lg font-bold text-orange-600">
                      {formatPrice(listing.price)}đ<span className="text-sm font-medium text-orange-500">/tháng</span>
                    </p>
                  </div>

                  <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm">
                    <div className="flex gap-1.5">
                      <dt className="text-gray-500">Chủ nhà</dt>
                      <dd className="font-medium text-gray-900">{listing.landlordName}</dd>
                    </div>
                    {listing.contactPhone && (
                      <div className="flex gap-1.5">
                        <dt className="text-gray-500">SĐT</dt>
                        <dd className="font-medium text-gray-900">{listing.contactPhone}</dd>
                      </div>
                    )}
                    {listing.area && (
                      <div className="flex gap-1.5">
                        <dt className="text-gray-500">Diện tích</dt>
                        <dd className="font-medium text-gray-900">{listing.area} m²</dd>
                      </div>
                    )}
                    <div className="flex gap-1.5">
                      <dt className="text-gray-500">Gửi lúc</dt>
                      <dd className="font-medium text-gray-900">{formatDateTime(listing.updatedAt || listing.createdAt)}</dd>
                    </div>
                    <div className="flex gap-1.5">
                      <dt className="text-gray-500">Bản đồ</dt>
                      <dd className={listing.latitude != null ? 'font-medium text-emerald-700' : 'font-medium text-amber-700'}>
                        {listing.latitude != null ? 'Đã ghim' : 'Chưa ghim'}
                      </dd>
                    </div>
                  </dl>

                  {listing.description && (
                    <p className="mt-3 line-clamp-3 whitespace-pre-line text-sm text-gray-700">{listing.description}</p>
                  )}

                  {amenities.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {amenities.map((a) => (
                        <span key={a} className="rounded-md bg-gray-100 px-2 py-0.5 text-xs text-gray-700">
                          {AMENITY_LABELS[a] || a}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="mt-5 flex flex-wrap justify-end gap-2 border-t border-gray-100 pt-4">
                    <button type="button" disabled={busy} onClick={() => setRejecting(listing)} className="btn-secondary">
                      Từ chối
                    </button>
                    <button type="button" disabled={busy} onClick={() => handleApprove(listing.id)} className="btn-primary">
                      {busy ? 'Đang xử lý...' : 'Duyệt tin'}
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <ConfirmModal
        open={Boolean(rejecting)}
        title="Từ chối tin đăng"
        message="Chủ nhà sẽ thấy lý do này và có thể sửa tin để gửi duyệt lại."
        confirmLabel="Từ chối tin"
        danger
        requireInput
        inputPlaceholder="VD: Ảnh không phải ảnh thật của phòng, thiếu địa chỉ cụ thể..."
        onConfirm={handleReject}
        onCancel={() => setRejecting(null)}
      />
    </div>
  );
}
