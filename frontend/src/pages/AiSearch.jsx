import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUp, MapPin } from 'lucide-react';
import { aiSearch } from '../services/aiSearchService';
import { useFavorites } from '../hooks/useFavorites';
import ListingCard from '../components/ListingCard';
import ListingsMapPreview from '../components/ListingsMapPreview';

const EXAMPLES = [
  'Tìm phòng gần Lăng Bác dưới 5 triệu',
  'Phòng trong bán kính 2km quanh Đại học Bách khoa Hà Nội',
  'Phòng dưới 3 triệu ở Cầu Giấy, Hà Nội',
  'Phòng có máy lạnh, chỗ để xe ở Đà Nẵng khoảng 2-4 triệu',
];

const UNDERSTANDS = [
  { term: 'Khu vực', detail: 'Tỉnh/thành, quận/huyện, phường/xã. Viết tắt như "Q.10", "HCM" cũng được.' },
  { term: 'Địa điểm gần đó', detail: 'Trường học, chợ, công ty, địa danh. Trợ lý tìm trong bán kính quanh điểm đó.' },
  { term: 'Giá và diện tích', detail: '"dưới 3 triệu", "khoảng 2-4tr", "rộng hơn 25m²".' },
  { term: 'Tiện ích', detail: 'Máy lạnh, máy giặt, chỗ để xe, cho nuôi thú cưng, giờ giấc tự do...' },
];

function formatKm(km) {
  return `${km.toLocaleString('vi-VN', { maximumFractionDigits: 1 })} km`;
}

export default function AiSearch() {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [reply, setReply] = useState('');
  const [listings, setListings] = useState([]);
  const [landmark, setLandmark] = useState(null);
  const [lastQuery, setLastQuery] = useState('');
  const favorites = useFavorites('listing');
  const searched = Boolean(lastQuery);

  async function runSearch(query) {
    const trimmed = query.trim();
    if (!trimmed || loading) return;

    setLoading(true);
    setError('');
    try {
      const res = await aiSearch(trimmed);
      setReply(res.reply);
      setListings(res.listings || []);
      setLandmark(res.landmark || null);
      setLastQuery(trimmed);
    } catch (err) {
      setError(err.response?.data?.message || 'Trợ lý đang bận, bạn thử lại sau ít phút nhé.');
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    runSearch(message);
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      runSearch(message);
    }
  }

  function pickExample(example) {
    setMessage(example);
    runSearch(example);
  }

  const composer = (
    <form onSubmit={handleSubmit} className="surface p-2 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20">
      <label htmlFor="ai-query" className="sr-only">
        Mô tả phòng bạn cần
      </label>
      <textarea
        id="ai-query"
        rows={searched ? 1 : 3}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="VD: Phòng gần Đại học Kinh tế Quốc dân, dưới 4 triệu, có máy giặt"
        maxLength={500}
        className="block w-full resize-none bg-transparent px-3 py-2.5 text-base text-gray-900 placeholder:text-gray-500 focus:outline-none"
      />
      <div className="flex items-center justify-end gap-3 px-3 pb-1 sm:justify-between">
        <span className="hidden text-xs text-gray-500 sm:inline">Enter để tìm, Shift + Enter để xuống dòng</span>
        <button type="submit" disabled={loading || !message.trim()} className="btn-primary whitespace-nowrap">
          {loading ? 'Đang tìm...' : 'Tìm phòng'} <ArrowUp size={16} />
        </button>
      </div>
    </form>
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
      {!searched ? (
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-14">
          <div className="lg:col-span-7">
            <h1 className="text-balance text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">Mô tả phòng bạn cần, Trợ lý tìm giúp bạn</h1>
            <p className="mt-3 max-w-[60ch] text-gray-600">
              Viết như khi nhắn cho người quen. Trợ lý đọc yêu cầu, tự đặt bộ lọc và trả về các phòng đang cho thuê phù hợp.
            </p>

            <div className="mt-7">{composer}</div>
            {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

            <div className="mt-8">
              <h2 className="text-sm font-semibold text-gray-900">Thử một câu hỏi</h2>
              <ul className="mt-2 divide-y divide-gray-200 border-y border-gray-200">
                {EXAMPLES.map((ex) => (
                  <li key={ex}>
                    <button
                      type="button"
                      onClick={() => pickExample(ex)}
                      disabled={loading}
                      className="flex w-full items-center justify-between gap-4 py-3 text-left text-sm text-gray-800 transition-colors hover:text-blue-700 disabled:opacity-50"
                    >
                      {ex}
                      <ArrowUp size={15} className="flex-shrink-0 rotate-45 text-gray-400" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <aside className="lg:col-span-5">
            <div className="rounded-2xl bg-gray-50 p-6 sm:p-7">
              <h2 className="font-semibold text-gray-900">Trợ lý hiểu được</h2>
              <dl className="mt-4 space-y-4">
                {UNDERSTANDS.map((item) => (
                  <div key={item.term}>
                    <dt className="text-sm font-semibold text-gray-900">{item.term}</dt>
                    <dd className="mt-0.5 text-sm text-gray-600">{item.detail}</dd>
                  </div>
                ))}
              </dl>
              <p className="mt-6 border-t border-gray-200 pt-4 text-sm text-gray-600">
                Muốn tự chọn từng tiêu chí?{' '}
                <Link to="/search" className="link-accent">
                  Dùng bộ lọc thường
                </Link>
              </p>
            </div>
          </aside>
        </div>
      ) : (
        <>
          <div className="max-w-3xl">
            {composer}
            {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
          </div>

          <section className="mt-8" aria-live="polite">
            {loading ? (
              <>
                <p className="text-sm text-gray-600">Trợ lý đang đọc yêu cầu của bạn...</p>
                <div className="mt-5 grid grid-cols-1 gap-x-5 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
                  {[0, 1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse">
                      <div className="aspect-[4/3] rounded-2xl bg-gray-100" />
                      <div className="mt-3 h-4 w-2/3 rounded bg-gray-100" />
                      <div className="mt-2 h-3 w-1/2 rounded bg-gray-100" />
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <>
                <div className="max-w-3xl border-l-2 border-blue-700 pl-4">
                  <p className="text-xs font-semibold text-gray-500">Trợ lý trả lời</p>
                  <p className="mt-1 text-gray-900">{reply || `Kết quả cho “${lastQuery}”`}</p>
                  {landmark && (
                    <p className="mt-2 flex items-start gap-1.5 text-sm text-gray-600">
                      <MapPin size={15} className="mt-0.5 flex-shrink-0 text-rose-600" />
                      <span>
                        Trong bán kính <span className="font-semibold text-gray-900">{formatKm(landmark.radiusKm)}</span> quanh{' '}
                        <span className="font-semibold text-gray-900">{landmark.name}</span>
                        {landmark.address && <span className="text-gray-500">, {landmark.address}</span>}
                      </span>
                    </p>
                  )}
                </div>

                <div className="mt-6 flex items-baseline justify-between gap-3">
                  <h1 className="text-xl font-bold tracking-tight text-gray-900">{listings.length} phòng phù hợp</h1>
                  <Link to="/search" className="text-sm link-accent">
                    Lọc thủ công
                  </Link>
                </div>

                {landmark && (
                  <ListingsMapPreview
                    listings={listings}
                    focus={landmark}
                    priceMarkers
                    className="mt-4 h-80 w-full"
                  />
                )}

                {listings.length > 0 ? (
                  <div className="mt-6 grid grid-cols-1 gap-x-5 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
                    {listings.map((listing) => (
                      <ListingCard
                        key={listing.id}
                        listing={listing}
                        favorited={favorites.isFavorited(listing.id)}
                        onToggleFavorite={() => favorites.toggle(listing.id)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="mt-6 rounded-2xl border border-dashed border-gray-300 px-6 py-12 text-center">
                    <p className="font-semibold text-gray-900">Chưa có phòng nào khớp yêu cầu này</p>
                    <p className="mt-1 text-sm text-gray-600">Thử nới khoảng giá, bớt tiện ích hoặc mở rộng khu vực.</p>
                  </div>
                )}
              </>
            )}
          </section>
        </>
      )}
    </div>
  );
}
