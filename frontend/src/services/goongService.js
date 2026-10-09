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

// Goong's "bike" vehicle is a motorbike route - how most people in Vietnam actually get around.
export async function getDirections(origin, destination, vehicle = 'bike') {
  if (!GOONG_API_KEY) return null;
  const res = await axios.get(`${GOONG_BASE_URL}/Direction`, {
    params: {
      api_key: GOONG_API_KEY,
      origin: `${origin.latitude},${origin.longitude}`,
      destination: `${destination.latitude},${destination.longitude}`,
      vehicle,
    },
  });
  const route = res.data?.routes?.[0];
  const leg = route?.legs?.[0];
  if (!route || !leg) return null;
  return {
    distanceMeters: leg.distance.value,
    durationSeconds: leg.duration.value,
    coordinates: decodePolyline(route.overview_polyline.points),
  };
}

// Standard Google encoded-polyline decoding (precision 5), returned as [lng, lat] pairs for GeoJSON.
function decodePolyline(encoded) {
  const coordinates = [];
  let index = 0;
  let lat = 0;
  let lng = 0;
  while (index < encoded.length) {
    for (const axis of ['lat', 'lng']) {
      let result = 0;
      let shift = 0;
      let byte;
      do {
        byte = encoded.codePointAt(index++) - 63;
        result |= (byte & 0x1f) << shift;
        shift += 5;
      } while (byte >= 0x20);
      const delta = result & 1 ? ~(result >> 1) : result >> 1;
      if (axis === 'lat') lat += delta;
      else lng += delta;
    }
    coordinates.push([lng / 1e5, lat / 1e5]);
  }
  return coordinates;
}
