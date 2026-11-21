import React, { useState, useRef } from 'react';
import { Copy, Download, Upload, Check } from 'lucide-react';
import type { TournamentState } from '../types/tournament';
import { copyToClipboard, generateShareText } from '../utils/share';
import { isValidTournamentState } from '../utils/storage';
import { TEKS } from '../lib/teks';

interface ImportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  tournament: TournamentState | null;
  onImportTournament: (state: TournamentState) => void;
  onShowToast: (text: string, type?: 'success' | 'warning' | 'info') => void;
}

export const ImportExportModal: React.FC<ImportExportModalProps> = ({
  isOpen,
  onClose,
  tournament,
  onImportTournament,
  onShowToast,
}) => {
  const [activeTab, setActiveTab] = useState<'export' | 'import'>('export');
  const [importJsonText, setImportJsonText] = useState('');
  const [importError, setImportError] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleCopy = async (key: string, text: string) => {
    const success = await copyToClipboard(text);
    if (success) {
      setCopiedKey(key);
      onShowToast(TEKS.toast.disalin);
      setTimeout(() => setCopiedKey(null), 1800);
    }
  };

  const handleDownloadJson = () => {
    if (!tournament) return;
    const blob = new Blob([JSON.stringify(tournament, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sia-rehe-turnamen-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    onShowToast('File cadangan turnamen diunduh.');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      const content = event.target?.result;
      if (typeof content === 'string') {
        setImportJsonText(content);
        setImportError(null);
      }
    };
    reader.readAsText(file);
  };

  const handleProcessImport = () => {
    setImportError(null);
    const trimmed = importJsonText.trim();
    if (!trimmed) {
      setImportError('Silakan masukkan atau tempel teks data turnamen.');
      return;
    }

    try {
      const parsed = JSON.parse(trimmed);
      if (!isValidTournamentState(parsed)) {
        setImportError(TEKS.error.formatDataSalah);
        return;
      }

      onImportTournament(parsed);
      onShowToast(TEKS.toast.imporSukses);
      onClose();
    } catch {
      setImportError(TEKS.error.formatDataSalah);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div
        className="w-full max-w-md rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#121c17] p-5 text-slate-900 dark:text-white space-y-4 shadow-2xl max-h-[90dvh] flex flex-col"
        role="dialog"
        aria-modal="true"
      >
        {/* Header Modal */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/10 pb-3">
          <h3 className="font-scoreboard text-lg font-bold uppercase tracking-wide">
            {TEKS.dialog.imporJudul}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white text-sm"
          >
            &times;
          </button>
        </div>

        {/* Tab Selector */}
        <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('export')}
            className={`min-h-10 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'export'
                ? 'bg-white dark:bg-emerald-600 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Salin & Ekspor
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('import')}
            className={`min-h-10 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'import'
                ? 'bg-white dark:bg-emerald-600 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Impor Data
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-0.5">
          {activeTab === 'export' ? (
            <div className="space-y-3">
              {!tournament ? (
                <p className="text-xs text-slate-500 dark:text-slate-400 text-center py-4">
                  Turnamen belum dimulai. Belum ada data untuk diekspor.
                </p>
              ) : (
                <>
                  {/* 1. Salin Ringkasan Hasil Teks */}
                  <div className="p-3.5 rounded-2xl border border-slate-200/80 dark:border-white/10 bg-slate-50/70 dark:bg-white/5 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <div className="text-xs font-bold text-slate-900 dark:text-white">Salin Hasil Teks (WhatsApp)</div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">Ringkasan juara, klasemen, & head-to-head rapi</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopy('all', generateShareText(tournament))}
                        className="btn-pressable min-h-9 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 shrink-0"
                      >
                        {copiedKey === 'all' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedKey === 'all' ? 'Tersalin' : 'Salin Teks'}</span>
                      </button>
                    </div>
                  </div>

                  {/* 2. Informasi Ekspor Gambar */}
                  <div className="p-3.5 rounded-2xl border border-emerald-500/20 bg-emerald-50/40 dark:bg-emerald-950/20 text-xs space-y-1">
                    <div className="font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                      <span>Simpan sebagai Gambar (PNG)</span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                      Untuk menyimpan Klasemen, Head-to-Head, atau Bagan sebagai gambar PNG/JPG, buka tab <b>Bracket</b> atau <b>Klasemen</b> lalu tekan tombol <b>"Gambar PNG"</b> di sudut tabel.
                    </p>
                  </div>

                  {/* 3. Unduh File Cadangan JSON */}
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={handleDownloadJson}
                      className="btn-pressable w-full min-h-11 py-2 px-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center justify-center gap-2"
                    >
                      <Download className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span>Unduh File Cadangan (.json)</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-slate-600 dark:text-slate-300">
                Pilih file backup (.json) atau tempelkan data JSON di bawah untuk memulihkan jadwal turnamen:
              </p>

              <div>
                <input
                  type="file"
                  accept=".json,application/json"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="btn-pressable w-full min-h-11 py-2 px-3 rounded-xl border border-dashed border-emerald-500/50 bg-emerald-50/50 dark:bg-emerald-950/20 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center justify-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  <span>Pilih File .json Cadangan</span>
                </button>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Atau Tempel JSON
                </label>
                <textarea
                  value={importJsonText}
                  onChange={e => {
                    setImportJsonText(e.target.value);
                    setImportError(null);
                  }}
                  placeholder='{"config": { ... }, "matches": [ ... ]}'
                  rows={5}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white text-xs font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500 resize-none"
                />
              </div>

              {importError && (
                <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 font-medium">
                  {importError}
                </div>
              )}

              <button
                type="button"
                onClick={handleProcessImport}
                className="btn-pressable w-full min-h-12 py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-scoreboard text-sm font-bold uppercase tracking-wider shadow-md shadow-emerald-600/30"
              >
                Muat Turnamen
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-slate-100 dark:border-white/10">
          <button
            type="button"
            onClick={onClose}
            className="btn-pressable w-full min-h-10 py-2 px-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-700 dark:text-slate-300 text-xs font-semibold"
          >
            {TEKS.dialog.tutup}
          </button>
        </div>
      </div>
    </div>
  );
};
