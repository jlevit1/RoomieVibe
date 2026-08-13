import api from './api';

export function searchListings(params) {
  return api.get('/listings', { params }).then((res) => res.data);
}

export function getListing(id) {
  return api.get(`/listings/${id}`).then((res) => res.data);
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
