// Lean Rush - lean your head left and right to steer through a neon highway.
import { Particles, FloatText } from '../core/fx.js';
import { rand, clamp, smooth, roundRect } from '../core/util.js';
import { art, spr } from '../core/art.js';

export default class LeanRush {
  static meta = {
    id: 'lean', name: 'Lean Rush', tagline: 'Lean your head left and right to steer a neon highway. Grab coins, dodge the barriers.',
    control: '🙂 Head lean', hint: 'Lean your head left and right to switch lanes', needs: { hands: false, face: true }, colors: ['#ff4fa3', '#7c5cff'], cursor: 'none', pip: true,
    icon: `<svg viewBox="0 0 100 100"><path d="M8 92 L44 14 H56 L92 92Z" fill="#241a4d"/><path d="M50 18v74" stroke="#ff4fa3" stroke-width="4" stroke-dasharray="10 8"/><rect x="40" y="60" width="20" height="22" rx="6" fill="#00e0ff"/><circle cx="28" cy="48" r="7" fill="#ffd36b"/></svg>`,
  };
  constructor(app) {
    this.app = app; this.fx = new Particles(); this.ft = new FloatText();
    this.px = 0; this.cal = null; this.obs = []; this.coins = []; this.z = 0; this.speed = 0.55; this.score = 0; this.dist = 0; this.lives = 3; this.inv = 0; this.spawnT = 0; this.t = 0; this.coinN = 0; this.tilt = 0;
    app.hud.lives = 3; this.W = app.W; this.H = app.H;
  }
  idle(dt, input) { this.steer(dt, input); }
  steer(dt, input) {
    const f = input.face, { W } = this.app;
    if (f && !f.fake) { if (!this.cal) this.cal = f.x; this.target = clamp((f.x - this.cal) / (W * 0.1), -1.35, 1.35); }
    else if (f) this.target = clamp((f.x - W / 2) / (W * 0.25), -1.35, 1.35);
    else if (this.target === undefined) this.target = 0;
    const prev = this.px; this.px = smooth(this.px, this.target || 0, 9, dt); this.tilt = smooth(this.tilt, (this.px - prev) * 8, 12, dt);
  }
  // perspective: depth d in [0,1] (0 = horizon, 1 = player)
  proj(lane, d) {
    const { W, H } = this.app, hy = H * 0.36, k = d * d * 0.85 + d * 0.15;
    const y = hy + (H * 0.84 - hy) * k, half = (W * 0.02 + W * 0.2 * k) * 1;
    return { x: W / 2 + lane * half * 1.25 - this.px * half * 0.0, y, s: 0.08 + k * 0.92, lw: half * 1.25 };
  }
  update(dt, input) {
    const app = this.app; this.t += dt; this.steer(dt, input); this.inv = Math.max(0, this.inv - dt);
    this.speed = 0.55 + clamp(this.dist / 4000, 0, 1) * 0.55;
    this.z += this.speed * dt; this.dist += this.speed * 60 * dt; this.score = Math.floor(this.dist / 4) + this.coinN * 10;
    this.spawnT -= dt;
    if (this.spawnT <= 0) {
      this.spawnT = rand(0.65, 1.1) / (0.7 + this.speed * 0.5);
      const lane = [-1, 0, 1][(Math.random() * 3) | 0];
      if (Math.random() < 0.65) { this.obs.push({ lane, d: 0, w: Math.random() < 0.25 ? 2 : 1 }); if (this.obs[this.obs.length - 1].w === 2) this.obs[this.obs.length - 1].lane = Math.random() < 0.5 ? -0.5 : 0.5; }
      else for (let i = 0; i < 5; i++) this.coins.push({ lane, d: -i * 0.07, got: false });
    }
    for (const o of this.obs) o.d += this.speed * dt * 0.8;
    for (const c of this.coins) c.d += this.speed * dt * 0.8;
    for (const o of this.obs) if (!o.hit && o.d > 0.86 && o.d < 1.0 && Math.abs(o.lane - this.px) < o.w * 0.5 + 0.38) { o.hit = true; if (this.inv <= 0) this.crash(o); }
    for (const c of this.coins) if (!c.got && c.d > 0.84 && c.d < 1 && Math.abs(c.lane - this.px) < 0.55) { c.got = true; this.coinN++; app.snd.tick(); const p = this.proj(c.lane, 0.9); this.fx.burst(p.x, p.y, 8, { color: ['#ffd36b', '#fff'], glow: true, gravity: 0, max: 300 }); }
    this.obs = this.obs.filter((o) => o.d < 1.15); this.coins = this.coins.filter((c) => c.d < 1.1 && !c.got);
    this.fx.update(dt); this.ft.update(dt);
    app.hud.score = this.score; app.hud.lives = this.lives; app.hud.label = `${this.coinN} coins`;
  }
  crash(o) {
    const app = this.app; this.lives--; this.inv = 1.4; app.snd.hit(); app.shake = 24; const p = this.proj(this.px, 0.93);
    this.fx.burst(p.x, p.y, 40, { color: ['#ff4fa3', '#ffd36b', '#fff'], glow: true, max: 600 }); this.ft.add(app.W / 2, app.H * 0.4, 'CRASH!', '#ff6b8a', 60);
    if (this.lives <= 0) app.finish(this.score, { title: 'Wiped out', extra: `${Math.floor(this.dist)} m · ${this.coinN} coins` });
  }
  draw(ctx) {
    const { W, H } = this.app, hy = H * 0.36;
    const sky = ctx.createLinearGradient(0, 0, 0, hy + 40); sky.addColorStop(0, '#0b0626'); sky.addColorStop(0.7, '#3b0d5c'); sky.addColorStop(1, '#ff4fa3'); ctx.fillStyle = sky; ctx.fillRect(0, 0, W, hy + 2);
    // sun
    const sg = ctx.createLinearGradient(0, hy - 150, 0, hy); sg.addColorStop(0, '#ffd36b'); sg.addColorStop(1, '#ff4fa3'); ctx.fillStyle = sg; ctx.beginPath(); ctx.arc(W / 2, hy, 150, Math.PI, 0); ctx.fill();
    ctx.fillStyle = '#3b0d5c'; for (let i = 0; i < 5; i++) ctx.fillRect(W / 2 - 150, hy - 12 - i * 26, 300, 3 + i * 2);
    ctx.fillStyle = '#0a0518'; ctx.fillRect(0, hy, W, H - hy);
    // road
    const p0 = this.proj(0, 0), p1 = this.proj(0, 1);
    ctx.fillStyle = '#150a2e'; ctx.beginPath(); ctx.moveTo(W / 2 - p0.lw * 1.7, hy); ctx.lineTo(W / 2 + p0.lw * 1.7, hy); ctx.lineTo(W / 2 + p1.lw * 1.7, H); ctx.lineTo(W / 2 - p1.lw * 1.7, H); ctx.fill();
    ctx.shadowColor = '#00e0ff'; ctx.shadowBlur = 16; ctx.strokeStyle = '#00e0ff'; ctx.lineWidth = 3;
    for (const l of [-1.7, 1.7]) { ctx.beginPath(); ctx.moveTo(W / 2 + l * p0.lw, hy); ctx.lineTo(W / 2 + l * p1.lw, H); ctx.stroke(); }
    ctx.shadowBlur = 0; ctx.strokeStyle = 'rgba(255,79,163,.7)'; ctx.lineWidth = 2;
    for (const l of [-0.5, 0.5]) { ctx.beginPath(); ctx.moveTo(W / 2 + l * p0.lw * 1.0, hy); ctx.lineTo(W / 2 + l * p1.lw * 1.0, H); ctx.setLineDash([14, 18]); ctx.stroke(); ctx.setLineDash([]); }
    // horizontal grid scroll
    ctx.strokeStyle = 'rgba(124,92,255,.5)'; ctx.lineWidth = 2;
    for (let i = 0; i < 14; i++) { const d = ((i / 14 + this.z * 0.8) % 1), p = this.proj(0, d); ctx.beginPath(); ctx.moveTo(W / 2 - p.lw * 1.7, p.y); ctx.lineTo(W / 2 + p.lw * 1.7, p.y); ctx.stroke(); }
    // objects far to near
    const items = [...this.obs.map((o) => ({ t: 'o', d: o.d, o })), ...this.coins.map((c) => ({ t: 'c', d: c.d, c }))].filter((i) => i.d > 0).sort((a, b) => a.d - b.d);
    for (const it of items) {
      if (it.t === 'o') {
        const o = it.o, p = this.proj(o.lane, it.d), w = p.lw * 0.5 * 2 * o.w * 0.9, h = p.lw * 0.75;
        { o.sk = o.sk || ['o1', 'o2', 'o3', 'o4', 'o5'][Math.floor(Math.random() * 5)]; const oi = art('lean', o.w === 2 ? 'o5' : o.sk), ww = o.w === 2 ? w * 0.9 : w * 1.05; if (oi) { ctx.save(); ctx.shadowColor = '#ff4fa3'; ctx.shadowBlur = 14; ctx.drawImage(oi, p.x - ww / 2, p.y - ww * oi.naturalHeight / oi.naturalWidth, ww, ww * oi.naturalHeight / oi.naturalWidth); ctx.restore(); continue; } }
        ctx.save(); ctx.shadowColor = '#ff4fa3'; ctx.shadowBlur = 20; const g = ctx.createLinearGradient(0, p.y - h, 0, p.y); g.addColorStop(0, '#ff7ac0'); g.addColorStop(1, '#a3105f'); ctx.fillStyle = g;
        roundRect(ctx, p.x - w / 2, p.y - h, w, h, 8 * p.s); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.fillRect(p.x - w / 2 + 6, p.y - h * 0.62, w - 12, h * 0.12); ctx.restore();
      } else {
        const c = it.c, p = this.proj(c.lane, it.d), r = p.lw * 0.2;
        { const ci = art('lean', 'coin'); if (ci) { const sx = Math.max(0.2, Math.abs(Math.cos(this.t * 4 + it.d * 6))); ctx.save(); ctx.shadowColor = '#ffd36b'; ctx.shadowBlur = 14; ctx.translate(p.x, p.y - r * 1.6); ctx.scale(sx, 1); spr(ctx, ci, 0, 0, r * 2.6); ctx.restore(); continue; } }
        ctx.save(); ctx.shadowColor = '#ffd36b'; ctx.shadowBlur = 16; ctx.fillStyle = '#ffd36b'; ctx.beginPath(); ctx.ellipse(p.x, p.y - r * 1.6, r * Math.abs(Math.cos(this.t * 4 + it.d * 6)) + 2, r, 0, 0, 7); ctx.fill(); ctx.restore();
      }
    }
    // player
    const pp = this.proj(this.px, 0.93), w = pp.lw * 0.62, h = pp.lw * 0.5;
    const pi = art('lean', 'player');
    if (pi && !(this.inv > 0 && Math.floor(this.t * 14) % 2)) { ctx.save(); ctx.translate(pp.x, pp.y); ctx.rotate(this.tilt * 0.35); ctx.shadowColor = '#00e0ff'; ctx.shadowBlur = 28; spr(ctx, pi, 0, -w * 0.38, w * 1.35); ctx.restore(); }
    else if (!(this.inv > 0 && Math.floor(this.t * 14) % 2)) {
      ctx.save(); ctx.translate(pp.x, pp.y); ctx.rotate(this.tilt * 0.35); ctx.shadowColor = '#00e0ff'; ctx.shadowBlur = 28;
      const g = ctx.createLinearGradient(0, -h, 0, 0); g.addColorStop(0, '#7fefff'); g.addColorStop(1, '#2a7bff'); ctx.fillStyle = g; roundRect(ctx, -w / 2, -h, w, h, 14); ctx.fill();
      ctx.fillStyle = 'rgba(8,10,30,.8)'; roundRect(ctx, -w * 0.36, -h * 0.9, w * 0.72, h * 0.38, 8); ctx.fill();
      ctx.fillStyle = '#ff4fa3'; ctx.fillRect(-w * 0.4, -h * 0.12, w * 0.18, h * 0.08); ctx.fillRect(w * 0.22, -h * 0.12, w * 0.18, h * 0.08); ctx.restore();
    }
    this.fx.draw(ctx); this.ft.draw(ctx);
  }
}
