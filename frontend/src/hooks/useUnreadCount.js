import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getUnreadCount } from '../services/chatService';

const POLL_INTERVAL_MS = 15000;
export const UNREAD_REFRESH_EVENT = 'roomievibe:unread-refresh';

// Call after opening a conversation so badges drop right away instead of waiting for the next poll.
export function requestUnreadRefresh() {
  window.dispatchEvent(new Event(UNREAD_REFRESH_EVENT));
}

export function useUnreadCount() {
  const { user } = useAuth();
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!user) {
      setCount(0);
      return undefined;
    }

    let cancelled = false;
    function load() {
      getUnreadCount()
        .then((data) => {
          if (!cancelled) setCount(data.count);
        })
        .catch(() => {});
    }

    load();
    const interval = setInterval(load, POLL_INTERVAL_MS);
    window.addEventListener(UNREAD_REFRESH_EVENT, load);
    return () => {
      cancelled = true;
      clearInterval(interval);
      window.removeEventListener(UNREAD_REFRESH_EVENT, load);
    };
  }, [user]);

  return count;
}
