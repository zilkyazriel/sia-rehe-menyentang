import React from 'react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'warning' | 'info';
  text: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const Toast: React.FC<ToastProps> = ({ toasts }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-1.5 pointer-events-none w-full max-w-xs px-3">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className="px-4 py-2.5 rounded-full border border-slate-800/80 dark:border-emerald-500/30 bg-slate-900/90 dark:bg-[#121c17]/95 text-white dark:text-emerald-200 text-xs font-semibold shadow-lg shadow-black/15 backdrop-blur-md"
        >
          {toast.text}
        </div>
      ))}
    </div>
  );
};
