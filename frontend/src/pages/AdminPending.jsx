import { useEffect, useState } from 'react';
import { approveListing, getPendingListings, rejectListing } from '../services/listingService';

function formatPrice(price) {
  return new Intl.NumberFormat('vi-VN').format(price) + ' đ/tháng';
}

export default function AdminPending() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  function load() {
    setLoading(true);
    getPendingListings()
      .then(setListings)
      .finally(() => setLoading(false));
  }

  async function handleApprove(id) {
    await approveListing(id);
    load();
  }

  async function handleReject(id) {
    const reason = prompt('Lý do từ chối:');
    if (!reason) return;
    await rejectListing(id, reason);
    load();
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <h1 className="mb-6 text-2xl font-bold">Tin đăng chờ duyệt</h1>

      {loading ? (
        <p className="text-gray-500">Đang tải...</p>
      ) : listings.length === 0 ? (
        <p className="text-gray-500">Không có tin nào chờ duyệt.</p>
      ) : (
        <div className="space-y-3">
          {listings.map((listing) => (
            <div key={listing.id} className="rounded-lg border border-gray-200 p-4">
              <div className="mb-2 flex items-start justify-between">
                <div>
                  <p className="font-semibold text-gray-900">{listing.title}</p>
                  <p className="text-sm text-gray-500">
                    {formatPrice(listing.price)} · {listing.district}, {listing.city}
                  </p>
                  <p className="text-sm text-gray-500">Chủ nhà: {listing.landlordName}</p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleApprove(listing.id)}
                    className="rounded-md bg-green-600 px-3 py-1.5 text-sm text-white hover:bg-green-700"
                  >
                    Duyệt
                  </button>
                  <button
                    onClick={() => handleReject(listing.id)}
                    className="rounded-md bg-red-600 px-3 py-1.5 text-sm text-white hover:bg-red-700"
                  >
                    Từ chối
                  </button>
                </div>
              </div>
              <p className="text-sm text-gray-600">{listing.description}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
