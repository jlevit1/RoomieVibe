function getPageNumbers(current, total) {
  const pages = [];
  const window = 1;

  for (let i = 0; i < total; i++) {
    const isEdge = i === 0 || i === total - 1;
    const isNearCurrent = Math.abs(i - current) <= window;
    if (isEdge || isNearCurrent) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== '...') {
      pages.push('...');
    }
  }
  return pages;
}

export default function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;

  return (
    <nav aria-label="Phân trang" className="mt-10 flex items-center justify-center gap-1">
      <button
        type="button"
        disabled={page === 0}
        onClick={() => onChange(page - 1)}
        className="rounded-xl border border-gray-300 px-3.5 py-2 text-sm font-medium text-gray-700 transition-colors hover:border-gray-400 disabled:opacity-40 disabled:hover:border-gray-300"
      >
        Trước
      </button>

      {getPageNumbers(page, totalPages).map((p, idx) =>
        p === '...' ? (
          <span key={`dots-${idx}`} className="px-2 text-sm text-gray-400">
            ...
          </span>
        ) : (
          <button
            type="button"
            key={p}
            onClick={() => onChange(p)}
            aria-current={p === page ? 'page' : undefined}
            className={`h-9 w-9 rounded-xl text-sm font-medium transition-colors ${
              p === page ? 'bg-gray-900 text-white' : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            {p + 1}
          </button>
        )
      )}

      <button
        type="button"
        disabled={page + 1 >= totalPages}
        onClick={() => onChange(page + 1)}
        className="rounded-xl border border-gray-300 px-3.5 py-2 text-sm font-medium text-gray-700 transition-colors hover:border-gray-400 disabled:opacity-40 disabled:hover:border-gray-300"
      >
        Sau
      </button>
    </nav>
  );
}
