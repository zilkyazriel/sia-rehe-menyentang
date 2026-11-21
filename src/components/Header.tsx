import React from 'react';
import type { TournamentState } from '../types/tournament';
import { TEKS } from '../lib/teks';

interface HeaderProps {
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  tournament: TournamentState | null;
  activeTab: 'matches' | 'standings' | 'bracket';
  onChangeTab: (tab: 'matches' | 'standings' | 'bracket') => void;
  onUndo: () => void;
  canUndo: boolean;
  onReset: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  theme,
  onToggleTheme,
  tournament,
  activeTab,
  onChangeTab,
  onUndo,
  canUndo,
  onReset,
}) => {
  const activeMatches = tournament?.matches.filter(m => !m.isBye) || [];
  const completedCount = activeMatches.filter(m => m.status === 'completed').length;
  const totalCount = activeMatches.length;

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-white/85 dark:bg-[#0c1411]/90 border-b border-slate-200/80 dark:border-white/10 transition-colors">
      <div className="max-w-3xl mx-auto px-4 py-2.5">
        <div className="flex items-center justify-between gap-3">
          {/* Logo & Brand Title */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-scoreboard font-bold text-sm shadow-sm shadow-emerald-600/30">
              8
            </div>
            <div>
              <span className="font-scoreboard text-lg font-bold tracking-wide text-slate-900 dark:text-white uppercase leading-none block">
                {TEKS.app.title}
              </span>
            </div>
            {tournament && (
              <span className="font-scoreboard text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/60">
                {completedCount}/{totalCount}
              </span>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1.5">
            {tournament && (
              <>
                <button
                  type="button"
                  onClick={onUndo}
                  disabled={!canUndo}
                  className="btn-pressable min-h-12 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                >
                  {TEKS.nav.undo}
                </button>

                <button
                  type="button"
                  onClick={onReset}
                  className="btn-pressable min-h-12 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 transition-colors"
                >
                  {TEKS.nav.gameBaru}
                </button>
              </>
            )}

            <button
              type="button"
              onClick={onToggleTheme}
              className="btn-pressable min-h-12 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 transition-colors"
              aria-label="Toggle tema"
            >
              {theme === 'dark' ? 'Terang' : 'Gelap'}
            </button>
          </div>
        </div>

        {/* Navigation Tabs: Kiri (Jadwal), Tengah (Bracket), Kanan (Klasemen) */}
        {tournament && (
          <nav className="flex items-center gap-1 mt-2.5 p-1 rounded-xl bg-slate-200/60 dark:bg-white/5 border border-slate-200/80 dark:border-white/5">
            {/* Kiri: Jadwal */}
            <button
              type="button"
              onClick={() => onChangeTab('matches')}
              className={`flex-1 min-h-12 py-2 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'matches'
                  ? 'bg-white dark:bg-emerald-600 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {TEKS.nav.jadwal}
            </button>

            {/* Tengah: Bracket */}
            <button
              type="button"
              onClick={() => onChangeTab('bracket')}
              className={`flex-1 min-h-12 py-2 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'bracket'
                  ? 'bg-white dark:bg-emerald-600 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {TEKS.nav.bracket}
            </button>

            {/* Kanan: Klasemen */}
            <button
              type="button"
              onClick={() => onChangeTab('standings')}
              className={`flex-1 min-h-12 py-2 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'standings'
                  ? 'bg-white dark:bg-emerald-600 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {TEKS.nav.klasemen}
            </button>
          </nav>
        )}
      </div>
    </header>
  );
};
