import { useEffect, useState } from 'react';
import { Lock, Unlock, Users } from 'lucide-react';
import { getAllUsers, lockUser, unlockUser } from '../../services/adminService';

const ROLE_LABELS = {
  USER: 'Người thuê',
  LANDLORD: 'Chủ nhà',
  ADMIN: 'Admin',
};

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  function load() {
    setLoading(true);
    getAllUsers()
      .then(setUsers)
      .finally(() => setLoading(false));
  }

  async function toggleLock(user) {
    if (user.enabled) {
      await lockUser(user.id);
    } else {
      await unlockUser(user.id);
    }
    load();
  }

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold tracking-tight text-gray-900">Quản lý người dùng</h1>
      <p className="mb-6 text-sm text-gray-500">{users.length} tài khoản trong hệ thống.</p>

      {loading && (
        <div className="space-y-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-14 animate-pulse rounded-2xl border border-gray-200 bg-gray-50" />
          ))}
        </div>
      )}

      {!loading && users.length === 0 && (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-gray-300 py-16 text-center">
          <Users size={28} className="text-gray-300" />
          <p className="text-gray-500">Chưa có người dùng nào.</p>
        </div>
      )}

      {!loading && users.length > 0 && (
        <div className="overflow-hidden overflow-x-auto rounded-2xl border border-gray-200">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3 font-medium">Họ tên</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Vai trò</th>
                <th className="px-4 py-3 font-medium">Trạng thái</th>
                <th className="px-4 py-3 text-right font-medium">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((user) => (
                <tr key={user.id} className="transition-colors hover:bg-gray-50/60">
                  <td className="px-4 py-3 font-medium text-gray-900">{user.fullName}</td>
                  <td className="px-4 py-3 text-gray-600">{user.email}</td>
                  <td className="px-4 py-3 text-gray-600">{ROLE_LABELS[user.role] || user.role}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                        user.enabled ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {user.enabled ? 'Hoạt động' : 'Đã khóa'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {user.role !== 'ADMIN' && (
                      <button
                        type="button"
                        onClick={() => toggleLock(user)}
                        className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
                          user.enabled
                            ? 'bg-red-50 text-red-600 hover:bg-red-100'
                            : 'bg-green-50 text-green-600 hover:bg-green-100'
                        }`}
                      >
                        {user.enabled ? <Lock size={13} /> : <Unlock size={13} />}
                        {user.enabled ? 'Khóa' : 'Mở khóa'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
