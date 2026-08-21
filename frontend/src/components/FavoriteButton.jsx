import { Heart } from 'lucide-react';

export default function FavoriteButton({ favorited = false, onToggle, className = '' }) {
  function handleClick(e) {
    e.preventDefault();
    e.stopPropagation();
    onToggle?.();
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={favorited ? 'Bỏ lưu tin yêu thích' : 'Lưu tin yêu thích'}
      className={`flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 bg-white shadow-sm transition-colors ${
        favorited ? 'text-rose-600' : 'text-gray-400 hover:text-rose-600'
      } ${className}`}
    >
      <Heart size={16} fill={favorited ? 'currentColor' : 'none'} />
    </button>
  );
}
