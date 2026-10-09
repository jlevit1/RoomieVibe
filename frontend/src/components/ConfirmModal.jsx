import { useEffect, useState } from 'react';

// `requireInput` shows a textarea whose value is passed to onConfirm; `inputOptional` lets it be left empty.
export default function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = 'Xác nhận',
  cancelLabel = 'Hủy',
  danger = false,
  requireInput = false,
  inputOptional = false,
  inputPlaceholder = '',
  onConfirm,
  onCancel,
}) {
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    if (open) setInputValue('');
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    function handleKey(e) {
      if (e.key === 'Escape') onCancel();
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 px-4" onClick={onCancel}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-[0_24px_48px_-12px_rgba(20,79,112,0.35)]"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="confirm-modal-title" className="text-lg font-semibold text-gray-900">
          {title}
        </h2>
        {message && <p className="mt-2 text-sm leading-relaxed text-gray-600">{message}</p>}
        {requireInput && (
          <textarea
            autoFocus
            aria-label={title}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={inputPlaceholder}
            rows={3}
            className="field-input mt-4 resize-none"
          />
        )}
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onCancel} className="btn-secondary">
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={() => onConfirm(requireInput ? inputValue : undefined)}
            disabled={requireInput && !inputOptional && !inputValue.trim()}
            className={danger ? 'btn-danger' : 'btn-primary'}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
