import React from 'react';
import { Undo2, RotateCcw, Sun, Moon, Share2 } from 'lucide-react';
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
  onOpenImportExport?: () => void;
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
  onOpenImportExport,
}) => {
  const activeMatches = tournament?.matches.filter(m => !m.isBye) || [];
  const completedCount = activeMatches.filter(m => m.status === 'completed').length;
  const totalCount = activeMatches.length;

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-white/90 dark:bg-[#0c1411]/90 border-b border-slate-200/80 dark:border-white/10 transition-colors pt-[env(safe-area-inset-top,0px)]">
      <div className="max-w-3xl mx-auto px-3 sm:px-4 py-2 sm:py-2.5">
        <div className="flex items-center justify-between gap-2">
          {/* Logo & Brand Title */}
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 shrink-0 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-scoreboard font-bold text-sm shadow-sm shadow-emerald-600/30">
              8
            </div>
            <div className="min-w-0">
              <span className="font-scoreboard text-sm sm:text-base md:text-lg font-bold tracking-tight text-slate-900 dark:text-white uppercase leading-none block truncate">
                {TEKS.app.title}
              </span>
            </div>
            {tournament && (
              <span className="shrink-0 font-scoreboard text-[11px] sm:text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/60">
                {completedCount}/{totalCount}
              </span>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            {tournament && (
              <>
                <button
                  type="button"
                  onClick={onUndo}
                  disabled={!canUndo}
                  title={TEKS.nav.undo}
                  aria-label={TEKS.nav.undo}
                  className="btn-pressable min-h-10 sm:min-h-11 px-2.5 sm:px-3 text-xs font-semibold rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 disabled:opacity-30 disabled:pointer-events-none transition-colors flex items-center gap-1.5"
                >
                  <Undo2 className="w-4 h-4 shrink-0" />
                  <span className="hidden sm:inline">{TEKS.nav.undo}</span>
                </button>

                <button
                  type="button"
                  onClick={onReset}
                  title={TEKS.nav.gameBaru}
                  aria-label={TEKS.nav.gameBaru}
                  className="btn-pressable min-h-10 sm:min-h-11 px-2.5 sm:px-3 text-xs font-semibold rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 transition-colors flex items-center gap-1.5"
                >
                  <RotateCcw className="w-4 h-4 shrink-0" />
                  <span className="hidden sm:inline">{TEKS.nav.gameBaru}</span>
                </button>
              </>
            )}

            <button
              type="button"
              onClick={onToggleTheme}
              title={theme === 'dark' ? 'Mode terang' : 'Mode gelap'}
              aria-label="Ganti mode gelap/terang"
              className="btn-pressable min-h-10 min-w-10 sm:min-h-11 px-2.5 sm:px-3 text-xs font-semibold rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 transition-colors flex items-center justify-center gap-1.5"
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="hidden sm:inline">Terang</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-slate-600 shrink-0" />
                  <span className="hidden sm:inline">Gelap</span>
                </>
              )}
            </button>

            {onOpenImportExport && (
              <button
                type="button"
                onClick={onOpenImportExport}
                title="Salin & Impor Data"
                aria-label="Salin dan Impor Data"
                className="btn-pressable min-h-10 min-w-10 sm:min-h-11 px-2.5 sm:px-3 text-xs font-semibold rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 transition-colors flex items-center justify-center gap-1.5"
              >
                <Share2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span className="hidden md:inline">Data</span>
              </button>
            )}
          </div>
        </div>

        {/* Navigation Tabs: Kiri (Jadwal), Tengah (Bracket), Kanan (Klasemen) */}
        {tournament && (
          <nav className="grid grid-cols-3 gap-1 mt-2.5 p-1 rounded-xl bg-slate-200/60 dark:bg-white/5 border border-slate-200/80 dark:border-white/5">
            {/* Kiri: Jadwal */}
            <button
              type="button"
              onClick={() => onChangeTab('matches')}
              className={`min-h-11 py-2 text-xs font-semibold rounded-lg transition-all text-center ${
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
              className={`min-h-11 py-2 text-xs font-semibold rounded-lg transition-all text-center ${
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
              className={`min-h-11 py-2 text-xs font-semibold rounded-lg transition-all text-center ${
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
