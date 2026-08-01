import React, { useState, useRef } from 'react';
import {
  Volume2,
  VolumeX,
  Volume1,
  Play,
  Check,
  X,
  BellRing,
  Sparkles,
  Repeat,
  Sliders,
  Music,
  Zap,
  Upload,
  Trash2,
  AlertCircle,
  FileAudio,
  Smartphone,
  ChevronRight,
} from 'lucide-react';
import {
  STAT_SOUND_PRESETS,
  getAllSoundPresets,
  getSelectedSoundId,
  setSelectedSoundId,
  getSoundVolume,
  setSoundVolume,
  getSoundLoops,
  setSoundLoops,
  playStatAlarmSound,
  processAndSaveCustomAudio,
  deleteCustomSound,
} from '../utils/statSound';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSoundChange?: (newSoundId: string) => void;
  onOpenPwaNotifications?: () => void;
}

export const SoundSelectorModal: React.FC<Props> = ({ isOpen, onClose, onSoundChange, onOpenPwaNotifications }) => {
  const [activeSoundId, setActiveSoundId] = useState<string>(() => getSelectedSoundId());
  const [volume, setVolume] = useState<number>(() => getSoundVolume());
  const [loops, setLoops] = useState<number>(() => getSoundLoops());
  const [activeCategory, setActiveCategory] = useState<'all' | 'clinical' | 'effects' | 'retro' | 'custom'>('all');
  const [playingId, setPlayingId] = useState<string | null>(null);

  const [allPresets, setAllPresets] = useState(() => getAllSoundPresets());
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const refreshPresets = () => {
    setAllPresets(getAllSoundPresets());
  };

  const handleFileUpload = async (file: File) => {
    setIsUploading(true);
    setUploadError(null);
    try {
      const newSound = await processAndSaveCustomAudio(file);
      refreshPresets();
      setActiveSoundId(newSound.id);
      setSelectedSoundId(newSound.id);
      setActiveCategory('custom');
      if (onSoundChange) {
        onSoundChange(newSound.id);
      }
      playStatAlarmSound(newSound.id, volume, loops);
    } catch (err: any) {
      setUploadError(err.message || 'Failed to upload custom audio file');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
      e.target.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleDeleteCustomSound = (e: React.MouseEvent, soundId: string) => {
    e.stopPropagation();
    deleteCustomSound(soundId);
    refreshPresets();
    if (activeSoundId === soundId) {
      const fallback = 'piercing-pulse';
      setActiveSoundId(fallback);
      setSelectedSoundId(fallback);
      if (onSoundChange) {
        onSoundChange(fallback);
      }
    }
  };

  const handlePreviewSound = (e?: React.MouseEvent, soundId?: string) => {
    if (e) e.stopPropagation();
    const targetId = soundId || activeSoundId;
    setPlayingId(targetId);
    playStatAlarmSound(targetId, volume, loops);

    const baseDuration = targetId === 'f1-v10-rev' ? 1.2 : targetId === 'sub-dive-horn' ? 0.8 : 0.6;
    const totalTimeMs = Math.round((baseDuration + 0.15) * loops * 1000);

    setTimeout(() => {
      setPlayingId(null);
    }, Math.min(totalTimeMs, 5000));
  };

  const handleSelectSound = (soundId: string) => {
    setActiveSoundId(soundId);
    setSelectedSoundId(soundId);
    if (onSoundChange) {
      onSoundChange(soundId);
    }
    handlePreviewSound(undefined, soundId);
  };

  const handleVolumeChange = (newVol: number) => {
    setVolume(newVol);
    setSoundVolume(newVol);
  };

  const handleLoopsChange = (newLoops: number) => {
    setLoops(newLoops);
    setSoundLoops(newLoops);
    handlePreviewSound(undefined, activeSoundId);
  };

  const activePreset =
    allPresets.find((p) => p.id === activeSoundId) || allPresets[0] || STAT_SOUND_PRESETS[0];

  const filteredPresets = allPresets.filter((p) => {
    if (activeCategory === 'all') return true;
    return p.category === activeCategory;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="relative w-full max-w-3xl bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[96vh] sm:max-h-[92vh]">
        {/* Modal Header (Sticky Top) */}
        <div className="px-3 sm:px-6 py-2 sm:py-4 bg-gradient-to-r from-rose-600 via-rose-700 to-amber-600 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2.5 rounded-lg sm:rounded-2xl bg-white/20 backdrop-blur text-white shadow-xs shrink-0">
              <Volume2 className="w-4 h-4 sm:w-6 sm:h-6 animate-pulse" />
            </div>
            <div>
              <h2 className="text-xs sm:text-lg font-black tracking-tight text-white flex items-center gap-1.5 sm:gap-2">
                <span className="truncate max-w-[170px] xs:max-w-none">STAT Sound Customizer</span>
                <span className="hidden xs:inline-block px-1.5 sm:px-2 py-0.5 rounded-full text-[8px] sm:text-[10px] font-extrabold bg-white text-rose-800 uppercase whitespace-nowrap shadow-2xs">
                  Custom Audio
                </span>
              </h2>
              <p className="hidden sm:block text-xs text-rose-100 font-medium">
                Upload your own alarm sound or choose from built-in presets.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 sm:p-2 rounded-full text-white/80 hover:text-white hover:bg-white/20 transition-colors shrink-0"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* Scrollable Modal Content Body */}
        <div className="flex-1 overflow-y-auto min-h-0 divide-y divide-slate-200/60 dark:divide-slate-800/80">
          {/* Current Active Sound Banner & Quick Test */}
          <div className="px-3 sm:px-6 py-2 sm:py-3 bg-rose-50/80 dark:bg-rose-950/40 border-b border-rose-100 dark:border-rose-900/50 flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 text-[11px] sm:text-xs overflow-hidden">
              <BellRing className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-600 dark:text-rose-400 shrink-0" />
              <span className="hidden xs:inline">Active Sound:</span>
              <strong className="font-bold text-rose-800 dark:text-rose-300 truncate max-w-[110px] sm:max-w-none">
                {activePreset.name}
              </strong>
              <span className="text-slate-400 text-[10px] sm:text-xs hidden sm:inline">({volume}% Vol • {loops}x Burst)</span>
            </div>
            <button
              onClick={(e) => handlePreviewSound(e, activeSoundId)}
              className="px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-lg sm:rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold flex items-center justify-center gap-1 transition-all active:scale-95 shadow-xs text-[10px] sm:text-xs shrink-0"
            >
              <Play className={`w-3 h-3 sm:w-3.5 sm:h-3.5 fill-current ${playingId === activeSoundId ? 'animate-bounce' : ''}`} />
              <span>Test Alarm</span>
            </button>
          </div>

          {/* PWA & Mobile Lockscreen Notification Help Banner */}
          {onOpenPwaNotifications && (
            <div className="px-3 sm:px-6 py-2.5 bg-indigo-50/80 dark:bg-indigo-950/30 border-b border-indigo-100 dark:border-indigo-900/50 flex items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 text-indigo-900 dark:text-indigo-200">
                <Smartphone className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                <div className="text-[11px] sm:text-xs">
                  <span className="font-bold">Can&apos;t see PWA in Phone Notification Settings?</span>
                  <span className="hidden sm:inline text-indigo-700 dark:text-indigo-300 ml-1">
                    Request permission &amp; add to Home Screen.
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenPwaNotifications();
                }}
                className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] sm:text-xs flex items-center gap-1 shrink-0 transition-all"
              >
                <span>Enable PWA Alerts</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* Global Controls Section (Volume & Duration Changer) */}
          <div className="p-3 sm:p-6 bg-slate-50/60 dark:bg-slate-800/30 grid grid-cols-1 md:grid-cols-2 gap-2.5 sm:gap-4">
            {/* Volume Control Slider */}
            <div className="bg-white dark:bg-slate-800 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700/70 shadow-2xs">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  {volume === 0 ? (
                    <VolumeX className="w-4 h-4 text-slate-400" />
                  ) : volume < 50 ? (
                    <Volume1 className="w-4 h-4 text-amber-500" />
                  ) : (
                    <Volume2 className="w-4 h-4 text-rose-600" />
                  )}
                  <span>Volume Level</span>
                </label>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-black text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950 px-2 py-0.5 rounded-md">
                    {volume}%
                  </span>
                  <button
                    type="button"
                    onClick={() => handleVolumeChange(volume === 0 ? 100 : 0)}
                    className="text-[10px] font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 underline ml-1"
                  >
                    {volume === 0 ? 'Unmute' : 'Mute'}
                  </button>
                </div>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={volume}
                onChange={(e) => handleVolumeChange(parseInt(e.target.value, 10))}
                onMouseUp={() => handlePreviewSound(undefined, activeSoundId)}
                onTouchEnd={() => handlePreviewSound(undefined, activeSoundId)}
                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-rose-600"
              />
              <div className="flex justify-between text-[10px] font-semibold text-slate-400 mt-1">
                <span>0% (Muted)</span>
                <span>50%</span>
                <span>100% (Max Alert)</span>
              </div>
            </div>

            {/* Sound Duration / Loop Count Changer */}
            <div className="bg-white dark:bg-slate-800 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700/70 shadow-2xs">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Repeat className="w-4 h-4 text-rose-600" />
                  <span>Alarm Duration / Repeats</span>
                </label>
                <span className="text-[10px] font-extrabold text-slate-500 uppercase">
                  {loops === 1 ? '~1 Sec Burst' : loops === 2 ? '~2.5 Secs' : loops === 3 ? '~4 Secs' : '~7 Secs Alert'}
                </span>
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { count: 1, label: '1 Burst', sub: 'Short' },
                  { count: 2, label: '2 Repeats', sub: 'Medium' },
                  { count: 3, label: '3 Repeats', sub: 'Long' },
                  { count: 5, label: '5 Repeats', sub: 'Max Alert' },
                ].map((opt) => {
                  const isSelected = loops === opt.count;
                  return (
                    <button
                      key={opt.count}
                      type="button"
                      onClick={() => handleLoopsChange(opt.count)}
                      className={`py-1.5 px-1.5 sm:px-2 rounded-xl text-xs font-bold transition-all border text-center ${
                        isSelected
                          ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-700/50 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      <div className="text-[11px] sm:text-xs">{opt.label}</div>
                      <div
                        className={`text-[8px] sm:text-[9px] font-medium ${
                          isSelected ? 'text-rose-100' : 'text-slate-400'
                        }`}
                      >
                        {opt.sub}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Upload Custom Sound Box */}
          <div className="p-3 sm:p-6 bg-amber-50/50 dark:bg-amber-950/20">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="audio/*,.mp3,.wav,.ogg,.m4a,.aac,.flac,.webm"
              className="hidden"
            />

            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`p-3.5 sm:p-4 rounded-2xl border-2 border-dashed cursor-pointer transition-all flex flex-col sm:flex-row items-center justify-between gap-3 ${
                isDragOver
                  ? 'border-amber-500 bg-amber-100/80 dark:bg-amber-900/40 scale-[1.01]'
                  : 'border-amber-300 dark:border-amber-800/80 bg-white dark:bg-slate-800 hover:border-amber-400'
              }`}
            >
              <div className="flex items-center gap-3 text-center sm:text-left">
                <div className="p-2.5 rounded-xl bg-amber-500 text-white shadow-2xs shrink-0 mx-auto sm:mx-0">
                  <Upload className={`w-5 h-5 ${isUploading ? 'animate-bounce' : ''}`} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white flex flex-wrap items-center justify-center sm:justify-start gap-1.5">
                    <span>Upload Your Own STAT Sound</span>
                    <span className="text-[10px] text-amber-700 dark:text-amber-400 font-semibold bg-amber-100 dark:bg-amber-950 px-2 py-0.5 rounded-md">
                      MP3, WAV, OGG, M4A, AAC
                    </span>
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Click to choose a file or drag & drop audio here (Max 8MB).
                  </p>
                </div>
              </div>

              <button
                type="button"
                disabled={isUploading}
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                className="w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white transition-all shadow-xs shrink-0 flex items-center justify-center gap-1.5"
              >
                <FileAudio className="w-4 h-4" />
                <span>{isUploading ? 'Uploading...' : 'Browse Audio File'}</span>
              </button>
            </div>

            {uploadError && (
              <div className="mt-2.5 p-2.5 px-3 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{uploadError}</span>
              </div>
            )}
          </div>

          {/* Sticky Category Tabs */}
          <div className="sticky top-0 z-10 px-4 sm:px-6 py-2 bg-slate-100/95 dark:bg-slate-800/95 backdrop-blur-md border-y border-slate-200 dark:border-slate-700/60 flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar">
            {[
              { id: 'all', label: 'All Presets', icon: Sliders },
              { id: 'custom', label: 'Custom Uploads', icon: Upload },
              { id: 'clinical', label: 'Clinical Hospital', icon: BellRing },
              { id: 'effects', label: 'Motorsport & Effects', icon: Zap },
              { id: 'retro', label: 'Retro Pager', icon: Music },
            ].map((cat) => {
              const Icon = cat.icon;
              const isActive = activeCategory === cat.id;
              const count = allPresets.filter((p) => cat.id === 'all' || p.category === cat.id).length;

              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id as any)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-xs border border-slate-200 dark:border-slate-700'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{cat.label}</span>
                  <span className="px-1.5 py-0.2 text-[9px] rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Preset Selection Grid */}
          <div className="p-4 sm:p-6 space-y-3">
            {filteredPresets.length === 0 ? (
              <div className="py-12 text-center text-slate-400 dark:text-slate-500">
                <FileAudio className="w-12 h-12 mx-auto mb-3 text-slate-300 dark:text-slate-600" />
                <p className="text-sm font-bold">No custom audio files uploaded yet.</p>
                <p className="text-xs mt-1">Use the upload box above to add your custom alert sound!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredPresets.map((preset) => {
                  const isSelected = activeSoundId === preset.id;
                  const isPlayingThis = playingId === preset.id;
                  const isCustom = preset.category === 'custom';

                  return (
                    <div
                      key={preset.id}
                      onClick={() => handleSelectSound(preset.id)}
                      className={`relative p-3.5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                        isSelected
                          ? 'bg-rose-50/80 dark:bg-rose-950/40 border-rose-500 dark:border-rose-600 shadow-md ring-2 ring-rose-500/20'
                          : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      <div>
                        <div className="flex items-start justify-between gap-1.5 mb-1.5">
                          <div className="flex items-center gap-2">
                            <span
                              className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                                isSelected
                                  ? 'border-rose-600 bg-rose-600 text-white'
                                  : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700'
                              }`}
                            >
                              {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                            </span>
                            <h3 className="text-xs font-bold text-slate-900 dark:text-white leading-tight truncate max-w-[140px]">
                              {preset.name}
                            </h3>
                          </div>

                          <span
                            className={`text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider shrink-0 ${
                              isCustom
                                ? 'bg-amber-600 text-white'
                                : isSelected
                                ? 'bg-rose-600 text-white'
                                : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            {preset.tag}
                          </span>
                        </div>

                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-3 leading-snug line-clamp-2">
                          {preset.description}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-slate-700/60 mt-auto">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={(e) => handlePreviewSound(e, preset.id)}
                            className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-600 flex items-center gap-1 transition-colors shadow-2xs"
                          >
                            <Play
                              className={`w-3 h-3 text-rose-600 fill-current ${
                                isPlayingThis ? 'animate-bounce' : ''
                              }`}
                            />
                            <span>Preview</span>
                          </button>

                          {isCustom && (
                            <button
                              type="button"
                              title="Delete custom sound"
                              onClick={(e) => handleDeleteCustomSound(e, preset.id)}
                              className="p-1 rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-950 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        {isSelected ? (
                          <span className="text-[10px] font-extrabold text-rose-600 dark:text-rose-400 flex items-center gap-0.5">
                            <Check className="w-3 h-3" />
                            Selected
                          </span>
                        ) : (
                          <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500">
                            Select
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Modal Sticky Footer */}
        <div className="px-4 sm:px-6 py-3.5 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 leading-tight">
            <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span className="truncate sm:whitespace-normal">Settings and custom sounds saved locally.</span>
          </p>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 transition-all shadow-xs active:scale-95 shrink-0"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

