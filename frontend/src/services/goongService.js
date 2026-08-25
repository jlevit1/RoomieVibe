import axios from 'axios';

const GOONG_API_KEY = import.meta.env.VITE_GOONG_API_KEY;
const GOONG_BASE_URL = 'https://rsapi.goong.io';

export async function getPlaceSuggestions(input) {
  if (!GOONG_API_KEY || !input) return [];
  const res = await axios.get(`${GOONG_BASE_URL}/Place/AutoComplete`, {
    params: { api_key: GOONG_API_KEY, input, limit: 5 },
  });
  return res.data?.predictions || [];
}

export async function getPlaceDetail(placeId) {
  if (!GOONG_API_KEY || !placeId) return null;
  const res = await axios.get(`${GOONG_BASE_URL}/Place/Detail`, {
    params: { api_key: GOONG_API_KEY, place_id: placeId },
  });
  const location = res.data?.result?.geometry?.location;
  if (!location) return null;
  return {
    latitude: location.lat,
    longitude: location.lng,
    formattedAddress: res.data.result.formatted_address,
  };
}
