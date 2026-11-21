import React, { useRef, useState } from 'react';
import { Image as ImageIcon } from 'lucide-react';
import type { Match, Player } from '../types/tournament';
import { buildHeadToHeadMatrix, calculateStandings } from '../utils/standings';
import { exportElementAsImage } from '../utils/imageExport';
import { TEKS } from '../lib/teks';

interface StandingsViewProps {
  players: Player[];
  matches: Match[];
  onShowToast?: (msg: string) => void;
}

export const StandingsView: React.FC<StandingsViewProps> = ({ players, matches, onShowToast }) => {
  const isGroupFormat = matches.some(m => m.bracketType === 'group' && m.groupName);

  if (isGroupFormat) {
    const matchesA = matches.filter(m => m.groupName === 'Grup A');
    const matchesB = matches.filter(m => m.groupName === 'Grup B');

    const getGroupPlayers = (groupMatches: Match[]) => {
      const ids = new Set<string>();
      groupMatches.forEach(m => {
        if (m.playerAId) ids.add(m.playerAId);
        if (m.playerBId) ids.add(m.playerBId);
      });
      return players.filter(p => ids.has(p.id));
    };

    const playersA = getGroupPlayers(matchesA);
    const playersB = getGroupPlayers(matchesB);

    return (
      <div className="max-w-3xl mx-auto px-4 py-4 space-y-8">
        <SingleStandingsBlock
          title="Klasemen Grup A"
          players={playersA}
          matches={matchesA}
          onShowToast={onShowToast}
        />
        <SingleStandingsBlock
          title="Klasemen Grup B"
          players={playersB}
          matches={matchesB}
          onShowToast={onShowToast}
        />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-4 space-y-6">
      <SingleStandingsBlock
        title={TEKS.klasemen.judul}
        players={players}
        matches={matches}
        onShowToast={onShowToast}
      />
    </div>
  );
};

interface SingleStandingsBlockProps {
  title: string;
  players: Player[];
  matches: Match[];
  onShowToast?: (msg: string) => void;
}

const SingleStandingsBlock: React.FC<SingleStandingsBlockProps> = ({ title, players, matches, onShowToast }) => {
  const standings = calculateStandings(players, matches);
  const matrix = buildHeadToHeadMatrix(players, matches);

  const standingsRef = useRef<HTMLDivElement>(null);
  const h2hRef = useRef<HTMLDivElement>(null);
  const [isExportingStandings, setIsExportingStandings] = useState(false);
  const [isExportingH2H, setIsExportingH2H] = useState(false);

  const handleExportStandings = async () => {
    if (!standingsRef.current) return;
    setIsExportingStandings(true);
    const ok = await exportElementAsImage(
      standingsRef.current,
      `sia-rehe-${title.toLowerCase().replace(/\s+/g, '-')}`,
      title
    );
    setIsExportingStandings(false);
    if (ok && onShowToast) {
      onShowToast('Gambar klasemen berhasil disimpan.');
    }
  };

  const handleExportH2H = async () => {
    if (!h2hRef.current) return;
    setIsExportingH2H(true);
    const ok = await exportElementAsImage(
      h2hRef.current,
      'sia-rehe-head-to-head',
      'Head-to-head'
    );
    setIsExportingH2H(false);
    if (ok && onShowToast) {
      onShowToast('Gambar head-to-head berhasil disimpan.');
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. KLASEMEN (MODERN LEAGUE TABLE) */}
      <div ref={standingsRef} className="p-3 -m-3 rounded-2xl bg-inherit space-y-2.5">
        <section aria-label={title} className="space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="font-scoreboard text-xl font-bold tracking-tight text-slate-900 dark:text-white uppercase">
                {title}
              </h2>
              <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-800/60">
                Live
              </span>
            </div>

            <button
              type="button"
              onClick={handleExportStandings}
              disabled={isExportingStandings}
              className="no-export btn-pressable min-h-8 px-2.5 py-1 text-xs font-semibold rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 flex items-center gap-1.5 transition-colors"
              title="Simpan klasemen sebagai gambar PNG/JPG"
            >
              <ImageIcon className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>{isExportingStandings ? 'Menyimpan...' : 'Gambar PNG'}</span>
            </button>
          </div>

          <div className="rounded-2xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-[#121c17] shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200/80 dark:border-white/10 text-slate-500 dark:text-slate-400 font-scoreboard text-[11px] uppercase tracking-wider bg-slate-50/70 dark:bg-white/5">
                    <th className="py-3 px-3.5 text-center w-12">{TEKS.klasemen.pos}</th>
                    <th className="py-3 px-3">{TEKS.klasemen.pemain}</th>
                    <th className="py-3 px-2 text-center">{TEKS.klasemen.main}</th>
                    <th className="py-3 px-2 text-center text-emerald-600 dark:text-emerald-400 font-bold">
                      {TEKS.klasemen.menang}
                    </th>
                    <th className="py-3 px-2 text-center text-slate-400">{TEKS.klasemen.kalah}</th>
                    <th className="py-3 px-2 text-center text-slate-400">{TEKS.klasemen.selisih}</th>
                    <th className="py-3 px-3.5 text-center text-slate-900 dark:text-white font-black">
                      {TEKS.klasemen.poin}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-slate-800 dark:text-slate-200">
                  {standings.map(row => {
                    let rankBadge = (
                      <span className="font-scoreboard text-xs font-semibold text-slate-400 dark:text-slate-500">
                        {row.isTied ? `T${row.rank}` : row.rank}
                      </span>
                    );

                    if (row.rank === 1) {
                      rankBadge = (
                        <span className="inline-flex w-5 h-5 items-center justify-center rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 font-scoreboard text-xs font-black">
                          1
                        </span>
                      );
                    } else if (row.rank === 2) {
                      rankBadge = (
                        <span className="inline-flex w-5 h-5 items-center justify-center rounded-full bg-slate-200 text-slate-700 dark:bg-white/10 dark:text-slate-300 font-scoreboard text-xs font-bold">
                          2
                        </span>
                      );
                    } else if (row.rank === 3) {
                      rankBadge = (
                        <span className="inline-flex w-5 h-5 items-center justify-center rounded-full bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-300 font-scoreboard text-xs font-bold">
                          3
                        </span>
                      );
                    }

                    return (
                      <tr
                        key={row.playerId}
                        className="hover:bg-slate-50/60 dark:hover:bg-white/5 transition-colors"
                      >
                        <td className="py-3 px-3.5 text-center">{rankBadge}</td>
                        <td className="py-3 px-3 font-semibold text-slate-900 dark:text-white">
                          {row.playerName}
                        </td>
                        <td className="py-3 px-2 text-center font-scoreboard">{row.played}</td>
                        <td className="py-3 px-2 text-center font-scoreboard font-bold text-emerald-600 dark:text-emerald-400">
                          {row.won}
                        </td>
                        <td className="py-3 px-2 text-center font-scoreboard text-slate-400">
                          {row.lost}
                        </td>
                        <td className="py-3 px-2 text-center font-scoreboard text-slate-500 dark:text-slate-400">
                          {row.difference > 0 ? `+${row.difference}` : row.difference}
                        </td>
                        <td className="py-3 px-3.5 text-center font-scoreboard font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                          {row.points}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>

      {/* 2. HEAD-TO-HEAD (CROSS TABLE) */}
      <div ref={h2hRef} className="p-3 -m-3 rounded-2xl bg-inherit space-y-2.5">
        <section aria-label="Head-to-head" className="space-y-2.5">
          <div className="flex items-center justify-between">
            <h3 className="font-scoreboard text-base font-bold tracking-tight text-slate-700 dark:text-slate-300 uppercase">
              {TEKS.klasemen.matriksJudul}
            </h3>
            <button
              type="button"
              onClick={handleExportH2H}
              disabled={isExportingH2H}
              className="no-export btn-pressable min-h-8 px-2.5 py-1 text-xs font-semibold rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 flex items-center gap-1.5 transition-colors"
              title="Simpan tabel head-to-head sebagai gambar PNG/JPG"
            >
              <ImageIcon className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>{isExportingH2H ? 'Menyimpan...' : 'Gambar PNG'}</span>
            </button>
          </div>

          <div className="rounded-2xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-[#121c17] shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-center text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200/80 dark:border-white/10 bg-slate-50/70 dark:bg-white/5 text-slate-500 dark:text-slate-400 font-scoreboard text-[11px]">
                    <th className="py-3 px-3.5 text-left min-w-[90px]">{TEKS.klasemen.vs}</th>
                    {matrix.players.map((p, idx) => (
                      <th key={p.id} className="py-3 px-2 min-w-[52px]" title={p.name}>
                        P{idx + 1}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-slate-800 dark:text-slate-200">
                  {matrix.players.map((rowPlayer, rIdx) => (
                    <tr key={rowPlayer.id} className="hover:bg-slate-50/60 dark:hover:bg-white/5">
                      <td className="py-2.5 px-3.5 text-left font-semibold text-slate-900 dark:text-white border-r border-slate-100 dark:border-white/10 truncate max-w-[130px]">
                        <span className="font-scoreboard text-slate-400 dark:text-slate-500 mr-1.5">
                          P{rIdx + 1}
                        </span>
                        {rowPlayer.name}
                      </td>
                      {matrix.players.map(colPlayer => {
                        if (rowPlayer.id === colPlayer.id) {
                          return (
                            <td key={colPlayer.id} className="py-2.5 px-2 bg-slate-50/50 dark:bg-white/5 text-slate-300 dark:text-white/20">
                              &bull;
                            </td>
                          );
                        }

                        const record = matrix.results[rowPlayer.id]?.[colPlayer.id];
                        const totalPlayed = (record?.won || 0) + (record?.lost || 0);

                        if (totalPlayed === 0) {
                          return (
                            <td key={colPlayer.id} className="py-2.5 px-2 text-slate-300 dark:text-slate-600 font-scoreboard">
                              -
                            </td>
                          );
                        }

                        return (
                          <td
                            key={colPlayer.id}
                            className="py-2.5 px-2 font-scoreboard font-semibold text-xs text-slate-700 dark:text-slate-300"
                          >
                            <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                              {record?.won || 0}
                            </span>
                            <span className="text-slate-400 mx-0.5">-</span>
                            <span className="text-slate-500">{record?.lost || 0}</span>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
