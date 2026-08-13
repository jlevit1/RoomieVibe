import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { deleteListing, getMyListings } from '../services/listingService';

const STATUS_LABELS = {
  CHO_DUYET: { text: 'Chờ duyệt', className: 'bg-yellow-100 text-yellow-700' },
  HIEN_THI: { text: 'Đã duyệt', className: 'bg-green-100 text-green-700' },
  TU_CHOI: { text: 'Bị từ chối', className: 'bg-red-100 text-red-700' },
};

function formatPrice(price) {
  return new Intl.NumberFormat('vi-VN').format(price) + ' đ/tháng';
}

export default function MyListings() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  function load() {
    setLoading(true);
    getMyListings()
      .then(setListings)
      .finally(() => setLoading(false));
  }

  async function handleDelete(id) {
    if (!confirm('Xóa tin đăng này?')) return;
    await deleteListing(id);
    load();
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Tin đăng của tôi</h1>
        <Link
          to="/listings/new"
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          + Đăng tin mới
        </Link>
      </div>

      {loading ? (
        <p className="text-gray-500">Đang tải...</p>
      ) : listings.length === 0 ? (
        <p className="text-gray-500">Bạn chưa đăng tin nào.</p>
      ) : (
        <div className="space-y-3">
          {listings.map((listing) => {
            const status = STATUS_LABELS[listing.status];
            return (
              <div
                key={listing.id}
                className="flex items-center justify-between rounded-lg border border-gray-200 p-4"
              >
                <div>
                  <p className="font-semibold text-gray-900">{listing.title}</p>
                  <p className="text-sm text-gray-500">
                    {formatPrice(listing.price)} · {listing.district}, {listing.city}
                  </p>
                  {listing.status === 'TU_CHOI' && listing.rejectReason && (
                    <p className="mt-1 text-sm text-red-600">Lý do: {listing.rejectReason}</p>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <span className={`rounded-full px-3 py-1 text-xs font-medium ${status?.className}`}>
                    {status?.text}
                  </span>
                  <Link
                    to={`/listings/${listing.id}/edit`}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    Sửa
                  </Link>
                  <button
                    onClick={() => handleDelete(listing.id)}
                    className="text-sm text-red-600 hover:underline"
                  >
                    Xóa
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
