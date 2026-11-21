import type { Match, Player, TournamentFormat, TournamentState } from '../types/tournament';
import { buildHeadToHeadMatrix, calculateStandings, getTop3Winners } from './standings';

/**
 * Salin teks ke clipboard dengan fallback
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    const success = document.execCommand('copy');
    document.body.removeChild(textarea);
    return success;
  } catch {
    return false;
  }
}

/**
 * Teks tabel Klasemen
 */
export function generateStandingsText(players: Player[], matches: Match[], title = 'Klasemen'): string {
  const standings = calculateStandings(players, matches);
  let text = `SIA REHE MENYENTANG - ${title.toUpperCase()}\n`;
  text += `------------------------------------\n`;
  text += `#   Pemain         M  W  L  +/- PTS\n`;
  text += `------------------------------------\n`;
  standings.forEach(s => {
    const pos = (s.isTied ? `T${s.rank}` : `${s.rank}.`).padEnd(3, ' ');
    const name = s.playerName.padEnd(14, ' ').slice(0, 14);
    const m = String(s.played).padStart(2, ' ');
    const w = String(s.won).padStart(2, ' ');
    const l = String(s.lost).padStart(2, ' ');
    const diff = (s.difference > 0 ? `+${s.difference}` : `${s.difference}`).padStart(4, ' ');
    const pts = String(s.points).padStart(3, ' ');
    text += `${pos} ${name} ${m} ${w} ${l} ${diff} ${pts}\n`;
  });
  text += `------------------------------------\n`;
  return text.trim();
}

/**
 * Teks matriks Head-to-Head
 */
export function generateHeadToHeadText(players: Player[], matches: Match[]): string {
  const matrix = buildHeadToHeadMatrix(players, matches);
  let text = `SIA REHE MENYENTANG - HEAD-TO-HEAD\n`;
  text += `====================================\n`;
  for (let i = 0; i < matrix.players.length; i++) {
    for (let j = i + 1; j < matrix.players.length; j++) {
      const p1 = matrix.players[i];
      const p2 = matrix.players[j];
      const rec1 = matrix.results[p1.id]?.[p2.id] || { won: 0, lost: 0 };
      const total = rec1.won + rec1.lost;
      if (total > 0) {
        text += `${p1.name} ${rec1.won} - ${rec1.lost} ${p2.name}\n`;
      } else {
        text += `${p1.name} vs ${p2.name}: Belum tanding\n`;
      }
    }
  }
  text += `====================================\n`;
  return text.trim();
}

/**
 * Teks susunan dan hasil Bagan / Bracket
 */
export function generateBracketText(matches: Match[], format?: TournamentFormat): string {
  let text = `SIA REHE MENYENTANG - BAGAN PERTANDINGAN\n`;
  if (format) {
    let fName = 'Sistem Gugur';
    if (format === 'double-elimination') fName = 'Gugur Ganda';
    else if (format === 'group-stage-knockout') fName = 'Fase Grup + Gugur';
    else if (format === 'round-robin') fName = 'Semua Lawan Semua';
    text += `Format: ${fName}\n`;
  }
  text += `====================================\n`;

  const activeMatches = matches.filter(m => !m.isBye);
  activeMatches.forEach(m => {
    const roundLabel = m.roundName || `Match ${m.matchNumber}`;
    const pA = m.playerAName || 'TBD';
    const pB = m.playerBName || 'TBD';
    if (m.status === 'completed') {
      const winnerName = m.winnerId === m.playerAId ? pA : pB;
      text += `[#${m.matchNumber}] ${roundLabel}: ${pA} vs ${pB} -> Pemenang: ${winnerName}\n`;
    } else {
      text += `[#${m.matchNumber}] ${roundLabel}: ${pA} vs ${pB} (Belum main)\n`;
    }
  });
  text += `====================================\n`;
  return text.trim();
}

/**
 * Ringkasan teks hasil lengkap turnamen
 */
export function generateShareText(state: TournamentState): string {
  const { config, matches } = state;
  let formatName = 'Semua lawan semua';
  if (config.format === 'single-elimination') formatName = 'Sistem gugur';
  else if (config.format === 'double-elimination') formatName = 'Gugur ganda';
  else if (config.format === 'group-stage-knockout') formatName = 'Grup + gugur';

  const winners = getTop3Winners(config.format, config.players, matches);
  const totalMatches = matches.filter(m => !m.isBye).length;
  const completedMatches = matches.filter(m => !m.isBye && m.status === 'completed').length;

  let text = `SIA REHE MENYENTANG - HASIL TURNAMEN\n`;
  text += `Format: ${formatName}\n`;
  text += `Pemain (${config.players.length}): ${config.players.map(p => p.name).join(', ')}\n`;
  text += `Match: ${completedMatches}/${totalMatches} selesai\n\n`;

  if (winners.first) {
    text += `HASIL AKHIR:\n`;
    text += `Juara 1: ${winners.first.name}\n`;
    if (winners.second) text += `Juara 2: ${winners.second.name}\n`;
    if (winners.third) text += `Juara 3: ${winners.third.name}\n`;
    text += `\n`;
  }

  // Tambahkan Klasemen atau Bagan sesuai format
  if (config.format === 'round-robin') {
    text += generateStandingsText(config.players, matches) + '\n\n';
    text += generateHeadToHeadText(config.players, matches) + '\n';
  } else if (config.format === 'group-stage-knockout') {
    text += generateBracketText(matches, config.format) + '\n';
  } else {
    text += generateBracketText(matches, config.format) + '\n';
  }

  return text.trim();
}
