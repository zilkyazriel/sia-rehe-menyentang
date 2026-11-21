import type { TournamentState } from '../types/tournament';
import { calculateStandings, getTop3Winners } from './standings';

/**
 * Ringkasan teks hasil turnamen tanpa emoji dekoratif dan kalimat promosi.
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
  text += `Pemain: ${config.players.length}\n`;
  text += `Match: ${completedMatches}/${totalMatches} selesai\n\n`;

  if (winners.first) {
    text += `Juara 1: ${winners.first.name}\n`;
    if (winners.second) text += `Juara 2: ${winners.second.name}\n`;
    if (winners.third) text += `Juara 3: ${winners.third.name}\n`;
    text += `\n`;
  }

  if (config.format === 'round-robin') {
    const standings = calculateStandings(config.players, matches);
    text += `Klasemen:\n`;
    standings.forEach(s => {
      text += `${s.rank}. ${s.playerName} - Main: ${s.played}, W: ${s.won}, L: ${s.lost}, PTS: ${s.points}\n`;
    });
  } else {
    text += `Bagan:\n`;
    matches
      .filter(m => !m.isBye && m.status === 'completed')
      .forEach(m => {
        const winnerName = m.winnerId === m.playerAId ? m.playerAName : m.playerBName;
        text += `${m.roundName || 'Match ' + m.matchNumber}: ${m.playerAName} vs ${m.playerBName} -> Pemenang: ${winnerName}\n`;
      });
  }

  return text.trim();
}
