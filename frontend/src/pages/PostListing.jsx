import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { CheckCircle2, Circle, MapPin } from 'lucide-react';
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

const MAX_IMAGES = 6;

function Optional() {
  return <span className="font-normal text-gray-500"> (không bắt buộc)</span>;
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

function SuffixInput({ suffix, children }) {
  return (
    <div className="relative">
      {children}
      <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-sm text-gray-500">{suffix}</span>
    </div>
  );
}

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
        setForm({
          ...EMPTY_FORM,
          ...listing,
          description: listing.description || '',
          amenities: [...(listing.amenities || [])],
          imageUrls: [...(listing.imageUrls || [])],
        });
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
        amenities: has ? prev.amenities.filter((a) => a !== amenity) : [...prev.amenities, amenity],
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
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setLoading(false);
    }
  }

  const previewThumbnail = form.imageUrls?.[0];
  const previewLocation = [form.district, form.city].filter(Boolean).join(', ');
  const checks = [
    { label: 'Tiêu đề và giá thuê', done: form.title.trim().length >= 10 && Number(form.price) > 0 },
    { label: 'Ghim vị trí trên bản đồ', done: form.latitude != null && form.longitude != null },
    { label: 'Ít nhất 3 ảnh thật của phòng', done: form.imageUrls.length >= 3 },
    { label: 'Mô tả từ 100 ký tự', done: form.description.trim().length >= 100 },
    { label: 'Chọn tiện ích có sẵn', done: form.amenities.length > 0 },
  ];
  const doneCount = checks.filter((c) => c.done).length;

  let submitLabel = isEdit ? 'Lưu thay đổi' : 'Gửi tin để duyệt';
  if (loading) submitLabel = 'Đang lưu...';

  return (
    <div className="bg-gray-50">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-gray-500">
          <Link to="/listings/mine" className="hover:text-gray-900">
            Tin đăng của tôi
          </Link>
          <span aria-hidden="true">/</span>
          <span className="text-gray-900">{isEdit ? 'Sửa tin' : 'Đăng tin mới'}</span>
        </nav>
        <h1 className="page-title mt-3">{isEdit ? 'Sửa tin đăng' : 'Đăng tin cho thuê phòng'}</h1>
        <p className="mt-1 text-gray-600">
          {isEdit
            ? 'Tin đã sửa sẽ được duyệt lại trước khi hiển thị.'
            : 'Tin được duyệt trong ngày. Thông tin càng rõ, người thuê càng dễ quyết định.'}
        </p>

        {error && <div className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

        <form onSubmit={handleSubmit} className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-8">
          <div className="space-y-6">
            <Section title="Thông tin cơ bản" desc="Tiêu đề nên có loại phòng, khu vực và điểm nổi bật.">
              <div>
                <label htmlFor="title" className="field-label">
                  Tiêu đề
                </label>
                <input
                  id="title"
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  required
                  maxLength={120}
                  placeholder="VD: Phòng trọ Cầu Giấy có gác, gần ĐH Quốc gia"
                  className="field-input"
                />
              </div>

              <div>
                <label htmlFor="description" className="field-label">
                  Mô tả
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  rows={6}
                  placeholder="Diện tích, nội thất, giờ giấc, chi phí điện nước, khu vực xung quanh..."
                  className="field-input resize-y"
                />
                <p className="mt-1.5 text-right text-xs text-gray-500">{form.description.trim().length} ký tự</p>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label htmlFor="price" className="field-label">
                    Giá thuê
                  </label>
                  <SuffixInput suffix="đ/tháng">
                    <CurrencyInput
                      id="price"
                      name="price"
                      value={form.price}
                      onChange={handleChange}
                      required
                      placeholder="3.500.000"
                      className="field-input pr-20"
                    />
                  </SuffixInput>
                </div>
                <div>
                  <label htmlFor="area" className="field-label">
                    Diện tích
                    <Optional />
                  </label>
                  <SuffixInput suffix="m²">
                    <input
                      id="area"
                      type="number"
                      min="1"
                      name="area"
                      value={form.area ?? ''}
                      onChange={handleChange}
                      placeholder="25"
                      className="field-input pr-12"
                    />
                  </SuffixInput>
                </div>
                <div>
                  <label htmlFor="maxOccupants" className="field-label">
                    Ở tối đa
                    <Optional />
                  </label>
                  <SuffixInput suffix="người">
                    <input
                      id="maxOccupants"
                      type="number"
                      min="1"
                      name="maxOccupants"
                      value={form.maxOccupants ?? ''}
                      onChange={handleChange}
                      placeholder="2"
                      className="field-input pr-16"
                    />
                  </SuffixInput>
                </div>
              </div>
            </Section>

            <Section title="Vị trí" desc="Chọn gợi ý địa chỉ để ghim phòng lên bản đồ. Người thuê tìm theo khoảng cách sẽ thấy tin của bạn.">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label htmlFor="city" className="field-label">
                    Tỉnh/thành phố
                  </label>
                  <SearchableSelect
                    id="city"
                    name="city"
                    value={form.city}
                    onChange={(e) => setForm((prev) => ({ ...prev, city: e.target.value, district: '', ward: '' }))}
                    options={PROVINCE_NAMES}
                    placeholder="Chọn tỉnh/thành"
                    required
                    className="field-input"
                  />
                </div>
                <div>
                  <label htmlFor="district" className="field-label">
                    Quận/huyện
                  </label>
                  <SearchableSelect
                    id="district"
                    name="district"
                    value={form.district}
                    onChange={(e) => setForm((prev) => ({ ...prev, district: e.target.value, ward: '' }))}
                    options={getDistrictNamesForProvince(form.city)}
                    placeholder={form.city ? 'Chọn quận/huyện' : 'Chọn tỉnh/thành trước'}
                    disabled={!form.city}
                    required
                    className="field-input"
                  />
                </div>
                <div>
                  <label htmlFor="ward" className="field-label">
                    Phường/xã
                    <Optional />
                  </label>
                  <SearchableSelect
                    id="ward"
                    name="ward"
                    value={form.ward}
                    onChange={handleChange}
                    options={wardOptions}
                    placeholder={wardPlaceholder}
                    disabled={!form.district || loadingWards}
                    className="field-input"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="address" className="field-label">
                  Địa chỉ
                </label>
                <AddressAutocomplete
                  id="address"
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  onSelectLocation={handleLocationSelect}
                  required
                  placeholder="Số nhà, ngõ, đường"
                  className="field-input"
                />
                {form.latitude != null && form.longitude != null ? (
                  <div className="mt-3">
                    <ListingMap latitude={form.latitude} longitude={form.longitude} className="h-48 w-full" />
                    <p className="mt-1.5 flex items-center gap-1 text-xs text-emerald-700">
                      <CheckCircle2 size={13} /> Đã ghim vị trí trên bản đồ
                    </p>
                  </div>
                ) : (
                  <p className="mt-1.5 flex items-center gap-1 text-xs text-gray-500">
                    <MapPin size={13} /> Gõ địa chỉ rồi chọn một gợi ý để ghim vị trí.
                  </p>
                )}
              </div>

              <div className="sm:max-w-xs">
                <label htmlFor="contactPhone" className="field-label">
                  Số điện thoại liên hệ
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

            <Section
              title="Ảnh phòng"
              desc={`Tối đa ${MAX_IMAGES} ảnh. Ảnh đầu tiên là ảnh bìa. Chụp ngang, đủ sáng, có cả toàn cảnh phòng và nhà vệ sinh.`}
            >
              <ImageUploader
                images={form.imageUrls}
                onChange={(imageUrls) => setForm({ ...form, imageUrls })}
                maxImages={MAX_IMAGES}
              />
            </Section>

            <Section title="Tiện ích" desc="Chỉ chọn những gì phòng thật sự có.">
              <div className="flex flex-wrap gap-2">
                {AMENITY_OPTIONS.map((amenity) => {
                  const selected = form.amenities.includes(amenity);
                  return (
                    <button
                      type="button"
                      key={amenity}
                      onClick={() => toggleAmenity(amenity)}
                      aria-pressed={selected}
                      className={`rounded-full border px-3.5 py-1.5 text-sm transition-colors ${
                        selected
                          ? 'border-gray-900 bg-gray-900 font-medium text-white'
                          : 'border-gray-300 bg-white text-gray-700 hover:border-gray-500'
                      }`}
                    >
                      {AMENITY_LABELS[amenity]}
                    </button>
                  );
                })}
              </div>
            </Section>
          </div>

          <aside>
            <div className="space-y-4 lg:sticky lg:top-24">
              <div className="surface hidden overflow-hidden lg:block">
                <div className="aspect-[4/3] bg-gray-100">
                  {previewThumbnail ? (
                    <img src={previewThumbnail} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-gray-500">Ảnh bìa hiện ở đây</div>
                  )}
                </div>
                <div className="p-4">
                  <p className="line-clamp-2 font-semibold text-gray-900">{form.title || 'Tiêu đề tin đăng'}</p>
                  <p className="mt-1 flex items-center gap-1 truncate text-sm text-gray-600">
                    <MapPin size={14} className="flex-shrink-0 text-gray-400" />
                    {previewLocation || 'Khu vực'}
                  </p>
                  <p className="mt-3 border-t border-gray-100 pt-3 text-lg font-bold text-orange-600">
                    {form.price ? new Intl.NumberFormat('vi-VN').format(form.price) + 'đ' : 'Giá thuê'}
                    <span className="text-sm font-medium text-orange-500">/tháng</span>
                  </p>
                </div>
              </div>

              <div className="surface p-5">
                <div className="flex items-baseline justify-between">
                  <p className="font-semibold text-gray-900">Độ đầy đủ của tin</p>
                  <p className="text-sm text-gray-600">
                    {doneCount}/{checks.length}
                  </p>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full rounded-full bg-emerald-600 transition-all"
                    style={{ width: `${(doneCount / checks.length) * 100}%` }}
                  />
                </div>
                <ul className="mt-4 space-y-2">
                  {checks.map((c) => (
                    <li key={c.label} className={`flex items-center gap-2 text-sm ${c.done ? 'text-gray-900' : 'text-gray-500'}`}>
                      {c.done ? (
                        <CheckCircle2 size={16} className="flex-shrink-0 text-emerald-600" />
                      ) : (
                        <Circle size={16} className="flex-shrink-0 text-gray-300" />
                      )}
                      {c.label}
                    </li>
                  ))}
                </ul>

                <button type="submit" disabled={loading} className="btn-primary mt-5 w-full">
                  {submitLabel}
                </button>
                <p className="mt-2 text-center text-xs text-gray-500">Tin hiển thị công khai sau khi được duyệt.</p>
              </div>
            </div>
          </aside>
        </form>
      </div>
    </div>
  );
}
