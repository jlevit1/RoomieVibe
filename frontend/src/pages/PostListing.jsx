import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createListing, getMyListings, updateListing } from '../services/listingService';
import { AMENITY_LABELS, AMENITY_OPTIONS } from '../constants/amenities';
import ImageUploader from '../components/ImageUploader';

const EMPTY_FORM = {
  title: '',
  description: '',
  price: '',
  area: '',
  city: '',
  district: '',
  address: '',
  contactPhone: '',
  maxOccupants: '',
  amenities: [],
  imageUrls: [],
};

const inputClass =
  'w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm transition-colors focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20';
const labelClass = 'mb-1.5 block text-sm font-medium text-gray-700';

export default function PostListing() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isEdit) return;
    getMyListings().then((listings) => {
      const listing = listings.find((l) => String(l.id) === id);
      if (listing) {
        setForm({ ...EMPTY_FORM, ...listing });
      }
    });
  }, [id, isEdit]);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function toggleAmenity(amenity) {
    setForm((prev) => {
      const has = prev.amenities.includes(amenity);
      return {
        ...prev,
        amenities: has
          ? prev.amenities.filter((a) => a !== amenity)
          : [...prev.amenities, amenity],
      };
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const payload = {
        ...form,
        price: Number(form.price),
        area: form.area ? Number(form.area) : null,
        maxOccupants: form.maxOccupants ? Number(form.maxOccupants) : null,
      };
      if (isEdit) {
        await updateListing(id, payload);
      } else {
        await createListing(payload);
      }
      navigate('/listings/mine');
    } catch (err) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra, thử lại nhé');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="mb-1 text-2xl font-bold tracking-tight text-gray-900">
        {isEdit ? 'Sửa tin đăng' : 'Đăng tin phòng trọ'}
      </h1>
      <p className="mb-6 text-sm text-gray-500">
        Điền đầy đủ thông tin để tin đăng được duyệt nhanh hơn.
      </p>

      {error && (
        <div className="mb-4 rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-600">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-4 rounded-2xl border border-gray-200 p-5">
          <div>
            <label htmlFor="title" className={labelClass}>Tiêu đề</label>
            <input
              id="title"
              name="title"
              value={form.title}
              onChange={handleChange}
              required
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="description" className={labelClass}>Mô tả</label>
            <textarea
              id="description"
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={4}
              className={inputClass}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="price" className={labelClass}>Giá (đ/tháng)</label>
              <input
                id="price"
                type="number"
                name="price"
                value={form.price}
                onChange={handleChange}
                required
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="area" className={labelClass}>Diện tích (m²)</label>
              <input
                id="area"
                type="number"
                name="area"
                value={form.area}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
          </div>
        </div>

        <div className="space-y-4 rounded-2xl border border-gray-200 p-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="city" className={labelClass}>Tỉnh/thành phố</label>
              <input
                id="city"
                name="city"
                value={form.city}
                onChange={handleChange}
                required
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="district" className={labelClass}>Quận/huyện</label>
              <input
                id="district"
                name="district"
                value={form.district}
                onChange={handleChange}
                required
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label htmlFor="address" className={labelClass}>Địa chỉ đầy đủ</label>
            <input
              id="address"
              name="address"
              value={form.address}
              onChange={handleChange}
              required
              className={inputClass}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="contactPhone" className={labelClass}>SĐT liên hệ</label>
              <input
                id="contactPhone"
                name="contactPhone"
                value={form.contactPhone}
                onChange={handleChange}
                required
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="maxOccupants" className={labelClass}>Số người tối đa</label>
              <input
                id="maxOccupants"
                type="number"
                name="maxOccupants"
                value={form.maxOccupants}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
          </div>
        </div>

        <div className="space-y-4 rounded-2xl border border-gray-200 p-5">
          <div>
            <p className={`${labelClass} mb-2`}>Ảnh phòng</p>
            <ImageUploader
              images={form.imageUrls}
              onChange={(imageUrls) => setForm({ ...form, imageUrls })}
            />
          </div>

          <div>
            <p className={`${labelClass} mb-2`}>Tiện ích</p>
            <div className="flex flex-wrap gap-2">
              {AMENITY_OPTIONS.map((amenity) => (
                <button
                  type="button"
                  key={amenity}
                  onClick={() => toggleAmenity(amenity)}
                  className={`rounded-full border px-3.5 py-1.5 text-sm transition-colors ${
                    form.amenities.includes(amenity)
                      ? 'border-rose-600 bg-rose-600 text-white'
                      : 'border-gray-300 text-gray-700 hover:border-rose-300'
                  }`}
                >
                  {AMENITY_LABELS[amenity]}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-rose-600 py-2.5 text-sm font-semibold text-white transition-all hover:bg-rose-700 active:scale-[0.98] disabled:opacity-50"
        >
          {loading ? 'Đang lưu...' : isEdit ? 'Lưu thay đổi' : 'Đăng tin'}
        </button>
      </form>
    </div>
  );
}
