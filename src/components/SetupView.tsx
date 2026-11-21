import React, { useState } from 'react';
import type { Player, TournamentConfig, TournamentFormat } from '../types/tournament';
import { TEKS } from '../lib/teks';

interface SetupViewProps {
  onStart: (config: TournamentConfig) => void;
}

export const SetupView: React.FC<SetupViewProps> = ({ onStart }) => {
  const [players, setPlayers] = useState<Player[]>([
    { id: 'p1', name: 'Rian' },
    { id: 'p2', name: 'Budi' },
    { id: 'p3', name: 'Doni' },
    { id: 'p4', name: 'Eko' },
  ]);

  const [inputName, setInputName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [format, setFormat] = useState<TournamentFormat>('round-robin');
  const [rounds, setRounds] = useState<number>(1);

  const handleAddPlayer = () => {
    const trimmed = inputName.trim();
    if (!trimmed) {
      setErrorMessage(TEKS.error.namaKosong);
      return;
    }

    const isDuplicate = players.some(
      p => p.name.trim().toLowerCase() === trimmed.toLowerCase()
    );

    if (isDuplicate) {
      setErrorMessage(TEKS.error.namaKembar(trimmed));
      return;
    }

    setPlayers(prev => [
      ...prev,
      { id: `player-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`, name: trimmed },
    ]);
    setInputName('');
    setErrorMessage(null);
  };

  const startEditing = (p: Player) => {
    setEditingId(p.id);
    setEditingName(p.name);
    setErrorMessage(null);
  };

  const saveEditing = (id: string) => {
    const trimmed = editingName.trim();
    if (!trimmed) {
      setErrorMessage(TEKS.error.namaKosong);
      return;
    }

    const isDuplicate = players.some(
      p => p.id !== id && p.name.trim().toLowerCase() === trimmed.toLowerCase()
    );

    if (isDuplicate) {
      setErrorMessage(TEKS.error.namaKembar(trimmed));
      return;
    }

    setPlayers(prev => prev.map(p => (p.id === id ? { ...p, name: trimmed } : p)));
    setEditingId(null);
    setEditingName('');
    setErrorMessage(null);
  };

  const removePlayer = (id: string) => {
    setPlayers(prev => prev.filter(p => p.id !== id));
    setErrorMessage(null);
  };

  const n = players.length;
  let totalMatches = 0;
  if (n >= 2) {
    if (format === 'round-robin') {
      totalMatches = ((n * (n - 1)) / 2) * rounds;
    } else if (format === 'single-elimination') {
      totalMatches = n - 1;
    } else if (format === 'double-elimination') {
      let bSize = 2;
      while (bSize < n) bSize *= 2;
      totalMatches = 2 * bSize - 2 - (bSize - n);
    } else if (format === 'group-stage-knockout') {
      const nA = Math.ceil(n / 2);
      const nB = Math.floor(n / 2);
      totalMatches = (nA * (nA - 1)) / 2 + (nB * (nB - 1)) / 2 + 4;
    }
  }

  const estimatedMinutes = Math.max(totalMatches * 15, 15);
  const estHours = Math.floor(estimatedMinutes / 60);
  const estMins = estimatedMinutes % 60;
  const durationText =
    estHours > 0 ? TEKS.setup.jamMenit(estHours, estMins) : TEKS.setup.menit(estMins);

  const isValidToStart = format === 'group-stage-knockout' ? n >= 4 : n >= 3;

  const handleStartTournament = () => {
    if (format === 'group-stage-knockout' && n < 4) {
      setErrorMessage(TEKS.error.minPemainGrup);
      return;
    }
    if (!isValidToStart) {
      setErrorMessage(TEKS.error.minPemain);
      return;
    }

    onStart({
      format,
      players,
      rounds: format === 'round-robin' ? rounds : 1,
    });
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-5 space-y-4">
      {/* Title */}
      <div className="flex items-center justify-between pb-1">
        <h1 className="font-scoreboard text-2xl font-bold tracking-tight text-slate-900 dark:text-white uppercase">
          {TEKS.setup.judul}
        </h1>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/60">
          Meja 1
        </span>
      </div>

      {/* 1. Format Pertandingan Card (4 Format) */}
      <div className="p-4 rounded-2xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-[#121c17] shadow-sm space-y-3">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {TEKS.setup.format}
        </label>

        <div className="grid grid-cols-2 gap-2.5">
          {/* 1. Semua Lawan Semua */}
          <button
            type="button"
            onClick={() => setFormat('round-robin')}
            className={`min-h-12 p-3 text-left rounded-xl border font-semibold text-xs transition-all btn-pressable ${
              format === 'round-robin'
                ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-900 dark:text-emerald-200 shadow-sm ring-1 ring-emerald-500'
                : 'bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {TEKS.setup.roundRobin}
          </button>

          {/* 2. Sistem Gugur */}
          <button
            type="button"
            onClick={() => setFormat('single-elimination')}
            className={`min-h-12 p-3 text-left rounded-xl border font-semibold text-xs transition-all btn-pressable ${
              format === 'single-elimination'
                ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-900 dark:text-emerald-200 shadow-sm ring-1 ring-emerald-500'
                : 'bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {TEKS.setup.singleElimination}
          </button>

          {/* 3. Gugur Ganda (Double Elimination) */}
          <button
            type="button"
            onClick={() => setFormat('double-elimination')}
            className={`min-h-12 p-3 text-left rounded-xl border font-semibold text-xs transition-all btn-pressable ${
              format === 'double-elimination'
                ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-900 dark:text-emerald-200 shadow-sm ring-1 ring-emerald-500'
                : 'bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {TEKS.setup.doubleElimination}
          </button>

          {/* 4. Fase Grup + Gugur */}
          <button
            type="button"
            onClick={() => setFormat('group-stage-knockout')}
            className={`min-h-12 p-3 text-left rounded-xl border font-semibold text-xs transition-all btn-pressable ${
              format === 'group-stage-knockout'
                ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-900 dark:text-emerald-200 shadow-sm ring-1 ring-emerald-500'
                : 'bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {TEKS.setup.groupStageKnockout}
          </button>
        </div>

        {format === 'round-robin' && (
          <div className="pt-3 border-t border-slate-100 dark:border-white/10 flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
              {TEKS.setup.ronde}
            </span>
            <div className="flex gap-1.5">
              {[1, 2, 3, 4].map(num => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setRounds(num)}
                  className={`min-h-12 px-3.5 py-1.5 text-xs font-bold rounded-lg border btn-pressable transition-all ${
                    rounds === num
                      ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                      : 'bg-slate-50 dark:bg-white/5 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-white/10 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {TEKS.setup.kaliPutaran(num)}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 2. Input & List Pemain Card */}
      <div className="p-4 rounded-2xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-[#121c17] shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {TEKS.setup.pemain(players.length)}
          </label>
          <span className="text-xs text-amber-600 dark:text-amber-400 font-semibold">
            {format === 'group-stage-knockout' ? 'Min. 4 pemain' : 'Min. 3 pemain'}
          </span>
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={inputName}
            onChange={e => {
              setInputName(e.target.value);
              if (errorMessage) setErrorMessage(null);
            }}
            onKeyDown={e => {
              if (e.key === 'Enter') handleAddPlayer();
            }}
            placeholder={TEKS.setup.inputPlaceholder}
            className="flex-1 min-h-12 px-3.5 text-sm rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:bg-white dark:focus:bg-[#15231c] transition-all"
          />
          <button
            type="button"
            onClick={handleAddPlayer}
            className="btn-pressable min-h-12 px-4 text-xs font-bold rounded-xl border border-emerald-600 bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm"
          >
            {TEKS.setup.tambah}
          </button>
        </div>

        {errorMessage && (
          <div className="p-2.5 rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 text-xs font-medium">
            {errorMessage}
          </div>
        )}

        <div className="divide-y divide-slate-100 dark:divide-white/5 max-h-56 overflow-y-auto">
          {players.map((p, idx) => (
            <div key={p.id} className="py-2.5 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 flex-1 min-w-0">
                <span className="w-6 h-6 rounded-full bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 font-scoreboard text-xs font-bold flex items-center justify-center shrink-0">
                  {idx + 1}
                </span>
                {editingId === p.id ? (
                  <input
                    type="text"
                    value={editingName}
                    onChange={e => setEditingName(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') saveEditing(p.id);
                    }}
                    autoFocus
                    className="flex-1 min-h-12 px-2.5 text-xs rounded-lg border border-emerald-500 bg-white dark:bg-black/30 text-slate-900 dark:text-white"
                  />
                ) : (
                  <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">
                    {p.name}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1 shrink-0">
                {editingId === p.id ? (
                  <button
                    type="button"
                    onClick={() => saveEditing(p.id)}
                    className="min-h-12 px-3 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
                  >
                    Simpan
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => startEditing(p)}
                    className="min-h-12 px-2.5 text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white"
                  >
                    Edit
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => removePlayer(p.id)}
                  disabled={players.length <= 1}
                  className="min-h-12 px-2.5 text-xs font-medium text-rose-600 dark:text-rose-400 hover:text-rose-700 disabled:opacity-30"
                >
                  Hapus
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Summary & CTA Card */}
      <div className="p-4 rounded-2xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-[#121c17] shadow-sm space-y-4">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-3 rounded-xl border border-slate-100 dark:border-white/5 bg-slate-50/70 dark:bg-white/5">
            <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {TEKS.setup.ringkasanPemain}
            </div>
            <div className="font-scoreboard text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
              {n}
            </div>
          </div>
          <div className="p-3 rounded-xl border border-slate-100 dark:border-white/5 bg-slate-50/70 dark:bg-white/5">
            <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {TEKS.setup.ringkasanMatch}
            </div>
            <div className="font-scoreboard text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
              {totalMatches}
            </div>
          </div>
          <div className="p-3 rounded-xl border border-slate-100 dark:border-white/5 bg-slate-50/70 dark:bg-white/5">
            <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {TEKS.setup.ringkasanDurasi}
            </div>
            <div className="font-scoreboard text-2xl font-bold text-slate-700 dark:text-slate-300 mt-0.5">
              {durationText}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleStartTournament}
          disabled={!isValidToStart}
          className="btn-pressable w-full min-h-16 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-scoreboard text-lg font-bold uppercase tracking-wider shadow-md shadow-emerald-600/30 disabled:opacity-40 disabled:pointer-events-none transition-all"
        >
          {TEKS.setup.mulai}
        </button>
      </div>
    </div>
  );
};
