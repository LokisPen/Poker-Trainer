import { LIFE } from './state.js';
import { G } from '../game/state.js';

/* ================= sound ================= */
let AC = null;
export function sfxInit() {
  if (!LIFE.opt.sound) return;
  try {
    if (!AC) {
      const C = window.AudioContext || window.webkitAudioContext;
      if (!C) return;
      AC = new C();
    }
    if (AC.state === 'suspended') AC.resume();
  } catch (e) {}
}
export function sfx(k) {
  if (!LIFE.opt.sound || !AC || AC.state !== 'running') return;
  try {
    const t = AC.currentTime;
    const tone = (f, d, g, type, at) => {
      const o = AC.createOscillator(),
        v = AC.createGain(),
        s = t + (at || 0);
      o.type = type || 'sine';
      o.frequency.setValueAtTime(f, s);
      v.gain.setValueAtTime(g, s);
      v.gain.exponentialRampToValueAtTime(0.0001, s + d);
      o.connect(v);
      v.connect(AC.destination);
      o.start(s);
      o.stop(s + d + 0.02);
    };
    const noise = (d, g, hp) => {
      const n = Math.floor(AC.sampleRate * d),
        b = AC.createBuffer(1, n, AC.sampleRate),
        a = b.getChannelData(0);
      for (let i = 0; i < n; i++) a[i] = (Math.random() * 2 - 1) * (1 - i / n);
      const s = AC.createBufferSource(),
        v = AC.createGain(),
        f = AC.createBiquadFilter();
      f.type = 'highpass';
      f.frequency.value = hp;
      s.buffer = b;
      v.gain.value = g;
      s.connect(f);
      f.connect(v);
      v.connect(AC.destination);
      s.start(t);
    };
    if (k === 'chip') {
      tone(2500, 0.05, 0.07, 'triangle');
      tone(3300, 0.04, 0.05, 'triangle', 0.04);
    } else if (k === 'check') {
      tone(150, 0.05, 0.22);
      tone(130, 0.05, 0.18, 'sine', 0.09);
    } else if (k === 'fold') noise(0.08, 0.1, 1100);
    else if (k === 'card') noise(0.06, 0.12, 2600);
    else if (k === 'turn') tone(880, 0.14, 0.05);
    else if (k === 'win') {
      tone(660, 0.12, 0.07);
      tone(880, 0.12, 0.07, 'sine', 0.1);
      tone(1320, 0.22, 0.07, 'sine', 0.2);
    }
  } catch (e) {}
}
export function sfxLast() {
  const H = G && G.hand;
  if (!H || !H.events.length) return;
  const e = H.events[H.events.length - 1];
  if (H.done) {
    if (H.result && H.result.win[0]) sfx('win');
    else sfx(e.t === 'fold' ? 'fold' : 'chip');
    return;
  }
  sfx(e.t === 'board' ? 'card' : e.t === 'fold' ? 'fold' : e.t === 'check' ? 'check' : 'chip');
  if (H.toAct === 0) setTimeout(() => sfx('turn'), 160);
}
