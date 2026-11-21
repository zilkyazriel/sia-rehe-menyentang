import React, { useState, useRef } from 'react';
import { Image as ImageIcon } from 'lucide-react';
import type { Match, Player, TournamentFormat } from '../types/tournament';
import { exportElementAsImage } from '../utils/imageExport';
import { TEKS } from '../lib/teks';

interface BracketViewProps {
  format?: TournamentFormat;
  matches: Match[];
  players: Player[];
  onShowToast?: (msg: string) => void;
}

export const BracketView: React.FC<BracketViewProps> = ({ format = 'single-elimination', matches, onShowToast }) => {
  const [doubleFilter, setDoubleFilter] = useState<'all' | 'winners' | 'losers'>('all');
  const [isExporting, setIsExporting] = useState(false);
  const bracketRef = useRef<HTMLDivElement>(null);

  const currentActiveMatch = matches.find(m => !m.isBye && m.status !== 'completed');

  const handleExportBracketImage = async () => {
    if (!bracketRef.current) return;
    setIsExporting(true);
    const ok = await exportElementAsImage(
      bracketRef.current,
      'sia-rehe-bagan-pertandingan',
      'Bagan Pertandingan'
    );
    setIsExporting(false);
    if (ok && onShowToast) {
      onShowToast('Gambar bagan berhasil disimpan.');
    }
  };

  const renderExportButton = () => (
    <button
      type="button"
      onClick={handleExportBracketImage}
      disabled={isExporting}
      className="no-export btn-pressable min-h-8 px-2.5 py-1 text-xs font-semibold rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 flex items-center gap-1.5 transition-colors shrink-0"
      title="Simpan bagan sebagai gambar PNG/JPG"
    >
      <ImageIcon className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
      <span>{isExporting ? 'Menyimpan...' : 'Gambar PNG'}</span>
    </button>
  );

  // 1. FORMAT GUGUR GANDA (DOUBLE ELIMINATION)
  if (format === 'double-elimination') {
    const wbMatches = matches.filter(m => m.bracketType === 'winners');
    const lbMatches = matches.filter(m => m.bracketType === 'losers');
    const grandFinalMatch = matches.find(m => m.bracketType === 'grand_final');

    return (
      <div ref={bracketRef} className="max-w-6xl mx-auto px-4 py-4 space-y-5">
        {/* Header Bracket */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-1">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="font-scoreboard text-xl font-bold tracking-tight text-slate-900 dark:text-white uppercase leading-none">
                {TEKS.bracket.judul}
              </h2>
              {renderExportButton()}
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Gugur ganda &bull; Pemain memiliki 2 kesempatan bermain
            </span>
          </div>

          {/* Filter Segmented Control */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-200/60 dark:bg-white/5 border border-slate-200 dark:border-white/10 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setDoubleFilter('all')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                doubleFilter === 'all'
                  ? 'bg-white dark:bg-emerald-600 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Semua
            </button>
            <button
              type="button"
              onClick={() => setDoubleFilter('winners')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                doubleFilter === 'winners'
                  ? 'bg-white dark:bg-emerald-600 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Winners
            </button>
            <button
              type="button"
              onClick={() => setDoubleFilter('losers')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                doubleFilter === 'losers'
                  ? 'bg-white dark:bg-emerald-600 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Losers
            </button>
          </div>
        </div>

        {/* WINNERS BRACKET */}
        {(doubleFilter === 'all' || doubleFilter === 'winners') && (
          <div className="space-y-2">
            <h3 className="font-scoreboard text-sm font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
              {TEKS.bracket.winners} (Bagan Pemenang)
            </h3>
            <BracketTreeCanvas matches={wbMatches} currentActiveMatch={currentActiveMatch} />
          </div>
        )}

        {/* LOSERS BRACKET */}
        {(doubleFilter === 'all' || doubleFilter === 'losers') && (
          <div className="space-y-2 pt-2">
            <h3 className="font-scoreboard text-sm font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
              {TEKS.bracket.losers} (Bagan Kalah)
            </h3>
            <BracketTreeCanvas matches={lbMatches} currentActiveMatch={currentActiveMatch} />
          </div>
        )}

        {/* GRAND FINAL */}
        {grandFinalMatch && (doubleFilter === 'all' || doubleFilter === 'winners') && (
          <div className="space-y-2 pt-2">
            <h3 className="font-scoreboard text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              Grand Final
            </h3>
            <div className="max-w-sm rounded-2xl border-2 border-emerald-500/60 bg-white dark:bg-[#121c17] p-4 shadow-md">
              <MatchCard match={grandFinalMatch} isCurrent={currentActiveMatch?.id === grandFinalMatch.id} />
            </div>
          </div>
        )}
      </div>
    );
  }

  // 2. FORMAT FASE GRUP + SISTEM GUGUR (GROUP STAGE + KNOCKOUT)
  if (format === 'group-stage-knockout') {
    const groupMatches = matches.filter(m => m.bracketType === 'group');
    const knockoutMatches = matches.filter(m => m.bracketType === 'knockout');

    return (
      <div ref={bracketRef} className="max-w-6xl mx-auto px-4 py-4 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-scoreboard text-xl font-bold tracking-tight text-slate-900 dark:text-white uppercase leading-none">
              {TEKS.bracket.judul}
            </h2>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Fase grup & babak gugur semifinal silang hingga final
            </span>
          </div>
          {renderExportButton()}
        </div>

        {/* Knockout Bracket */}
        <div className="space-y-2">
          <h3 className="font-scoreboard text-sm font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
            {TEKS.bracket.knockout} (Semifinal & Final)
          </h3>
          <BracketTreeCanvas matches={knockoutMatches} currentActiveMatch={currentActiveMatch} />
        </div>

        {/* Group Matches Board */}
        <div className="space-y-2 pt-2">
          <h3 className="font-scoreboard text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            {TEKS.bracket.grup} (Jadwal Grup A & B)
          </h3>
          <GroupMatchesBoard matches={groupMatches} currentActiveMatch={currentActiveMatch} />
        </div>
      </div>
    );
  }

  // 3. FORMAT SISTEM GUGUR TUNGGAL (SINGLE ELIMINATION)
  if (format === 'single-elimination') {
    return (
      <div ref={bracketRef} className="max-w-6xl mx-auto px-4 py-4 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-scoreboard text-xl font-bold tracking-tight text-slate-900 dark:text-white uppercase leading-none">
              {TEKS.bracket.judul}
            </h2>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Bagan eliminasi tunggal &bull; Geser horizontal untuk melihat bagan lengkap
            </span>
          </div>
          {renderExportButton()}
        </div>

        <BracketTreeCanvas matches={matches} currentActiveMatch={currentActiveMatch} />
      </div>
    );
  }

  // 4. FORMAT SEMUA LAWAN SEMUA (ROUND-ROBIN FIXTURE BOARD)
  return (
    <div ref={bracketRef} className="max-w-6xl mx-auto px-4 py-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-scoreboard text-xl font-bold tracking-tight text-slate-900 dark:text-white uppercase leading-none">
            {TEKS.bracket.judul}
          </h2>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Bagan putaran pertandingan &bull; Geser horizontal untuk melihat putaran
          </span>
        </div>
        {renderExportButton()}
      </div>

      <GroupMatchesBoard matches={matches} currentActiveMatch={currentActiveMatch} />
    </div>
  );
};

/**
 * Komponen Canvas Tree Bracket (Kolom Babak demi Babak)
 */
interface BracketTreeCanvasProps {
  matches: Match[];
  currentActiveMatch?: Match;
}

const BracketTreeCanvas: React.FC<BracketTreeCanvasProps> = ({ matches, currentActiveMatch }) => {
  const roundMap: Record<number, Match[]> = {};
  matches.forEach(m => {
    if (!roundMap[m.round]) {
      roundMap[m.round] = [];
    }
    roundMap[m.round].push(m);
  });

  const rounds = Object.keys(roundMap)
    .map(Number)
    .sort((a, b) => a - b);

  return (
    <div className="rounded-2xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-[#121c17] shadow-sm p-5 overflow-x-auto">
      <div className="inline-flex gap-8 min-w-full items-stretch py-1">
        {rounds.map(roundNum => {
          const roundMatches = roundMap[roundNum];
          const roundTitle = roundMatches[0]?.roundName || `Babak ${roundNum}`;

          return (
            <div
              key={roundNum}
              className="flex flex-col min-w-[220px] max-w-[240px] flex-shrink-0"
            >
              <div className="py-2 px-3 mb-4 text-center rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 font-scoreboard text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                {roundTitle}
              </div>

              <div className="flex flex-col justify-around flex-1 gap-5">
                {roundMatches.map(m => (
                  <MatchCard
                    key={m.id}
                    match={m}
                    isCurrent={currentActiveMatch?.id === m.id}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/**
 * Komponen Papan Match Grup / Putaran
 */
interface GroupMatchesBoardProps {
  matches: Match[];
  currentActiveMatch?: Match;
}

const GroupMatchesBoard: React.FC<GroupMatchesBoardProps> = ({ matches, currentActiveMatch }) => {
  const roundMap: Record<string, Match[]> = {};
  matches.forEach(m => {
    const key = m.groupName ? `${m.groupName}` : `Putaran ${m.round}`;
    if (!roundMap[key]) {
      roundMap[key] = [];
    }
    roundMap[key].push(m);
  });

  const keys = Object.keys(roundMap);

  return (
    <div className="rounded-2xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-[#121c17] shadow-sm p-5 overflow-x-auto">
      <div className="inline-flex gap-8 min-w-full items-stretch py-1">
        {keys.map(key => {
          const rMatches = roundMap[key];
          const completedCount = rMatches.filter(m => m.status === 'completed').length;

          return (
            <div
              key={key}
              className="flex flex-col min-w-[240px] max-w-[260px] flex-shrink-0"
            >
              <div className="py-2.5 px-3.5 mb-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 flex items-center justify-between">
                <span className="font-scoreboard text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                  {key}
                </span>
                <span className="font-scoreboard text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  {completedCount}/{rMatches.length}
                </span>
              </div>

              <div className="flex flex-col gap-3 flex-1">
                {rMatches.map(m => (
                  <MatchCard
                    key={m.id}
                    match={m}
                    isCurrent={currentActiveMatch?.id === m.id}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/**
 * Kartu Pertandingan Individual di Bracket
 */
interface MatchCardProps {
  match: Match;
  isCurrent: boolean;
}

const MatchCard: React.FC<MatchCardProps> = ({ match, isCurrent }) => {
  const isCompleted = match.status === 'completed';
  const isAWinner = isCompleted && match.winnerId === match.playerAId;
  const isBWinner = isCompleted && match.winnerId === match.playerBId;

  return (
    <div
      className={`rounded-2xl border p-3.5 space-y-2 transition-all shadow-sm ${
        match.isBye
          ? 'bg-slate-50/50 dark:bg-white/5 border-slate-200/50 dark:border-white/5 opacity-50'
          : isCurrent
          ? 'bg-emerald-50/60 dark:bg-emerald-950/40 border-2 border-emerald-500 shadow-md shadow-emerald-500/10'
          : isCompleted
          ? 'bg-slate-50/80 dark:bg-white/5 border-slate-200/90 dark:border-white/10'
          : 'bg-white dark:bg-[#14221c] border-slate-200 dark:border-white/10'
      }`}
    >
      <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 font-scoreboard pb-1.5 border-b border-slate-200/60 dark:border-white/10">
        <span className="font-bold">
          {match.isBye ? TEKS.bracket.bye : `Match #${match.matchNumber}`}
        </span>
        {isCurrent ? (
          <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
            {TEKS.bracket.aktif}
          </span>
        ) : isCompleted ? (
          <span className="text-emerald-700 dark:text-emerald-400 font-bold">
            {TEKS.bracket.selesai}
          </span>
        ) : (
          <span className="text-slate-400">{TEKS.bracket.menunggu}</span>
        )}
      </div>

      {/* Player A Slot */}
      <div
        className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-colors ${
          isAWinner
            ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-950 dark:text-emerald-100 font-bold border border-emerald-300 dark:border-emerald-600/60 shadow-xs'
            : 'text-slate-800 dark:text-slate-300 font-medium bg-white/60 dark:bg-white/5'
        }`}
      >
        <span className="truncate pr-1">{match.playerAName || '-'}</span>
        {isAWinner && (
          <span className="font-scoreboard text-xs text-emerald-600 dark:text-emerald-300 font-black">
            &#10003;
          </span>
        )}
      </div>

      {/* Player B Slot */}
      <div
        className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-colors ${
          isBWinner
            ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-950 dark:text-emerald-100 font-bold border border-emerald-300 dark:border-emerald-600/60 shadow-xs'
            : 'text-slate-800 dark:text-slate-300 font-medium bg-white/60 dark:bg-white/5'
        }`}
      >
        <span className="truncate pr-1">{match.playerBName || '-'}</span>
        {isBWinner && (
          <span className="font-scoreboard text-xs text-emerald-600 dark:text-emerald-300 font-black">
            &#10003;
          </span>
        )}
      </div>
    </div>
  );
};
