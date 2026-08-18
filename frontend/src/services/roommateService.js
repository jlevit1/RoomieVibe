import api from './api';

export function saveMyProfile(data) {
  return api.post('/roommate-profiles', data).then((res) => res.data);
}

export function getMyProfile() {
  return api.get('/roommate-profiles/me').then((res) => res.data);
}

export function deleteMyProfile() {
  return api.delete('/roommate-profiles/me').then((res) => res.data);
}

export function browseProfiles() {
  return api.get('/roommate-profiles/browse').then((res) => res.data);
}

export function getProfileById(id) {
  return api.get(`/roommate-profiles/${id}`).then((res) => res.data);
}
