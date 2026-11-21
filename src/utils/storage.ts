import type { TournamentState, Player, Match } from '../types/tournament';

const STORAGE_KEY = 'billiard_tournament_state_v1';
const THEME_KEY = 'billiard_theme_mode';

function isPlayer(obj: unknown): obj is Player {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    typeof (obj as { id: unknown }).id === 'string' &&
    'name' in obj &&
    typeof (obj as { name: unknown }).name === 'string'
  );
}

function isMatch(obj: unknown): obj is Match {
  if (typeof obj !== 'object' || obj === null) return false;
  const m = obj as Record<string, unknown>;
  return (
    typeof m.id === 'string' &&
    typeof m.matchNumber === 'number' &&
    typeof m.round === 'number' &&
    typeof m.playerAName === 'string' &&
    typeof m.playerBName === 'string' &&
    (m.winnerId === null || typeof m.winnerId === 'string') &&
    (m.status === 'waiting' || m.status === 'in_progress' || m.status === 'completed')
  );
}

export function isValidTournamentState(data: unknown): data is TournamentState {
  if (typeof data !== 'object' || data === null) return false;
  const s = data as Record<string, unknown>;

  if (typeof s.config !== 'object' || s.config === null) return false;
  const cfg = s.config as Record<string, unknown>;
  if (
    cfg.format !== 'round-robin' &&
    cfg.format !== 'single-elimination' &&
    cfg.format !== 'double-elimination' &&
    cfg.format !== 'group-stage-knockout'
  )
    return false;
  if (!Array.isArray(cfg.players) || !cfg.players.every(isPlayer)) return false;
  if (typeof cfg.rounds !== 'number') return false;

  if (!Array.isArray(s.matches) || !s.matches.every(isMatch)) return false;
  if (typeof s.currentMatchIndex !== 'number') return false;
  if (typeof s.isCompleted !== 'boolean') return false;
  if (typeof s.startedAt !== 'string') return false;

  return true;
}

export function saveTournamentToStorage(state: TournamentState | null): void {
  try {
    if (!state) {
      localStorage.removeItem(STORAGE_KEY);
      return;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.error('Gagal menyimpan ke localStorage:', err);
  }
}

export function loadTournamentFromStorage(): TournamentState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (isValidTournamentState(parsed)) {
      return parsed;
    }
  } catch (err) {
    console.error('Data localStorage tidak valid:', err);
  }
  return null;
}

export function getStoredTheme(): 'dark' | 'light' {
  const saved = localStorage.getItem(THEME_KEY);
  if (saved === 'dark' || saved === 'light') return saved;
  if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
    return 'light';
  }
  return 'dark';
}

export function saveStoredTheme(theme: 'dark' | 'light'): void {
  localStorage.setItem(THEME_KEY, theme);
}
