import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { browseProfiles } from '../services/roommateService';
import RoommateCard from '../components/RoommateCard';

export default function RoommateBrowse() {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    browseProfiles()
      .then(setProfiles)
      .catch((err) => {
        setError(err.response?.data?.message || 'Không tải được danh sách');
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tìm bạn ở ghép</h1>
          <p className="text-sm text-gray-500">Sắp xếp theo % tương thích với hồ sơ của bạn</p>
        </div>
        <Link
          to="/roommates/profile"
          className="rounded-md bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700"
        >
          Sửa hồ sơ của tôi
        </Link>
      </div>

      {error && (
        <div className="mb-4 rounded-md bg-amber-50 px-4 py-3 text-sm text-amber-700">
          {error}{' '}
          <Link to="/roommates/profile" className="font-medium underline">
            Tạo hồ sơ ngay
          </Link>
        </div>
      )}

      {loading && <p className="text-gray-500">Đang tải...</p>}

      {!loading && !error && profiles.length === 0 && (
        <p className="text-gray-500">Chưa có hồ sơ nào phù hợp (từ 60% tương thích trở lên).</p>
      )}

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {profiles.map((p) => (
          <RoommateCard key={p.id} profile={p} />
        ))}
      </div>
    </div>
  );
}
