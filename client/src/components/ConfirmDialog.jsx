export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  danger = false,
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[2000] flex items-end justify-center bg-ink-900/40 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
    >
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label="Close dialog"
        onClick={onCancel}
      />
      <div className="relative w-full max-w-md rounded-2xl border border-ink-200 bg-white p-5 shadow-panel">
        <h2 id="confirm-title" className="text-lg font-semibold text-ink-900">
          {title}
        </h2>
        <p className="mt-2 text-sm text-ink-600">{message}</p>
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-ink-200 px-4 py-2 text-sm font-medium text-ink-700 hover:bg-ink-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`rounded-xl px-4 py-2 text-sm font-semibold text-white ${
              danger ? 'bg-red-600 hover:bg-red-700' : 'bg-brand-600 hover:bg-brand-700'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
