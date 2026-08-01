import React, { useState } from 'react';
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
} from 'lucide-react';
import {
  STAT_SOUND_PRESETS,
  getSelectedSoundId,
  setSelectedSoundId,
  getSoundVolume,
  setSoundVolume,
  getSoundLoops,
  setSoundLoops,
  playStatAlarmSound,
} from '../utils/statSound';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSoundChange?: (newSoundId: string) => void;
}

export const SoundSelectorModal: React.FC<Props> = ({ isOpen, onClose, onSoundChange }) => {
  const [activeSoundId, setActiveSoundId] = useState<string>(() => getSelectedSoundId());
  const [volume, setVolume] = useState<number>(() => getSoundVolume());
  const [loops, setLoops] = useState<number>(() => getSoundLoops());
  const [activeCategory, setActiveCategory] = useState<'all' | 'clinical' | 'effects' | 'retro'>('all');
  const [playingId, setPlayingId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handlePreviewSound = (e?: React.MouseEvent, soundId?: string) => {
    if (e) e.stopPropagation();
    const targetId = soundId || activeSoundId;
    setPlayingId(targetId);
    playStatAlarmSound(targetId, volume, loops);

    // Approximate total play time based on loops
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
    STAT_SOUND_PRESETS.find((p) => p.id === activeSoundId) || STAT_SOUND_PRESETS[0];

  const filteredPresets = STAT_SOUND_PRESETS.filter((p) => {
    if (activeCategory === 'all') return true;
    return p.category === activeCategory;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="relative w-full max-w-3xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-rose-600 via-rose-700 to-amber-600 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-white/20 backdrop-blur text-white shadow-xs">
              <Volume2 className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
                <span>STAT Alarm Sound Customizer</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-white text-rose-800 uppercase">
                  15 Presets
                </span>
              </h2>
              <p className="text-xs text-rose-100 font-medium">
                Customize alert tone, volume, and alarm repeat duration.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-white/80 hover:text-white hover:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Active Sound Banner & Quick Test */}
        <div className="px-6 py-3 bg-rose-50 dark:bg-rose-950/40 border-b border-rose-100 dark:border-rose-900/50 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
          <div className="flex items-center gap-2">
            <BellRing className="w-4 h-4 text-rose-600 dark:text-rose-400" />
            <span className="text-slate-600 dark:text-slate-300">Active STAT Sound:</span>
            <strong className="font-bold text-rose-800 dark:text-rose-300">
              {activePreset.name}
            </strong>
            <span className="text-slate-400">({volume}% Vol • {loops}x Burst)</span>
          </div>
          <button
            onClick={(e) => handlePreviewSound(e, activeSoundId)}
            className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold flex items-center gap-1.5 transition-all active:scale-95 shadow-xs"
          >
            <Play className={`w-3.5 h-3.5 fill-current ${playingId === activeSoundId ? 'animate-bounce' : ''}`} />
            <span>Test Configured Alarm</span>
          </button>
        </div>

        {/* Global Controls Section (Volume & Duration Changer) */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-4 shrink-0">
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
                    className={`py-1.5 px-2 rounded-xl text-xs font-bold transition-all border text-center ${
                      isSelected
                        ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-700/50 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    <div>{opt.label}</div>
                    <div
                      className={`text-[9px] font-medium ${
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

        {/* Category Tabs */}
        <div className="px-6 py-2 bg-slate-100/70 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2 overflow-x-auto shrink-0">
          {[
            { id: 'all', label: 'All 15 Presets', icon: Sliders },
            { id: 'clinical', label: 'Clinical Hospital', icon: BellRing },
            { id: 'effects', label: 'Motorsport & Effects', icon: Zap },
            { id: 'retro', label: 'Retro Pager', icon: Music },
          ].map((cat) => {
            const Icon = cat.icon;
            const isActive = activeCategory === cat.id;
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
              </button>
            );
          })}
        </div>

        {/* Preset Selection Grid */}
        <div className="p-6 overflow-y-auto space-y-3 flex-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredPresets.map((preset) => {
              const isSelected = activeSoundId === preset.id;
              const isPlayingThis = playingId === preset.id;

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
                        <h3 className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                          {preset.name}
                        </h3>
                      </div>

                      <span
                        className={`text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider shrink-0 ${
                          isSelected
                            ? 'bg-rose-600 text-white'
                            : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {preset.tag}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-3 leading-snug">
                      {preset.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-slate-700/60 mt-auto">
                    <button
                      type="button"
                      onClick={(e) => handlePreviewSound(e, preset.id)}
                      className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-600 flex items-center gap-1 transition-colors shadow-2xs"
                    >
                      <Play
                        className={`w-3 h-3 text-rose-600 fill-current ${
                          isPlayingThis ? 'animate-ping' : ''
                        }`}
                      />
                      <span>Preview</span>
                    </button>

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
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
          <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Sound, volume, and duration are saved locally in browser storage.</span>
          </p>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 transition-all shadow-xs active:scale-95"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
