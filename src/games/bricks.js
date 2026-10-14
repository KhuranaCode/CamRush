// Brick Breaker - steer the paddle with your palm, smash every brick.
import { Particles, FloatText } from '../core/fx.js';
import { rand, clamp, smooth } from '../core/util.js';
import { bgGrad, grid } from './_kit.js';
import { art, spr } from '../core/art.js';
const CN = ['red', 'yellow', 'yellow', 'green', 'blue', 'purple'];
const HUES = [350, 25, 50, 140, 190, 265];
export default class BrickBreaker {
  static meta = { id: 'bricks', name: 'Brick Breaker', tagline: 'Slide your palm left and right to keep the ball alive and break the wall.', control: '🖐 Palm left/right', hint: 'Move your palm sideways. Catch power-ups: wide paddle, multiball.', needs: { hands: true, face: false }, colors: ['#ff5e62', '#ffb347'], cursor: 'dot', pip: true, bloom: 0.65,
    icon: `<svg viewBox="0 0 100 100"><g fill="#ff5e62"><rect x="10" y="16" width="24" height="12" rx="3"/><rect x="38" y="16" width="24" height="12" rx="3" fill="#ffb347"/><rect x="66" y="16" width="24" height="12" rx="3" fill="#7c5cff"/><rect x="24" y="32" width="24" height="12" rx="3" fill="#00e0a0"/><rect x="52" y="32" width="24" height="12" rx="3"/></g><circle cx="54" cy="66" r="6" fill="#fff"/><rect x="30" y="84" width="40" height="8" rx="4" fill="#00e0ff"/></svg>` };
  constructor(app) {
    this.app = app; this.fx = new Particles(); this.ft = new FloatText(); this.t = 0; this.score = 0; this.lives = 3; this.level = 0; this.px = app.W / 2; this.tx = this.px; this.pw = app.W * 0.14; this.widT = 0; this.balls = []; this.ups = []; this.combo = 0; app.hud.lives = 3; this.build(); this.reset();
  }
  build() { const { W, H } = this.app; this.bricks = []; const cols = 12, rows = 5 + Math.min(this.level, 3), bw = (W * 0.9) / cols, bh = H * 0.045, x0 = W * 0.05, y0 = H * 0.14;
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) { if (this.level % 3 === 1 && (r + c) % 2) continue; if (this.level % 3 === 2 && Math.abs(c - 5.5) < r - 1 && r > 2) continue; this.bricks.push({ x: x0 + c * bw + 2, y: y0 + r * (bh + 4), w: bw - 4, h: bh, hue: HUES[r % 6], hp: r < 1 && this.level > 0 ? 2 : 1, a: 0 }); } }
  reset() { const { W, H } = this.app; this.balls = [{ x: this.px, y: H * 0.86, vx: 0, vy: 0, stuck: 1 }]; this.launchT = 1.0; this.sp = H * (0.7 + this.level * 0.06); this.combo = 0; }
  update(dt, input) {
    const app = this.app, { W, H } = app; this.t += dt; const h = input.primary;
    if (h) this.tx = h.palm ? h.palm.x : h.x; else if (input.keys.has('ArrowLeft')) this.tx -= W * dt; else if (input.keys.has('ArrowRight')) this.tx += W * dt;
    this.px = smooth(this.px, clamp(this.tx, this.pw / 2, W - this.pw / 2), 24, dt); this.widT -= dt; const tw = W * (this.widT > 0 ? 0.22 : 0.14); this.pw = smooth(this.pw, tw, 8, dt);
    const py = H * 0.9, ph = 16;
    for (const b of this.balls) {
      if (b.stuck) { b.x = this.px; b.y = py - ph - 10; this.launchT -= dt; if (this.launchT <= 0) { b.stuck = 0; const a = rand(-0.5, 0.5); b.vx = Math.sin(a) * this.sp; b.vy = -Math.cos(a) * this.sp; } continue; }
      const steps = 3; for (let s = 0; s < steps; s++) { b.x += b.vx * dt / steps; b.y += b.vy * dt / steps; this.collide(b, py, ph); }
      b.tr = b.tr || []; b.tr.push({ x: b.x, y: b.y }); if (b.tr.length > 10) b.tr.shift();
    }
    this.balls = this.balls.filter((b) => b.y < H + 30);
    if (!this.balls.length) { this.lives--; app.snd.hit(); app.shake = 20; app.flash('255,60,90', 0.3); if (this.lives <= 0) { app.finish(this.score, { title: 'Game over', extra: `Level ${this.level + 1}` }); } else this.reset(); }
    for (const u of this.ups) { u.y += H * 0.25 * dt; if (u.y > py - ph && u.y < py + ph * 2 && Math.abs(u.x - this.px) < this.pw / 2 + 14) { u.dead = 1; this.power(u); } if (u.y > H + 40) u.dead = 1; }
    this.ups = this.ups.filter((u) => !u.dead);
    for (const b of this.bricks) b.a = Math.max(0, b.a - dt * 4);
    if (!this.bricks.length) { this.level++; this.score += 1000; app.snd.win(); app.flash('120,255,200', 0.4); this.ft.add(W / 2, H * 0.5, `LEVEL ${this.level + 1}`, '#7fffd4', 72); this.build(); this.reset(); }
    this.fx.update(dt); this.ft.update(dt); app.hud.score = this.score; app.hud.lives = this.lives; app.hud.label = this.combo >= 4 ? `${this.combo} combo` : `Level ${this.level + 1}`;
  }
  power(u) { const app = this.app; app.snd.bonus(); if (u.kind === 'wide') { this.widT = 10; this.ft.add(this.px, app.H * 0.8, 'WIDE!', '#7fefff', 40); } else { const src = this.balls.find((b) => !b.stuck) || this.balls[0]; for (let i = 0; i < 2; i++) { const a = rand(-0.8, 0.8); this.balls.push({ x: src.x, y: src.y, vx: Math.sin(a) * this.sp, vy: -Math.abs(Math.cos(a)) * this.sp }); } this.ft.add(this.px, app.H * 0.8, 'MULTIBALL!', '#ffd36b', 40); } }
  collide(b, py, ph) {
    const { W } = this.app, r = 10; if (b.x < r) { b.x = r; b.vx = Math.abs(b.vx); this.app.snd.bounce(); } if (b.x > W - r) { b.x = W - r; b.vx = -Math.abs(b.vx); this.app.snd.bounce(); } if (b.y < r) { b.y = r; b.vy = Math.abs(b.vy); this.app.snd.bounce(); }
    if (b.vy > 0 && b.y + r > py && b.y - r < py + ph && Math.abs(b.x - this.px) < this.pw / 2 + r) { const off = clamp((b.x - this.px) / (this.pw / 2), -1, 1), a = off * 1.0; const sp = Math.hypot(b.vx, b.vy) * 1.01; b.vx = Math.sin(a) * sp; b.vy = -Math.cos(a) * sp; b.y = py - r; this.combo = 0; this.app.snd.bounce(); this.fx.burst(b.x, py, 8, { color: ['#00e0ff', '#fff'], glow: true, max: 260 }); }
    for (const k of this.bricks) {
      if (b.x + r > k.x && b.x - r < k.x + k.w && b.y + r > k.y && b.y - r < k.y + k.h) {
        const ox = Math.min(b.x + r - k.x, k.x + k.w - (b.x - r)), oy = Math.min(b.y + r - k.y, k.y + k.h - (b.y - r)); if (ox < oy) b.vx = -b.vx; else b.vy = -b.vy;
        k.hp--; k.a = 1; this.combo++; this.score += 10 * (1 + Math.min(this.combo, 10)); this.app.snd.brick(Math.min(this.combo, 12));
        if (k.hp <= 0) { k.dead = 1; this.fx.burst(k.x + k.w / 2, k.y + k.h / 2, 14, { color: [`hsl(${k.hue},90%,60%)`, '#fff'], glow: true, min: 60, max: 340, gravity: 500 }); this.app.shake = 4; if (Math.random() < 0.1) this.ups.push({ x: k.x + k.w / 2, y: k.y, kind: Math.random() < 0.5 ? 'wide' : 'multi' }); }
        this.bricks = this.bricks.filter((q) => !q.dead); break;
      }
    }
  }
  draw(ctx) {
    const { W, H } = this.app; bgGrad(ctx, this.app, '#0c0626', '#1b0f3d', 0.25); grid(ctx, W, H, this.t, 'rgba(255,94,98,.07)');
    for (const k of this.bricks) { const bi = art('bricks', CN[HUES.indexOf(k.hue)]); if (bi) { ctx.save(); if (k.hue === 25) ctx.filter = 'hue-rotate(-18deg) saturate(1.3)'; if (k.hp > 1) ctx.filter = 'grayscale(.7) brightness(1.1)'; ctx.globalAlpha = 1; ctx.drawImage(bi, k.x, k.y, k.w, k.h); if (k.a > 0) { ctx.globalAlpha = k.a * 0.6; ctx.fillStyle = '#fff'; ctx.fillRect(k.x, k.y, k.w, k.h); } ctx.restore(); continue; } ctx.save(); ctx.shadowColor = `hsl(${k.hue},90%,60%)`; ctx.shadowBlur = 12 + k.a * 24; const g = ctx.createLinearGradient(0, k.y, 0, k.y + k.h); g.addColorStop(0, `hsl(${k.hue},90%,${68 + k.a * 20}%)`); g.addColorStop(1, `hsl(${k.hue},85%,${45 + k.a * 20}%)`); ctx.fillStyle = g; ctx.beginPath(); ctx.roundRect(k.x, k.y, k.w, k.h, 6); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(k.x + 4, k.y + 3, k.w - 8, 3); if (k.hp > 1) { ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke(); } ctx.restore(); }
    for (const u of this.ups) { ctx.save(); ctx.shadowColor = '#ffd36b'; ctx.shadowBlur = 20; ctx.fillStyle = u.kind === 'wide' ? '#00e0ff' : '#ffd36b'; ctx.beginPath(); ctx.roundRect(u.x - 20, u.y - 12, 40, 24, 12); ctx.fill(); ctx.fillStyle = '#111'; ctx.font = '700 14px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(u.kind === 'wide' ? '↔' : '+2', u.x, u.y + 1); ctx.restore(); }
    const py = H * 0.9; const pd = art('bricks', 'paddle'); if (pd) { ctx.drawImage(pd, this.px - this.pw / 2, py - 6, this.pw, 26); } else { ctx.save(); ctx.shadowColor = '#00e0ff'; ctx.shadowBlur = 26; const pg = ctx.createLinearGradient(0, py, 0, py + 16); pg.addColorStop(0, '#9ff3ff'); pg.addColorStop(1, '#0090c0'); ctx.fillStyle = pg; ctx.beginPath(); ctx.roundRect(this.px - this.pw / 2, py, this.pw, 16, 8); ctx.fill(); ctx.restore(); }
    for (const b of this.balls) { (b.tr || []).forEach((p, i, a) => { ctx.fillStyle = `rgba(255,255,255,${i / a.length * 0.35})`; ctx.beginPath(); ctx.arc(p.x, p.y, 10 * i / a.length, 0, 7); ctx.fill(); }); const bl = art('bricks', 'ball'); if (bl) { ctx.save(); ctx.shadowColor = '#fff'; ctx.shadowBlur = 18; ctx.drawImage(bl, b.x - 12, b.y - 12, 24, 24); ctx.restore(); } else { ctx.save(); ctx.shadowColor = '#fff'; ctx.shadowBlur = 24; ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(b.x, b.y, 10, 0, 7); ctx.fill(); ctx.restore(); } }
    this.fx.draw(ctx); this.ft.draw(ctx);
  }
}
