import api from './api';

export function getStats() {
  return api.get('/admin/stats').then((res) => res.data);
}

export function getAllUsers() {
  return api.get('/admin/users').then((res) => res.data);
}

export function lockUser(id) {
  return api.patch(`/admin/users/${id}/lock`).then((res) => res.data);
}

export function unlockUser(id) {
  return api.patch(`/admin/users/${id}/unlock`).then((res) => res.data);
}
