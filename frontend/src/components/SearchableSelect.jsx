import { useEffect, useRef, useState } from 'react';

export default function SearchableSelect({
  id,
  name,
  value,
  onChange,
  options,
  placeholder,
  required,
  disabled,
  className,
}) {
  const [query, setQuery] = useState(value || '');
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    setQuery(value || '');
  }, [value]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
        setQuery(value || '');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [value]);

  const filtered = query
    ? options.filter((o) => o.toLowerCase().includes(query.toLowerCase()))
    : options;

  function handleSelect(option) {
    setOpen(false);
    setQuery(option);
    onChange({ target: { name, value: option } });
  }

  return (
    <div ref={containerRef} className="relative">
      <input
        id={id}
        name={name}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        required={required}
        disabled={disabled}
        placeholder={placeholder}
        autoComplete="off"
        className={className}
      />
      {open && !disabled && (
        <ul className="absolute z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-lg">
          {filtered.length === 0 ? (
            <li className="px-3.5 py-2.5 text-sm text-gray-400">Không tìm thấy</li>
          ) : (
            filtered.map((option) => (
              <li key={option}>
                <button
                  type="button"
                  onClick={() => handleSelect(option)}
                  className="block w-full px-3.5 py-2 text-left text-sm text-gray-700 hover:bg-rose-50"
                >
                  {option}
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
