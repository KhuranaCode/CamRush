// Tiny synth - no audio files, nothing to fail on a demo laptop.
export class Sound {
  constructor() { this.ctx = null; this.master = null; this.muted = localStorage.getItem('camrush.mute') === '1'; this.musicOn = false; }
  ensure() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = this.muted ? 0 : 0.5;
    const comp = this.ctx.createDynamicsCompressor();
    this.master.connect(comp); comp.connect(this.ctx.destination);
  }
  setMuted(m) { this.muted = m; localStorage.setItem('camrush.mute', m ? '1' : '0'); if (this.master) this.master.gain.value = m ? 0 : 0.5; }
  tone(freq, dur = 0.12, type = 'sine', vol = 0.3, slide = 0, delay = 0) {
    if (!this.ctx || this.muted) return;
    const t0 = this.ctx.currentTime + delay;
    const o = this.ctx.createOscillator(), g = this.ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t0);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(this.master); o.start(t0); o.stop(t0 + dur + 0.05);
  }
  noise(dur = 0.2, vol = 0.25, hp = 800, delay = 0) {
    if (!this.ctx || this.muted) return;
    const t0 = this.ctx.currentTime + delay;
    const buf = this.ctx.createBuffer(1, Math.floor(this.ctx.sampleRate * dur), this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
    const s = this.ctx.createBufferSource(); s.buffer = buf;
    const f = this.ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = hp;
    const g = this.ctx.createGain(); g.gain.value = vol;
    s.connect(f); f.connect(g); g.connect(this.master); s.start(t0);
  }
  // named effects
  click() { this.tone(660, 0.07, 'triangle', 0.18); }
  select() { this.tone(520, 0.09, 'triangle', 0.22); this.tone(780, 0.12, 'triangle', 0.22, 0, 0.07); }
  hover() { this.tone(900, 0.04, 'sine', 0.06); }
  point() { this.tone(880, 0.08, 'square', 0.12); this.tone(1320, 0.12, 'square', 0.1, 0, 0.06); }
  flap() { this.tone(420, 0.1, 'sine', 0.12, 260); }
  hit() { this.noise(0.25, 0.35, 200); this.tone(160, 0.3, 'sawtooth', 0.25, -100); }
  slice(p = 1) { this.noise(0.14, 0.22, 2500); this.tone(500 * p, 0.1, 'triangle', 0.15, 500); }
  splat() { this.noise(0.18, 0.3, 500); this.tone(220, 0.12, 'sine', 0.2, -120); }
  bomb() { this.noise(0.6, 0.5, 80); this.tone(90, 0.5, 'sawtooth', 0.35, -60); }
  pop() { this.tone(700 + Math.random() * 400, 0.09, 'sine', 0.22, 600); }
  bonus() { [523, 659, 784, 1046].forEach((f, i) => this.tone(f, 0.14, 'triangle', 0.2, 0, i * 0.07)); }
  win() { [523, 659, 784, 1046, 1318].forEach((f, i) => this.tone(f, 0.18, 'triangle', 0.22, 0, i * 0.09)); }
  lose() { [392, 330, 262, 196].forEach((f, i) => this.tone(f, 0.22, 'sawtooth', 0.18, 0, i * 0.12)); }
  tick() { this.tone(1000, 0.05, 'square', 0.1); }
  go() { this.tone(1200, 0.25, 'square', 0.16); }
  chomp() { this.noise(0.1, 0.3, 300); this.tone(240, 0.1, 'square', 0.18, -120); }
  bounce() { this.tone(300 + Math.random() * 40, 0.07, 'square', 0.14, 120); }
  brick(i = 0) { this.tone(400 + i * 60, 0.09, 'triangle', 0.2, 200); }
  whoosh() { this.noise(0.2, 0.1, 1500); }
}
