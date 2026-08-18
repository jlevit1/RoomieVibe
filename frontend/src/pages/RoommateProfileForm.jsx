import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyProfile, saveMyProfile } from '../services/roommateService';
import ImageUploader from '../components/ImageUploader';
import {
  STATUS_LABELS,
  GENDER_LABELS,
  OCCUPATION_LABELS,
  SLEEP_LABELS,
  CLEANLINESS_LABELS,
} from '../constants/roommate';

const EMPTY_FORM = {
  status: 'LOOKING_FOR_ROOM',
  city: '',
  districts: '',
  budget: '',
  moveInDate: '',
  gender: 'MALE',
  preferredGender: '',
  occupation: 'STUDENT',
  preferredOccupation: '',
  sleepSchedule: 'NORMAL',
  cleanliness: 'MEDIUM',
  smokes: false,
  acceptsSmoking: true,
  hasPet: false,
  acceptsPets: true,
  cooksAtHome: false,
  imageUrls: [],
  bio: '',
  contactPhone: '',
};

export default function RoommateProfileForm() {
  const navigate = useNavigate();
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getMyProfile()
      .then((profile) => {
        setForm({
          ...EMPTY_FORM,
          ...profile,
          districts: (profile.districts || []).join(', '),
          imageUrls: profile.imageUrls || [],
          preferredGender: profile.preferredGender || '',
          preferredOccupation: profile.preferredOccupation || '',
          moveInDate: profile.moveInDate || '',
        });
      })
      .catch(() => {});
  }, []);

  function handleChange(e) {
    const { name, type, checked, value } = e.target;
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const payload = {
        ...form,
        budget: Number(form.budget),
        districts: form.districts
          ? form.districts.split(',').map((d) => d.trim()).filter(Boolean)
          : [],
        preferredGender: form.preferredGender || null,
        preferredOccupation: form.preferredOccupation || null,
        moveInDate: form.moveInDate || null,
      };
      await saveMyProfile(payload);
      navigate('/roommates');
    } catch (err) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra, thử lại nhé');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-8">
      <h1 className="mb-2 text-2xl font-bold text-gray-900">Hồ sơ tìm bạn ở ghép</h1>
      <p className="mb-6 text-sm text-gray-500">
        Điền hồ sơ lối sống để hệ thống tính % tương thích và gợi ý người phù hợp.
      </p>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 px-4 py-2 text-sm text-red-600">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Tình trạng</label>
          <select
            name="status"
            value={form.status}
            onChange={handleChange}
            className="w-full rounded-md border border-gray-300 px-3 py-2"
          >
            {Object.entries(STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Tỉnh/thành phố</label>
            <input
              name="city"
              value={form.city}
              onChange={handleChange}
              required
              className="w-full rounded-md border border-gray-300 px-3 py-2"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Khu vực mong muốn
            </label>
            <input
              name="districts"
              placeholder="VD: Quận 10, Quận 1"
              value={form.districts}
              onChange={handleChange}
              className="w-full rounded-md border border-gray-300 px-3 py-2"
            />
            <p className="mt-1 text-xs text-gray-400">Nhiều quận/huyện cách nhau bằng dấu phẩy</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Ngân sách (đ/người/tháng)
            </label>
            <input
              type="number"
              name="budget"
              value={form.budget}
              onChange={handleChange}
              required
              className="w-full rounded-md border border-gray-300 px-3 py-2"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Dự kiến chuyển vào
            </label>
            <input
              type="date"
              name="moveInDate"
              value={form.moveInDate}
              onChange={handleChange}
              className="w-full rounded-md border border-gray-300 px-3 py-2"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Giới tính</label>
            <select
              name="gender"
              value={form.gender}
              onChange={handleChange}
              className="w-full rounded-md border border-gray-300 px-3 py-2"
            >
              {Object.entries(GENDER_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Giới tính bạn ghép mong muốn
            </label>
            <select
              name="preferredGender"
              value={form.preferredGender}
              onChange={handleChange}
              className="w-full rounded-md border border-gray-300 px-3 py-2"
            >
              <option value="">Không yêu cầu</option>
              {Object.entries(GENDER_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Nghề nghiệp</label>
            <select
              name="occupation"
              value={form.occupation}
              onChange={handleChange}
              className="w-full rounded-md border border-gray-300 px-3 py-2"
            >
              {Object.entries(OCCUPATION_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Nghề nghiệp bạn ghép mong muốn
            </label>
            <select
              name="preferredOccupation"
              value={form.preferredOccupation}
              onChange={handleChange}
              className="w-full rounded-md border border-gray-300 px-3 py-2"
            >
              <option value="">Không yêu cầu</option>
              {Object.entries(OCCUPATION_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Giờ giấc</label>
            <select
              name="sleepSchedule"
              value={form.sleepSchedule}
              onChange={handleChange}
              className="w-full rounded-md border border-gray-300 px-3 py-2"
            >
              {Object.entries(SLEEP_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Mức độ gọn gàng</label>
            <select
              name="cleanliness"
              value={form.cleanliness}
              onChange={handleChange}
              className="w-full rounded-md border border-gray-300 px-3 py-2"
            >
              {Object.entries(CLEANLINESS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 rounded-lg border border-gray-200 p-4 sm:grid-cols-4">
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" name="smokes" checked={form.smokes} onChange={handleChange} />
            Hút thuốc
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              name="acceptsSmoking"
              checked={form.acceptsSmoking}
              onChange={handleChange}
            />
            Chấp nhận hút thuốc
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" name="hasPet" checked={form.hasPet} onChange={handleChange} />
            Nuôi thú cưng
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              name="acceptsPets"
              checked={form.acceptsPets}
              onChange={handleChange}
            />
            Chấp nhận thú cưng
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-700 sm:col-span-2">
            <input
              type="checkbox"
              name="cooksAtHome"
              checked={form.cooksAtHome}
              onChange={handleChange}
            />
            Thường nấu ăn tại nhà
          </label>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            {form.status === 'HAS_ROOM' ? 'Ảnh phòng hiện tại' : 'Ảnh (không bắt buộc)'}
          </label>
          <ImageUploader
            images={form.imageUrls}
            onChange={(imageUrls) => setForm({ ...form, imageUrls })}
          />
          {form.status === 'HAS_ROOM' && (
            <p className="mt-1 text-xs text-gray-400">
              Đăng ảnh phòng để người tìm bạn ghép xem trước không gian sống
            </p>
          )}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Giới thiệu thêm</label>
          <textarea
            name="bio"
            value={form.bio}
            onChange={handleChange}
            rows={3}
            className="w-full rounded-md border border-gray-300 px-3 py-2"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">SĐT liên hệ</label>
          <input
            name="contactPhone"
            value={form.contactPhone}
            onChange={handleChange}
            required
            className="w-full rounded-md border border-gray-300 px-3 py-2"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-rose-600 py-2 text-white hover:bg-rose-700 disabled:opacity-50"
        >
          {loading ? 'Đang lưu...' : 'Lưu hồ sơ'}
        </button>
      </form>
    </div>
  );
}
