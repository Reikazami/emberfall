// Tiny synthesized sound effects (Web Audio). Nothing is loaded; a browser that blocks audio just stays quiet.

let context = null;

function ensure() {
  if (context) return context;
  const Ctor = globalThis.AudioContext ?? globalThis.webkitAudioContext;
  if (!Ctor) return null;
  context = new Ctor();
  return context;
}

export function unlockAudio() {
  const ctx = ensure();
  if (ctx && ctx.state === 'suspended') ctx.resume();
}

function tone(freq, start, length, type, gain) {
  const ctx = ensure();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const amp = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
  amp.gain.setValueAtTime(0.0001, ctx.currentTime + start);
  amp.gain.exponentialRampToValueAtTime(gain, ctx.currentTime + start + 0.01);
  amp.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + start + length);
  osc.connect(amp).connect(ctx.destination);
  osc.start(ctx.currentTime + start);
  osc.stop(ctx.currentTime + start + length + 0.02);
}

const SOUNDS = {
  play: () => { tone(330, 0, 0.12, 'triangle', 0.12); tone(495, 0.07, 0.16, 'triangle', 0.1); },
  hit: () => { tone(150, 0, 0.14, 'sawtooth', 0.12); tone(90, 0.04, 0.18, 'square', 0.08); },
  heal: () => { tone(520, 0, 0.14, 'sine', 0.1); tone(780, 0.1, 0.2, 'sine', 0.1); },
  draw: () => tone(660, 0, 0.06, 'sine', 0.05),
  death: () => { tone(220, 0, 0.2, 'sawtooth', 0.08); tone(110, 0.1, 0.3, 'sawtooth', 0.08); },
  turn: () => { tone(440, 0, 0.1, 'sine', 0.08); tone(587, 0.1, 0.16, 'sine', 0.08); },
  refuse: () => tone(120, 0, 0.12, 'square', 0.06),
  win: () => [523, 659, 784, 1046].forEach((f, i) => tone(f, i * 0.14, 0.3, 'triangle', 0.12)),
  lose: () => [392, 330, 262, 196].forEach((f, i) => tone(f, i * 0.2, 0.34, 'sawtooth', 0.08)),
};

export function sound(name) {
  const play = SOUNDS[name];
  if (play) {
    try {
      play();
    } catch {
      // audio is a bonus; ignore failures
    }
  }
}
