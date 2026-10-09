import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, X } from 'lucide-react';
import SearchableSelect from './SearchableSelect';
import { AMENITY_LABELS, AMENITY_OPTIONS } from '../constants/amenities';
import { PROVINCE_NAMES, getDistrictNamesForProvince, getWardsForDistrict } from '../data/vnLocations';
import { PRICE_BANDS, AREA_BANDS } from '../constants/filters';

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

function SectionHeader({ title }) {
  return <h3 className="mb-3 font-semibold text-gray-900">{title}</h3>;
}

export function BandPills({ bands, isActive, onSelect }) {
  return (
    <div className="flex flex-wrap gap-2">
      {bands.map((band) => (
        <button
          type="button"
          key={band.label}
          onClick={() => onSelect(band)}
          aria-pressed={isActive(band)}
          className={`rounded-full border px-3.5 py-1.5 text-sm transition-colors ${
            isActive(band)
              ? 'border-gray-900 bg-gray-900 font-medium text-white'
              : 'border-gray-300 text-gray-700 hover:border-gray-400'
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/50 px-4 py-8"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="filter-modal-title"
        className="flex max-h-full w-full max-w-xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2 id="filter-modal-title" className="text-lg font-semibold text-gray-900">
            Bộ lọc
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="flex h-9 w-9 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 space-y-8 overflow-y-auto px-6 py-6">
          <div>
            <SectionHeader title="Khu vực" />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <label className="field-label">Tỉnh thành</label>
                <SearchableSelect
                  value={draft.city}
                  onChange={(e) => setDraft({ ...draft, city: e.target.value, district: '', ward: '' })}
                  options={PROVINCE_NAMES}
                  placeholder="Toàn quốc"
                  className="field-input"
                />
              </div>
              <div>
                <label className="field-label">Quận huyện</label>
                <SearchableSelect
                  value={draft.district}
                  onChange={(e) => setDraft({ ...draft, district: e.target.value, ward: '' })}
                  options={getDistrictNamesForProvince(draft.city)}
                  placeholder="Tất cả"
                  disabled={!draft.city}
                  className="field-input"
                />
              </div>
              <div>
                <label className="field-label">Phường xã</label>
                <SearchableSelect
                  value={draft.ward}
                  onChange={(e) => setDraft({ ...draft, ward: e.target.value })}
                  options={wardOptions}
                  placeholder="Tất cả"
                  disabled={!draft.district}
                  className="field-input"
                />
              </div>
            </div>
          </div>

          <div>
            <SectionHeader title="Mức giá" />
            <BandPills
              bands={PRICE_BANDS}
              isActive={(band) => draft.minPrice === band.min && draft.maxPrice === band.max}
              onSelect={(band) => setDraft({ ...draft, minPrice: band.min, maxPrice: band.max })}
            />
          </div>

          <div>
            <SectionHeader title="Diện tích" />
            <BandPills
              bands={AREA_BANDS}
              isActive={(band) => draft.minArea === band.min && draft.maxArea === band.max}
              onSelect={(band) => setDraft({ ...draft, minArea: band.min, maxArea: band.max })}
            />
          </div>

          <div>
            <SectionHeader title="Tiện ích" />
            <div className="flex flex-wrap gap-2">
              {AMENITY_OPTIONS.map((amenity) => {
                const selected = draft.amenities.includes(amenity);
                return (
                  <button
                    type="button"
                    key={amenity}
                    onClick={() => toggleAmenity(amenity)}
                    aria-pressed={selected}
                    className={`flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm transition-colors ${
                      selected
                        ? 'border-gray-900 bg-gray-900 text-white'
                        : 'border-gray-300 text-gray-700 hover:border-gray-400'
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

        <div className="flex items-center justify-between gap-3 border-t border-gray-200 px-6 py-4">
          <button type="button" onClick={handleReset} className="btn-secondary">
            Đặt lại
          </button>
          <button type="button" onClick={handleApply} className="btn-primary flex-1 py-3">
            Áp dụng{activeCount > 0 ? ` (${activeCount})` : ''}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
