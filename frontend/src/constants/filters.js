export function filterPillClass(active) {
  return `flex flex-shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
    active ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-300 bg-white text-gray-800 hover:border-gray-400'
  }`;
}

function formatMillion(value) {
  return `${(Number(value) / 1_000_000).toLocaleString('vi-VN', { maximumFractionDigits: 1 })} tr`;
}

export function priceRangeLabel(min, max) {
  if (min && max) return `${formatMillion(min)} - ${formatMillion(max)}`;
  if (min) return `Từ ${formatMillion(min)}`;
  if (max) return `Dưới ${formatMillion(max)}`;
  return '';
}

export const BUDGET_BANDS = [
  { label: 'Tất cả', min: '', max: '' },
  { label: 'Dưới 2 triệu', min: '', max: '2000000' },
  { label: '2 - 3 triệu', min: '2000000', max: '3000000' },
  { label: '3 - 4 triệu', min: '3000000', max: '4000000' },
  { label: '4 - 6 triệu', min: '4000000', max: '6000000' },
  { label: 'Trên 6 triệu', min: '6000000', max: '' },
];

export const PRICE_BANDS = [
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

export const AREA_BANDS = [
  { label: 'Tất cả', min: '', max: '' },
  { label: 'Dưới 20m²', min: '', max: '20' },
  { label: 'Từ 20m² - 30m²', min: '20', max: '30' },
  { label: 'Từ 30m² - 50m²', min: '30', max: '50' },
  { label: 'Từ 50m² - 70m²', min: '50', max: '70' },
  { label: 'Từ 70m² - 90m²', min: '70', max: '90' },
  { label: 'Trên 90m²', min: '90', max: '' },
];
