import { useEffect, useState } from 'react';
import { searchListings } from '../services/listingService';
import ListingCard from '../components/ListingCard';

export default function Home() {
  const [filters, setFilters] = useState({
    city: '',
    district: '',
    minPrice: '',
    maxPrice: '',
    maxOccupants: '',
  });
  const [page, setPage] = useState(0);
  const [data, setData] = useState({ content: [], totalPages: 0 });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadListings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  async function loadListings() {
    setLoading(true);
    try {
      const params = { page, size: 12 };
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== '') params[key] = value;
      });
      const result = await searchListings(params);
      setData(result);
    } finally {
      setLoading(false);
    }
  }

  function handleFilterChange(e) {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  }

  function handleSearch(e) {
    e.preventDefault();
    setPage(0);
    loadListings();
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <h1 className="mb-6 text-2xl font-bold">Tìm phòng trọ</h1>

      <form
        onSubmit={handleSearch}
        className="mb-8 grid grid-cols-2 gap-3 rounded-lg border border-gray-200 p-4 md:grid-cols-5"
      >
        <input
          name="city"
          placeholder="Tỉnh/thành phố"
          value={filters.city}
          onChange={handleFilterChange}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
        <input
          name="district"
          placeholder="Quận/huyện"
          value={filters.district}
          onChange={handleFilterChange}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
        <input
          name="minPrice"
          type="number"
          placeholder="Giá từ"
          value={filters.minPrice}
          onChange={handleFilterChange}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
        <input
          name="maxPrice"
          type="number"
          placeholder="Giá đến"
          value={filters.maxPrice}
          onChange={handleFilterChange}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
        <button
          type="submit"
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Tìm kiếm
        </button>
      </form>

      {loading ? (
        <p className="text-gray-500">Đang tải...</p>
      ) : data.content.length === 0 ? (
        <p className="text-gray-500">Không tìm thấy tin đăng nào phù hợp.</p>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {data.content.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>

          {data.totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-2">
              <button
                disabled={page === 0}
                onClick={() => setPage((p) => p - 1)}
                className="rounded-md border border-gray-300 px-3 py-1.5 text-sm disabled:opacity-40"
              >
                Trước
              </button>
              <span className="text-sm text-gray-600">
                Trang {page + 1} / {data.totalPages}
              </span>
              <button
                disabled={page + 1 >= data.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-md border border-gray-300 px-3 py-1.5 text-sm disabled:opacity-40"
              >
                Sau
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
