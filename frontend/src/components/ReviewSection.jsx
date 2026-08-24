import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Star, Pencil, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Avatar from './Avatar';
import { getListingReviews, submitListingReview, deleteListingReview } from '../services/reviewService';

function Stars({ value, size = 13 }) {
  return (
    <span className="flex items-center gap-0.5 text-amber-500">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} size={size} fill={i < value ? 'currentColor' : 'none'} />
      ))}
    </span>
  );
}

function StarPicker({ value, onChange }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          aria-label={`${n} sao`}
          className="text-amber-500 transition-transform hover:scale-110"
        >
          <Star size={24} fill={n <= value ? 'currentColor' : 'none'} />
        </button>
      ))}
    </div>
  );
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('vi-VN');
}

export default function ReviewSection({ targetId, hidden = false }) {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetId]);

  function load() {
    setLoading(true);
    getListingReviews(targetId)
      .then((data) => {
        setSummary(data);
        const mine = data.reviews.find((r) => r.own);
        setEditing(!mine);
        setRating(mine?.rating ?? 5);
        setComment(mine?.comment ?? '');
      })
      .finally(() => setLoading(false));
  }

  function startEdit(mine) {
    setRating(mine.rating);
    setComment(mine.comment ?? '');
    setEditing(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await submitListingReview(targetId, { rating, comment });
      await load();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!confirm('Xóa đánh giá của bạn?')) return;
    await deleteListingReview(targetId);
    load();
  }

  if (loading || !summary) {
    return <div className="h-24 animate-pulse rounded-2xl border border-gray-200 bg-gray-50" />;
  }

  const myReview = summary.reviews.find((r) => r.own);
  const otherReviews = summary.reviews.filter((r) => !r.own);

  return (
    <div>
      <div className="mb-5 flex items-center gap-4">
        <h2 className="text-lg font-semibold text-gray-900">Đánh giá</h2>
        {summary.totalReviews > 0 ? (
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold text-gray-900">{summary.averageRating}</span>
            <Stars value={Math.round(summary.averageRating)} size={16} />
            <span className="text-sm text-gray-400">({summary.totalReviews} đánh giá)</span>
          </div>
        ) : (
          <span className="text-sm text-gray-400">Chưa có đánh giá</span>
        )}
      </div>

      {!hidden && user && (
        <div className="mb-6">
          {!editing && myReview ? (
            <div className="flex items-start gap-3 rounded-2xl border border-rose-100 bg-rose-50/50 p-4">
              <Avatar name={myReview.reviewerName} />
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex items-center gap-2">
                  <p className="font-medium text-gray-900">Đánh giá của bạn</p>
                  <Stars value={myReview.rating} />
                  <span className="text-xs text-gray-400">{formatDate(myReview.createdAt)}</span>
                </div>
                {myReview.comment && <p className="text-sm text-gray-700">{myReview.comment}</p>}
              </div>
              <div className="flex flex-shrink-0 items-center gap-1">
                <button
                  type="button"
                  onClick={() => startEdit(myReview)}
                  aria-label="Sửa đánh giá"
                  className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-white hover:text-rose-600"
                >
                  <Pencil size={15} />
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  aria-label="Xóa đánh giá"
                  className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-white hover:text-red-600"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="space-y-3 rounded-2xl border border-gray-200 p-4"
            >
              <p className="text-sm font-medium text-gray-900">
                {myReview ? 'Sửa đánh giá của bạn' : 'Viết đánh giá'}
              </p>
              <StarPicker value={rating} onChange={setRating} />
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Chia sẻ cảm nhận của bạn..."
                rows={3}
                className="w-full rounded-xl border border-gray-200 p-3 text-sm focus:border-rose-400 focus:outline-none"
              />
              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-full bg-rose-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-rose-700 disabled:opacity-60"
                >
                  {myReview ? 'Cập nhật đánh giá' : 'Gửi đánh giá'}
                </button>
                {myReview && (
                  <button
                    type="button"
                    onClick={() => setEditing(false)}
                    className="text-sm font-medium text-gray-500 hover:underline"
                  >
                    Hủy
                  </button>
                )}
              </div>
            </form>
          )}
        </div>
      )}

      {!hidden && !user && (
        <p className="mb-6 text-sm text-gray-500">
          <Link to="/login" className="font-medium text-rose-600 hover:underline">
            Đăng nhập
          </Link>{' '}
          để viết đánh giá.
        </p>
      )}

      {otherReviews.length > 0 ? (
        <div className="space-y-5">
          {otherReviews.map((r) => (
            <div key={r.id} className="flex items-start gap-3 border-b border-gray-100 pb-5 last:border-0">
              <Avatar name={r.reviewerName} />
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex items-center gap-2">
                  <p className="font-medium text-gray-900">{r.reviewerName}</p>
                  <Stars value={r.rating} />
                  <span className="text-xs text-gray-400">{formatDate(r.createdAt)}</span>
                </div>
                {r.comment && <p className="text-sm text-gray-700">{r.comment}</p>}
              </div>
            </div>
          ))}
        </div>
      ) : (
        summary.totalReviews === 0 && (
          <p className="text-sm text-gray-400">Hãy là người đầu tiên đánh giá.</p>
        )
      )}
    </div>
  );
}
