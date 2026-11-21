import type { HeadToHeadMatrix, Match, Player, StandingsRow, TournamentFormat } from '../types/tournament';

/**
 * Menghitung klasemen turnamen Round-Robin berdasarkan aturan:
 * 1. Jumlah kemenangan (Wins) terbanyak.
 * 2. Head-to-Head (H2H) antar pemain yang memiliki jumlah kemenangan sama.
 * 3. Selisih (Menang - Kalah) keseluruhan.
 * 4. Jika masih sama persis, ditandai sebagai seri bersama (shared tied rank).
 */
export function calculateStandings(players: Player[], matches: Match[]): StandingsRow[] {
  const statsMap: Record<string, StandingsRow> = {};

  players.forEach(p => {
    statsMap[p.id] = {
      playerId: p.id,
      playerName: p.name,
      played: 0,
      won: 0,
      lost: 0,
      points: 0,
      difference: 0,
      rank: 1,
      isTied: false,
    };
  });

  matches.forEach(m => {
    if (m.status === 'completed' && m.winnerId && !m.isBye) {
      const pAId = m.playerAId;
      const pBId = m.playerBId;

      if (pAId && statsMap[pAId]) {
        statsMap[pAId].played++;
        if (m.winnerId === pAId) {
          statsMap[pAId].won++;
          statsMap[pAId].points += 1;
        } else {
          statsMap[pAId].lost++;
        }
      }

      if (pBId && statsMap[pBId]) {
        statsMap[pBId].played++;
        if (m.winnerId === pBId) {
          statsMap[pBId].won++;
          statsMap[pBId].points += 1;
        } else {
          statsMap[pBId].lost++;
        }
      }
    }
  });

  const rows = Object.values(statsMap).map(row => ({
    ...row,
    difference: row.won - row.lost,
  }));

  const getH2HWins = (playerId: string, groupPlayerIds: Set<string>): number => {
    let winsInGroup = 0;
    matches.forEach(m => {
      if (
        m.status === 'completed' &&
        m.winnerId === playerId &&
        m.playerAId &&
        m.playerBId &&
        groupPlayerIds.has(m.playerAId) &&
        groupPlayerIds.has(m.playerBId)
      ) {
        winsInGroup++;
      }
    });
    return winsInGroup;
  };

  const winBuckets: Record<number, StandingsRow[]> = {};
  rows.forEach(r => {
    if (!winBuckets[r.won]) {
      winBuckets[r.won] = [];
    }
    winBuckets[r.won].push(r);
  });

  const sortedWinKeys = Object.keys(winBuckets)
    .map(Number)
    .sort((a, b) => b - a);

  const finalSortedRows: StandingsRow[] = [];
  let currentRank = 1;

  sortedWinKeys.forEach(winCount => {
    const group = winBuckets[winCount];

    if (group.length === 1) {
      const single = { ...group[0], rank: currentRank, isTied: false };
      finalSortedRows.push(single);
      currentRank++;
    } else {
      const groupPlayerIds = new Set(group.map(g => g.playerId));

      const groupWithH2H = group.map(p => ({
        ...p,
        h2hWins: getH2HWins(p.playerId, groupPlayerIds),
      }));

      groupWithH2H.sort((a, b) => {
        if (b.h2hWins !== a.h2hWins) {
          return b.h2hWins - a.h2hWins;
        }
        if (b.difference !== a.difference) {
          return b.difference - a.difference;
        }
        return a.playerName.localeCompare(b.playerName);
      });

      let i = 0;
      while (i < groupWithH2H.length) {
        let j = i;
        while (
          j + 1 < groupWithH2H.length &&
          groupWithH2H[j + 1].h2hWins === groupWithH2H[i].h2hWins &&
          groupWithH2H[j + 1].difference === groupWithH2H[i].difference
        ) {
          j++;
        }

        const isSharedRank = j > i;
        const assignedRank = currentRank;

        for (let k = i; k <= j; k++) {
          finalSortedRows.push({
            playerId: groupWithH2H[k].playerId,
            playerName: groupWithH2H[k].playerName,
            played: groupWithH2H[k].played,
            won: groupWithH2H[k].won,
            lost: groupWithH2H[k].lost,
            points: groupWithH2H[k].points,
            difference: groupWithH2H[k].difference,
            rank: assignedRank,
            isTied: isSharedRank,
          });
        }

        currentRank += j - i + 1;
        i = j + 1;
      }
    }
  });

  return finalSortedRows;
}

/**
 * Membuat matriks Head-to-Head (Tabel Silang Pertemuan).
 */
export function buildHeadToHeadMatrix(players: Player[], matches: Match[]): HeadToHeadMatrix {
  const results: Record<string, Record<string, { won: number; lost: number; matches: Match[] }>> = {};

  players.forEach(p1 => {
    results[p1.id] = {};
    players.forEach(p2 => {
      results[p1.id][p2.id] = { won: 0, lost: 0, matches: [] };
    });
  });

  matches.forEach(m => {
    if (m.playerAId && m.playerBId && !m.isBye) {
      if (results[m.playerAId] && results[m.playerAId][m.playerBId]) {
        results[m.playerAId][m.playerBId].matches.push(m);
        if (m.status === 'completed' && m.winnerId) {
          if (m.winnerId === m.playerAId) {
            results[m.playerAId][m.playerBId].won++;
            results[m.playerBId][m.playerAId].lost++;
          } else if (m.winnerId === m.playerBId) {
            results[m.playerAId][m.playerBId].lost++;
            results[m.playerBId][m.playerAId].won++;
          }
        }
      }
    }
  });

  return { players, results };
}

/**
 * Menentukan Juara 1, 2, dan 3 turnamen.
 */
export function getTop3Winners(
  format: TournamentFormat,
  players: Player[],
  matches: Match[]
): { first: Player | null; second: Player | null; third: Player | null } {
  const getP = (id?: string | null) => (id ? players.find(p => p.id === id) || null : null);

  if (format === 'round-robin') {
    const standings = calculateStandings(players, matches);
    return {
      first: getP(standings[0]?.playerId),
      second: getP(standings[1]?.playerId),
      third: getP(standings[2]?.playerId),
    };
  }

  if (format === 'group-stage-knockout') {
    const finalMatch = matches.find(m => m.id === 'ko-final');
    const bronzeMatch = matches.find(m => m.id === 'ko-bronze');

    if (!finalMatch || finalMatch.status !== 'completed' || !finalMatch.winnerId) {
      return { first: null, second: null, third: null };
    }

    const firstId = finalMatch.winnerId;
    const secondId = finalMatch.playerAId === firstId ? finalMatch.playerBId : finalMatch.playerAId;
    const thirdId = bronzeMatch?.winnerId || null;

    return {
      first: getP(firstId),
      second: getP(secondId),
      third: getP(thirdId),
    };
  }

  if (format === 'double-elimination') {
    const grandFinal = matches.find(m => m.id === 'grand-final');
    const lbFinal = matches.find(m => m.id === 'lb-final');

    if (!grandFinal || grandFinal.status !== 'completed' || !grandFinal.winnerId) {
      return { first: null, second: null, third: null };
    }

    const firstId = grandFinal.winnerId;
    const secondId = grandFinal.playerAId === firstId ? grandFinal.playerBId : grandFinal.playerAId;

    // Juara 3 adalah pemain yang gugur di Losers Final
    let thirdId: string | null = null;
    if (lbFinal && lbFinal.winnerId) {
      thirdId = lbFinal.playerAId === lbFinal.winnerId ? lbFinal.playerBId : lbFinal.playerAId;
    }

    return {
      first: getP(firstId),
      second: getP(secondId),
      third: getP(thirdId),
    };
  }

  // Single Elimination
  const finalMatch = matches[matches.length - 1];
  if (!finalMatch || finalMatch.status !== 'completed' || !finalMatch.winnerId) {
    return { first: null, second: null, third: null };
  }

  const firstId = finalMatch.winnerId;
  const secondId = finalMatch.playerAId === firstId ? finalMatch.playerBId : finalMatch.playerAId;

  let thirdPlayer: Player | null = null;
  const semiA = matches.find(m => m.id === finalMatch.sourceMatchAId);
  const semiB = matches.find(m => m.id === finalMatch.sourceMatchBId);

  const semiLosers: string[] = [];
  if (semiA && semiA.winnerId) {
    const loserA = semiA.playerAId === semiA.winnerId ? semiA.playerBId : semiA.playerAId;
    if (loserA) semiLosers.push(loserA);
  }
  if (semiB && semiB.winnerId) {
    const loserB = semiB.playerAId === semiB.winnerId ? semiB.playerBId : semiB.playerAId;
    if (loserB) semiLosers.push(loserB);
  }

  if (semiLosers.length > 0) {
    thirdPlayer = players.find(p => p.id === semiLosers[0]) || null;
  }

  return {
    first: getP(firstId),
    second: getP(secondId),
    third: thirdPlayer,
  };
}
