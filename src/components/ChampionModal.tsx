import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import type { TournamentState } from '../types/tournament';
import { getTop3Winners } from '../utils/standings';
import { generateShareText } from '../utils/share';
import { TEKS } from '../lib/teks';

interface ChampionModalProps {
  state: TournamentState;
  isOpen: boolean;
  onClose: () => void;
  onReset: () => void;
  onShowToast: (text: string) => void;
}

export const ChampionModal: React.FC<ChampionModalProps> = ({
  state,
  isOpen,
  onClose,
  onReset,
  onShowToast,
}) => {
  const { config, matches } = state;
  const winners = getTop3Winners(config.format, config.players, matches);

  useEffect(() => {
    if (isOpen) {
      const prefersReducedMotion =
        window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      if (!prefersReducedMotion) {
        confetti({
          particleCount: 60,
          spread: 70,
          origin: { y: 0.65 },
          colors: ['#10b981', '#f59e0b', '#3b82f6', '#059669'],
        });
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopyShare = async () => {
    const text = generateShareText(state);
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        onShowToast(TEKS.toast.disalin);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        onShowToast(TEKS.toast.disalin);
      }
    } catch {
      onShowToast(TEKS.toast.disalin);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div
        className="w-full max-w-sm rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#121c17] p-6 text-slate-900 dark:text-white text-center space-y-4 shadow-2xl"
        role="dialog"
        aria-modal="true"
      >
        <div className="w-12 h-12 mx-auto rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-scoreboard text-2xl font-black">
          1
        </div>

        <h2 className="font-scoreboard text-2xl font-bold uppercase tracking-wide text-slate-900 dark:text-white">
          {TEKS.dialog.juaraJudul}
        </h2>

        {/* Podium 1, 2, 3 */}
        <div className="grid grid-cols-3 gap-2 items-end pt-2">
          {/* Juara 2 */}
          <div className="flex flex-col items-center">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 truncate max-w-full mb-1">
              {winners.second?.name || '-'}
            </span>
            <div className="w-full bg-slate-100 dark:bg-white/10 border-t-2 border-slate-300 dark:border-slate-500 py-3 rounded-t-xl">
              <span className="font-scoreboard text-base font-bold text-slate-700 dark:text-slate-300">2</span>
            </div>
          </div>

          {/* Juara 1 */}
          <div className="flex flex-col items-center -mt-3">
            <span className="text-sm font-bold text-amber-600 dark:text-amber-400 truncate max-w-full mb-1">
              {winners.first?.name || '-'}
            </span>
            <div className="w-full bg-amber-50 dark:bg-amber-950/40 border-t-2 border-amber-500 py-5 rounded-t-xl">
              <span className="font-scoreboard text-2xl font-black text-amber-600 dark:text-amber-400">1</span>
            </div>
          </div>

          {/* Juara 3 */}
          <div className="flex flex-col items-center">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 truncate max-w-full mb-1">
              {winners.third?.name || '-'}
            </span>
            <div className="w-full bg-slate-100 dark:bg-white/10 border-t-2 border-orange-400 py-2 rounded-t-xl">
              <span className="font-scoreboard text-base font-bold text-orange-700 dark:text-orange-400">3</span>
            </div>
          </div>
        </div>

        {/* Tombol Aksi */}
        <div className="space-y-2 pt-2">
          <button
            type="button"
            onClick={handleCopyShare}
            className="btn-pressable w-full min-h-12 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-scoreboard text-sm font-bold uppercase tracking-wider shadow-md shadow-emerald-600/30"
          >
            {TEKS.dialog.salinHasil}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="btn-pressable w-full min-h-12 py-2 px-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 text-xs font-semibold"
          >
            {TEKS.dialog.tutup}
          </button>

          <button
            type="button"
            onClick={onReset}
            className="btn-pressable w-full min-h-12 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400"
          >
            {TEKS.nav.gameBaru}
          </button>
        </div>
      </div>
    </div>
  );
};
