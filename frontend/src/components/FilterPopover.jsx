import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, X } from 'lucide-react';
import { filterPillClass } from '../constants/filters';

const DESKTOP_QUERY = '(min-width: 640px)';

function useIsDesktop() {
  const [matches, setMatches] = useState(() => typeof window === 'undefined' || window.matchMedia(DESKTOP_QUERY).matches);
  useEffect(() => {
    const mql = window.matchMedia(DESKTOP_QUERY);
    const onChange = () => setMatches(mql.matches);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);
  return matches;
}

// Dropdown under the pill on desktop, bottom sheet on phones.
// `width` must be a full static class (e.g. "sm:w-80") so Tailwind can see it.
export default function FilterPopover({ label, title, active, open, onToggle, onClose, children, width = 'sm:w-80' }) {
  const ref = useRef(null);
  const sheetRef = useRef(null);
  const isDesktop = useIsDesktop();

  useEffect(() => {
    if (!open) return undefined;
    function handleClick(e) {
      if (ref.current?.contains(e.target) || sheetRef.current?.contains(e.target)) return;
      onClose();
    }
    function handleKey(e) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open || isDesktop) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open, isDesktop]);

  return (
    <div ref={ref} className="relative flex-shrink-0">
      <button type="button" onClick={onToggle} aria-expanded={open} className={filterPillClass(active)}>
        {label}
        <ChevronDown size={15} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && isDesktop && (
        <div
          className={`absolute left-0 top-12 z-30 rounded-2xl border border-gray-200 bg-white p-5 shadow-[0_24px_48px_-24px_rgba(20,79,112,0.4)] ${width}`}
        >
          {children}
        </div>
      )}
      {open &&
        !isDesktop &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-end bg-gray-900/40">
            <div
              ref={sheetRef}
              role="dialog"
              aria-modal="true"
              aria-label={title || label}
              className="max-h-[85dvh] w-full overflow-y-auto rounded-t-2xl bg-white px-5 pb-8 pt-4"
            >
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-semibold text-gray-900">{title || label}</h2>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Đóng"
                  className="-mr-2 rounded-full p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                >
                  <X size={18} />
                </button>
              </div>
              {children}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
