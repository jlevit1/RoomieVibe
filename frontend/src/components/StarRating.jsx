import { Star } from 'lucide-react';

export default function StarRating({ rating, count }) {
  return (
    <span className="inline-flex items-center gap-1 text-sm">
      <Star size={14} className="text-amber-500" fill="currentColor" />
      <span className="font-medium text-gray-800">{rating}</span>
      {count != null && <span className="text-gray-400">({count})</span>}
    </span>
  );
}
