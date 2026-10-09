import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getMyProfile, saveMyProfile } from '../services/roommateService';
import ImageUploader from '../components/ImageUploader';
import CurrencyInput from '../components/CurrencyInput';
import SearchableSelect from '../components/SearchableSelect';
import { PROVINCE_NAMES } from '../data/vnLocations';
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

const STATUS_HINTS = {
  HAS_ROOM: 'Bạn đang thuê phòng và muốn tìm thêm người ở cùng để chia tiền.',
  LOOKING_FOR_ROOM: 'Bạn chưa có phòng, muốn tìm người hợp rồi cùng nhau đi thuê.',
};

const HABITS = [
  { name: 'smokes', label: 'Tôi hút thuốc' },
  { name: 'hasPet', label: 'Tôi nuôi thú cưng' },
  { name: 'cooksAtHome', label: 'Tôi thường nấu ăn ở nhà' },
];

const ACCEPTS = [
  { name: 'acceptsSmoking', label: 'Ở cùng người hút thuốc được' },
  { name: 'acceptsPets', label: 'Ở cùng thú cưng được' },
];

function toOptions(labels, anyLabel) {
  const options = Object.entries(labels).map(([value, label]) => ({ value, label }));
  return anyLabel ? [{ value: '', label: anyLabel }, ...options] : options;
}

function Section({ title, desc, children }) {
  return (
    <section className="surface p-5 sm:p-7">
      <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
      {desc && <p className="mt-0.5 text-sm text-gray-600">{desc}</p>}
      <div className="mt-5 space-y-5">{children}</div>
    </section>
  );
}

function ChoicePills({ legend, name, options, value, onChange }) {
  return (
    <fieldset>
      <legend className="field-label">{legend}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const selected = value === opt.value;
          return (
            <label
              key={opt.value || 'any'}
              className={`cursor-pointer rounded-full border px-3.5 py-1.5 text-sm transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-blue-500/40 ${
                selected
                  ? 'border-gray-900 bg-gray-900 font-medium text-white'
                  : 'border-gray-300 bg-white text-gray-700 hover:border-gray-500'
              }`}
            >
              <input
                type="radio"
                name={name}
                value={opt.value}
                checked={selected}
                onChange={onChange}
                className="sr-only"
              />
              {opt.label}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

function CheckRow({ name, label, checked, onChange }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 py-3 text-sm text-gray-800">
      {label}
      <input type="checkbox" name={name} checked={checked} onChange={onChange} className="h-4 w-4 accent-gray-900" />
    </label>
  );
}

export default function RoommateProfileForm() {
  const navigate = useNavigate();
  const [form, setForm] = useState(EMPTY_FORM);
  const [hasProfile, setHasProfile] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getMyProfile()
      .then((profile) => {
        setHasProfile(true);
        setForm({
          ...EMPTY_FORM,
          ...profile,
          districts: (profile.districts || []).join(', '),
          imageUrls: profile.imageUrls || [],
          preferredGender: profile.preferredGender || '',
          preferredOccupation: profile.preferredOccupation || '',
          moveInDate: profile.moveInDate || '',
          bio: profile.bio || '',
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
          ? form.districts
              .split(',')
              .map((d) => d.trim())
              .filter(Boolean)
          : [],
        preferredGender: form.preferredGender || null,
        preferredOccupation: form.preferredOccupation || null,
        moveInDate: form.moveInDate || null,
      };
      await saveMyProfile(payload);
      navigate('/roommates');
    } catch (err) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra, thử lại nhé');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setLoading(false);
    }
  }

  const hasRoom = form.status === 'HAS_ROOM';
  let submitLabel = hasProfile ? 'Lưu thay đổi' : 'Tạo hồ sơ';
  if (loading) submitLabel = 'Đang lưu...';

  return (
    <div className="bg-gray-50">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-gray-500">
          <Link to="/roommates" className="hover:text-gray-900">
            Ở ghép
          </Link>
          <span aria-hidden="true">/</span>
          <span className="text-gray-900">Hồ sơ của tôi</span>
        </nav>
        <h1 className="page-title mt-3">{hasProfile ? 'Hồ sơ ở ghép của bạn' : 'Tạo hồ sơ ở ghép'}</h1>
        <p className="mt-1 max-w-[60ch] text-gray-600">
          Thông tin lối sống dùng để tính mức độ hợp giữa bạn và từng người. Trả lời thật lòng sẽ được gợi ý chính xác hơn.
        </p>

        {error && <div className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          <Section title="Tình trạng của bạn">
            <fieldset className="grid gap-3 sm:grid-cols-2">
              <legend className="sr-only">Tình trạng</legend>
              {Object.entries(STATUS_LABELS).map(([value, label]) => {
                const selected = form.status === value;
                return (
                  <label
                    key={value}
                    className={`cursor-pointer rounded-xl border p-4 transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-blue-500/40 ${
                      selected ? 'border-gray-900 ring-1 ring-gray-900' : 'border-gray-200 hover:border-gray-400'
                    }`}
                  >
                    <input
                      type="radio"
                      name="status"
                      value={value}
                      checked={selected}
                      onChange={handleChange}
                      className="sr-only"
                    />
                    <span className="block font-semibold text-gray-900">{label}</span>
                    <span className="mt-1 block text-sm text-gray-600">{STATUS_HINTS[value]}</span>
                  </label>
                );
              })}
            </fieldset>
          </Section>

          <Section title="Khu vực và ngân sách">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="city" className="field-label">
                  Tỉnh/thành phố
                </label>
                <SearchableSelect
                  id="city"
                  name="city"
                  value={form.city}
                  onChange={handleChange}
                  options={PROVINCE_NAMES}
                  placeholder="Chọn tỉnh/thành"
                  required
                  className="field-input"
                />
              </div>
              <div>
                <label htmlFor="districts" className="field-label">
                  {hasRoom ? 'Phòng ở quận/huyện' : 'Muốn ở quận/huyện'}
                </label>
                <input
                  id="districts"
                  name="districts"
                  placeholder="VD: Quận 10, Quận 3"
                  value={form.districts}
                  onChange={handleChange}
                  className="field-input"
                />
                <p className="mt-1.5 text-xs text-gray-500">Nhiều nơi thì cách nhau bằng dấu phẩy.</p>
              </div>
              <div>
                <label htmlFor="budget" className="field-label">
                  {hasRoom ? 'Tiền phòng mỗi người' : 'Ngân sách mỗi người'}
                </label>
                <div className="relative">
                  <CurrencyInput
                    id="budget"
                    name="budget"
                    value={form.budget}
                    onChange={handleChange}
                    required
                    placeholder="2.500.000"
                    className="field-input pr-20"
                  />
                  <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                    đ/tháng
                  </span>
                </div>
              </div>
              <div>
                <label htmlFor="moveInDate" className="field-label">
                  Dự kiến chuyển vào
                </label>
                <input
                  id="moveInDate"
                  type="date"
                  name="moveInDate"
                  value={form.moveInDate}
                  onChange={handleChange}
                  className="field-input"
                />
              </div>
            </div>
          </Section>

          <Section title="Về bạn">
            <ChoicePills
              legend="Giới tính"
              name="gender"
              options={toOptions(GENDER_LABELS)}
              value={form.gender}
              onChange={handleChange}
            />
            <ChoicePills
              legend="Bạn đang"
              name="occupation"
              options={toOptions(OCCUPATION_LABELS)}
              value={form.occupation}
              onChange={handleChange}
            />
            <div>
              <label htmlFor="bio" className="field-label">
                Giới thiệu ngắn
              </label>
              <textarea
                id="bio"
                name="bio"
                value={form.bio}
                onChange={handleChange}
                rows={4}
                placeholder="VD: Sinh viên năm 3, hay học khuya nhưng giữ yên lặng, cuối tuần thường về quê."
                className="field-input resize-y"
              />
            </div>
          </Section>

          <Section title="Lối sống" desc="Phần này ảnh hưởng nhiều nhất tới mức độ hợp.">
            <ChoicePills
              legend="Giờ giấc"
              name="sleepSchedule"
              options={toOptions(SLEEP_LABELS)}
              value={form.sleepSchedule}
              onChange={handleChange}
            />
            <ChoicePills
              legend="Mức độ gọn gàng"
              name="cleanliness"
              options={toOptions(CLEANLINESS_LABELS)}
              value={form.cleanliness}
              onChange={handleChange}
            />
            <div className="grid gap-x-8 sm:grid-cols-2">
              <fieldset>
                <legend className="field-label">Thói quen của bạn</legend>
                <div className="divide-y divide-gray-100 border-y border-gray-100">
                  {HABITS.map((h) => (
                    <CheckRow key={h.name} name={h.name} label={h.label} checked={form[h.name]} onChange={handleChange} />
                  ))}
                </div>
              </fieldset>
              <fieldset className="mt-5 sm:mt-0">
                <legend className="field-label">Bạn chấp nhận</legend>
                <div className="divide-y divide-gray-100 border-y border-gray-100">
                  {ACCEPTS.map((h) => (
                    <CheckRow key={h.name} name={h.name} label={h.label} checked={form[h.name]} onChange={handleChange} />
                  ))}
                </div>
              </fieldset>
            </div>
          </Section>

          <Section title="Bạn muốn ở cùng ai">
            <ChoicePills
              legend="Giới tính bạn ở ghép"
              name="preferredGender"
              options={toOptions(GENDER_LABELS, 'Không yêu cầu')}
              value={form.preferredGender}
              onChange={handleChange}
            />
            <ChoicePills
              legend="Bạn ở ghép đang"
              name="preferredOccupation"
              options={toOptions(OCCUPATION_LABELS, 'Không yêu cầu')}
              value={form.preferredOccupation}
              onChange={handleChange}
            />
          </Section>

          <Section
            title={hasRoom ? 'Ảnh phòng hiện tại' : 'Ảnh của bạn'}
            desc={
              hasRoom
                ? 'Ảnh phòng giúp người khác hình dung không gian trước khi nhắn tin.'
                : 'Không bắt buộc. Ảnh góc học tập, góc phòng cũ giúp hồ sơ đáng tin hơn.'
            }
          >
            <ImageUploader
              images={form.imageUrls}
              onChange={(imageUrls) => setForm({ ...form, imageUrls })}
              maxImages={6}
            />
          </Section>

          <Section title="Liên hệ">
            <div className="sm:max-w-xs">
              <label htmlFor="contactPhone" className="field-label">
                Số điện thoại
              </label>
              <input
                id="contactPhone"
                name="contactPhone"
                type="tel"
                value={form.contactPhone}
                onChange={handleChange}
                required
                placeholder="0912 345 678"
                className="field-input"
              />
            </div>
          </Section>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Link to="/roommates" className="btn-secondary">
              Hủy
            </Link>
            <button type="submit" disabled={loading} className="btn-primary sm:min-w-40">
              {submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
