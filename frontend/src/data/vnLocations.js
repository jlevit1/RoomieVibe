import axios from 'axios';
import provinceDistrict from './vnProvinceDistrict.json';

// The source data uses full administrative names ("Thành phố Hà Nội", "Tỉnh Bình Dương").
// The app uses the shorter, everyday form everywhere (city chips, listing cards, search) -
// strip the prefix so the dropdown here stays in sync with that instead of introducing a
// second spelling for the same province.
function shortenProvinceName(fullName) {
  if (fullName === 'Thành phố Hồ Chí Minh') return 'TP. Hồ Chí Minh';
  return fullName.replace(/^(Thành phố|Tỉnh)\s+/, '');
}

export const PROVINCES = provinceDistrict.map((p) => ({ ...p, name: shortenProvinceName(p.name) }));
export const PROVINCE_NAMES = PROVINCES.map((p) => p.name);

export function getDistrictsForProvince(provinceName) {
  const match = PROVINCES.find((p) => p.name === provinceName);
  return match ? match.districts : [];
}

export function getDistrictNamesForProvince(provinceName) {
  return getDistrictsForProvince(provinceName).map((d) => d.name);
}

function findDistrictCode(provinceName, districtName) {
  const district = getDistrictsForProvince(provinceName).find((d) => d.name === districtName);
  return district?.code ?? null;
}

const wardCache = new Map();

export async function getWardsForDistrict(provinceName, districtName) {
  const code = findDistrictCode(provinceName, districtName);
  if (!code) return [];
  if (wardCache.has(code)) return wardCache.get(code);
  try {
    const res = await axios.get(`https://provinces.open-api.vn/api/v1/d/${code}`, {
      params: { depth: 2 },
    });
    const wards = (res.data?.wards || []).map((w) => w.name);
    wardCache.set(code, wards);
    return wards;
  } catch {
    return [];
  }
}
