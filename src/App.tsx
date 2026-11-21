import { useState, useEffect } from 'react';
import { useTournament } from './hooks/useTournament';
import { Header } from './components/Header';
import { SetupView } from './components/SetupView';
import { MatchView } from './components/MatchView';
import { StandingsView } from './components/StandingsView';
import { BracketView } from './components/BracketView';
import { ChampionModal } from './components/ChampionModal';
import { ConfirmDialog } from './components/ConfirmDialog';
import { Toast, type ToastMessage } from './components/Toast';
import { getStoredTheme, saveStoredTheme } from './utils/storage';
import { TEKS } from './lib/teks';

export function App() {
  const [theme, setTheme] = useState<'dark' | 'light'>(() => getStoredTheme());
  const [activeTab, setActiveTab] = useState<'matches' | 'standings' | 'bracket'>('matches');
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [isChampionModalOpen, setIsChampionModalOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const {
    tournament,
    startTournament,
    recordWinner,
    undoLastAction,
    editMatchResult,
    resetTournament,
    canUndo,
  } = useTournament();

  useEffect(() => {
    saveStoredTheme(theme);
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const showToast = (text: string, type: 'success' | 'warning' | 'info' = 'success') => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts(prev => [...prev, { id, text, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 2200);
  };

  const dismissToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  useEffect(() => {
    if (tournament && tournament.isCompleted) {
      setIsChampionModalOpen(true);
    }
  }, [tournament?.isCompleted]);

  const handleRecordWinner = (matchId: string, winnerId: string) => {
    recordWinner(matchId, winnerId);
    showToast(TEKS.toast.disimpan);
  };

  const handleEditResult = (matchId: string, newWinnerId: string) => {
    editMatchResult(matchId, newWinnerId);
    showToast(TEKS.toast.dikoreksi, 'info');
  };

  const handleUndo = () => {
    const ok = undoLastAction();
    if (ok) {
      showToast(TEKS.toast.dibatalkan, 'warning');
    }
  };

  const handleConfirmReset = () => {
    resetTournament();
    setIsResetConfirmOpen(false);
    setIsChampionModalOpen(false);
    setActiveTab('matches');
    showToast(TEKS.toast.direset, 'info');
  };

  return (
    <div
      className={`min-h-dvh flex flex-col font-sans transition-colors duration-200 overflow-x-hidden ${
        theme === 'dark'
          ? 'dark bg-[#090e0c] text-slate-100'
          : 'light bg-[#f4f6f5] text-slate-800'
      }`}
      style={{
        paddingBottom: 'env(safe-area-inset-bottom)',
        paddingLeft: 'env(safe-area-inset-left)',
        paddingRight: 'env(safe-area-inset-right)',
      }}
    >
      <Toast toasts={toasts} onDismiss={dismissToast} />

      <Header
        theme={theme}
        onToggleTheme={toggleTheme}
        tournament={tournament}
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        onUndo={handleUndo}
        canUndo={canUndo}
        onReset={() => setIsResetConfirmOpen(true)}
      />

      <main className="flex-1 pb-12 pt-1">
        {!tournament ? (
          <SetupView onStart={startTournament} />
        ) : (
          <div>
            {/* Tab 1 (Kiri): Jadwal */}
            {activeTab === 'matches' && (
              <MatchView
                matches={tournament.matches}
                players={tournament.config.players}
                currentMatchIndex={tournament.currentMatchIndex}
                onRecordWinner={handleRecordWinner}
                onEditResult={handleEditResult}
                onUndo={handleUndo}
                canUndo={canUndo}
              />
            )}

            {/* Tab 2 (Tengah): Bracket yang bagus */}
            {activeTab === 'bracket' && (
              <BracketView
                format={tournament.config.format}
                matches={tournament.matches}
                players={tournament.config.players}
              />
            )}

            {/* Tab 3 (Kanan): Klasemen & Matriks Pertemuan */}
            {activeTab === 'standings' && (
              <StandingsView
                players={tournament.config.players}
                matches={tournament.matches}
              />
            )}
          </div>
        )}
      </main>

      <ConfirmDialog
        isOpen={isResetConfirmOpen}
        title={TEKS.dialog.resetJudul}
        message={TEKS.dialog.resetPesan}
        confirmText={TEKS.dialog.simpan}
        cancelText={TEKS.dialog.batal}
        confirmVariant="danger"
        onConfirm={handleConfirmReset}
        onCancel={() => setIsResetConfirmOpen(false)}
      />

      {tournament && (
        <ChampionModal
          state={tournament}
          isOpen={isChampionModalOpen}
          onClose={() => setIsChampionModalOpen(false)}
          onReset={() => {
            setIsChampionModalOpen(false);
            setIsResetConfirmOpen(true);
          }}
          onShowToast={showToast}
        />
      )}
    </div>
  );
}

export default App;
