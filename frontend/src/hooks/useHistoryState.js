import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { STATE_STORAGE_PREFIX } from '../utils/historyEntry';

function storageKey(locationKey, name) {
  return `${STATE_STORAGE_PREFIX}${locationKey}:${name}`;
}

function read(key, fallback) {
  try {
    const raw = sessionStorage.getItem(key);
    return raw == null ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
}

// useState that is remembered per browser-history entry: pressing Back to this page brings back the same
// value (selected tab, city chip, list/map toggle), while opening the page fresh starts from `initial`.
export function useHistoryState(name, initial) {
  const { key } = useLocation();
  const [value, setValue] = useState(() => read(storageKey(key, name), initial));

  useEffect(() => {
    try {
      sessionStorage.setItem(storageKey(key, name), JSON.stringify(value));
    } catch {
      // Storage full or blocked: the value just won't survive Back.
    }
  }, [key, name, value]);

  return [value, setValue];
}
