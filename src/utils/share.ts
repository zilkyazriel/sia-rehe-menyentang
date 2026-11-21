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
 * Format teks Klasemen rapi untuk dibagikan (WhatsApp / Catatan)
 */
export function generateStandingsText(players: Player[], matches: Match[], title = 'Klasemen'): string {
  const standings = calculateStandings(players, matches);
  let text = `*SIA REHE MENYENTANG - ${title.toUpperCase()}*\n`;
  standings.forEach(s => {
    const rankLabel = s.isTied ? `T${s.rank}.` : `${s.rank}.`;
    const diffStr = s.difference > 0 ? `+${s.difference}` : `${s.difference}`;
    text += `${rankLabel} ${s.playerName} | ${s.played} Main | ${s.won}W - ${s.lost}L | (${diffStr}) | ${s.points} Poin\n`;
  });
  return text.trim();
}

/**
 * Format teks Head-to-Head rapi untuk dibagikan
 */
export function generateHeadToHeadText(players: Player[], matches: Match[]): string {
  const matrix = buildHeadToHeadMatrix(players, matches);
  let text = `*SIA REHE MENYENTANG - HEAD-TO-HEAD*\n`;
  for (let i = 0; i < matrix.players.length; i++) {
    for (let j = i + 1; j < matrix.players.length; j++) {
      const p1 = matrix.players[i];
      const p2 = matrix.players[j];
      const rec1 = matrix.results[p1.id]?.[p2.id] || { won: 0, lost: 0 };
      const total = rec1.won + rec1.lost;
      if (total > 0) {
        text += `• ${p1.name} ${rec1.won} - ${rec1.lost} ${p2.name}\n`;
      } else {
        text += `• ${p1.name} vs ${p2.name}: Belum tanding\n`;
      }
    }
  }
  return text.trim();
}

/**
 * Format teks Bagan / Bracket rapi untuk dibagikan
 */
export function generateBracketText(matches: Match[], format?: TournamentFormat): string {
  let text = `*SIA REHE MENYENTANG - BAGAN PERTANDINGAN*\n`;
  if (format) {
    let fName = 'Sistem Gugur';
    if (format === 'double-elimination') fName = 'Gugur Ganda';
    else if (format === 'group-stage-knockout') fName = 'Fase Grup + Gugur';
    else if (format === 'round-robin') fName = 'Semua Lawan Semua';
    text += `Format: ${fName}\n`;
  }

  const activeMatches = matches.filter(m => !m.isBye);
  activeMatches.forEach(m => {
    const roundLabel = m.roundName || `Match ${m.matchNumber}`;
    const pA = m.playerAName || 'TBD';
    const pB = m.playerBName || 'TBD';
    if (m.status === 'completed') {
      const winnerName = m.winnerId === m.playerAId ? pA : pB;
      text += `• #${m.matchNumber} (${roundLabel}): ${pA} vs ${pB} -> Pemenang: ${winnerName}\n`;
    } else {
      text += `• #${m.matchNumber} (${roundLabel}): ${pA} vs ${pB} (Belum main)\n`;
    }
  });
  return text.trim();
}

/**
 * Ringkasan teks lengkap hasil turnamen (WhatsApp Friendly, tidak berantakan)
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

  if (config.format === 'round-robin') {
    text += `KLASEMEN:\n`;
    const standings = calculateStandings(config.players, matches);
    standings.forEach(s => {
      const rankLabel = s.isTied ? `T${s.rank}.` : `${s.rank}.`;
      const diffStr = s.difference > 0 ? `+${s.difference}` : `${s.difference}`;
      text += `${rankLabel} ${s.playerName} | ${s.played} Main | ${s.won}W - ${s.lost}L | (${diffStr}) | ${s.points} Poin\n`;
    });
    text += `\nHEAD-TO-HEAD:\n`;
    const matrix = buildHeadToHeadMatrix(config.players, matches);
    for (let i = 0; i < matrix.players.length; i++) {
      for (let j = i + 1; j < matrix.players.length; j++) {
        const p1 = matrix.players[i];
        const p2 = matrix.players[j];
        const rec1 = matrix.results[p1.id]?.[p2.id] || { won: 0, lost: 0 };
        const total = rec1.won + rec1.lost;
        if (total > 0) {
          text += `• ${p1.name} ${rec1.won} - ${rec1.lost} ${p2.name}\n`;
        }
      }
    }
  } else {
    text += `BAGAN PERTANDINGAN:\n`;
    matches
      .filter(m => !m.isBye && m.status === 'completed')
      .forEach(m => {
        const winnerName = m.winnerId === m.playerAId ? m.playerAName : m.playerBName;
        text += `• #${m.matchNumber} (${m.roundName || 'Match'}): ${m.playerAName} vs ${m.playerBName} -> Pemenang: ${winnerName}\n`;
      });
  }

  return text.trim();
}
