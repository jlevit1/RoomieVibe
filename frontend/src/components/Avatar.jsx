const SIZES = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-9 w-9 text-sm',
  lg: 'h-11 w-11 text-base',
};

export default function Avatar({ name, size = 'md', className = '' }) {
  const initial = name?.charAt(0)?.toUpperCase() || '?';
  return (
    <span
      className={`flex flex-shrink-0 items-center justify-center rounded-full bg-rose-600 font-semibold text-white ${SIZES[size]} ${className}`}
    >
      {initial}
    </span>
  );
}
