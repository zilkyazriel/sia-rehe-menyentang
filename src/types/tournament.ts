export type TournamentFormat =
  | 'round-robin'
  | 'single-elimination'
  | 'double-elimination'
  | 'group-stage-knockout';

export type MatchStatus = 'waiting' | 'in_progress' | 'completed';

export interface Player {
  id: string;
  name: string;
}

export interface Match {
  id: string;
  matchNumber: number; // Urutan nomor pertandingan di meja
  round: number; // Ronde / babak
  roundName?: string; // e.g. "Babak 1", "Winners Final", "Losers Round 1", "Final"
  playerAId: string | null;
  playerBId: string | null;
  playerAName: string;
  playerBName: string;
  winnerId: string | null;
  status: MatchStatus;
  isBye?: boolean;

  // Bracket metadata
  bracketType?: 'winners' | 'losers' | 'grand_final' | 'group' | 'knockout';
  groupName?: string; // e.g. "Grup A", "Grup B"

  // Forward linkage untuk pemenang
  nextMatchId?: string;
  nextMatchSlot?: 'A' | 'B';
  sourceMatchAId?: string;
  sourceMatchBId?: string;

  // Forward linkage untuk pemain yang kalah (khusus Double Elimination)
  nextLoserMatchId?: string;
  nextLoserMatchSlot?: 'A' | 'B';
}

export interface StandingsRow {
  playerId: string;
  playerName: string;
  played: number;
  won: number;
  lost: number;
  points: number;
  difference: number; // won - lost
  rank: number;
  isTied: boolean;
  tieGroup?: number;
}

export interface HeadToHeadMatrix {
  players: Player[];
  results: Record<string, Record<string, { won: number; lost: number; matches: Match[] }>>;
}

export interface TournamentConfig {
  format: TournamentFormat;
  players: Player[];
  rounds: number; // Khusus round-robin: berapa kali ketemu (1x, 2x, 3x...)
  groupCount?: number; // Khusus fase grup
  advancePerGroup?: number; // Berapa pemain lolos per grup
}

export interface TournamentState {
  config: TournamentConfig;
  matches: Match[];
  currentMatchIndex: number;
  history: TournamentSnapshot[];
  isCompleted: boolean;
  startedAt: string;
  completedAt?: string;
}

export interface TournamentSnapshot {
  matches: Match[];
  currentMatchIndex: number;
  isCompleted: boolean;
  description: string;
}
