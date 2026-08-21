import api from './api';

export function getFavoriteListingIds() {
  return api.get('/favorites/listings').then((res) => res.data);
}

export function getFavoriteListings() {
  return api.get('/favorites/listings/full').then((res) => res.data);
}

export function toggleListingFavorite(id) {
  return api.post(`/favorites/listings/${id}`).then((res) => res.data);
}

export function getFavoriteRoommateProfileIds() {
  return api.get('/favorites/roommate-profiles').then((res) => res.data);
}

export function getFavoriteRoommateProfiles() {
  return api.get('/favorites/roommate-profiles/full').then((res) => res.data);
}

export function toggleRoommateFavorite(id) {
  return api.post(`/favorites/roommate-profiles/${id}`).then((res) => res.data);
}
