import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getUnreadCount } from '../services/chatService';

const POLL_INTERVAL_MS = 15000;

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
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [user]);

  return count;
}
