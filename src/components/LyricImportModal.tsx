import React, { useState } from 'react';
import { Subtitle } from '../types';
import { detectAndParseLyrics, formatSubtitleText } from '../utils/lyricsParser';
import { translateLyrics, SUPPORTED_LANGUAGES } from '../utils/translator';
import { X, Upload, FileText, Globe, Sparkles, Check, ArrowRight, Loader2, Music, RefreshCw } from 'lucide-react';

interface LyricImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  audioDuration?: number;
  onApplyLyrics: (subtitles: Subtitle[]) => void;
}

export const LyricImportModal: React.FC<LyricImportModalProps> = ({
  isOpen,
  onClose,
  audioDuration,
  onApplyLyrics,
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'paste'>('upload');
  const [pasteText, setPasteText] = useState('');
  const [selectedFileName, setSelectedFileName] = useState<string>('');
  const [detectedFormat, setDetectedFormat] = useState<'lrc' | 'srt' | 'txt' | null>(null);

  const [parsedLines, setParsedLines] = useState<Subtitle[]>([]);
  const [targetLang, setTargetLang] = useState('id');
  const [displayMode, setDisplayMode] = useState<'bilingual' | 'translated_only' | 'original_only'>('bilingual');

  const [isTranslating, setIsTranslating] = useState(false);
  const [translationProgress, setTranslationProgress] = useState<{ current: number; total: number } | null>(null);
  const [hasTranslated, setHasTranslated] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMessage(null);
    setSelectedFileName(file.name);
    try {
      const text = await file.text();
      const result = detectAndParseLyrics(text, file.name, audioDuration);
      if (result.subtitles.length === 0) {
        setErrorMessage('File tidak memiliki baris lirik yang valid.');
        return;
      }
      setParsedLines(result.subtitles);
      setDetectedFormat(result.format);
      setHasTranslated(false);
    } catch (err: any) {
      setErrorMessage(`Gagal membaca file: ${err.message || 'Format tidak valid'}`);
    }
  };

  const handleParsePastedText = () => {
    if (!pasteText.trim()) return;
    setErrorMessage(null);
    const result = detectAndParseLyrics(pasteText, 'pasted.txt', audioDuration);
    if (result.subtitles.length === 0) {
      setErrorMessage('Teks lirik kosong atau tidak valid.');
      return;
    }
    setParsedLines(result.subtitles);
    setDetectedFormat(result.format);
    setHasTranslated(false);
  };

  const handleTranslate = async () => {
    if (parsedLines.length === 0) return;

    setIsTranslating(true);
    setErrorMessage(null);
    setTranslationProgress({ current: 0, total: parsedLines.length });

    try {
      const textsToTranslate = parsedLines.map(line => line.originalText || line.text);
      const translated = await translateLyrics(textsToTranslate, targetLang, (completed, total) => {
        setTranslationProgress({ current: completed, total });
      });

      const updated = parsedLines.map((line, idx) => {
        const trans = translated[idx] || '';
        return {
          ...line,
          originalText: line.originalText || line.text,
          translatedText: trans,
          text: formatSubtitleText(line.originalText || line.text, trans, displayMode),
        };
      });

      setParsedLines(updated);
      setHasTranslated(true);
    } catch (err: any) {
      setErrorMessage(`Proses terjemahan gagal: ${err.message || 'Error tidak diketahui'}`);
    } finally {
      setIsTranslating(false);
      setTranslationProgress(null);
    }
  };

  const handleModeChange = (mode: 'bilingual' | 'translated_only' | 'original_only') => {
    setDisplayMode(mode);
    // Update texts
    setParsedLines(prev =>
      prev.map(line => {
        const orig = line.originalText || line.text;
        const trans = line.translatedText;
        return {
          ...line,
          text: formatSubtitleText(orig, trans, mode),
        };
      })
    );
  };

  const handleApply = () => {
    if (parsedLines.length === 0) return;

    // Apply the display mode to ensure final text format
    const finalSubs = parsedLines.map(line => {
      const orig = line.originalText || line.text;
      const trans = line.translatedText;
      return {
        ...line,
        originalText: orig,
        translatedText: trans,
        text: formatSubtitleText(orig, trans, displayMode),
      };
    });

    onApplyLyrics(finalSubs);
    onClose();
  };

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    const ms = Math.floor((sec % 1) * 10);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-[#121216] border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-gray-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#17171d]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20 text-white">
              <Sparkles size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Import & Terjemahan Lirik Otomatis
                <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  AI Bilingual
                </span>
              </h2>
              <p className="text-xs text-gray-400">
                Mendukung file .LRC, .SRT, .TXT dengan opsi terjemahan Dual Bahasa (Bilingual).
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
            title="Tutup Modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Section 1: Input method */}
          <div className="space-y-3">
            <div className="flex gap-2 border-b border-white/10 pb-2">
              <button
                onClick={() => setActiveTab('upload')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'upload'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Upload size={14} /> Upload File (.lrc, .srt, .txt)
              </button>
              <button
                onClick={() => setActiveTab('paste')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'paste'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <FileText size={14} /> Tempel Teks Lirik (Paste)
              </button>
            </div>

            {activeTab === 'upload' ? (
              <div className="border-2 border-dashed border-white/15 hover:border-blue-500/50 rounded-xl p-6 text-center transition-all bg-white/[0.02]">
                <input
                  type="file"
                  id="lyric-file-input"
                  accept=".lrc,.srt,.txt"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <label
                  htmlFor="lyric-file-input"
                  className="flex flex-col items-center justify-center cursor-pointer space-y-2"
                >
                  <div className="w-12 h-12 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center">
                    <Upload size={22} />
                  </div>
                  <div className="text-xs font-semibold text-white">
                    {selectedFileName ? (
                      <span className="text-green-400 flex items-center gap-1.5 justify-center">
                        <Check size={14} /> {selectedFileName}
                      </span>
                    ) : (
                      'Klik untuk memilih file lirik (.LRC, .SRT, atau .TXT)'
                    )}
                  </div>
                  <p className="text-[11px] text-gray-500">
                    Format file lirik dengan timestamp (.lrc / .srt) atau teks biasa (.txt)
                  </p>
                </label>
              </div>
            ) : (
              <div className="space-y-2">
                <textarea
                  value={pasteText}
                  onChange={e => setPasteText(e.target.value)}
                  placeholder="Tempelkan baris lirik lagu di sini...&#10;Contoh:&#10;Is this the real life?&#10;Is this just fantasy?&#10;Caught in a landslide, no escape from reality..."
                  className="w-full h-32 bg-black/40 border border-white/10 rounded-xl p-3 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 font-mono resize-y"
                />
                <button
                  onClick={handleParsePastedText}
                  disabled={!pasteText.trim()}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 disabled:opacity-50 text-white rounded-lg text-xs font-semibold transition-all"
                >
                  Muat Teks Lirik
                </button>
              </div>
            )}

            {errorMessage && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-xs text-red-400">
                {errorMessage}
              </div>
            )}
          </div>

          {/* Section 2: Translation & Display Options (Available once lines are loaded) */}
          {parsedLines.length > 0 && (
            <div className="bg-[#181820] border border-white/10 rounded-xl p-5 space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    Pengaturan Terjemahan
                  </span>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-medium">
                    {parsedLines.length} Baris Terdeteksi ({detectedFormat?.toUpperCase() || 'LIRIK'})
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Globe size={14} className="text-gray-400" />
                    <span className="text-xs text-gray-300">Bahasa Tujuan:</span>
                    <select
                      value={targetLang}
                      onChange={e => setTargetLang(e.target.value)}
                      className="bg-black/50 border border-white/15 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
                    >
                      {SUPPORTED_LANGUAGES.map(lang => (
                        <option key={lang.code} value={lang.code}>
                          {lang.flag} {lang.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    onClick={handleTranslate}
                    disabled={isTranslating}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold rounded-lg shadow-lg shadow-blue-600/30 transition-all disabled:opacity-50"
                  >
                    {isTranslating ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        Menerjemahkan ({translationProgress ? `${translationProgress.current}/${translationProgress.total}` : 'Memproses...'})
                      </>
                    ) : (
                      <>
                        <Sparkles size={14} />
                        {hasTranslated ? 'Terjemahkan Ulang (AI)' : 'Terjemahkan Otomatis (AI)'}
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Display Mode Selection */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-gray-300">
                  Pilih Mode Tampilan di Layar (Visualizer):
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* Bilingual */}
                  <div
                    onClick={() => handleModeChange('bilingual')}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                      displayMode === 'bilingual'
                        ? 'bg-blue-600/15 border-blue-500 text-white ring-1 ring-blue-500'
                        : 'bg-black/30 border-white/5 text-gray-400 hover:border-white/20 hover:text-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold text-white flex items-center gap-1.5">
                        🌟 Bilingual (Dua Bahasa)
                      </span>
                      {displayMode === 'bilingual' && <Check size={14} className="text-blue-400" />}
                    </div>
                    <p className="text-[11px] leading-relaxed text-gray-400">
                      Baris 1 lirik asli, Baris 2 teks terjemahan. Mode standar untuk video musik & karaoke.
                    </p>
                  </div>

                  {/* Translated Only */}
                  <div
                    onClick={() => handleModeChange('translated_only')}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                      displayMode === 'translated_only'
                        ? 'bg-blue-600/15 border-blue-500 text-white ring-1 ring-blue-500'
                        : 'bg-black/30 border-white/5 text-gray-400 hover:border-white/20 hover:text-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold text-white flex items-center gap-1.5">
                        🔄 Hanya Terjemahan
                      </span>
                      {displayMode === 'translated_only' && <Check size={14} className="text-blue-400" />}
                    </div>
                    <p className="text-[11px] leading-relaxed text-gray-400">
                      Mengganti lirik asli sepenuhnya dengan teks terjemahan saja.
                    </p>
                  </div>

                  {/* Original Only */}
                  <div
                    onClick={() => handleModeChange('original_only')}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                      displayMode === 'original_only'
                        ? 'bg-blue-600/15 border-blue-500 text-white ring-1 ring-blue-500'
                        : 'bg-black/30 border-white/5 text-gray-400 hover:border-white/20 hover:text-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold text-white flex items-center gap-1.5">
                        📄 Lirik Asli Saja
                      </span>
                      {displayMode === 'original_only' && <Check size={14} className="text-blue-400" />}
                    </div>
                    <p className="text-[11px] leading-relaxed text-gray-400">
                      Hanya menampilkan teks lirik asli tanpa terjemahan.
                    </p>
                  </div>
                </div>
              </div>

              {/* Translation Progress bar if active */}
              {isTranslating && translationProgress && (
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[11px] text-gray-400">
                    <span>Sedang menerjemahkan baris demi baris secara musikal...</span>
                    <span>{Math.round((translationProgress.current / translationProgress.total) * 100)}%</span>
                  </div>
                  <div className="w-full h-2 bg-black/50 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-200"
                      style={{
                        width: `${(translationProgress.current / translationProgress.total) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Preview Table of Lines */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-400">
                    Pratinjau Hasil Lirik ({parsedLines.length} Baris):
                  </span>
                  <span className="text-[10px] text-gray-500">
                    Anda bisa mengedit teks langsung pada kolom di bawah
                  </span>
                </div>

                <div className="max-h-60 overflow-y-auto space-y-2 pr-1 divide-y divide-white/5">
                  {parsedLines.map((line, idx) => (
                    <div key={line.id || idx} className="pt-2 flex flex-col md:flex-row gap-2 items-start md:items-center">
                      <div className="w-24 shrink-0 font-mono text-[10px] text-gray-500 bg-black/40 px-2 py-1 rounded">
                        {formatSeconds(line.start)} - {formatSeconds(line.end)}
                      </div>

                      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-2 w-full">
                        <div>
                          <span className="text-[9px] uppercase tracking-wider text-gray-500 block mb-0.5">Asli</span>
                          <input
                            type="text"
                            value={line.originalText || line.text}
                            onChange={e => {
                              const newOrig = e.target.value;
                              setParsedLines(prev => {
                                const next = [...prev];
                                next[idx] = {
                                  ...next[idx],
                                  originalText: newOrig,
                                  text: formatSubtitleText(newOrig, next[idx].translatedText, displayMode),
                                };
                                return next;
                              });
                            }}
                            className="w-full bg-black/40 border border-white/10 rounded px-2.5 py-1 text-xs text-white focus:outline-none focus:border-blue-500"
                          />
                        </div>

                        <div>
                          <span className="text-[9px] uppercase tracking-wider text-blue-400 block mb-0.5">
                            Terjemahan {displayMode === 'bilingual' ? '(Baris 2)' : ''}
                          </span>
                          <input
                            type="text"
                            value={line.translatedText || ''}
                            placeholder={hasTranslated ? 'Tidak ada terjemahan' : 'Klik "Terjemahkan Otomatis" di atas'}
                            onChange={e => {
                              const newTrans = e.target.value;
                              setParsedLines(prev => {
                                const next = [...prev];
                                next[idx] = {
                                  ...next[idx],
                                  translatedText: newTrans,
                                  text: formatSubtitleText(next[idx].originalText || next[idx].text, newTrans, displayMode),
                                };
                                return next;
                              });
                            }}
                            className="w-full bg-black/40 border border-white/10 rounded px-2.5 py-1 text-xs text-blue-200 focus:outline-none focus:border-blue-500 placeholder-gray-600"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/10 bg-[#17171d] flex items-center justify-between">
          <div className="text-xs text-gray-400">
            {parsedLines.length > 0 && (
              <span>
                Mode aktif:{' '}
                <strong className="text-white">
                  {displayMode === 'bilingual'
                    ? 'Bilingual (Dua Bahasa)'
                    : displayMode === 'translated_only'
                    ? 'Hanya Terjemahan'
                    : 'Lirik Asli Saja'}
                </strong>
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              Batal
            </button>
            <button
              onClick={handleApply}
              disabled={parsedLines.length === 0}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-600/30 transition-all cursor-pointer"
            >
              <Check size={16} /> Terapkan ke Proyek ({parsedLines.length} Baris)
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
