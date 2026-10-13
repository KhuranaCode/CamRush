// Bubble Burst - pop bubbles by touching them with any fingertip, both hands. 45 seconds.
import { Particles, FloatText } from '../core/fx.js';
import { rand, clamp, dist } from '../core/util.js';

export default class BubbleBurst {
  static meta = {
    id: 'bubbles', name: 'Bubble Burst', tagline: 'Touch the bubbles with your fingertips. Both hands, all ten fingers. Grab gold for a mega burst.',
    control: '🖐 Both hands', hint: 'Pop bubbles with any fingertip. Gold = mega burst. Spiky = avoid!', needs: { hands: true, face: false }, colors: ['#7c5cff', '#00e0ff'], cursor: 'dot', pip: true,
    icon: `<svg viewBox="0 0 100 100"><defs><radialGradient id="bb" cx=".3" cy=".3"><stop offset="0" stop-color="#fff" stop-opacity=".9"/><stop offset=".4" stop-color="#9be9ff" stop-opacity=".35"/><stop offset="1" stop-color="#7c5cff" stop-opacity=".55"/></radialGradient></defs><circle cx="38" cy="58" r="30" fill="url(#bb)" stroke="#bfefff" stroke-width="3"/><circle cx="70" cy="34" r="19" fill="url(#bb)" stroke="#bfefff" stroke-width="3"/><circle cx="76" cy="72" r="11" fill="url(#bb)" stroke="#bfefff" stroke-width="3"/></svg>`,
  };
  constructor(app) {
    this.app = app; this.fx = new Particles(); this.ft = new FloatText(); this.s = clamp(app.H / 900, 0.6, 1.5);
    this.b = []; this.score = 0; this.time = 45; this.spawnT = 0.2; this.combo = 0; this.comboT = 0; this.popped = 0; this.flash = 0; this.t = 0; this.ring = [];
    app.hud.time = 45;
  }
  spawn() {
    const { W, H } = this.app, s = this.s, roll = Math.random();
    const r = rand(26, 74) * s;
    const kind = roll < 0.05 ? 'gold' : roll < 0.12 ? 'spike' : 'norm';
    this.b.push({ x: rand(r, W - r), y: H + r, vy: -rand(70, 160) * (1 + (45 - this.time) / 90) * s, r: kind === 'gold' ? 54 * s : kind === 'spike' ? 46 * s : r, kind, hue: rand(170, 320), ph: rand(0, 6) });
  }
  update(dt, input) {
    const app = this.app, { W, H } = app; this.t += dt; this.time -= dt; this.flash = Math.max(0, this.flash - dt * 2);
    this.comboT -= dt; if (this.comboT <= 0) this.combo = 0;
    this.spawnT -= dt;
    if (this.spawnT <= 0) { this.spawnT = rand(0.18, 0.4) * (1 - (45 - this.time) / 120); this.spawn(); if (Math.random() < 0.3) this.spawn(); }
    const pts = [];
    for (const h of input.hands) { if (h.mouse) pts.push({ x: h.x, y: h.y, r: 18 }); else for (const t of h.tips) pts.push({ x: t.x, y: t.y, r: 16 }); }
    for (const q of this.b) {
      q.y += q.vy * dt; q.x += Math.sin(this.t * 1.4 + q.ph) * 24 * dt;
      if (q.dead) continue;
      for (const p of pts) {
        if (dist(p.x, p.y, q.x, q.y) < q.r + p.r * 0.6) { this.pop(q); break; }
      }
    }
    this.b = this.b.filter((q) => !q.dead && q.y > -q.r - 20);
    this.fx.update(dt); this.ft.update(dt);
    app.hud.score = this.score; app.hud.time = Math.max(0, this.time);
    app.hud.label = this.combo >= 4 ? `${this.combo} combo` : '';
    if (this.time <= 0) app.finish(this.score, { title: "Time's up", extra: `${this.popped} bubbles popped` });
  }
  pop(q, chain = false) {
    if (q.dead) return; q.dead = true; const app = this.app;
    const col = `hsl(${q.hue},90%,70%)`;
    if (q.kind === 'spike') { this.time = Math.max(0, this.time - 3); this.combo = 0; app.snd.hit(); app.shake = 14; this.ft.add(q.x, q.y, '-3s', '#ff6b8a', 44); this.fx.burst(q.x, q.y, 24, { color: ['#ff4f7b', '#fff'], glow: true }); return; }
    this.popped++; this.combo++; this.comboT = 1.2;
    const base = Math.round(120 / (q.r / this.s) * 3) ; const pts = Math.round(base * (1 + Math.min(this.combo, 20) * 0.1));
    this.score += chain ? Math.round(pts * 0.5) : pts;
    app.snd.pop(); this.fx.burst(q.x, q.y, 16 + q.r / 5, { color: [col, '#fff', '#bfefff'], min: 80, max: 380, gravity: 200, glow: true });
    this.ring.push({ x: q.x, y: q.y, r: q.r, life: 0 });
    if (!chain) this.ft.add(q.x, q.y - q.r, `+${pts}`, '#fff', 28);
    if (q.kind === 'gold') {
      this.time += 5; this.flash = 1; app.snd.bonus(); this.ft.add(q.x, q.y - 70, '+5s  MEGA BURST!', '#ffd36b', 46); app.shake = 10;
      for (const o of this.b) if (!o.dead && o !== q && o.kind !== 'spike' && dist(o.x, o.y, q.x, q.y) < 420 * this.s) this.pop(o, true);
    }
  }
  draw(ctx) {
    const { W, H } = this.app, tr = this.app.tracker;
    const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#120a3a'); g.addColorStop(1, '#0a3052'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    if (tr.drawVideo(ctx, W, H, 0.4)) { ctx.fillStyle = 'rgba(10,8,40,.45)'; ctx.fillRect(0, 0, W, H); }
    for (const q of this.b) this.drawBubble(ctx, q);
    for (const r of this.ring) { r.life += 0.016; ctx.strokeStyle = `rgba(255,255,255,${1 - r.life / 0.35})`; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(r.x, r.y, r.r * (1 + r.life * 2.4), 0, 7); ctx.stroke(); }
    this.ring = this.ring.filter((r) => r.life < 0.35);
    this.fx.draw(ctx); this.ft.draw(ctx);
    if (this.flash > 0) { ctx.fillStyle = `rgba(255,230,150,${this.flash * 0.4})`; ctx.fillRect(0, 0, W, H); }
  }
  drawBubble(ctx, q) {
    const r = q.r; ctx.save(); ctx.translate(q.x, q.y);
    if (q.kind === 'spike') {
      ctx.fillStyle = '#2a0d1c'; ctx.strokeStyle = '#ff4f7b'; ctx.lineWidth = 4; ctx.shadowColor = '#ff4f7b'; ctx.shadowBlur = 20; ctx.beginPath();
      for (let i = 0; i < 24; i++) { const a = i / 24 * 6.283 + this.t, rr = i % 2 ? r * 0.78 : r * 1.12; ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore(); return;
    }
    const gold = q.kind === 'gold';
    const grad = ctx.createRadialGradient(-r * 0.35, -r * 0.4, r * 0.05, 0, 0, r);
    if (gold) { grad.addColorStop(0, 'rgba(255,255,255,.95)'); grad.addColorStop(0.5, 'rgba(255,214,90,.6)'); grad.addColorStop(1, 'rgba(255,150,30,.85)'); ctx.shadowColor = '#ffd36b'; ctx.shadowBlur = 36 + Math.sin(this.t * 8) * 10; }
    else { grad.addColorStop(0, 'rgba(255,255,255,.75)'); grad.addColorStop(0.35, `hsla(${q.hue},90%,75%,.22)`); grad.addColorStop(1, `hsla(${q.hue},90%,60%,.5)`); }
    ctx.fillStyle = grad; ctx.beginPath(); ctx.arc(0, 0, r, 0, 7); ctx.fill();
    ctx.shadowBlur = 0; ctx.lineWidth = 3; ctx.strokeStyle = gold ? '#fff2b0' : `hsla(${q.hue},100%,85%,.8)`; ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.beginPath(); ctx.ellipse(-r * 0.4, -r * 0.45, r * 0.22, r * 0.12, -0.7, 0, 7); ctx.fill();
    if (gold) { ctx.fillStyle = '#fff'; ctx.font = `700 ${r * 0.8}px "Space Grotesk",sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('★', 0, 2); }
    ctx.restore();
  }
}
