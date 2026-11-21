import type { Match, Player, TournamentConfig } from '../types/tournament';

/**
 * Pengacakan array secara adil (Fisher-Yates Shuffle).
 */
export function shuffleArray<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * 1. ALGORITMA ROUND-ROBIN (SEMUA LAWAN SEMUA)
 */
export function generateRoundRobinSchedule(config: TournamentConfig): Match[] {
  const rawPlayers = [...config.players];
  const n = rawPlayers.length;
  if (n < 2) return [];

  const isOdd = n % 2 !== 0;
  const dummyBye: Player = { id: '__BYE__', name: 'BYE' };
  const workingPlayers = isOdd ? [...rawPlayers, dummyBye] : [...rawPlayers];
  const totalSlots = workingPlayers.length;
  const numRounds = totalSlots - 1;
  const matchesPerRound = totalSlots / 2;

  const sideBalance: Record<string, { a: number; b: number }> = {};
  rawPlayers.forEach(p => {
    sideBalance[p.id] = { a: 0, b: 0 };
  });

  const generatedMatches: Match[] = [];
  let matchCounter = 1;

  for (let cycle = 0; cycle < config.rounds; cycle++) {
    const playersForCycle = cycle === 0 ? shuffleArray(workingPlayers) : [...workingPlayers];
    const rotating = [...playersForCycle];
    const cycleMatches: Array<{ pA: Player; pB: Player; roundIdx: number }> = [];

    for (let r = 0; r < numRounds; r++) {
      for (let m = 0; m < matchesPerRound; m++) {
        const p1 = rotating[m];
        const p2 = rotating[totalSlots - 1 - m];

        if (p1.id === '__BYE__' || p2.id === '__BYE__') continue;

        let playerA = p1;
        let playerB = p2;

        const p1Bal = sideBalance[p1.id] || { a: 0, b: 0 };
        const p2Bal = sideBalance[p2.id] || { a: 0, b: 0 };

        if (p1Bal.a - p1Bal.b > p2Bal.a - p2Bal.b) {
          playerA = p2;
          playerB = p1;
        }

        if (cycle % 2 === 1) {
          const temp = playerA;
          playerA = playerB;
          playerB = temp;
        }

        sideBalance[playerA.id].a++;
        sideBalance[playerB.id].b++;

        cycleMatches.push({
          pA: playerA,
          pB: playerB,
          roundIdx: cycle * numRounds + r + 1,
        });
      }

      const last = rotating.pop()!;
      rotating.splice(1, 0, last);
    }

    const orderedMatches = orderMatchesForSingleTable(cycleMatches);

    orderedMatches.forEach(item => {
      generatedMatches.push({
        id: `match-rr-${cycle + 1}-${matchCounter}`,
        matchNumber: matchCounter++,
        round: cycle + 1,
        roundName: `Putaran ${cycle + 1}`,
        playerAId: item.pA.id,
        playerBId: item.pB.id,
        playerAName: item.pA.name,
        playerBName: item.pB.name,
        winnerId: null,
        status: 'waiting',
        bracketType: 'group',
      });
    });
  }

  return generatedMatches;
}

/**
 * 2. ALGORITMA SISTEM GUGUR (SINGLE ELIMINATION) DENGAN BYE
 */
export function generateSingleEliminationSchedule(config: TournamentConfig): Match[] {
  const players = shuffleArray([...config.players]);
  const n = players.length;
  if (n < 2) return [];

  let bracketSize = 2;
  while (bracketSize < n) {
    bracketSize *= 2;
  }

  const numByes = bracketSize - n;
  const totalRounds = Math.log2(bracketSize);

  const slots: Array<Player | null> = new Array(bracketSize).fill(null);
  const byeIndices = getFairByeIndices(bracketSize, numByes);

  let playerPointer = 0;
  for (let i = 0; i < bracketSize; i++) {
    if (byeIndices.has(i)) {
      slots[i] = null;
    } else {
      slots[i] = players[playerPointer++];
    }
  }

  const roundsMatches: Match[][] = [];
  let globalMatchCounter = 1;

  const getRoundLabel = (rIndex: number, totalR: number) => {
    const roundsFromFinal = totalR - rIndex;
    if (roundsFromFinal === 1) return 'Final';
    if (roundsFromFinal === 2) return 'Semifinal';
    if (roundsFromFinal === 3) return 'Perempat Final';
    return `Babak ${rIndex + 1}`;
  };

  // Babak 1
  const round1Matches: Match[] = [];
  const r1PairsCount = bracketSize / 2;

  for (let i = 0; i < r1PairsCount; i++) {
    const slotA = slots[i * 2];
    const slotB = slots[i * 2 + 1];
    const isByeMatch = !slotA || !slotB;
    const winnerPlayer = slotA || slotB;

    const match: Match = {
      id: `match-se-r1-${i + 1}`,
      matchNumber: globalMatchCounter++,
      round: 1,
      roundName: getRoundLabel(0, totalRounds),
      playerAId: slotA ? slotA.id : null,
      playerBId: slotB ? slotB.id : null,
      playerAName: slotA ? slotA.name : 'BYE',
      playerBName: slotB ? slotB.name : 'BYE',
      winnerId: isByeMatch && winnerPlayer ? winnerPlayer.id : null,
      status: isByeMatch ? 'completed' : 'waiting',
      isBye: isByeMatch,
      bracketType: 'knockout',
    };

    round1Matches.push(match);
  }
  roundsMatches.push(round1Matches);

  // Babak selanjutnya
  for (let r = 1; r < totalRounds; r++) {
    const currentRoundMatches: Match[] = [];
    const prevMatches = roundsMatches[r - 1];
    const currentPairsCount = prevMatches.length / 2;

    for (let i = 0; i < currentPairsCount; i++) {
      const sourceA = prevMatches[i * 2];
      const sourceB = prevMatches[i * 2 + 1];

      const playerAId = sourceA.winnerId;
      const playerAName = playerAId
        ? players.find(p => p.id === playerAId)?.name || 'Pemenang Match ' + sourceA.matchNumber
        : `Pemenang M${sourceA.matchNumber}`;

      const playerBId = sourceB.winnerId;
      const playerBName = playerBId
        ? players.find(p => p.id === playerBId)?.name || 'Pemenang Match ' + sourceB.matchNumber
        : `Pemenang M${sourceB.matchNumber}`;

      const match: Match = {
        id: `match-se-r${r + 1}-${i + 1}`,
        matchNumber: globalMatchCounter++,
        round: r + 1,
        roundName: getRoundLabel(r, totalRounds),
        playerAId,
        playerBId,
        playerAName,
        playerBName,
        winnerId: null,
        status: 'waiting',
        sourceMatchAId: sourceA.id,
        sourceMatchBId: sourceB.id,
        bracketType: 'knockout',
      };

      sourceA.nextMatchId = match.id;
      sourceA.nextMatchSlot = 'A';
      sourceB.nextMatchId = match.id;
      sourceB.nextMatchSlot = 'B';

      currentRoundMatches.push(match);
    }

    roundsMatches.push(currentRoundMatches);
  }

  const allMatches = roundsMatches.flat();
  let activeSeq = 1;
  allMatches.forEach(m => {
    if (!m.isBye) {
      m.matchNumber = activeSeq++;
    }
  });

  return allMatches;
}

/**
 * 3. ALGORITMA DOUBLE ELIMINATION (GUGUR GANDA / WINNERS & LOSERS BRACKET)
 * Pemain baru gugur jika kalah 2 kali.
 */
export function generateDoubleEliminationSchedule(config: TournamentConfig): Match[] {
  const players = shuffleArray([...config.players]);
  const n = players.length;
  if (n < 2) return [];

  // Pangkat dua terkecil >= n (4 atau 8)
  let bracketSize = 2;
  while (bracketSize < n) {
    bracketSize *= 2;
  }

  const numByes = bracketSize - n;
  const slots: Array<Player | null> = new Array(bracketSize).fill(null);
  const byeIndices = getFairByeIndices(bracketSize, numByes);

  let playerPointer = 0;
  for (let i = 0; i < bracketSize; i++) {
    if (byeIndices.has(i)) {
      slots[i] = null;
    } else {
      slots[i] = players[playerPointer++];
    }
  }

  let matchCounter = 1;
  const allMatches: Match[] = [];

  // A. WINNERS BRACKET (WB)
  // Babak 1 WB
  const wbR1: Match[] = [];
  const r1Pairs = bracketSize / 2;

  for (let i = 0; i < r1Pairs; i++) {
    const slotA = slots[i * 2];
    const slotB = slots[i * 2 + 1];
    const isBye = !slotA || !slotB;
    const winnerPlayer = slotA || slotB;

    const m: Match = {
      id: `wb-r1-${i + 1}`,
      matchNumber: matchCounter++,
      round: 1,
      roundName: 'Winners Babak 1',
      playerAId: slotA ? slotA.id : null,
      playerBId: slotB ? slotB.id : null,
      playerAName: slotA ? slotA.name : 'BYE',
      playerBName: slotB ? slotB.name : 'BYE',
      winnerId: isBye && winnerPlayer ? winnerPlayer.id : null,
      status: isBye ? 'completed' : 'waiting',
      isBye,
      bracketType: 'winners',
    };
    wbR1.push(m);
    allMatches.push(m);
  }

  // Jika 4 pemain (bracket 4):
  // WB R1 (2 match) -> Winners Final (1 match)
  // Losers Round 1 (1 match) -> Losers Final (1 match) -> Grand Final
  if (bracketSize === 4) {
    // Losers Round 1 (M3)
    const lbR1: Match = {
      id: 'lb-r1-1',
      matchNumber: matchCounter++,
      round: 1,
      roundName: 'Losers Babak 1',
      playerAId: null,
      playerBId: null,
      playerAName: 'Kalah WB 1',
      playerBName: 'Kalah WB 2',
      winnerId: null,
      status: 'waiting',
      bracketType: 'losers',
    };
    wbR1[0].nextLoserMatchId = lbR1.id;
    wbR1[0].nextLoserMatchSlot = 'A';
    wbR1[1].nextLoserMatchId = lbR1.id;
    wbR1[1].nextLoserMatchSlot = 'B';
    allMatches.push(lbR1);

    // Winners Final (M4)
    const wbFinal: Match = {
      id: 'wb-final',
      matchNumber: matchCounter++,
      round: 2,
      roundName: 'Winners Final',
      playerAId: wbR1[0].winnerId,
      playerBId: wbR1[1].winnerId,
      playerAName: wbR1[0].winnerId ? players.find(p => p.id === wbR1[0].winnerId)?.name || 'Pemenang' : 'Pemenang WB 1',
      playerBName: wbR1[1].winnerId ? players.find(p => p.id === wbR1[1].winnerId)?.name || 'Pemenang' : 'Pemenang WB 2',
      winnerId: null,
      status: 'waiting',
      bracketType: 'winners',
      sourceMatchAId: wbR1[0].id,
      sourceMatchBId: wbR1[1].id,
    };
    wbR1[0].nextMatchId = wbFinal.id;
    wbR1[0].nextMatchSlot = 'A';
    wbR1[1].nextMatchId = wbFinal.id;
    wbR1[1].nextMatchSlot = 'B';
    allMatches.push(wbFinal);

    // Losers Final (M5)
    const lbFinal: Match = {
      id: 'lb-final',
      matchNumber: matchCounter++,
      round: 2,
      roundName: 'Losers Final',
      playerAId: null,
      playerBId: null,
      playerAName: 'Kalah Winners Final',
      playerBName: 'Pemenang Losers R1',
      winnerId: null,
      status: 'waiting',
      bracketType: 'losers',
      sourceMatchBId: lbR1.id,
    };
    wbFinal.nextLoserMatchId = lbFinal.id;
    wbFinal.nextLoserMatchSlot = 'A';
    lbR1.nextMatchId = lbFinal.id;
    lbR1.nextMatchSlot = 'B';
    allMatches.push(lbFinal);

    // Grand Final (M6)
    const grandFinal: Match = {
      id: 'grand-final',
      matchNumber: matchCounter++,
      round: 3,
      roundName: 'Grand Final',
      playerAId: null,
      playerBId: null,
      playerAName: 'Juara Winners',
      playerBName: 'Juara Losers',
      winnerId: null,
      status: 'waiting',
      bracketType: 'grand_final',
      sourceMatchAId: wbFinal.id,
      sourceMatchBId: lbFinal.id,
    };
    wbFinal.nextMatchId = grandFinal.id;
    wbFinal.nextMatchSlot = 'A';
    lbFinal.nextMatchId = grandFinal.id;
    lbFinal.nextMatchSlot = 'B';
    allMatches.push(grandFinal);
  } else {
    // Bracket 8 untuk 5-8 pemain
    // WB Semifinal (2 matches)
    const wbSemi: Match[] = [];
    for (let i = 0; i < 2; i++) {
      const srcA = wbR1[i * 2];
      const srcB = wbR1[i * 2 + 1];
      const m: Match = {
        id: `wb-semi-${i + 1}`,
        matchNumber: matchCounter++,
        round: 2,
        roundName: 'Winners Semifinal',
        playerAId: srcA.winnerId,
        playerBId: srcB.winnerId,
        playerAName: srcA.winnerId ? players.find(p => p.id === srcA.winnerId)?.name || 'Pemenang' : `Pemenang M${srcA.matchNumber}`,
        playerBName: srcB.winnerId ? players.find(p => p.id === srcB.winnerId)?.name || 'Pemenang' : `Pemenang M${srcB.matchNumber}`,
        winnerId: null,
        status: 'waiting',
        bracketType: 'winners',
        sourceMatchAId: srcA.id,
        sourceMatchBId: srcB.id,
      };
      srcA.nextMatchId = m.id;
      srcA.nextMatchSlot = 'A';
      srcB.nextMatchId = m.id;
      srcB.nextMatchSlot = 'B';
      wbSemi.push(m);
      allMatches.push(m);
    }

    // Losers R1 (2 matches dari yang kalah WB R1)
    const lbR1: Match[] = [];
    for (let i = 0; i < 2; i++) {
      const m: Match = {
        id: `lb-r1-${i + 1}`,
        matchNumber: matchCounter++,
        round: 1,
        roundName: 'Losers Babak 1',
        playerAId: null,
        playerBId: null,
        playerAName: `Kalah M${wbR1[i * 2].matchNumber}`,
        playerBName: `Kalah M${wbR1[i * 2 + 1].matchNumber}`,
        winnerId: null,
        status: 'waiting',
        bracketType: 'losers',
      };
      wbR1[i * 2].nextLoserMatchId = m.id;
      wbR1[i * 2].nextLoserMatchSlot = 'A';
      wbR1[i * 2 + 1].nextLoserMatchId = m.id;
      wbR1[i * 2 + 1].nextLoserMatchSlot = 'B';
      lbR1.push(m);
      allMatches.push(m);
    }

    // Losers R2 (2 matches: pemenang LB R1 vs yang kalah WB Semi)
    const lbR2: Match[] = [];
    for (let i = 0; i < 2; i++) {
      const m: Match = {
        id: `lb-r2-${i + 1}`,
        matchNumber: matchCounter++,
        round: 2,
        roundName: 'Losers Babak 2',
        playerAId: null,
        playerBId: null,
        playerAName: `Kalah WB Semi ${i + 1}`,
        playerBName: `Pemenang LB R1 #${i + 1}`,
        winnerId: null,
        status: 'waiting',
        bracketType: 'losers',
        sourceMatchBId: lbR1[i].id,
      };
      wbSemi[i].nextLoserMatchId = m.id;
      wbSemi[i].nextLoserMatchSlot = 'A';
      lbR1[i].nextMatchId = m.id;
      lbR1[i].nextMatchSlot = 'B';
      lbR2.push(m);
      allMatches.push(m);
    }

    // Winners Final
    const wbFinal: Match = {
      id: 'wb-final',
      matchNumber: matchCounter++,
      round: 3,
      roundName: 'Winners Final',
      playerAId: null,
      playerBId: null,
      playerAName: 'Pemenang WB Semi 1',
      playerBName: 'Pemenang WB Semi 2',
      winnerId: null,
      status: 'waiting',
      bracketType: 'winners',
      sourceMatchAId: wbSemi[0].id,
      sourceMatchBId: wbSemi[1].id,
    };
    wbSemi[0].nextMatchId = wbFinal.id;
    wbSemi[0].nextMatchSlot = 'A';
    wbSemi[1].nextMatchId = wbFinal.id;
    wbSemi[1].nextMatchSlot = 'B';
    allMatches.push(wbFinal);

    // Losers Semifinal (LB R2-1 vs LB R2-2)
    const lbSemi: Match = {
      id: 'lb-semi',
      matchNumber: matchCounter++,
      round: 3,
      roundName: 'Losers Semifinal',
      playerAId: null,
      playerBId: null,
      playerAName: 'Pemenang LB R2 #1',
      playerBName: 'Pemenang LB R2 #2',
      winnerId: null,
      status: 'waiting',
      bracketType: 'losers',
      sourceMatchAId: lbR2[0].id,
      sourceMatchBId: lbR2[1].id,
    };
    lbR2[0].nextMatchId = lbSemi.id;
    lbR2[0].nextMatchSlot = 'A';
    lbR2[1].nextMatchId = lbSemi.id;
    lbR2[1].nextMatchSlot = 'B';
    allMatches.push(lbSemi);

    // Losers Final (Kalah WB Final vs Pemenang LB Semi)
    const lbFinal: Match = {
      id: 'lb-final',
      matchNumber: matchCounter++,
      round: 4,
      roundName: 'Losers Final',
      playerAId: null,
      playerBId: null,
      playerAName: 'Kalah Winners Final',
      playerBName: 'Pemenang Losers Semi',
      winnerId: null,
      status: 'waiting',
      bracketType: 'losers',
      sourceMatchBId: lbSemi.id,
    };
    wbFinal.nextLoserMatchId = lbFinal.id;
    wbFinal.nextLoserMatchSlot = 'A';
    lbSemi.nextMatchId = lbFinal.id;
    lbSemi.nextMatchSlot = 'B';
    allMatches.push(lbFinal);

    // Grand Final
    const grandFinal: Match = {
      id: 'grand-final',
      matchNumber: matchCounter++,
      round: 5,
      roundName: 'Grand Final',
      playerAId: null,
      playerBId: null,
      playerAName: 'Juara Winners',
      playerBName: 'Juara Losers',
      winnerId: null,
      status: 'waiting',
      bracketType: 'grand_final',
      sourceMatchAId: wbFinal.id,
      sourceMatchBId: lbFinal.id,
    };
    wbFinal.nextMatchId = grandFinal.id;
    wbFinal.nextMatchSlot = 'A';
    lbFinal.nextMatchId = grandFinal.id;
    lbFinal.nextMatchSlot = 'B';
    allMatches.push(grandFinal);
  }

  // Atur penomoran meja yang bukan pure BYE
  let activeSeq = 1;
  allMatches.forEach(m => {
    if (!m.isBye) {
      m.matchNumber = activeSeq++;
    }
  });

  return allMatches;
}

/**
 * 4. ALGORITMA FASE GRUP + SISTEM GUGUR (GROUP STAGE + KNOCKOUT)
 * Membagi pemain ke Grup A & B -> Round Robin -> Semifinal silang & Final.
 */
export function generateGroupStageKnockoutSchedule(config: TournamentConfig): Match[] {
  const players = shuffleArray([...config.players]);
  const n = players.length;
  if (n < 4) return [];

  // Bagi ke 2 grup: Grup A dan Grup B
  const groupA: Player[] = [];
  const groupB: Player[] = [];

  players.forEach((p, idx) => {
    if (idx % 2 === 0) groupA.push(p);
    else groupB.push(p);
  });

  let matchCounter = 1;
  const allMatches: Match[] = [];

  // 1. Match Fase Grup A (Round-robin)
  const matchesA = generateRoundRobinSchedule({
    format: 'round-robin',
    players: groupA,
    rounds: 1,
  });
  matchesA.forEach(m => {
    m.id = `group-a-${m.matchNumber}`;
    m.groupName = 'Grup A';
    m.roundName = `Grup A (Putaran ${m.round})`;
    m.bracketType = 'group';
  });

  // 2. Match Fase Grup B (Round-robin)
  const matchesB = generateRoundRobinSchedule({
    format: 'round-robin',
    players: groupB,
    rounds: 1,
  });
  matchesB.forEach(m => {
    m.id = `group-b-${m.matchNumber}`;
    m.groupName = 'Grup B';
    m.roundName = `Grup B (Putaran ${m.round})`;
    m.bracketType = 'group';
  });

  // Selang-seling match Grup A dan Grup B untuk antrean meja yang adil
  const maxGroupLen = Math.max(matchesA.length, matchesB.length);
  for (let i = 0; i < maxGroupLen; i++) {
    if (i < matchesA.length) {
      matchesA[i].matchNumber = matchCounter++;
      allMatches.push(matchesA[i]);
    }
    if (i < matchesB.length) {
      matchesB[i].matchNumber = matchCounter++;
      allMatches.push(matchesB[i]);
    }
  }

  // 3. Babak Knockout (Semifinal silang & Final)
  // Semifinal 1: Juara Grup A vs Runner-up Grup B
  const sf1: Match = {
    id: 'ko-sf-1',
    matchNumber: matchCounter++,
    round: 1,
    roundName: 'Semifinal 1',
    playerAId: null,
    playerBId: null,
    playerAName: 'Juara Grup A',
    playerBName: 'Runner-up Grup B',
    winnerId: null,
    status: 'waiting',
    bracketType: 'knockout',
  };
  allMatches.push(sf1);

  // Semifinal 2: Juara Grup B vs Runner-up Grup A
  const sf2: Match = {
    id: 'ko-sf-2',
    matchNumber: matchCounter++,
    round: 1,
    roundName: 'Semifinal 2',
    playerAId: null,
    playerBId: null,
    playerAName: 'Juara Grup B',
    playerBName: 'Runner-up Grup A',
    winnerId: null,
    status: 'waiting',
    bracketType: 'knockout',
  };
  allMatches.push(sf2);

  // Perebutan Juara 3 (Bronze Match)
  const bronzeMatch: Match = {
    id: 'ko-bronze',
    matchNumber: matchCounter++,
    round: 2,
    roundName: 'Perebutan Juara 3',
    playerAId: null,
    playerBId: null,
    playerAName: 'Kalah SF 1',
    playerBName: 'Kalah SF 2',
    winnerId: null,
    status: 'waiting',
    bracketType: 'knockout',
    sourceMatchAId: sf1.id,
    sourceMatchBId: sf2.id,
  };
  sf1.nextLoserMatchId = bronzeMatch.id;
  sf1.nextLoserMatchSlot = 'A';
  sf2.nextLoserMatchId = bronzeMatch.id;
  sf2.nextLoserMatchSlot = 'B';
  allMatches.push(bronzeMatch);

  // Final
  const finalMatch: Match = {
    id: 'ko-final',
    matchNumber: matchCounter++,
    round: 2,
    roundName: 'Final',
    playerAId: null,
    playerBId: null,
    playerAName: 'Pemenang SF 1',
    playerBName: 'Pemenang SF 2',
    winnerId: null,
    status: 'waiting',
    bracketType: 'knockout',
    sourceMatchAId: sf1.id,
    sourceMatchBId: sf2.id,
  };
  sf1.nextMatchId = finalMatch.id;
  sf1.nextMatchSlot = 'A';
  sf2.nextMatchId = finalMatch.id;
  sf2.nextMatchSlot = 'B';
  allMatches.push(finalMatch);

  return allMatches;
}

/**
 * Algoritma greedy untuk mengurutkan pertandingan meja tunggal
 */
function orderMatchesForSingleTable(
  matches: Array<{ pA: Player; pB: Player; roundIdx: number }>
): Array<{ pA: Player; pB: Player; roundIdx: number }> {
  const remaining = [...matches];
  const ordered: Array<{ pA: Player; pB: Player; roundIdx: number }> = [];
  let lastPlayerAId: string | null = null;
  let lastPlayerBId: string | null = null;

  while (remaining.length > 0) {
    let bestIndex = -1;
    let bestScore = -Infinity;

    for (let i = 0; i < remaining.length; i++) {
      const { pA, pB } = remaining[i];
      let score = 0;

      const aJustPlayed = pA.id === lastPlayerAId || pA.id === lastPlayerBId;
      const bJustPlayed = pB.id === lastPlayerAId || pB.id === lastPlayerBId;

      if (!aJustPlayed && !bJustPlayed) {
        score += 100;
      } else if (aJustPlayed && bJustPlayed) {
        score -= 200;
      } else {
        score += 20;
      }

      score += Math.random() * 5;

      if (score > bestScore) {
        bestScore = score;
        bestIndex = i;
      }
    }

    if (bestIndex >= 0) {
      const chosen = remaining.splice(bestIndex, 1)[0];
      ordered.push(chosen);
      lastPlayerAId = chosen.pA.id;
      lastPlayerBId = chosen.pB.id;
    } else {
      ordered.push(remaining.shift()!);
    }
  }

  return ordered;
}

function getFairByeIndices(bracketSize: number, numByes: number): Set<number> {
  const set = new Set<number>();
  if (numByes <= 0) return set;

  const candidates: number[] = [];
  for (let i = 1; i < bracketSize; i += 2) {
    candidates.push(i);
  }

  const shuffledCandidates = shuffleArray(candidates);
  for (let i = 0; i < numByes; i++) {
    set.add(shuffledCandidates[i]);
  }

  return set;
}
