import React from 'react';

interface RippleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'brass' | 'felt';
  size?: 'sm' | 'md' | 'lg' | 'jumbo';
  children: React.ReactNode;
}

export const RippleButton: React.FC<RippleButtonProps> = ({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  disabled,
  ...props
}) => {
  let sizeStyles = 'min-h-12 px-4 py-2.5 text-sm font-semibold';
  if (size === 'sm') sizeStyles = 'min-h-12 px-3 py-2 text-xs font-semibold';
  if (size === 'lg') sizeStyles = 'min-h-12 px-5 py-3 text-base font-bold';
  if (size === 'jumbo') sizeStyles = 'min-h-16 px-6 py-4 text-lg font-bold';

  let variantStyles =
    'bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white shadow-sm';

  if (variant === 'secondary') {
    variantStyles =
      'bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-800 border border-slate-200 dark:bg-white/10 dark:hover:bg-white/15 dark:active:bg-white/20 dark:text-white dark:border-white/10';
  } else if (variant === 'danger') {
    variantStyles =
      'bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white shadow-sm';
  } else if (variant === 'ghost') {
    variantStyles =
      'bg-transparent hover:bg-slate-100 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white';
  } else if (variant === 'brass') {
    variantStyles =
      'bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 font-bold shadow-sm';
  } else if (variant === 'felt') {
    variantStyles =
      'bg-emerald-950 hover:bg-emerald-900 active:bg-emerald-950 text-emerald-200 border border-emerald-800/60';
  }

  const disabledStyles = disabled
    ? 'opacity-40 cursor-not-allowed pointer-events-none'
    : 'cursor-pointer';

  return (
    <button
      {...props}
      disabled={disabled}
      className={`btn-pressable inline-flex items-center justify-center gap-2 rounded-xl select-none touch-manipulation focus-visible:outline-none transition-all ${sizeStyles} ${variantStyles} ${disabledStyles} ${className}`}
    >
      {children}
    </button>
  );
};
