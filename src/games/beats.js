// Neon Beats - tap the glowing notes as they hit the line with your fingertips. 60 seconds.
import { Particles, FloatText } from '../core/fx.js';
import { clamp, rand, pick } from '../core/util.js';
import { pointsOf, bgGrad } from './_kit.js';
import { art, spr } from '../core/art.js';
const COLS = ['#ff4f7b', '#ffb347', '#00e0a0', '#00c8ff'], NOTES = [262, 330, 392, 523, 659, 784];
export default class NeonBeats {
  static meta = { id: 'beats', name: 'Neon Beats', tagline: 'Four lanes, one beat. Touch each note with your fingertip as it crosses the glowing line.', control: '🖐 Both hands', hint: 'Touch notes at the line. Perfect timing builds combo.', needs: { hands: true, face: false }, colors: ['#ff4f7b', '#7c5cff'], cursor: 'dot', pip: true, bloom: 0.7,
    icon: `<svg viewBox="0 0 100 100"><g><rect x="12" y="14" width="16" height="22" rx="5" fill="#ff4f7b"/><rect x="34" y="36" width="16" height="22" rx="5" fill="#ffb347"/><rect x="56" y="22" width="16" height="22" rx="5" fill="#00e0a0"/><rect x="78" y="48" width="12" height="22" rx="5" fill="#00c8ff"/></g><rect x="8" y="78" width="84" height="6" rx="3" fill="#fff" opacity=".8"/></svg>` };
  constructor(app) {
    this.app = app; this.fx = new Particles(); this.ft = new FloatText(); this.t = 0; this.time = 60; this.score = 0; this.combo = 0; this.maxCombo = 0; this.notes = []; this.bpm = 112; this.beat = 0; this.next = 1.5; this.hits = 0; this.miss = 0; this.glow = [0, 0, 0, 0]; this.hitZ = 0; this.life = 1; this.pat = 0; app.hud.time = 60; this.layout();
  }
  layout() { const { W, H } = this.app; this.lw = Math.min(W * 0.17, H * 0.26); this.x0 = W / 2 - this.lw * 2; this.hy = H * 0.76; this.fall = H * 0.62; }
  update(dt, input) {
    const app = this.app; this.t += dt; this.time -= dt; const step = 60 / this.bpm / 2;
    while (this.t >= this.next) { this.next += step; this.beat++; if (this.beat % 2 === 0) app.snd.tone(70, 0.1, 'sine', 0.3, -30); if (this.time > 3 && Math.random() < 0.62 + Math.min(0.2, (60 - this.time) / 200)) { const lane = Math.floor(Math.random() * 4), twin = Math.random() < 0.12; this.notes.push({ lane, y: this.hy - this.fall, t: 0 }); if (twin) this.notes.push({ lane: (lane + 2) % 4, y: this.hy - this.fall, t: 0 }); } }
    const sp = this.fall / 1.25 * (1 + (60 - this.time) / 150), pts = pointsOf(input, 24);
    for (let i = 0; i < 4; i++) this.glow[i] = Math.max(0, this.glow[i] - dt * 3);
    for (const n of this.notes) {
      n.y += sp * dt; const nx = this.x0 + n.lane * this.lw + this.lw / 2, dy = Math.abs(n.y - this.hy);
      if (!n.dead && dy < this.lw * 0.5) for (const p of pts) if (Math.abs(p.x - nx) < this.lw * 0.5 && Math.abs(p.y - n.y) < this.lw * 0.55 + p.r) { this.hit(n, nx, dy); break; }
      if (!n.dead && n.y > this.hy + this.lw * 0.55) { n.dead = 1; this.missed(nx); }
    }
    this.notes = this.notes.filter((n) => !n.dead); this.fx.update(dt); this.ft.update(dt);
    app.hud.score = this.score; app.hud.time = Math.max(0, this.time); app.hud.label = this.combo >= 4 ? `${this.combo} combo` : '';
    if (this.time <= 0) app.finish(this.score, { title: 'Track complete', extra: `${this.hits} hits · best combo ${this.maxCombo}` });
  }
  hit(n, x, dy) { n.dead = 1; const app = this.app, perfect = dy < this.lw * 0.18; this.combo++; this.maxCombo = Math.max(this.maxCombo, this.combo); this.hits++; const pts = Math.round((perfect ? 300 : 120) * (1 + Math.min(this.combo, 30) * 0.05)); this.score += pts; this.glow[n.lane] = 1;
    app.snd.tone(NOTES[(n.lane * 2 + (this.hits % 3)) % 6], 0.22, 'triangle', 0.28); if (perfect) app.snd.tone(NOTES[n.lane] * 2, 0.12, 'sine', 0.1);
    this.fx.burst(x, this.hy, perfect ? 28 : 14, { color: [COLS[n.lane], '#fff'], glow: true, min: 80, max: 460, gravity: 300 }); this.ft.add(x, this.hy - this.lw * 0.8, perfect ? 'PERFECT' : 'GOOD', perfect ? '#ffd36b' : '#fff', perfect ? 34 : 26); if (this.combo % 10 === 0) { app.punch(0.03); app.snd.bonus(); } else if (perfect) app.punch(0.008); }
  missed(x) { this.combo = 0; this.miss++; this.app.snd.tone(110, 0.15, 'sawtooth', 0.14, -40); this.ft.add(x, this.hy - 30, 'MISS', '#ff6b8a', 24); }
  draw(ctx) {
    const { W, H } = this.app, lw = this.lw, hy = this.hy; bgGrad(ctx, this.app, '#0a0420', '#1d0a3a', 0.25);
    const pulse = (Math.sin(this.beat * Math.PI) + 1) / 2; for (let i = 0; i < 4; i++) { const x = this.x0 + i * lw; const g = ctx.createLinearGradient(0, hy - this.fall, 0, hy + lw); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(1, COLS[i] + (this.glow[i] > 0 ? '66' : '22')); ctx.fillStyle = g; ctx.fillRect(x + 3, hy - this.fall, lw - 6, this.fall + lw); ctx.fillStyle = 'rgba(255,255,255,.05)'; ctx.fillRect(x, hy - this.fall, 2, this.fall + lw); }
    ctx.fillRect(this.x0 + 4 * lw, hy - this.fall, 2, this.fall + lw);
    ctx.save(); ctx.shadowColor = '#fff'; ctx.shadowBlur = 20 + pulse * 14; ctx.fillStyle = '#fff'; ctx.fillRect(this.x0, hy - 2, lw * 4, 4); ctx.restore();
    for (let i = 0; i < 4; i++) { ctx.strokeStyle = COLS[i]; ctx.lineWidth = 3; ctx.beginPath(); ctx.roundRect(this.x0 + i * lw + 10, hy - lw * 0.38, lw - 20, lw * 0.76, 14); ctx.stroke(); }
    for (const n of this.notes) { const x = this.x0 + n.lane * lw + 10; const gi = art('beats', 'n' + n.lane); if (gi) { ctx.save(); ctx.shadowColor = COLS[n.lane]; ctx.shadowBlur = 30; spr(ctx, gi, x + (lw - 20) / 2, n.y, lw * 0.74, lw * 0.74); ctx.restore(); continue; } ctx.save(); ctx.shadowColor = COLS[n.lane]; ctx.shadowBlur = 26; const g = ctx.createLinearGradient(0, n.y - lw * 0.38, 0, n.y + lw * 0.38); g.addColorStop(0, '#fff'); g.addColorStop(0.25, COLS[n.lane]); g.addColorStop(1, COLS[n.lane]); ctx.fillStyle = g; ctx.beginPath(); ctx.roundRect(x, n.y - lw * 0.34, lw - 20, lw * 0.68, 14); ctx.fill(); ctx.restore(); }
    this.fx.draw(ctx); this.ft.draw(ctx);
  }
}
