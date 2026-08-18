import { useEffect, useState } from 'react';
import { Lock, Unlock } from 'lucide-react';
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
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Quản lý người dùng</h1>

      {loading && <p className="text-gray-500">Đang tải...</p>}

      {!loading && (
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">Họ tên</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Vai trò</th>
                <th className="px-4 py-3">Trạng thái</th>
                <th className="px-4 py-3 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((user) => (
                <tr key={user.id}>
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
                        className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium ${
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
