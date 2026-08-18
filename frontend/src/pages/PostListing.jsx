import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createListing, getMyListings, updateListing } from '../services/listingService';
import { AMENITY_LABELS, AMENITY_OPTIONS } from '../constants/amenities';

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
};

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
        imageUrls: [],
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
    <div className="mx-auto max-w-2xl px-6 py-8">
      <h1 className="mb-6 text-2xl font-bold">{isEdit ? 'Sửa tin đăng' : 'Đăng tin phòng trọ'}</h1>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 px-4 py-2 text-sm text-red-600">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Tiêu đề</label>
          <input
            name="title"
            value={form.title}
            onChange={handleChange}
            required
            className="w-full rounded-md border border-gray-300 px-3 py-2"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Mô tả</label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            rows={4}
            className="w-full rounded-md border border-gray-300 px-3 py-2"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Giá (đ/tháng)</label>
            <input
              type="number"
              name="price"
              value={form.price}
              onChange={handleChange}
              required
              className="w-full rounded-md border border-gray-300 px-3 py-2"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Diện tích (m²)</label>
            <input
              type="number"
              name="area"
              value={form.area}
              onChange={handleChange}
              className="w-full rounded-md border border-gray-300 px-3 py-2"
            />
          </div>
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
            <label className="mb-1 block text-sm font-medium text-gray-700">Quận/huyện</label>
            <input
              name="district"
              value={form.district}
              onChange={handleChange}
              required
              className="w-full rounded-md border border-gray-300 px-3 py-2"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Địa chỉ đầy đủ</label>
          <input
            name="address"
            value={form.address}
            onChange={handleChange}
            required
            className="w-full rounded-md border border-gray-300 px-3 py-2"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
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
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Số người tối đa</label>
            <input
              type="number"
              name="maxOccupants"
              value={form.maxOccupants}
              onChange={handleChange}
              className="w-full rounded-md border border-gray-300 px-3 py-2"
            />
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">Tiện ích</label>
          <div className="flex flex-wrap gap-2">
            {AMENITY_OPTIONS.map((amenity) => (
              <button
                type="button"
                key={amenity}
                onClick={() => toggleAmenity(amenity)}
                className={`rounded-full border px-3 py-1.5 text-sm ${
                  form.amenities.includes(amenity)
                    ? 'border-rose-600 bg-rose-600 text-white'
                    : 'border-gray-300 text-gray-700'
                }`}
              >
                {AMENITY_LABELS[amenity]}
              </button>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-rose-600 py-2 text-white hover:bg-rose-700 disabled:opacity-50"
        >
          {loading ? 'Đang lưu...' : isEdit ? 'Lưu thay đổi' : 'Đăng tin'}
        </button>
      </form>
    </div>
  );
}
