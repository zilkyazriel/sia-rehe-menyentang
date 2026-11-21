import { useState, useEffect, useCallback } from 'react';
import type { Match, TournamentConfig, TournamentSnapshot, TournamentState } from '../types/tournament';
import {
  generateRoundRobinSchedule,
  generateSingleEliminationSchedule,
  generateDoubleEliminationSchedule,
  generateGroupStageKnockoutSchedule,
} from '../utils/scheduler';
import { calculateStandings } from '../utils/standings';
import { loadTournamentFromStorage, saveTournamentToStorage } from '../utils/storage';

export function useTournament() {
  const [tournament, setTournament] = useState<TournamentState | null>(() => {
    return loadTournamentFromStorage();
  });

  useEffect(() => {
    saveTournamentToStorage(tournament);
  }, [tournament]);

  /**
   * Memulai turnamen baru dari pengaturan pemain dan format
   */
  const startTournament = useCallback((config: TournamentConfig) => {
    let matches: Match[] = [];
    if (config.format === 'round-robin') {
      matches = generateRoundRobinSchedule(config);
    } else if (config.format === 'single-elimination') {
      matches = generateSingleEliminationSchedule(config);
    } else if (config.format === 'double-elimination') {
      matches = generateDoubleEliminationSchedule(config);
    } else if (config.format === 'group-stage-knockout') {
      matches = generateGroupStageKnockoutSchedule(config);
    }

    const firstActiveIndex = matches.findIndex(m => !m.isBye && m.status !== 'completed');

    const newState: TournamentState = {
      config,
      matches,
      currentMatchIndex: firstActiveIndex >= 0 ? firstActiveIndex : 0,
      history: [],
      isCompleted: false,
      startedAt: new Date().toISOString(),
    };

    setTournament(newState);
  }, []);

  const createSnapshot = (state: TournamentState, description: string): TournamentSnapshot => {
    return {
      matches: JSON.parse(JSON.stringify(state.matches)),
      currentMatchIndex: state.currentMatchIndex,
      isCompleted: state.isCompleted,
      description,
    };
  };

  /**
   * Mencatat pemenang pada match
   */
  const recordWinner = useCallback((matchId: string, winnerId: string) => {
    setTournament(prev => {
      if (!prev) return null;

      const snapshot = createSnapshot(prev, `Hasil match dicatat`);
      const newMatches = [...prev.matches];
      const matchIndex = newMatches.findIndex(m => m.id === matchId);
      if (matchIndex === -1) return prev;

      const targetMatch = { ...newMatches[matchIndex] };
      const prevWinnerId = targetMatch.winnerId;
      targetMatch.winnerId = winnerId;
      targetMatch.status = 'completed';
      newMatches[matchIndex] = targetMatch;

      // Update downstream bracket linkages
      updateDownstreamMatches(newMatches, targetMatch, winnerId, prevWinnerId, prev.config);

      const nextIdx = newMatches.findIndex(m => !m.isBye && m.status !== 'completed');
      const allDone = nextIdx === -1;

      return {
        ...prev,
        matches: newMatches,
        currentMatchIndex: allDone ? prev.matches.length - 1 : nextIdx,
        isCompleted: allDone,
        completedAt: allDone ? new Date().toISOString() : undefined,
        history: [...prev.history, snapshot],
      };
    });
  }, []);

  const undoLastAction = useCallback((): boolean => {
    let success = false;
    setTournament(prev => {
      if (!prev || prev.history.length === 0) return prev;

      const historyCopy = [...prev.history];
      const lastSnapshot = historyCopy.pop()!;

      success = true;
      return {
        ...prev,
        matches: lastSnapshot.matches,
        currentMatchIndex: lastSnapshot.currentMatchIndex,
        isCompleted: lastSnapshot.isCompleted,
        completedAt: lastSnapshot.isCompleted ? prev.completedAt : undefined,
        history: historyCopy,
      };
    });
    return success;
  }, []);

  const editMatchResult = useCallback((matchId: string, newWinnerId: string) => {
    setTournament(prev => {
      if (!prev) return null;

      const snapshot = createSnapshot(prev, `Koreksi hasil match #${matchId}`);
      const newMatches = [...prev.matches];
      const matchIndex = newMatches.findIndex(m => m.id === matchId);
      if (matchIndex === -1) return prev;

      const targetMatch = { ...newMatches[matchIndex] };
      const prevWinnerId = targetMatch.winnerId;
      targetMatch.winnerId = newWinnerId;
      targetMatch.status = 'completed';
      newMatches[matchIndex] = targetMatch;

      updateDownstreamMatches(newMatches, targetMatch, newWinnerId, prevWinnerId, prev.config);

      const nextIdx = newMatches.findIndex(m => !m.isBye && m.status !== 'completed');
      const allDone = nextIdx === -1;

      return {
        ...prev,
        matches: newMatches,
        currentMatchIndex: allDone ? prev.matches.length - 1 : nextIdx,
        isCompleted: allDone,
        history: [...prev.history, snapshot],
      };
    });
  }, []);

  const resetTournament = useCallback(() => {
    setTournament(null);
    saveTournamentToStorage(null);
  }, []);

  return {
    tournament,
    startTournament,
    recordWinner,
    undoLastAction,
    editMatchResult,
    resetTournament,
    canUndo: Boolean(tournament && tournament.history.length > 0),
  };
}

/**
 * Memperbarui match downstream (pemenang dan pemain yang kalah)
 */
function updateDownstreamMatches(
  matches: Match[],
  sourceMatch: Match,
  newWinnerId: string,
  prevWinnerId: string | null,
  config: TournamentConfig
) {
  const winnerPlayer = config.players.find(p => p.id === newWinnerId);
  const winnerName = winnerPlayer ? winnerPlayer.name : 'Pemenang';

  const loserId =
    sourceMatch.playerAId === newWinnerId ? sourceMatch.playerBId : sourceMatch.playerAId;
  const loserPlayer = config.players.find(p => p.id === loserId);
  const loserName = loserPlayer ? loserPlayer.name : 'Pemain';

  // 1. Majukan Pemenang ke nextMatchId
  if (sourceMatch.nextMatchId) {
    const nextIdx = matches.findIndex(m => m.id === sourceMatch.nextMatchId);
    if (nextIdx !== -1) {
      const nextM = { ...matches[nextIdx] };
      if (sourceMatch.nextMatchSlot === 'A') {
        nextM.playerAId = newWinnerId;
        nextM.playerAName = winnerName;
      } else {
        nextM.playerBId = newWinnerId;
        nextM.playerBName = winnerName;
      }

      if (prevWinnerId && prevWinnerId !== newWinnerId && nextM.winnerId) {
        nextM.winnerId = null;
        nextM.status = 'waiting';
      }
      matches[nextIdx] = nextM;
    }
  }

  // 2. Majukan Yang Kalah ke nextLoserMatchId (khusus Double Elimination atau Bronze)
  if (sourceMatch.nextLoserMatchId && loserId) {
    const loserIdx = matches.findIndex(m => m.id === sourceMatch.nextLoserMatchId);
    if (loserIdx !== -1) {
      const loserM = { ...matches[loserIdx] };
      if (sourceMatch.nextLoserMatchSlot === 'A') {
        loserM.playerAId = loserId;
        loserM.playerAName = loserName;
      } else {
        loserM.playerBId = loserId;
        loserM.playerBName = loserName;
      }
      matches[loserIdx] = loserM;
    }
  }

  // 3. Khusus Fase Grup + Knockout:
  // Periksa apakah semua match grup sudah selesai untuk mengisi peserta Semifinal
  if (config.format === 'group-stage-knockout') {
    const groupMatches = matches.filter(m => m.bracketType === 'group');
    const allGroupMatchesDone = groupMatches.every(m => m.status === 'completed');

    if (allGroupMatchesDone) {
      const matchesGroupA = groupMatches.filter(m => m.groupName === 'Grup A');
      const matchesGroupB = groupMatches.filter(m => m.groupName === 'Grup B');

      // Cari pemain di Grup A dan Grup B
      const playerIdsA = new Set<string>();
      matchesGroupA.forEach(m => {
        if (m.playerAId) playerIdsA.add(m.playerAId);
        if (m.playerBId) playerIdsA.add(m.playerBId);
      });
      const playersA = config.players.filter(p => playerIdsA.has(p.id));

      const playerIdsB = new Set<string>();
      matchesGroupB.forEach(m => {
        if (m.playerAId) playerIdsB.add(m.playerAId);
        if (m.playerBId) playerIdsB.add(m.playerBId);
      });
      const playersB = config.players.filter(p => playerIdsB.has(p.id));

      const standingsA = calculateStandings(playersA, matchesGroupA);
      const standingsB = calculateStandings(playersB, matchesGroupB);

      if (standingsA.length >= 2 && standingsB.length >= 2) {
        // SF 1: Juara Grup A vs Runner-up Grup B
        const sf1Idx = matches.findIndex(m => m.id === 'ko-sf-1');
        if (sf1Idx !== -1) {
          const sf1 = { ...matches[sf1Idx] };
          sf1.playerAId = standingsA[0].playerId;
          sf1.playerAName = standingsA[0].playerName;
          sf1.playerBId = standingsB[1].playerId;
          sf1.playerBName = standingsB[1].playerName;
          matches[sf1Idx] = sf1;
        }

        // SF 2: Juara Grup B vs Runner-up Grup A
        const sf2Idx = matches.findIndex(m => m.id === 'ko-sf-2');
        if (sf2Idx !== -1) {
          const sf2 = { ...matches[sf2Idx] };
          sf2.playerAId = standingsB[0].playerId;
          sf2.playerAName = standingsB[0].playerName;
          sf2.playerBId = standingsA[1].playerId;
          sf2.playerBName = standingsA[1].playerName;
          matches[sf2Idx] = sf2;
        }
      }
    }
  }
}
