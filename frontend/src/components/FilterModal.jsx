import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, MapPin, Ruler, SlidersHorizontal, Sparkles, Wallet, X } from 'lucide-react';
import SearchableSelect from './SearchableSelect';
import { AMENITY_LABELS, AMENITY_OPTIONS } from '../constants/amenities';
import { PROVINCE_NAMES, getDistrictNamesForProvince, getWardsForDistrict } from '../data/vnLocations';

const PRICE_BANDS = [
  { label: 'Tất cả', min: '', max: '' },
  { label: 'Dưới 1 triệu', min: '', max: '1000000' },
  { label: '1 - 2 triệu', min: '1000000', max: '2000000' },
  { label: '2 - 3 triệu', min: '2000000', max: '3000000' },
  { label: '3 - 5 triệu', min: '3000000', max: '5000000' },
  { label: '5 - 7 triệu', min: '5000000', max: '7000000' },
  { label: '7 - 10 triệu', min: '7000000', max: '10000000' },
  { label: '10 - 15 triệu', min: '10000000', max: '15000000' },
  { label: 'Trên 15 triệu', min: '15000000', max: '' },
];

const AREA_BANDS = [
  { label: 'Tất cả', min: '', max: '' },
  { label: 'Dưới 20m²', min: '', max: '20' },
  { label: 'Từ 20m² - 30m²', min: '20', max: '30' },
  { label: 'Từ 30m² - 50m²', min: '30', max: '50' },
  { label: 'Từ 50m² - 70m²', min: '50', max: '70' },
  { label: 'Từ 70m² - 90m²', min: '70', max: '90' },
  { label: 'Trên 90m²', min: '90', max: '' },
];

const EMPTY_FILTERS = {
  city: '',
  district: '',
  ward: '',
  minPrice: '',
  maxPrice: '',
  minArea: '',
  maxArea: '',
  amenities: [],
};

const selectClass =
  'w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm transition-colors focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20';

const labelClass = 'mb-1.5 block text-sm font-medium text-gray-700';

function SectionHeader({ Icon, title }) {
  return (
    <div className="mb-3 flex items-center gap-2.5">
      <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-rose-50 text-rose-600">
        <Icon size={15} />
      </span>
      <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
    </div>
  );
}

function BandPills({ bands, isActive, onSelect }) {
  return (
    <div className="flex flex-wrap gap-2">
      {bands.map((band) => (
        <button
          type="button"
          key={band.label}
          onClick={() => onSelect(band)}
          className={`rounded-full border px-3.5 py-1.5 text-sm transition-colors ${
            isActive(band)
              ? 'border-rose-600 bg-rose-600 font-medium text-white'
              : 'border-gray-300 text-gray-700 hover:border-rose-300 hover:text-rose-600'
          }`}
        >
          {band.label}
        </button>
      ))}
    </div>
  );
}

export default function FilterModal({ isOpen, onClose, initialFilters, onApply }) {
  const [draft, setDraft] = useState({ ...EMPTY_FILTERS, ...initialFilters });
  const [wardOptions, setWardOptions] = useState([]);

  useEffect(() => {
    if (isOpen) setDraft({ ...EMPTY_FILTERS, ...initialFilters });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return undefined;
    function handleKey(e) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!draft.city || !draft.district) {
      setWardOptions([]);
      return;
    }
    let cancelled = false;
    getWardsForDistrict(draft.city, draft.district).then((wards) => {
      if (!cancelled) setWardOptions(wards);
    });
    return () => {
      cancelled = true;
    };
  }, [draft.city, draft.district]);

  if (!isOpen) return null;

  function toggleAmenity(amenity) {
    setDraft((prev) => {
      const has = prev.amenities.includes(amenity);
      return {
        ...prev,
        amenities: has ? prev.amenities.filter((a) => a !== amenity) : [...prev.amenities, amenity],
      };
    });
  }

  function handleReset() {
    setDraft(EMPTY_FILTERS);
  }

  function handleApply() {
    onApply(draft);
    onClose();
  }

  const activeCount =
    [draft.city, draft.district, draft.ward, draft.minPrice || draft.maxPrice, draft.minArea || draft.maxArea]
      .filter(Boolean).length + draft.amenities.length;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-8 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        className="flex max-h-full w-full max-w-xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-rose-600 text-white">
              <SlidersHorizontal size={16} />
            </span>
            <h2 className="text-lg font-semibold text-gray-900">Bộ lọc</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 space-y-7 overflow-y-auto px-6 py-6">
          <div>
            <SectionHeader Icon={MapPin} title="Lọc theo khu vực" />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <label className={labelClass}>Tỉnh thành</label>
                <SearchableSelect
                  value={draft.city}
                  onChange={(e) => setDraft({ ...draft, city: e.target.value, district: '', ward: '' })}
                  options={PROVINCE_NAMES}
                  placeholder="Toàn quốc"
                  className={selectClass}
                />
              </div>
              <div>
                <label className={labelClass}>Quận huyện</label>
                <SearchableSelect
                  value={draft.district}
                  onChange={(e) => setDraft({ ...draft, district: e.target.value, ward: '' })}
                  options={getDistrictNamesForProvince(draft.city)}
                  placeholder="Tất cả"
                  disabled={!draft.city}
                  className={selectClass}
                />
              </div>
              <div>
                <label className={labelClass}>Phường xã</label>
                <SearchableSelect
                  value={draft.ward}
                  onChange={(e) => setDraft({ ...draft, ward: e.target.value })}
                  options={wardOptions}
                  placeholder="Tất cả"
                  disabled={!draft.district}
                  className={selectClass}
                />
              </div>
            </div>
          </div>

          <div>
            <SectionHeader Icon={Wallet} title="Khoảng giá" />
            <BandPills
              bands={PRICE_BANDS}
              isActive={(band) => draft.minPrice === band.min && draft.maxPrice === band.max}
              onSelect={(band) => setDraft({ ...draft, minPrice: band.min, maxPrice: band.max })}
            />
          </div>

          <div>
            <SectionHeader Icon={Ruler} title="Khoảng diện tích" />
            <BandPills
              bands={AREA_BANDS}
              isActive={(band) => draft.minArea === band.min && draft.maxArea === band.max}
              onSelect={(band) => setDraft({ ...draft, minArea: band.min, maxArea: band.max })}
            />
          </div>

          <div>
            <SectionHeader Icon={Sparkles} title="Đặc điểm nổi bật" />
            <div className="flex flex-wrap gap-2">
              {AMENITY_OPTIONS.map((amenity) => {
                const selected = draft.amenities.includes(amenity);
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

        <div className="flex items-center justify-between gap-3 border-t border-gray-100 px-6 py-4">
          <button
            type="button"
            onClick={handleReset}
            className="flex-shrink-0 text-sm font-medium text-gray-500 hover:text-rose-600"
          >
            Đặt lại
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="flex-1 rounded-full bg-rose-600 py-3 text-sm font-semibold text-white transition-all hover:bg-rose-700 active:scale-[0.98]"
          >
            Áp dụng{activeCount > 0 ? ` (${activeCount})` : ''}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
