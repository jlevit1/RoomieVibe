import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, Zap } from 'lucide-react';
import { deleteListing, getMyListings, markListingAvailable } from '../services/listingService';
import BoostListingModal from '../components/BoostListingModal';
import MarkRentedModal from '../components/MarkRentedModal';
import ConfirmModal from '../components/ConfirmModal';
import { useHistoryState } from '../hooks/useHistoryState';

const STATUS_META = {
  HIEN_THI: { text: 'Đang hiển thị', className: 'bg-emerald-50 text-emerald-800' },
  CHO_DUYET: { text: 'Chờ duyệt', className: 'bg-amber-50 text-amber-800' },
  DA_CHO_THUE: { text: 'Đã cho thuê', className: 'bg-gray-100 text-gray-700' },
  TU_CHOI: { text: 'Bị từ chối', className: 'bg-red-50 text-red-700' },
};

const TABS = [{ value: 'ALL', label: 'Tất cả' }, ...Object.entries(STATUS_META).map(([value, meta]) => ({ value, label: meta.text }))];

const SMALL_SECONDARY = 'btn-secondary px-3 py-1.5';

function formatPrice(price) {
  return new Intl.NumberFormat('vi-VN').format(price);
}

function formatDateTime(iso) {
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(d.getHours())}:${pad(d.getMinutes())} ngày ${pad(d.getDate())}/${pad(d.getMonth() + 1)}`;
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export default function MyListings() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useHistoryState('my-listings-tab', 'ALL');
  const [boosting, setBoosting] = useState(null);
  const [markingRented, setMarkingRented] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [actionError, setActionError] = useState('');

  useEffect(() => {
    load();
  }, []);

  function load() {
    setLoading(true);
    getMyListings()
      .then(setListings)
      .finally(() => setLoading(false));
  }

  function replaceListing(updated) {
    setListings((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
  }

  async function confirmDelete() {
    const target = deleting;
    setDeleting(null);
    setActionError('');
    try {
      await deleteListing(target.id);
      setListings((prev) => prev.filter((l) => l.id !== target.id));
    } catch (err) {
      setActionError(err.response?.data?.message || 'Không xóa được tin đăng, thử lại sau.');
    }
  }

  async function handleReopen(id) {
    setActionError('');
    try {
      replaceListing(await markListingAvailable(id));
    } catch (err) {
      setActionError(err.response?.data?.message || 'Không mở lại được tin đăng, thử lại sau.');
    }
  }

  const counts = listings.reduce((acc, l) => ({ ...acc, [l.status]: (acc[l.status] || 0) + 1 }), {});
  const visible = tab === 'ALL' ? listings : listings.filter((l) => l.status === tab);
  const totalViews = listings.reduce((sum, l) => sum + (l.viewCount || 0), 0);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="page-title">Tin đăng của tôi</h1>
          {!loading && listings.length > 0 && (
            <p className="mt-1 text-gray-600">
              {listings.length} tin, {counts.HIEN_THI || 0} đang hiển thị, tổng {totalViews.toLocaleString('vi-VN')} lượt xem
            </p>
          )}
        </div>
        <Link to="/listings/new" className="btn-primary">
          Đăng tin mới
        </Link>
      </div>

      {!loading && listings.length > 0 && (
        <div className="scrollbar-hide mt-6 flex gap-6 overflow-x-auto border-b border-gray-200" role="tablist">
          {TABS.map((t) => {
            const count = t.value === 'ALL' ? listings.length : counts[t.value] || 0;
            const active = tab === t.value;
            return (
              <button
                key={t.value}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setTab(t.value)}
                className={`-mb-px flex-shrink-0 whitespace-nowrap border-b-2 pb-3 text-sm font-medium transition-colors ${
                  active ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-800'
                }`}
              >
                {t.label} <span className={active ? 'text-gray-500' : 'text-gray-400'}>{count}</span>
              </button>
            );
          })}
        </div>
      )}

      {actionError && <p className="mt-4 rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-700">{actionError}</p>}

      {loading && (
        <div className="mt-6 divide-y divide-gray-100">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex animate-pulse gap-4 py-4">
              <div className="h-24 w-32 rounded-xl bg-gray-100" />
              <div className="flex-1 space-y-2 pt-1">
                <div className="h-4 w-1/2 rounded bg-gray-100" />
                <div className="h-3 w-1/3 rounded bg-gray-100" />
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && listings.length === 0 && (
        <div className="mt-8 rounded-2xl border border-dashed border-gray-300 px-6 py-16 text-center">
          <p className="font-semibold text-gray-900">Bạn chưa đăng tin nào</p>
          <p className="mx-auto mt-1 max-w-md text-sm text-gray-600">
            Tin đăng được duyệt trong ngày. Có ảnh thật và địa chỉ rõ ràng giúp tin được nhiều người xem hơn.
          </p>
          <Link to="/listings/new" className="btn-primary mt-5">
            Đăng tin đầu tiên
          </Link>
        </div>
      )}

      {!loading && listings.length > 0 && visible.length === 0 && (
        <p className="py-12 text-center text-sm text-gray-600">Không có tin nào ở mục này.</p>
      )}

      {!loading && visible.length > 0 && (
        <ul className="divide-y divide-gray-200">
          {visible.map((listing) => {
            const status = STATUS_META[listing.status];
            const cover = listing.imageUrls?.[0];
            return (
              <li key={listing.id} className="py-5">
                <div className="flex gap-4">
                  <Link
                    to={`/listings/${listing.id}`}
                    className="block h-20 w-24 flex-shrink-0 overflow-hidden rounded-xl bg-gray-100 sm:h-28 sm:w-40"
                  >
                    {cover && <img src={cover} alt="" className="h-full w-full object-cover" loading="lazy" />}
                  </Link>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${status?.className}`}>
                        {status?.text}
                      </span>
                      {listing.promoted && listing.status === 'HIEN_THI' && (
                        <span className="flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
                          <Zap size={12} fill="currentColor" /> Đẩy tin đến {formatDateTime(listing.promotedUntil)}
                        </span>
                      )}
                    </div>
                    <Link
                      to={`/listings/${listing.id}`}
                      className="mt-1.5 line-clamp-2 font-semibold text-gray-900 transition-colors hover:text-blue-700 sm:line-clamp-1"
                    >
                      {listing.title}
                    </Link>
                    <p className="mt-0.5 text-sm text-gray-600">
                      <span className="font-semibold text-orange-600">{formatPrice(listing.price)}đ</span>/tháng ·{' '}
                      {listing.district}, {listing.city}
                    </p>
                    <p className="mt-1 flex flex-wrap items-center gap-x-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Eye size={13} /> {(listing.viewCount || 0).toLocaleString('vi-VN')} lượt xem
                      </span>
                      {listing.createdAt && <span>Đăng ngày {formatDate(listing.createdAt)}</span>}
                      {listing.promoted && listing.status !== 'HIEN_THI' && (
                        <span>Gói đẩy tin còn hạn đến {formatDateTime(listing.promotedUntil)} (tin đang ẩn)</span>
                      )}
                    </p>
                    {listing.status === 'TU_CHOI' && listing.rejectReason && (
                      <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                        Lý do từ chối: {listing.rejectReason}. Sửa tin để gửi duyệt lại.
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2 sm:ml-44">
                  {listing.status === 'HIEN_THI' && (
                    <>
                      <button type="button" onClick={() => setBoosting(listing)} className={SMALL_SECONDARY}>
                        <Zap size={14} className="text-amber-600" /> Đẩy tin
                      </button>
                      <button type="button" onClick={() => setMarkingRented(listing)} className={SMALL_SECONDARY}>
                        Đánh dấu đã cho thuê
                      </button>
                    </>
                  )}
                  {listing.status === 'DA_CHO_THUE' && (
                    <button type="button" onClick={() => handleReopen(listing.id)} className={SMALL_SECONDARY}>
                      Mở cho thuê lại
                    </button>
                  )}
                  <Link to={`/listings/${listing.id}/edit`} className={SMALL_SECONDARY}>
                    Sửa tin
                  </Link>
                  <button
                    type="button"
                    onClick={() => setDeleting(listing)}
                    className="ml-auto rounded-lg px-2 py-1.5 text-sm font-semibold text-red-700 transition-colors hover:bg-red-50"
                  >
                    Xóa
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {boosting && (
        <BoostListingModal
          listing={boosting}
          onClose={() => setBoosting(null)}
          onBoosted={(updated) => {
            replaceListing(updated);
            setBoosting(null);
          }}
        />
      )}
      {markingRented && (
        <MarkRentedModal
          listing={markingRented}
          onClose={() => setMarkingRented(null)}
          onDone={(updated) => {
            replaceListing(updated);
            setMarkingRented(null);
          }}
        />
      )}
      <ConfirmModal
        open={Boolean(deleting)}
        title="Xóa tin đăng này?"
        message={deleting ? `"${deleting.title}" sẽ bị xóa và không khôi phục được.` : ''}
        confirmLabel="Xóa tin"
        danger
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}
