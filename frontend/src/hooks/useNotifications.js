import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  getRecentNotifications,
  getNotificationUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
} from '../services/notificationService';

const POLL_INTERVAL_MS = 15000;

export function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const load = useCallback(() => {
    getNotificationUnreadCount()
      .then((data) => setUnreadCount(data.count))
      .catch(() => {});
    getRecentNotifications()
      .then(setNotifications)
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      return undefined;
    }

    load();
    const interval = setInterval(load, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [user, load]);

  async function markRead(id) {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    setUnreadCount((c) => Math.max(0, c - 1));
    await markNotificationRead(id);
  }

  async function markAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
    await markAllNotificationsRead();
  }

  return { notifications, unreadCount, markRead, markAllRead };
}
