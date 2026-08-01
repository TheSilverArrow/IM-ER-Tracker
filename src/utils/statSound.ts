// Clinical STAT Emergency Alarm Synthesizer using Web Audio API

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

// Global listener to unlock audio on first click/touch if auto-play policy is strict
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

/**
 * Plays a sharp, high-urgency clinical STAT emergency alarm tone.
 * Consists of an alternating dual-tone pulse (A5 880Hz -> C6 1046.5Hz).
 */
export function playStatAlarmSound(): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const now = ctx.currentTime;
    
    // Master gain node - set to maximum volume
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(1.0, now);
    masterGain.connect(ctx.destination);

    // Beep sequence pattern: rapid piercing dual pulses
    const pulses = [
      { freq: 880, start: 0.0, duration: 0.14 },
      { freq: 1174.66, start: 0.15, duration: 0.16 },
      { freq: 880, start: 0.35, duration: 0.14 },
      { freq: 1174.66, start: 0.50, duration: 0.16 },
      { freq: 1396.91, start: 0.70, duration: 0.28 },
    ];

    pulses.forEach(({ freq, start, duration }) => {
      // Main oscillator (Square wave for maximum penetration & loudness)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();

      osc1.type = 'square';
      osc1.frequency.setValueAtTime(freq, now + start);

      gain1.gain.setValueAtTime(0, now + start);
      gain1.gain.linearRampToValueAtTime(0.85, now + start + 0.01);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + start + duration);

      osc1.connect(gain1);
      gain1.connect(masterGain);

      // Sub harmonic oscillator (Sawtooth layer for maximum acoustic energy)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();

      osc2.type = 'sawtooth';
      osc2.frequency.setValueAtTime(freq * 1.005, now + start); // slight chorus for maximum volume punch

      gain2.gain.setValueAtTime(0, now + start);
      gain2.gain.linearRampToValueAtTime(0.6, now + start + 0.01);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + start + duration);

      osc2.connect(gain2);
      gain2.connect(masterGain);

      osc1.start(now + start);
      osc1.stop(now + start + duration + 0.05);

      osc2.start(now + start);
      osc2.stop(now + start + duration + 0.05);
    });
  } catch (err) {
    console.warn('Could not play STAT alarm audio:', err);
  }
}
