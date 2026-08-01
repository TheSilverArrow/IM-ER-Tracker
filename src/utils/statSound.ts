// Clinical STAT Emergency Alarm Synthesizer with 15 Selectable Presets,
// Custom Duration/Loops & Volume Control saved in localStorage

export interface StatSoundPreset {
  id: string;
  name: string;
  description: string;
  tag: string;
  category?: 'clinical' | 'effects' | 'retro';
}

export const STAT_SOUND_PRESETS: StatSoundPreset[] = [
  {
    id: 'piercing-pulse',
    name: 'Piercing Dual Pulse',
    description: 'High-urgency dual square/saw octave pulse for loud clinical environments.',
    tag: 'DEFAULT',
    category: 'clinical',
  },
  {
    id: 'code-blue-staccato',
    name: 'Rapid Code Blue',
    description: 'Ultra-fast 4-tone ascending chirp for critical emergency alerts.',
    tag: 'HIGH URGENCY',
    category: 'clinical',
  },
  {
    id: 'f1-v10-rev',
    name: 'F1 V10 Engine Rev',
    description: 'Screaming high-RPM Formula 1 V10 engine acceleration roar.',
    tag: 'F1 MOTORSPORT',
    category: 'effects',
  },
  {
    id: 'car-lock-chirp',
    name: 'Car Lock Chirp',
    description: 'Crisp, double-pitch electronic remote vehicle keyless lock chirp.',
    tag: 'CAR REMOTE',
    category: 'effects',
  },
  {
    id: 'icu-priority',
    name: 'ICU Priority Beep',
    description: 'Classic dual-frequency medical monitor double beep.',
    tag: 'CLASSIC ICU',
    category: 'clinical',
  },
  {
    id: 'sonar-ping',
    name: 'Sonar Echo Ping',
    description: 'Resonant sine ping with smooth exponential acoustic drop.',
    tag: 'DISTINCT',
    category: 'effects',
  },
  {
    id: 'klaxon-siren',
    name: 'Emergency Klaxon Siren',
    description: 'FM frequency-sweep emergency siren for high noise areas.',
    tag: 'SIREN',
    category: 'clinical',
  },
  {
    id: 'trauma-chirp',
    name: 'Trauma Unit Chirp',
    description: 'High-frequency double slide chirp (2200Hz - 2800Hz).',
    tag: 'RAPID',
    category: 'clinical',
  },
  {
    id: 'gentle-chime',
    name: 'Gentle Clinical Chime',
    description: 'Harmonious tri-tone chime chord (E5 - G#5 - B5) for softer alerts.',
    tag: 'HARMONIC',
    category: 'clinical',
  },
  {
    id: 'telemetry-blip',
    name: 'Digital Telemetry Pulse',
    description: 'Modern 4-blip telemetry synth sequence.',
    tag: 'MODERN',
    category: 'clinical',
  },
  {
    id: 'heavy-buzz',
    name: 'Heavy Duty Klaxon Buzz',
    description: 'Dual low-sawtooth emergency buzz with rapid volume modulation.',
    tag: 'HEAVY',
    category: 'clinical',
  },
  {
    id: 'retro-pager',
    name: 'Retro Medical Pager',
    description: 'Classic 80s/90s hospital pager 4-burst piezo beep (2700Hz).',
    tag: 'RETRO PAGER',
    category: 'retro',
  },
  {
    id: 'sub-dive-horn',
    name: 'Submarine Dive Horn',
    description: 'Deep dual-tone nautical emergency dive horn pulse.',
    tag: 'NAUTICAL',
    category: 'effects',
  },
  {
    id: 'spaceport-alert',
    name: 'Spaceport Sci-Fi Alert',
    description: 'Futuristic arpeggiated 4-tone synth frequency sweep.',
    tag: 'SCI-FI',
    category: 'effects',
  },
  {
    id: 'digital-cyber-ring',
    name: 'Digital Cyber Ring',
    description: 'Rapid staccato dual-frequency ring burst (1400Hz + 2100Hz).',
    tag: 'CYBER',
    category: 'effects',
  },
];

const SOUND_ID_KEY = 'stat_sound_preference_v1';
const SOUND_VOLUME_KEY = 'stat_sound_volume_v1';
const SOUND_LOOPS_KEY = 'stat_sound_loops_v1';

// Getters & Setters with localStorage persistence

export function getSelectedSoundId(): string {
  if (typeof window === 'undefined') return 'piercing-pulse';
  try {
    const saved = localStorage.getItem(SOUND_ID_KEY);
    if (saved && STAT_SOUND_PRESETS.some((p) => p.id === saved)) {
      return saved;
    }
  } catch (err) {
    console.warn('Error reading sound preference:', err);
  }
  return 'piercing-pulse';
}

export function setSelectedSoundId(id: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(SOUND_ID_KEY, id);
  } catch (err) {
    console.warn('Error saving sound preference:', err);
  }
}

export function getSoundVolume(): number {
  if (typeof window === 'undefined') return 100;
  try {
    const saved = localStorage.getItem(SOUND_VOLUME_KEY);
    if (saved !== null) {
      const parsed = parseInt(saved, 10);
      if (!isNaN(parsed) && parsed >= 0 && parsed <= 100) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Error reading volume preference:', err);
  }
  return 100; // default 100%
}

export function setSoundVolume(volume: number): void {
  if (typeof window === 'undefined') return;
  try {
    const clamped = Math.max(0, Math.min(100, Math.round(volume)));
    localStorage.setItem(SOUND_VOLUME_KEY, String(clamped));
  } catch (err) {
    console.warn('Error saving volume preference:', err);
  }
}

export function getSoundLoops(): number {
  if (typeof window === 'undefined') return 1;
  try {
    const saved = localStorage.getItem(SOUND_LOOPS_KEY);
    if (saved !== null) {
      const parsed = parseInt(saved, 10);
      if (!isNaN(parsed) && [1, 2, 3, 5].includes(parsed)) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Error reading loops preference:', err);
  }
  return 1; // default 1 loop
}

export function setSoundLoops(loops: number): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(SOUND_LOOPS_KEY, String(loops));
  } catch (err) {
    console.warn('Error saving loops preference:', err);
  }
}

// Audio Context initialization

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch((e) => console.warn('AudioContext resume error:', e));
  }
  return audioCtx;
}

export function enableAudio(): void {
  const ctx = getAudioContext();
  if (ctx && ctx.state === 'suspended') {
    ctx.resume();
  }
}

if (typeof window !== 'undefined') {
  const unlockAudio = () => {
    enableAudio();
    window.removeEventListener('click', unlockAudio);
    window.removeEventListener('touchstart', unlockAudio);
    window.removeEventListener('keydown', unlockAudio);
  };
  window.addEventListener('click', unlockAudio);
  window.addEventListener('touchstart', unlockAudio);
  window.addEventListener('keydown', unlockAudio);
}

// Sound Duration helper (base length in seconds for a single loop)
function getSoundBaseDuration(soundId: string): number {
  switch (soundId) {
    case 'f1-v10-rev': return 1.2;
    case 'car-lock-chirp': return 0.35;
    case 'sub-dive-horn': return 0.8;
    case 'spaceport-alert': return 0.6;
    case 'digital-cyber-ring': return 0.5;
    case 'klaxon-siren': return 0.85;
    case 'gentle-chime': return 0.6;
    case 'piercing-pulse': return 0.98;
    default: return 0.55;
  }
}

/**
 * Synthesizes a single burst of the selected preset sound at a given start offset
 */
function renderSoundPreset(
  ctx: AudioContext,
  masterGain: GainNode,
  soundId: string,
  startTime: number
): void {
  switch (soundId) {
    case 'f1-v10-rev': {
      // Screaming F1 V10 engine acceleration pitch sweep
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sawtooth';
      osc2.type = 'triangle';

      // Rapid RPM rev from 280Hz up to 2600Hz, then down shift
      osc1.frequency.setValueAtTime(280, startTime);
      osc1.frequency.exponentialRampToValueAtTime(2600, startTime + 0.65);
      osc1.frequency.exponentialRampToValueAtTime(1400, startTime + 1.1);

      osc2.frequency.setValueAtTime(282, startTime);
      osc2.frequency.exponentialRampToValueAtTime(2620, startTime + 0.65);
      osc2.frequency.exponentialRampToValueAtTime(1410, startTime + 1.1);

      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.9, startTime + 0.05);
      gain.gain.setValueAtTime(0.9, startTime + 0.8);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 1.15);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(masterGain);

      osc1.start(startTime);
      osc1.stop(startTime + 1.18);
      osc2.start(startTime);
      osc2.stop(startTime + 1.18);
      break;
    }

    case 'car-lock-chirp': {
      // Crisp car remote key lock chirp-chirp
      const chirpTimes = [0.0, 0.12];
      chirpTimes.forEach((cOffset) => {
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        osc1.type = 'sine';
        osc2.type = 'square';

        osc1.frequency.setValueAtTime(2100, startTime + cOffset);
        osc1.frequency.exponentialRampToValueAtTime(2700, startTime + cOffset + 0.04);

        osc2.frequency.setValueAtTime(4200, startTime + cOffset);
        osc2.frequency.exponentialRampToValueAtTime(5400, startTime + cOffset + 0.04);

        gain.gain.setValueAtTime(0, startTime + cOffset);
        gain.gain.linearRampToValueAtTime(0.85, startTime + cOffset + 0.003);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + cOffset + 0.05);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(masterGain);

        osc1.start(startTime + cOffset);
        osc1.stop(startTime + cOffset + 0.06);
        osc2.start(startTime + cOffset);
        osc2.stop(startTime + cOffset + 0.06);
      });
      break;
    }

    case 'sub-dive-horn': {
      // Deep dual-tone submarine dive horn
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sawtooth';
      osc2.type = 'sawtooth';

      osc1.frequency.setValueAtTime(185, startTime);
      osc1.frequency.linearRampToValueAtTime(175, startTime + 0.75);

      osc2.frequency.setValueAtTime(277.18, startTime); // C#4
      osc2.frequency.linearRampToValueAtTime(262, startTime + 0.75);

      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.95, startTime + 0.02);
      gain.gain.setValueAtTime(0.95, startTime + 0.65);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.78);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(masterGain);

      osc1.start(startTime);
      osc1.stop(startTime + 0.8);
      osc2.start(startTime);
      osc2.stop(startTime + 0.8);
      break;
    }

    case 'spaceport-alert': {
      // Futuristic 4-tone arpeggiated sci-fi synth
      const notes = [800, 1200, 1800, 2400];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const offset = idx * 0.09;

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, startTime + offset);
        osc.frequency.exponentialRampToValueAtTime(freq * 1.2, startTime + offset + 0.08);

        gain.gain.setValueAtTime(0, startTime + offset);
        gain.gain.linearRampToValueAtTime(0.8, startTime + offset + 0.005);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + offset + 0.12);

        osc.connect(gain);
        gain.connect(masterGain);

        osc.start(startTime + offset);
        osc.stop(startTime + offset + 0.14);
      });
      break;
    }

    case 'digital-cyber-ring': {
      // Rapid staccato ring burst
      const bursts = [0.0, 0.12, 0.24];
      bursts.forEach((bOffset) => {
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        osc1.type = 'square';
        osc2.type = 'square';

        osc1.frequency.setValueAtTime(1400, startTime + bOffset);
        osc2.frequency.setValueAtTime(2100, startTime + bOffset);

        gain.gain.setValueAtTime(0, startTime + bOffset);
        gain.gain.linearRampToValueAtTime(0.75, startTime + bOffset + 0.003);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + bOffset + 0.07);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(masterGain);

        osc1.start(startTime + bOffset);
        osc1.stop(startTime + bOffset + 0.08);
        osc2.start(startTime + bOffset);
        osc2.stop(startTime + bOffset + 0.08);
      });
      break;
    }

    case 'code-blue-staccato': {
      const freqs = [1200, 1450, 1700, 1950];
      freqs.forEach((f, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const offset = idx * 0.08;
        osc.type = 'square';
        osc.frequency.setValueAtTime(f, startTime + offset);
        gain.gain.setValueAtTime(0, startTime + offset);
        gain.gain.linearRampToValueAtTime(0.8, startTime + offset + 0.005);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + offset + 0.06);
        osc.connect(gain);
        gain.connect(masterGain);
        osc.start(startTime + offset);
        osc.stop(startTime + offset + 0.07);
      });
      break;
    }

    case 'icu-priority': {
      const burstTimes = [0.0, 0.22];
      burstTimes.forEach((bTime) => {
        [950, 1250].forEach((freq) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(freq, startTime + bTime);
          gain.gain.setValueAtTime(0, startTime + bTime);
          gain.gain.linearRampToValueAtTime(0.7, startTime + bTime + 0.01);
          gain.gain.exponentialRampToValueAtTime(0.001, startTime + bTime + 0.12);
          osc.connect(gain);
          gain.connect(masterGain);
          osc.start(startTime + bTime);
          osc.stop(startTime + bTime + 0.14);
        });
      });
      break;
    }

    case 'sonar-ping': {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, startTime);
      osc.frequency.exponentialRampToValueAtTime(440, startTime + 0.5);
      gain.gain.setValueAtTime(0.9, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.6);
      osc.connect(gain);
      gain.connect(masterGain);
      osc.start(startTime);
      osc.stop(startTime + 0.65);
      break;
    }

    case 'klaxon-siren': {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(800, startTime);
      osc.frequency.linearRampToValueAtTime(1600, startTime + 0.25);
      osc.frequency.linearRampToValueAtTime(800, startTime + 0.5);
      osc.frequency.linearRampToValueAtTime(1600, startTime + 0.75);

      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.75, startTime + 0.02);
      gain.gain.setValueAtTime(0.75, startTime + 0.73);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.8);

      osc.connect(gain);
      gain.connect(masterGain);
      osc.start(startTime);
      osc.stop(startTime + 0.82);
      break;
    }

    case 'trauma-chirp': {
      [0.0, 0.18].forEach((sOffset) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(2200, startTime + sOffset);
        osc.frequency.exponentialRampToValueAtTime(2900, startTime + sOffset + 0.1);

        gain.gain.setValueAtTime(0, startTime + sOffset);
        gain.gain.linearRampToValueAtTime(0.85, startTime + sOffset + 0.005);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + sOffset + 0.12);

        osc.connect(gain);
        gain.connect(masterGain);
        osc.start(startTime + sOffset);
        osc.stop(startTime + sOffset + 0.13);
      });
      break;
    }

    case 'gentle-chime': {
      const notes = [659.25, 830.61, 987.77];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const offset = idx * 0.12;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, startTime + offset);

        gain.gain.setValueAtTime(0, startTime + offset);
        gain.gain.linearRampToValueAtTime(0.6, startTime + offset + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + offset + 0.5);

        osc.connect(gain);
        gain.connect(masterGain);
        osc.start(startTime + offset);
        osc.stop(startTime + offset + 0.55);
      });
      break;
    }

    case 'telemetry-blip': {
      const blips = [800, 1000, 1200, 1600];
      blips.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const offset = idx * 0.07;

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, startTime + offset);

        gain.gain.setValueAtTime(0, startTime + offset);
        gain.gain.linearRampToValueAtTime(0.8, startTime + offset + 0.005);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + offset + 0.05);

        osc.connect(gain);
        gain.connect(masterGain);
        osc.start(startTime + offset);
        osc.stop(startTime + offset + 0.06);
      });
      break;
    }

    case 'heavy-buzz': {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(440, startTime);
      osc.frequency.setValueAtTime(554, startTime + 0.15);
      osc.frequency.setValueAtTime(440, startTime + 0.3);

      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.9, startTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.5);

      osc.connect(gain);
      gain.connect(masterGain);
      osc.start(startTime);
      osc.stop(startTime + 0.52);
      break;
    }

    case 'retro-pager': {
      const pagerBeeps = [0.0, 0.08, 0.16, 0.24];
      pagerBeeps.forEach((offset) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(2700, startTime + offset);

        gain.gain.setValueAtTime(0, startTime + offset);
        gain.gain.linearRampToValueAtTime(0.8, startTime + offset + 0.002);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + offset + 0.04);

        osc.connect(gain);
        gain.connect(masterGain);
        osc.start(startTime + offset);
        osc.stop(startTime + offset + 0.05);
      });
      break;
    }

    case 'piercing-pulse':
    default: {
      const pulses = [
        { freq: 880, start: 0.0, duration: 0.14 },
        { freq: 1174.66, start: 0.15, duration: 0.16 },
        { freq: 880, start: 0.35, duration: 0.14 },
        { freq: 1174.66, start: 0.50, duration: 0.16 },
        { freq: 1396.91, start: 0.70, duration: 0.28 },
      ];

      pulses.forEach(({ freq, start, duration }) => {
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.type = 'square';
        osc1.frequency.setValueAtTime(freq, startTime + start);
        gain1.gain.setValueAtTime(0, startTime + start);
        gain1.gain.linearRampToValueAtTime(0.85, startTime + start + 0.01);
        gain1.gain.exponentialRampToValueAtTime(0.001, startTime + start + duration);
        osc1.connect(gain1);
        gain1.connect(masterGain);

        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = 'sawtooth';
        osc2.frequency.setValueAtTime(freq * 1.005, startTime + start);
        gain2.gain.setValueAtTime(0, startTime + start);
        gain2.gain.linearRampToValueAtTime(0.6, startTime + start + 0.01);
        gain2.gain.exponentialRampToValueAtTime(0.001, startTime + start + duration);
        osc2.connect(gain2);
        gain2.connect(masterGain);

        osc1.start(startTime + start);
        osc1.stop(startTime + start + duration + 0.05);
        osc2.start(startTime + start);
        osc2.stop(startTime + start + duration + 0.05);
      });
      break;
    }
  }
}

/**
 * Plays a STAT alarm sound according to selected or custom parameters.
 * @param targetSoundId Optional specific sound ID. Defaults to saved preference.
 * @param overrideVolume Optional specific volume (0-100). Defaults to saved preference.
 * @param overrideLoops Optional specific loops count (1, 2, 3, 5). Defaults to saved preference.
 */
export function playStatAlarmSound(
  targetSoundId?: string,
  overrideVolume?: number,
  overrideLoops?: number
): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const soundId = targetSoundId || getSelectedSoundId();
    const volumePercent = overrideVolume !== undefined ? overrideVolume : getSoundVolume();
    const loops = overrideLoops !== undefined ? overrideLoops : getSoundLoops();

    const gainMultiplier = (volumePercent / 100) * 0.9;
    if (gainMultiplier <= 0) return; // Muted

    const now = ctx.currentTime;

    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(gainMultiplier, now);
    masterGain.connect(ctx.destination);

    const baseDuration = getSoundBaseDuration(soundId);
    const loopSpacing = baseDuration + 0.12;

    for (let l = 0; l < loops; l++) {
      const loopStart = now + l * loopSpacing;
      renderSoundPreset(ctx, masterGain, soundId, loopStart);
    }
  } catch (err) {
    console.warn('Could not play STAT alarm audio:', err);
  }
}
