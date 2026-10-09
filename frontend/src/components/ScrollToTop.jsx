import { useEffect, useLayoutEffect, useRef } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';
import { SCROLL_STORAGE_KEY as STORAGE_KEY } from '../utils/historyEntry';

const RESTORE_WINDOW_MS = 4000;
const USER_SCROLL_EVENTS = ['wheel', 'touchstart', 'keydown', 'mousedown'];

function loadPositions() {
  try {
    return JSON.parse(sessionStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}

function savePositions(positions) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(positions));
  } catch {
    // Storage full or blocked: Back just won't restore the position.
  }
}

// Scroll handling for page navigation:
// - opening a different page starts at the top (the router otherwise keeps the previous page's offset);
// - filter/sort changes on the same page keep the current offset;
// - Back/Forward returns to where the user was. Pages re-fetch their data on the way back, so the saved
//   offset is re-applied whenever the content grows, until the user scrolls or a few seconds pass.
export default function ScrollToTop() {
  const { key, pathname } = useLocation();
  const navigationType = useNavigationType();
  const positions = useRef(loadPositions());
  const currentKey = useRef(key);
  const lastPathname = useRef(pathname);

  useEffect(() => {
    if ('scrollRestoration' in window.history) window.history.scrollRestoration = 'manual';

    let frame = 0;
    function record() {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        positions.current[currentKey.current] = Math.round(window.scrollY);
        savePositions(positions.current);
      });
    }
    window.addEventListener('scroll', record, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', record);
    };
  }, []);

  useLayoutEffect(() => {
    const samePage = lastPathname.current === pathname;
    currentKey.current = key;
    lastPathname.current = pathname;

    if (navigationType !== 'POP') {
      if (samePage) {
        positions.current[key] = Math.round(window.scrollY);
      } else {
        window.scrollTo(0, 0);
      }
      return undefined;
    }

    const target = positions.current[key] || 0;
    window.scrollTo(0, target);
    if (target === 0) return undefined;

    let stopped = false;
    const observer = new ResizeObserver(() => window.scrollTo(0, target));
    const timer = setTimeout(stop, RESTORE_WINDOW_MS);
    function stop() {
      if (stopped) return;
      stopped = true;
      observer.disconnect();
      clearTimeout(timer);
      USER_SCROLL_EVENTS.forEach((type) => window.removeEventListener(type, stop));
    }
    USER_SCROLL_EVENTS.forEach((type) => window.addEventListener(type, stop, { passive: true }));
    observer.observe(document.body);
    return stop;
  }, [key, pathname, navigationType]);

  return null;
}
