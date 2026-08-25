import { useEffect, useRef, useState } from 'react';
import { MapPin } from 'lucide-react';
import { getPlaceDetail, getPlaceSuggestions } from '../services/goongService';

export default function AddressAutocomplete({
  id,
  name,
  value,
  onChange,
  onSelectLocation,
  required,
  className,
}) {
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleInputChange(e) {
    onChange(e);
    const query = e.target.value;
    clearTimeout(debounceRef.current);
    if (!query || query.length < 3) {
      setSuggestions([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      const predictions = await getPlaceSuggestions(query);
      setSuggestions(predictions);
      setOpen(predictions.length > 0);
    }, 350);
  }

  async function handleSelect(prediction) {
    setOpen(false);
    setSuggestions([]);
    onChange({ target: { name, value: prediction.description } });
    const detail = await getPlaceDetail(prediction.place_id);
    if (detail) {
      onSelectLocation(detail);
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <input
        id={id}
        name={name}
        value={value}
        onChange={handleInputChange}
        onFocus={() => suggestions.length > 0 && setOpen(true)}
        required={required}
        autoComplete="off"
        className={className}
      />
      {open && (
        <ul className="absolute z-20 mt-1 w-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
          {suggestions.map((s) => (
            <li key={s.place_id}>
              <button
                type="button"
                onClick={() => handleSelect(s)}
                className="flex w-full items-start gap-2 px-3.5 py-2.5 text-left text-sm hover:bg-rose-50"
              >
                <MapPin size={15} className="mt-0.5 flex-shrink-0 text-rose-500" />
                <span>
                  <span className="block text-gray-900">
                    {s.structured_formatting?.main_text || s.description}
                  </span>
                  {s.structured_formatting?.secondary_text && (
                    <span className="block text-xs text-gray-500">
                      {s.structured_formatting.secondary_text}
                    </span>
                  )}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
