import api from './api';

export function getRecentNotifications() {
  return api.get('/notifications').then((res) => res.data);
}

export function getNotificationUnreadCount() {
  return api.get('/notifications/unread-count').then((res) => res.data);
}

export function markNotificationRead(id) {
  return api.post(`/notifications/${id}/read`).then((res) => res.data);
}

export function markAllNotificationsRead() {
  return api.post('/notifications/read-all').then((res) => res.data);
}
