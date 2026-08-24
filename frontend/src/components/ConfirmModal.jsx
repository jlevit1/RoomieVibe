import { useEffect, useState } from 'react';

export default function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = 'Xác nhận',
  cancelLabel = 'Hủy',
  danger = false,
  requireInput = false,
  inputPlaceholder = '',
  onConfirm,
  onCancel,
}) {
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    if (open) setInputValue('');
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="mb-1.5 text-base font-semibold text-gray-900">{title}</h3>
        {message && <p className="mb-4 text-sm leading-relaxed text-gray-600">{message}</p>}
        {requireInput && (
          <textarea
            autoFocus
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={inputPlaceholder}
            rows={3}
            className="mb-4 w-full rounded-xl border border-gray-200 p-3 text-sm focus:border-rose-400 focus:outline-none"
          />
        )}
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={() => onConfirm(requireInput ? inputValue : undefined)}
            disabled={requireInput && !inputValue.trim()}
            className={`rounded-full px-4 py-2 text-sm font-medium text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
              danger ? 'bg-red-600 hover:bg-red-700' : 'bg-rose-600 hover:bg-rose-700'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
