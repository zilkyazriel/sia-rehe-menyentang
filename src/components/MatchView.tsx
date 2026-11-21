import React, { useState } from 'react';
import { Trophy, Undo2 } from 'lucide-react';
import type { Match, Player } from '../types/tournament';
import { ConfirmDialog } from './ConfirmDialog';
import { TEKS } from '../lib/teks';

interface MatchViewProps {
  matches: Match[];
  players: Player[];
  currentMatchIndex?: number;
  onRecordWinner: (matchId: string, winnerId: string) => void;
  onEditResult: (matchId: string, newWinnerId: string) => void;
  onUndo: () => void;
  canUndo: boolean;
  onOpenChampionModal?: () => void;
}

export const MatchView: React.FC<MatchViewProps> = ({
  matches,
  onRecordWinner,
  onEditResult,
  onUndo,
  canUndo,
  onOpenChampionModal,
}) => {
  const activeQueue = matches.filter(m => !m.isBye);
  const currentMatch = activeQueue.find(m => m.status !== 'completed') || null;

  const [pendingWinner, setPendingWinner] = useState<{
    matchId: string;
    winnerId: string;
    winnerName: string;
  } | null>(null);

  const [editingMatch, setEditingMatch] = useState<Match | null>(null);

  const triggerHaptic = () => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(25);
      } catch {
        // Abaikan jika device tidak mengizinkan vibrasi
      }
    }
  };

  const handleSelectWinner = (match: Match, winnerId: string, winnerName: string) => {
    triggerHaptic();
    setPendingWinner({
      matchId: match.id,
      winnerId,
      winnerName,
    });
  };

  const confirmPendingWinner = () => {
    if (pendingWinner) {
      onRecordWinner(pendingWinner.matchId, pendingWinner.winnerId);
      setPendingWinner(null);
    }
  };

  const handleSelectCorrectionWinner = (newWinnerId: string) => {
    if (editingMatch) {
      triggerHaptic();
      onEditResult(editingMatch.id, newWinnerId);
      setEditingMatch(null);
    }
  };

  const completedMatches = activeQueue.filter(m => m.status === 'completed');

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
      {/* 1. MATCH AKTIF - SPOTLIGHT UTAMA (MODERN LIVE MATCH CENTER) */}
      {currentMatch ? (
        <section
          aria-label="Match aktif"
          className="rounded-2xl border-2 border-emerald-500/50 bg-white dark:bg-[#121c17] p-5 shadow-lg shadow-emerald-950/5 dark:shadow-black/40 transition-all"
        >
          {/* Header Info Match */}
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100 dark:border-white/10">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-scoreboard text-xs uppercase tracking-wider text-emerald-700 dark:text-emerald-400 font-bold">
                {TEKS.match.sedangMain}
              </span>
            </div>
            <span className="font-scoreboard text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300">
              {TEKS.match.matchNomor(currentMatch.matchNumber)}
            </span>
          </div>

          {/* DUA TOMBOL PEMENANG UTAMA (MIN 64PX, THUMB-FRIENDLY MODERN CARDS) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Pemain A */}
            <button
              type="button"
              onClick={() =>
                handleSelectWinner(
                  currentMatch,
                  currentMatch.playerAId || '',
                  currentMatch.playerAName
                )
              }
              disabled={!currentMatch.playerAId}
              className="btn-pressable min-h-18 p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 hover:border-emerald-500 dark:hover:border-emerald-500 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/40 text-left flex flex-col justify-between transition-all group"
            >
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {TEKS.match.pemenangA}
              </span>
              <div className="flex items-baseline justify-between mt-1.5">
                <span className="font-scoreboard text-2xl font-bold tracking-tight text-slate-900 dark:text-white truncate">
                  {currentMatch.playerAName}
                </span>
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider ml-2 shrink-0 group-hover:translate-x-0.5 transition-transform">
                  {TEKS.match.tombolMenang} &rarr;
                </span>
              </div>
            </button>

            {/* Pemain B */}
            <button
              type="button"
              onClick={() =>
                handleSelectWinner(
                  currentMatch,
                  currentMatch.playerBId || '',
                  currentMatch.playerBName
                )
              }
              disabled={!currentMatch.playerBId}
              className="btn-pressable min-h-18 p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 hover:border-emerald-500 dark:hover:border-emerald-500 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/40 text-left flex flex-col justify-between transition-all group"
            >
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {TEKS.match.pemenangB}
              </span>
              <div className="flex items-baseline justify-between mt-1.5">
                <span className="font-scoreboard text-2xl font-bold tracking-tight text-slate-900 dark:text-white truncate">
                  {currentMatch.playerBName}
                </span>
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider ml-2 shrink-0 group-hover:translate-x-0.5 transition-transform">
                  {TEKS.match.tombolMenang} &rarr;
                </span>
              </div>
            </button>
          </div>

          {canUndo && (
            <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-white/10 flex justify-end">
              <button
                type="button"
                onClick={onUndo}
                className="btn-pressable min-h-12 px-3 text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline"
              >
                &larr; {TEKS.nav.undo}
              </button>
            </div>
          )}
        </section>
      ) : (
        <div className="p-6 sm:p-8 border-2 border-emerald-500/50 bg-white dark:bg-[#121c17] rounded-3xl text-center space-y-4 shadow-xl shadow-emerald-950/5 dark:shadow-black/40">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-500 font-scoreboard text-2xl font-black">
            1
          </div>
          <div>
            <h3 className="font-scoreboard text-2xl font-bold uppercase tracking-tight text-slate-900 dark:text-white">
              {TEKS.match.semuaSelesai}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Seluruh pertandingan telah selesai dimainkan.
            </p>
          </div>

          {onOpenChampionModal && (
            <button
              type="button"
              onClick={onOpenChampionModal}
              className="btn-pressable w-full min-h-14 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-scoreboard text-base font-bold uppercase tracking-wider shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2"
            >
              <Trophy className="w-5 h-5 text-amber-300" />
              <span>Lihat Hasil Akhir & Juara</span>
            </button>
          )}

          {canUndo && (
            <div className="pt-1 flex justify-center">
              <button
                type="button"
                onClick={onUndo}
                className="btn-pressable min-h-10 px-3 text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1.5"
              >
                <Undo2 className="w-3.5 h-3.5" />
                <span>{TEKS.nav.undo} hasil terakhir</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* 2. MATCH BERIKUTNYA */}
      {currentMatch && (
        <section aria-label="Jadwal berikutnya" className="space-y-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 px-1">
            {TEKS.match.berikutnya}
          </h2>

          <div className="divide-y divide-slate-100 dark:divide-white/5 rounded-2xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-[#121c17] shadow-sm">
            {activeQueue
              .filter(m => m.status !== 'completed' && m.id !== currentMatch.id)
              .slice(0, 4)
              .map(nextM => (
                <div
                  key={nextM.id}
                  className="px-4 py-3 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="font-scoreboard font-bold text-slate-400 dark:text-slate-500 w-12">
                      #{nextM.matchNumber}
                    </span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {nextM.playerAName} <span className="text-slate-400 font-normal">vs</span> {nextM.playerBName}
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </section>
      )}

      {/* 3. RIWAYAT & KOREKSI */}
      {completedMatches.length > 0 && (
        <section aria-label="Riwayat pertandingan" className="space-y-2 pt-1">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 px-1">
            {TEKS.match.riwayat(completedMatches.length)}
          </h2>

          <div className="divide-y divide-slate-100 dark:divide-white/5 rounded-2xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-[#121c17] shadow-sm max-h-56 overflow-y-auto">
            {[...completedMatches].reverse().map(m => {
              const isAWinner = m.winnerId === m.playerAId;
              const isBWinner = m.winnerId === m.playerBId;

              return (
                <div
                  key={m.id}
                  className="px-4 py-2.5 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2.5 flex-1 min-w-0 pr-2">
                    <span className="font-scoreboard text-slate-400 dark:text-slate-500 w-10 shrink-0">
                      #{m.matchNumber}
                    </span>
                    <span
                      className={`truncate ${
                        isAWinner
                          ? 'font-bold text-emerald-700 dark:text-emerald-400'
                          : 'text-slate-400 dark:text-slate-500'
                      }`}
                    >
                      {m.playerAName}
                    </span>
                    <span className="text-slate-300 dark:text-white/20 text-[10px]">&bull;</span>
                    <span
                      className={`truncate ${
                        isBWinner
                          ? 'font-bold text-emerald-700 dark:text-emerald-400'
                          : 'text-slate-400 dark:text-slate-500'
                      }`}
                    >
                      {m.playerBName}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setEditingMatch(m)}
                    className="min-h-12 px-2.5 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white"
                  >
                    {TEKS.match.koreksi}
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* DIALOG KONFIRMASI PEMENANG */}
      <ConfirmDialog
        isOpen={Boolean(pendingWinner)}
        title={TEKS.dialog.konfirmasiPemenangJudul}
        message={
          pendingWinner ? TEKS.dialog.konfirmasiPemenangPesan(pendingWinner.winnerName) : ''
        }
        confirmText={TEKS.dialog.simpan}
        cancelText={TEKS.dialog.batal}
        onConfirm={confirmPendingWinner}
        onCancel={() => setPendingWinner(null)}
      />

      {/* DIALOG KOREKSI HASIL */}
      {editingMatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#121c17] p-5 shadow-2xl text-slate-900 dark:text-white space-y-3.5">
            <h3 className="font-scoreboard text-lg font-bold uppercase tracking-wide">
              {TEKS.dialog.koreksiJudul(editingMatch.matchNumber)}
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400">{TEKS.dialog.koreksiPesan}</p>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => handleSelectCorrectionWinner(editingMatch.playerAId || '')}
                className={`w-full min-h-12 p-3 text-left rounded-xl border font-scoreboard text-base font-bold transition-all ${
                  editingMatch.winnerId === editingMatch.playerAId
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 ring-1 ring-emerald-500'
                    : 'border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-800 dark:text-slate-200'
                }`}
              >
                {editingMatch.playerAName}
              </button>

              <button
                type="button"
                onClick={() => handleSelectCorrectionWinner(editingMatch.playerBId || '')}
                className={`w-full min-h-12 p-3 text-left rounded-xl border font-scoreboard text-base font-bold transition-all ${
                  editingMatch.winnerId === editingMatch.playerBId
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 ring-1 ring-emerald-500'
                    : 'border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-800 dark:text-slate-200'
                }`}
              >
                {editingMatch.playerBName}
              </button>
            </div>

            <button
              type="button"
              onClick={() => setEditingMatch(null)}
              className="w-full min-h-12 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white"
            >
              {TEKS.dialog.batal}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
