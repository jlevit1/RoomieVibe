import { useState } from 'react';
import { Heart } from 'lucide-react';

export default function FavoriteButton({ className = '' }) {
  const [saved, setSaved] = useState(false);

  function handleClick(e) {
    e.preventDefault();
    e.stopPropagation();
    setSaved((s) => !s);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label="Lưu tin yêu thích"
      className={`flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 bg-white shadow-sm transition-colors ${
        saved ? 'text-rose-600' : 'text-gray-400 hover:text-rose-600'
      } ${className}`}
    >
      <Heart size={16} fill={saved ? 'currentColor' : 'none'} />
    </button>
  );
}
