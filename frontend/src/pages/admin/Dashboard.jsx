import { useEffect, useState } from 'react';
import { Users, Home, Clock, CheckCircle2, XCircle, Building2 } from 'lucide-react';
import { getStats } from '../../services/adminService';

const CARD_CONFIG = [
  { key: 'totalUsers', label: 'Tổng người dùng', Icon: Users, color: 'text-blue-600 bg-blue-50' },
  { key: 'totalLandlords', label: 'Chủ nhà', Icon: Building2, color: 'text-purple-600 bg-purple-50' },
  { key: 'totalListings', label: 'Tổng tin đăng', Icon: Home, color: 'text-rose-600 bg-rose-50' },
  { key: 'pendingListings', label: 'Chờ duyệt', Icon: Clock, color: 'text-amber-600 bg-amber-50' },
  { key: 'approvedListings', label: 'Đã duyệt', Icon: CheckCircle2, color: 'text-green-600 bg-green-50' },
  { key: 'rejectedListings', label: 'Bị từ chối', Icon: XCircle, color: 'text-red-600 bg-red-50' },
];

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getStats()
      .then(setStats)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Dashboard</h1>

      {loading && <p className="text-gray-500">Đang tải...</p>}

      {!loading && stats && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CARD_CONFIG.map(({ key, label, Icon, color }) => (
            <div key={key} className="rounded-lg border border-gray-200 p-4">
              <div className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg ${color}`}>
                <Icon size={20} />
              </div>
              <p className="text-2xl font-bold text-gray-900">{stats[key]}</p>
              <p className="text-sm text-gray-500">{label}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
