import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  Check,
  Images,
  Info,
  ListChecks,
  MapPin,
  Phone,
  Ruler,
  Wallet,
} from 'lucide-react';
import { createListing, getMyListings, updateListing } from '../services/listingService';
import { AMENITY_LABELS, AMENITY_OPTIONS } from '../constants/amenities';
import ImageUploader from '../components/ImageUploader';
import CurrencyInput from '../components/CurrencyInput';
import AddressAutocomplete from '../components/AddressAutocomplete';
import ListingMap from '../components/ListingMap';
import SearchableSelect from '../components/SearchableSelect';
import { PROVINCE_NAMES, getDistrictNamesForProvince, getWardsForDistrict } from '../data/vnLocations';

const EMPTY_FORM = {
  title: '',
  description: '',
  price: '',
  area: '',
  city: '',
  district: '',
  ward: '',
  address: '',
  latitude: null,
  longitude: null,
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
  const [wardOptions, setWardOptions] = useState([]);
  const [loadingWards, setLoadingWards] = useState(false);

  useEffect(() => {
    if (!isEdit) return;
    getMyListings().then((listings) => {
      const listing = listings.find((l) => String(l.id) === id);
      if (listing) {
        setForm({ ...EMPTY_FORM, ...listing });
      }
    });
  }, [id, isEdit]);

  useEffect(() => {
    if (!form.city || !form.district) {
      setWardOptions([]);
      return;
    }
    let cancelled = false;
    setLoadingWards(true);
    getWardsForDistrict(form.city, form.district).then((wards) => {
      if (!cancelled) {
        setWardOptions(wards);
        setLoadingWards(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [form.city, form.district]);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function handleLocationSelect({ latitude, longitude }) {
    setForm((prev) => ({ ...prev, latitude, longitude }));
  }

  let wardPlaceholder = 'Chọn phường/xã';
  if (!form.district) {
    wardPlaceholder = 'Chọn quận/huyện trước';
  } else if (loadingWards) {
    wardPlaceholder = 'Đang tải...';
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

  const previewThumbnail = form.imageUrls?.[0];
  const previewLocation = [form.ward, form.district, form.city].filter(Boolean).join(', ');

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <Link
        to="/listings/mine"
        className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-gray-500 transition-colors hover:text-rose-600"
      >
        <ArrowLeft size={15} /> Tin đăng của tôi
      </Link>

      <h1 className="mb-1 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
        {isEdit ? 'Sửa tin đăng' : 'Đăng tin phòng trọ'}
      </h1>
      <p className="mb-6 text-sm text-gray-500">
        Điền đầy đủ thông tin để tin đăng được duyệt nhanh hơn.
      </p>

      {error && (
        <div className="mb-5 flex items-start gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
          <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-8 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <div className="space-y-5 rounded-2xl border border-gray-200 p-6 sm:p-7">
          <SectionHeader
            Icon={Info}
            title="Thông tin cơ bản"
            desc="Tiêu đề, mô tả và mức giá cho thuê"
          />

          <div>
            <label htmlFor="title" className={labelClass}>Tiêu đề</label>
            <input
              id="title"
              name="title"
              value={form.title}
              onChange={handleChange}
              required
              placeholder="VD: Phòng trọ mới, gần trung tâm, đầy đủ nội thất"
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
              placeholder="Mô tả chi tiết về phòng, khu vực xung quanh, quy định..."
              className={inputClass}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="price" className={labelClass}>Giá (đ/tháng)</label>
              <div className="relative">
                <Wallet size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <CurrencyInput
                  id="price"
                  name="price"
                  value={form.price}
                  onChange={handleChange}
                  required
                  className={`${inputClass} pl-10`}
                />
              </div>
            </div>
            <div>
              <label htmlFor="area" className={labelClass}>
                Diện tích (m²) <span className="font-normal text-gray-400">· Tuỳ chọn</span>
              </label>
              <div className="relative">
                <Ruler size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  id="area"
                  type="number"
                  name="area"
                  value={form.area}
                  onChange={handleChange}
                  className={`${inputClass} pl-10`}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-5 rounded-2xl border border-gray-200 p-6 sm:p-7">
          <SectionHeader
            Icon={MapPin}
            title="Vị trí"
            desc="Địa chỉ chính xác giúp người thuê dễ tìm và tin tưởng hơn"
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="city" className={labelClass}>Tỉnh/thành phố</label>
              <SearchableSelect
                id="city"
                name="city"
                value={form.city}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, city: e.target.value, district: '', ward: '' }))
                }
                options={PROVINCE_NAMES}
                placeholder="Chọn tỉnh/thành phố"
                required
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="district" className={labelClass}>Quận/huyện</label>
              <SearchableSelect
                id="district"
                name="district"
                value={form.district}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, district: e.target.value, ward: '' }))
                }
                options={getDistrictNamesForProvince(form.city)}
                placeholder={form.city ? 'Chọn quận/huyện' : 'Chọn tỉnh/thành trước'}
                disabled={!form.city}
                required
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="ward" className={labelClass}>
                Phường/xã <span className="font-normal text-gray-400">· Tuỳ chọn</span>
              </label>
              <SearchableSelect
                id="ward"
                name="ward"
                value={form.ward}
                onChange={handleChange}
                options={wardOptions}
                placeholder={wardPlaceholder}
                disabled={!form.district || loadingWards}
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label htmlFor="address" className={labelClass}>Địa chỉ đầy đủ</label>
            <AddressAutocomplete
              id="address"
              name="address"
              value={form.address}
              onChange={handleChange}
              onSelectLocation={handleLocationSelect}
              required
              className={inputClass}
            />
            <p className="mt-1.5 text-xs text-gray-400">
              Gõ địa chỉ và chọn gợi ý để ghim đúng vị trí trên bản đồ.
            </p>
            {form.latitude != null && form.longitude != null && (
              <div className="mt-3">
                <ListingMap latitude={form.latitude} longitude={form.longitude} className="h-40 w-full" />
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="contactPhone" className={labelClass}>SĐT liên hệ</label>
              <div className="relative">
                <Phone size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  id="contactPhone"
                  name="contactPhone"
                  value={form.contactPhone}
                  onChange={handleChange}
                  required
                  className={`${inputClass} pl-10`}
                />
              </div>
            </div>
            <div>
              <label htmlFor="maxOccupants" className={labelClass}>
                Số người tối đa <span className="font-normal text-gray-400">· Tuỳ chọn</span>
              </label>
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

        <div className="space-y-5 rounded-2xl border border-gray-200 p-6 sm:p-7">
          <SectionHeader
            Icon={Images}
            title="Hình ảnh & tiện ích"
            desc="Ảnh thật giúp tin đăng đáng tin cậy và được duyệt nhanh hơn"
          />

          <div>
            <p className={`${labelClass} mb-2`}>Ảnh phòng</p>
            <ImageUploader
              images={form.imageUrls}
              onChange={(imageUrls) => setForm({ ...form, imageUrls })}
              maxImages={6}
            />
          </div>

          <div>
            <p className={`${labelClass} mb-2`}>Tiện ích</p>
            <div className="flex flex-wrap gap-2">
              {AMENITY_OPTIONS.map((amenity) => {
                const selected = form.amenities.includes(amenity);
                return (
                  <button
                    type="button"
                    key={amenity}
                    onClick={() => toggleAmenity(amenity)}
                    className={`flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm transition-colors ${
                      selected
                        ? 'border-rose-600 bg-rose-600 text-white'
                        : 'border-gray-300 text-gray-700 hover:border-rose-300'
                    }`}
                  >
                    {selected && <Check size={13} />}
                    {AMENITY_LABELS[amenity]}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="lg:col-span-1">
        <div className="sticky top-4 space-y-4">
          <div className="overflow-hidden rounded-2xl border border-gray-200">
            <div className="flex h-36 items-center justify-center bg-gray-100 text-gray-400">
              {previewThumbnail ? (
                <img src={previewThumbnail} alt="" className="h-full w-full object-cover" />
              ) : (
                <Images size={24} />
              )}
            </div>
            <div className="space-y-1 p-4">
              <p className="truncate font-semibold text-gray-900">
                {form.title || 'Tiêu đề tin đăng'}
              </p>
              <p className="truncate text-sm text-gray-500">
                {previewLocation || 'Vị trí sẽ hiện ở đây'}
              </p>
              <p className="text-sm font-bold text-rose-600">
                {form.price ? `${new Intl.NumberFormat('vi-VN').format(form.price)} đ/tháng` : 'Chưa có giá'}
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
            <p className="mb-3 flex items-center gap-1.5 text-xs text-gray-500">
              <ListChecks size={14} className="flex-shrink-0" />
              Tin đăng sẽ hiển thị công khai sau khi admin duyệt.
            </p>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-rose-600 py-2.5 text-sm font-semibold text-white transition-all hover:bg-rose-700 active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? 'Đang lưu...' : isEdit ? 'Lưu thay đổi' : 'Đăng tin'}
            </button>
          </div>
        </div>
      </div>
      </form>
    </div>
  );
}

function SectionHeader({ Icon, title, desc }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-rose-50 text-rose-600">
        <Icon size={18} />
      </span>
      <div className="min-w-0">
        <h2 className="font-semibold text-gray-900">{title}</h2>
        <p className="truncate text-xs text-gray-500">{desc}</p>
      </div>
    </div>
  );
}
