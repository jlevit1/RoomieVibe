// React Router gives the first history entry of every page load the same key ("default"), so state saved
// for it would leak into the next visit. On a fresh visit (not a reload or Back/Forward into the app) drop
// whatever was stored for "default" before anything reads it.
const NAVIGATION_TYPE =
  typeof performance !== 'undefined' ? performance.getEntriesByType?.('navigation')?.[0]?.type : undefined;
const RESUMING = NAVIGATION_TYPE === 'reload' || NAVIGATION_TYPE === 'back_forward';

export const SCROLL_STORAGE_KEY = 'scroll-positions';
export const STATE_STORAGE_PREFIX = 'history-state:';

if (!RESUMING) {
  try {
    Object.keys(sessionStorage)
      .filter((k) => k.startsWith(`${STATE_STORAGE_PREFIX}default:`))
      .forEach((k) => sessionStorage.removeItem(k));
    const positions = JSON.parse(sessionStorage.getItem(SCROLL_STORAGE_KEY)) || {};
    delete positions.default;
    sessionStorage.setItem(SCROLL_STORAGE_KEY, JSON.stringify(positions));
  } catch {
    // Storage blocked: nothing was saved either.
  }
}
