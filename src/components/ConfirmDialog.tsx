import React from 'react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: 'primary' | 'danger' | 'amber' | 'emerald';
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Lanjutkan',
  cancelText = 'Batal',
  confirmVariant = 'emerald',
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div
        className="w-full max-w-sm rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#121c17] p-5 text-slate-900 dark:text-white space-y-3.5 shadow-2xl"
        role="dialog"
        aria-modal="true"
      >
        <h3 className="font-scoreboard text-lg font-bold uppercase tracking-wide">
          {title}
        </h3>
        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{message}</p>

        <div className="grid grid-cols-2 gap-2.5 pt-1">
          <button
            type="button"
            onClick={onCancel}
            className="btn-pressable min-h-12 px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`btn-pressable min-h-12 px-3 py-2 text-xs font-bold rounded-xl ${
              confirmVariant === 'danger'
                ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-sm'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
