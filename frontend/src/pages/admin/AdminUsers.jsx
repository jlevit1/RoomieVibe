import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { getAllUsers, lockUser, unlockUser } from '../../services/adminService';
import ConfirmModal from '../../components/ConfirmModal';
import Avatar from '../../components/Avatar';

const ROLE_LABELS = {
  USER: 'Người thuê',
  LANDLORD: 'Chủ nhà',
  ADMIN: 'Quản trị',
};

const TABS = [
  { value: 'ALL', label: 'Tất cả', match: () => true },
  { value: 'USER', label: 'Người thuê', match: (u) => u.role === 'USER' },
  { value: 'LANDLORD', label: 'Chủ nhà', match: (u) => u.role === 'LANDLORD' },
  { value: 'LOCKED', label: 'Đã khóa', match: (u) => !u.enabled },
];

function formatDate(iso) {
  return iso ? new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '';
}

function normalize(text) {
  return (text || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase();
}

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('ALL');
  const [query, setQuery] = useState('');
  const [locking, setLocking] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    getAllUsers()
      .then(setUsers)
      .finally(() => setLoading(false));
  }, []);

  async function applyLock(user) {
    setError('');
    try {
      const updated = user.enabled ? await lockUser(user.id) : await unlockUser(user.id);
      setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, ...updated } : u)));
    } catch (err) {
      setError(err.response?.data?.message || 'Không cập nhật được tài khoản, thử lại sau.');
    }
  }

  function confirmLock() {
    const target = locking;
    setLocking(null);
    applyLock(target);
  }

  const activeTab = TABS.find((t) => t.value === tab);
  const q = normalize(query.trim());
  const visible = users.filter(
    (u) => activeTab.match(u) && (!q || normalize(u.fullName).includes(q) || normalize(u.email).includes(q) || (u.phone || '').includes(q))
  );

  return (
    <div>
      <h1 className="page-title">Người dùng</h1>
      <p className="mt-1 text-gray-600">{loading ? 'Đang tải...' : `${users.length} tài khoản, mới nhất ở trên cùng.`}</p>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="scrollbar-hide flex gap-6 overflow-x-auto border-b border-gray-200 sm:border-0" role="tablist">
          {TABS.map((t) => {
            const count = users.filter(t.match).length;
            const active = t.value === tab;
            return (
              <button
                key={t.value}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setTab(t.value)}
                className={`-mb-px flex-shrink-0 whitespace-nowrap border-b-2 pb-2.5 text-sm font-medium transition-colors ${
                  active ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-800'
                }`}
              >
                {t.label} <span className="text-gray-400">{count}</span>
              </button>
            );
          })}
        </div>
        <div className="relative sm:w-72">
          <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm theo tên, email, SĐT"
            aria-label="Tìm người dùng"
            className="field-input pl-10"
          />
        </div>
      </div>

      {error && <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      <div className="surface mt-4 overflow-hidden">
        {loading ? (
          <div className="divide-y divide-gray-100">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="flex animate-pulse items-center gap-3 px-5 py-4">
                <div className="h-9 w-9 rounded-full bg-gray-100" />
                <div className="h-3.5 w-1/3 rounded bg-gray-100" />
              </div>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[44rem] text-left text-sm">
              <thead className="border-b border-gray-200 text-gray-500">
                <tr>
                  <th scope="col" className="px-5 py-3 font-medium">
                    Tài khoản
                  </th>
                  <th scope="col" className="px-5 py-3 font-medium">
                    Vai trò
                  </th>
                  <th scope="col" className="px-5 py-3 font-medium">
                    Ngày tham gia
                  </th>
                  <th scope="col" className="px-5 py-3 font-medium">
                    Trạng thái
                  </th>
                  <th scope="col" className="px-5 py-3">
                    <span className="sr-only">Thao tác</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {visible.map((user) => (
                  <tr key={user.id} className="transition-colors hover:bg-gray-50">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={user.fullName} />
                        <div className="min-w-0">
                          <p className="truncate font-medium text-gray-900">{user.fullName}</p>
                          <p className="truncate text-gray-500">
                            {user.email}
                            {user.phone ? ` · ${user.phone}` : ''}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-gray-700">{ROLE_LABELS[user.role] || user.role}</td>
                    <td className="px-5 py-3 tabular-nums text-gray-700">{formatDate(user.createdAt)}</td>
                    <td className="px-5 py-3">
                      <span className="flex items-center gap-1.5 text-gray-700">
                        <span className={`h-2 w-2 rounded-full ${user.enabled ? 'bg-emerald-500' : 'bg-red-500'}`} />
                        {user.enabled ? 'Hoạt động' : 'Đã khóa'}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      {user.role !== 'ADMIN' &&
                        (user.enabled ? (
                          <button type="button" onClick={() => setLocking(user)} className="btn-secondary px-3 py-1.5">
                            Khóa
                          </button>
                        ) : (
                          <button type="button" onClick={() => applyLock(user)} className="btn-secondary px-3 py-1.5">
                            Mở khóa
                          </button>
                        ))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {visible.length === 0 && (
              <p className="px-5 py-12 text-center text-sm text-gray-500">Không có tài khoản nào khớp.</p>
            )}
          </div>
        )}
      </div>

      <ConfirmModal
        open={Boolean(locking)}
        title="Khóa tài khoản này?"
        message={
          locking ? `${locking.fullName} sẽ không dùng được tài khoản cho tới khi bạn mở khóa.` : ''
        }
        confirmLabel="Khóa tài khoản"
        danger
        onConfirm={confirmLock}
        onCancel={() => setLocking(null)}
      />
    </div>
  );
}
