import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, PlusCircle } from 'lucide-react';
import { deleteListing, getMyListings } from '../services/listingService';

const STATUS_LABELS = {
  CHO_DUYET: { text: 'Chờ duyệt', className: 'bg-amber-100 text-amber-700' },
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
    <div className="mx-auto max-w-4xl px-6 py-10">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Tin đăng của tôi</h1>
          <p className="text-sm text-gray-500">Quản lý các tin phòng trọ bạn đã đăng.</p>
        </div>
        <Link
          to="/listings/new"
          className="flex items-center gap-1.5 rounded-full bg-rose-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-rose-700"
        >
          <PlusCircle size={16} /> Đăng tin mới
        </Link>
      </div>

      {loading && (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-2xl border border-gray-200 bg-gray-50" />
          ))}
        </div>
      )}

      {!loading && listings.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-gray-300 py-16 text-center">
          <FileText size={28} className="text-gray-300" />
          <p className="text-gray-500">Bạn chưa đăng tin nào.</p>
          <Link
            to="/listings/new"
            className="rounded-full bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700"
          >
            Đăng tin đầu tiên
          </Link>
        </div>
      )}

      {!loading && listings.length > 0 && (
        <div className="space-y-3">
          {listings.map((listing) => {
            const status = STATUS_LABELS[listing.status];
            return (
              <div
                key={listing.id}
                className="flex flex-col gap-3 rounded-2xl border border-gray-200 p-4 transition-colors hover:border-gray-300 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="truncate font-semibold text-gray-900">{listing.title}</p>
                  <p className="text-sm text-gray-500">
                    {formatPrice(listing.price)} · {listing.district}, {listing.city}
                  </p>
                  {listing.status === 'TU_CHOI' && listing.rejectReason && (
                    <p className="mt-1 text-sm text-red-600">Lý do: {listing.rejectReason}</p>
                  )}
                </div>

                <div className="flex flex-shrink-0 items-center gap-3">
                  <span className={`rounded-full px-3 py-1 text-xs font-medium ${status?.className}`}>
                    {status?.text}
                  </span>
                  <Link
                    to={`/listings/${listing.id}/edit`}
                    className="text-sm font-medium text-rose-600 hover:underline"
                  >
                    Sửa
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleDelete(listing.id)}
                    className="text-sm font-medium text-red-600 hover:underline"
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
