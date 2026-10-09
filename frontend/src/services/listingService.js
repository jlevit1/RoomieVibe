import api from './api';

export function searchListings(params) {
  return api
    .get('/listings', { params, paramsSerializer: { indexes: null } })
    .then((res) => res.data);
}

export function getListing(id) {
  return api.get(`/listings/${id}`).then((res) => res.data);
}

const viewedThisSession = new Set();

// Counts one view per listing per browser session. The check-and-mark runs synchronously, so a second
// call (page refresh, React StrictMode re-running effects) is skipped. Returns whether a view was sent.
export function recordListingView(id) {
  const key = `viewed-listing-${id}`;
  try {
    if (sessionStorage.getItem(key)) return false;
    sessionStorage.setItem(key, '1');
  } catch {
    if (viewedThisSession.has(key)) return false;
  }
  viewedThisSession.add(key);
  api.post(`/listings/${id}/views`).catch(() => {});
  return true;
}

export function createListing(data) {
  return api.post('/listings', data).then((res) => res.data);
}

export function updateListing(id, data) {
  return api.put(`/listings/${id}`, data).then((res) => res.data);
}

export function deleteListing(id) {
  return api.delete(`/listings/${id}`).then((res) => res.data);
}

export function getMyListings() {
  return api.get('/listings/mine').then((res) => res.data);
}

export function getPendingListings() {
  return api.get('/listings/pending').then((res) => res.data);
}

export function approveListing(id) {
  return api.patch(`/listings/${id}/approve`).then((res) => res.data);
}

export function rejectListing(id, reason) {
  return api.patch(`/listings/${id}/reject`, { reason }).then((res) => res.data);
}

export function getListingMapPoints() {
  return api.get('/listings/map-points').then((res) => res.data);
}

export function getRecommendedListings() {
  return api.get('/listings/recommended').then((res) => res.data);
}

export function markListingRented(id, tenantId) {
  return api.patch(`/listings/${id}/rented`, { tenantId: tenantId ?? null }).then((res) => res.data);
}

export function markListingAvailable(id) {
  return api.patch(`/listings/${id}/available`).then((res) => res.data);
}

export function getBoostPackages() {
  return api.get('/listings/boost-packages').then((res) => res.data);
}

export function boostListing(id, packageCode) {
  return api.post(`/listings/${id}/boost`, { packageCode }).then((res) => res.data);
}
