// Neon Pong - your palm height is the paddle. Beat the AI; you have 3 lives.
import { Particles, FloatText } from '../core/fx.js';
import { rand, clamp, smooth } from '../core/util.js';
import { bgGrad, glowText } from './_kit.js';
import { art, spr } from '../core/art.js';
export default class NeonPong {
  static meta = { id: 'pong', name: 'Neon Pong', tagline: 'Slide your palm up and down to rally against the AI. It gets faster every hit.', control: '🖐 Palm height', hint: 'Move your palm up/down. Hit with the paddle edge to steer the ball.', needs: { hands: true, face: false }, colors: ['#00e0ff', '#7c5cff'], cursor: 'dot', pip: true, bloom: 0.7,
    icon: `<svg viewBox="0 0 100 100"><rect x="14" y="26" width="8" height="40" rx="4" fill="#00e0ff"/><rect x="78" y="40" width="8" height="40" rx="4" fill="#ff5ea8"/><circle cx="52" cy="50" r="7" fill="#fff"/><path d="M50 8v84" stroke="#fff" stroke-opacity=".3" stroke-dasharray="6 6"/></svg>` };
  constructor(app) {
    this.app = app; this.fx = new Particles(); this.ft = new FloatText(); const { W, H } = app; this.t = 0; this.score = 0; this.lives = 3; this.rally = 0; this.best = 0;
    this.ph = H * 0.18; this.py = H / 2; this.ay = H / 2; this.targetY = H / 2; this.trail = []; this.pt = 0; this.at = 0; this.serve(1); app.hud.lives = 3;
  }
  serve(dir) { const { W, H } = this.app; this.bx = W / 2; this.by = H / 2; this.sp = W * 0.5; const a = rand(-0.4, 0.4); this.vx = Math.cos(a) * this.sp * dir; this.vy = Math.sin(a) * this.sp; this.wait = 1; this.trail = []; this.rally = 0; }
  update(dt, input) {
    const app = this.app, { W, H } = app; this.t += dt; const pw = 22, px = W * 0.06, ax = W - px;
    const h = input.primary; if (h) this.targetY = h.palm ? h.palm.y : h.y; else if (input.keys.has('ArrowUp')) this.targetY -= H * dt; else if (input.keys.has('ArrowDown')) this.targetY += H * dt;
    this.targetY = clamp(this.targetY, this.ph / 2, H - this.ph / 2); this.py = smooth(this.py, this.targetY, 22, dt);
    const aiSp = H * (0.55 + Math.min(this.score / 6000, 0.6)); const err = Math.sin(this.t * 1.3) * this.ph * 0.35; const ty = this.bx > W * 0.4 ? this.by + err : H / 2;
    this.ay += clamp(ty - this.ay, -aiSp * dt, aiSp * dt); this.ay = clamp(this.ay, this.ph / 2, H - this.ph / 2);
    if (this.wait > 0) { this.wait -= dt; }
    else {
      this.bx += this.vx * dt; this.by += this.vy * dt; const r = 12 * clamp(H / 800, 0.7, 1.4);
      this.trail.push({ x: this.bx, y: this.by }); if (this.trail.length > 14) this.trail.shift();
      if (this.by < r) { this.by = r; this.vy = Math.abs(this.vy); app.snd.bounce(); }
      if (this.by > H - r) { this.by = H - r; this.vy = -Math.abs(this.vy); app.snd.bounce(); }
      if (this.vx < 0 && this.bx - r < px + pw && this.bx > px && Math.abs(this.by - this.py) < this.ph / 2 + r) this.hitPaddle(this.py, px + pw + r, 1, true);
      if (this.vx > 0 && this.bx + r > ax - pw && this.bx < ax && Math.abs(this.by - this.ay) < this.ph / 2 + r) this.hitPaddle(this.ay, ax - pw - r, -1, false);
      if (this.bx < -30) { this.lives--; app.snd.hit(); app.shake = 22; app.flash('255,60,90', 0.3); this.fx.burst(20, this.by, 40, { color: ['#ff4f7b', '#fff'], glow: true }); if (this.lives <= 0) app.finish(this.score, { title: 'Game over', extra: `Longest rally ${this.best}` }); else this.serve(1); }
      if (this.bx > W + 30) { this.score += 500; app.snd.bonus(); this.ft.add(W * 0.7, this.by, '+500 point!', '#ffd36b', 44); app.punch(0.03); this.serve(-1); }
    }
    this.fx.update(dt); this.ft.update(dt); app.hud.score = this.score; app.hud.lives = this.lives; app.hud.label = this.rally >= 3 ? `${this.rally} rally` : '';
  }
  hitPaddle(py, x, dir, me) {
    const app = this.app, off = clamp((this.by - py) / (this.ph / 2), -1, 1); this.sp = Math.min(this.sp * 1.06, app.W * 1.4); const a = off * 0.9;
    this.vx = Math.cos(a) * this.sp * dir; this.vy = Math.sin(a) * this.sp; this.bx = x; app.snd.bounce();
    this.fx.burst(this.bx, this.by, 14, { color: me ? ['#00e0ff', '#fff'] : ['#ff5ea8', '#fff'], glow: true, min: 80, max: 420 });
    if (me) { this.rally++; this.best = Math.max(this.best, this.rally); this.score += 10 + this.rally * 5; this.pt = 1; app.shake = 5 + this.rally; if (this.rally % 5 === 0) { app.snd.bonus(); this.ft.add(this.bx + 80, this.by, `${this.rally} RALLY!`, '#7fefff', 40); app.punch(0.03); } } else this.at = 1;
  }
  draw(ctx) {
    const { W, H } = this.app; bgGrad(ctx, this.app, '#07071c', '#0b1a3a', 0.28);
    ctx.setLineDash([14, 16]); ctx.strokeStyle = 'rgba(255,255,255,.25)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(W / 2, 0); ctx.lineTo(W / 2, H); ctx.stroke(); ctx.setLineDash([]);
    const px = W * 0.06, ax = W - px, pw = 22; this.pt *= 0.9; this.at *= 0.9;
    const pad = (x, y, c, k) => { ctx.save(); ctx.shadowColor = c; ctx.shadowBlur = 24 + k * 30; ctx.fillStyle = c; ctx.beginPath(); ctx.roundRect(x - pw / 2, y - this.ph / 2, pw, this.ph, 11); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.fillRect(x - 3, y - this.ph / 2 + 8, 6, this.ph - 16); ctx.restore(); };
    pad(px, this.py, '#00e0ff', this.pt); pad(ax, this.ay, '#ff5ea8', this.at);
    this.trail.forEach((p, i) => { ctx.fillStyle = `rgba(255,255,255,${i / this.trail.length * 0.4})`; ctx.beginPath(); ctx.arc(p.x, p.y, 12 * i / this.trail.length, 0, 7); ctx.fill(); });
    const pb = art('pong', 'ball'); if (pb) { ctx.save(); ctx.shadowColor = '#fff'; ctx.shadowBlur = 26; spr(ctx, pb, this.bx, this.by, 34, undefined, this.t * 6); ctx.restore(); } else {
    ctx.save(); ctx.shadowColor = '#fff'; ctx.shadowBlur = 30; ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(this.bx, this.by, 12, 0, 7); ctx.fill(); ctx.restore(); }
    if (this.wait > 0) glowText(ctx, 'GET READY', W / 2, H * 0.3, 40, '#7fefff');
    this.fx.draw(ctx); this.ft.draw(ctx);
  }
}
