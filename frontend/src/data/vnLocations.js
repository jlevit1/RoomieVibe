import axios from 'axios';
import provinceDistrict from './vnProvinceDistrict.json';

export const PROVINCES = provinceDistrict;
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
