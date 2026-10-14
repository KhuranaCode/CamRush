// Target Blitz - aim with your index finger, pinch (or click) to shoot. 45 seconds.
import { Particles, FloatText } from '../core/fx.js';
import { rand, clamp, dist, pick, smooth } from '../core/util.js';
import { bgGrad } from './_kit.js';
import { art, spr } from '../core/art.js';
export default class TargetBlitz {
  static meta = { id: 'target', name: 'Target Blitz', tagline: 'Aim with your finger, pinch to fire. Hit the bullseye. Spare the friendly targets.', control: '☝ Point + pinch', hint: 'Point to aim, pinch thumb+finger to shoot. Green = do not shoot.', needs: { hands: true, face: false }, colors: ['#ff4f7b', '#ffb347'], cursor: 'none', pip: true, bloom: 0.5,
    icon: `<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="38" fill="none" stroke="#ff4f7b" stroke-width="8"/><circle cx="50" cy="50" r="22" fill="none" stroke="#fff" stroke-width="8"/><circle cx="50" cy="50" r="8" fill="#ff4f7b"/><path d="M50 4v20M50 76v20M4 50h20M76 50h20" stroke="#fff" stroke-width="4"/></svg>` };
  constructor(app) {
    this.app = app; this.fx = new Particles(); this.ft = new FloatText(); this.t = 0; this.time = 45; this.score = 0; this.tg = []; this.spawnT = 0.3; this.cx = app.W / 2; this.cy = app.H / 2; this.was = false; this.recoil = 0; this.shots = 0; this.hits = 0; this.combo = 0; this.sc = clamp(app.H / 900, 0.6, 1.4); this.marks = []; app.hud.time = 45;
  }
  update(dt, input) {
    const app = this.app, { W, H } = app; this.t += dt; this.time -= dt; this.spawnT -= dt; this.recoil *= Math.exp(-10 * dt);
    const h = input.primary; let fire = false;
    if (h) { const tx = h.mouse ? h.x : h.tips[1].x, ty = h.mouse ? h.y : h.tips[1].y; this.cx = smooth(this.cx, tx, 30, dt); this.cy = smooth(this.cy, ty, 30, dt); const p = h.mouse ? h.pinch : h.gesture === 'pinch'; fire = p && !this.was; this.was = p; }
    if (input.consume('Space')) fire = true;
    const prog = clamp(1 - this.time / 45, 0, 1);
    if (this.spawnT <= 0) { this.spawnT = rand(0.45, 0.9) * (1 - prog * 0.4); const r = rand(40, 78) * this.sc, friendly = Math.random() < 0.15; this.tg.push({ x: rand(r + 20, W - r - 20), y: rand(H * 0.2, H * 0.85), r, life: rand(1.6, 2.6) * (1 - prog * 0.3), t: 0, friendly, gold: !friendly && Math.random() < 0.1, vx: rand(-80, 80) * (0.5 + prog) }); }
    for (const g of this.tg) { g.t += dt; g.x += g.vx * dt; if (g.x < g.r || g.x > W - g.r) g.vx *= -1; g.pop = Math.min(1, g.t / 0.2); if (g.t > g.life) { g.dead = 1; if (!g.friendly) this.combo = 0; } }
    if (fire) this.shoot();
    this.tg = this.tg.filter((g) => !g.dead); this.marks = this.marks.filter((m) => (m.l += dt) < 2);
    this.fx.update(dt); this.ft.update(dt); app.hud.score = this.score; app.hud.time = Math.max(0, this.time); app.hud.label = this.combo >= 3 ? `${this.combo} streak` : '';
    if (this.time <= 0) app.finish(this.score, { title: "Time's up", extra: `${this.hits}/${this.shots} hits` });
  }
  shoot() {
    const app = this.app; this.shots++; this.recoil = 1; app.snd.hit(); app.shake = 5; let hit = null, d = 1e9;
    for (const g of this.tg) { const dd = dist(this.cx, this.cy, g.x, g.y); if (dd < g.r * 1.05 && dd < d) { d = dd; hit = g; } }
    this.fx.burst(this.cx, this.cy, 6, { color: ['#fff', '#ffd36b'], max: 220 });
    if (!hit) { this.combo = 0; this.marks.push({ x: this.cx, y: this.cy, l: 0 }); return; }
    hit.dead = 1;
    if (hit.friendly) { this.score = Math.max(0, this.score - 200); this.combo = 0; app.snd.bomb(); app.flash('255,60,90', 0.3); this.ft.add(hit.x, hit.y, '-200', '#ff6b8a', 46); this.fx.burst(hit.x, hit.y, 30, { color: ['#00e0a0', '#fff'], glow: true }); return; }
    this.hits++; this.combo++; const ring = clamp(1 - d / hit.r, 0, 1), base = ring > 0.8 ? 300 : ring > 0.4 ? 150 : 80, pts = Math.round(base * (hit.gold ? 3 : 1) * (1 + Math.min(this.combo, 10) * 0.1));
    this.score += pts; app.snd.slice(1 + ring); if (ring > 0.8) { app.snd.bonus(); app.punch(0.025); app.hitstop(45); }
    this.fx.burst(hit.x, hit.y, 30, { color: hit.gold ? ['#ffd36b', '#fff'] : ['#ff4f7b', '#fff', '#ffb347'], glow: true, max: 520 }); this.ft.add(hit.x, hit.y - hit.r, ring > 0.8 ? `BULLSEYE +${pts}` : `+${pts}`, ring > 0.8 ? '#ffd36b' : '#fff', ring > 0.8 ? 40 : 30);
  }
  draw(ctx) {
    const { W, H } = this.app; const hasVid = bgGrad(ctx, this.app, '#1a1030', '#1d0f26', 0.3);
    const wood = art('target', 'wood');
    if (wood) {
      ctx.save(); ctx.globalAlpha = hasVid ? 0.28 : 0.55; const ts = 256 * Math.max(1, H / 900); for (let y = 0; y < H; y += ts) for (let x = 0; x < W; x += ts) ctx.drawImage(wood, x, y, ts, ts); ctx.restore();
      const cw = art('target', 'curtain'), cs = H * 0.62 / 426; if (cw) { ctx.drawImage(cw, 0, 0, 131 * cs, 426 * cs); ctx.save(); ctx.translate(W, 0); ctx.scale(-1, 1); ctx.drawImage(cw, 0, 0, 131 * cs, 426 * cs); ctx.restore(); }
      const wt = art('target', 'water'); if (wt) { const ws = 70 * Math.max(1, H / 900); for (let x = -((this.t * 30) % ws); x < W; x += ws) ctx.drawImage(wt, x, H - ws * 1.1, ws, ws * 1.1); }
    } else { ctx.fillStyle = 'rgba(255,255,255,.04)'; ctx.fillRect(0, H * 0.9, W, H); }
    for (const g of this.tg) {
      const k = g.pop * (1 - Math.max(0, (g.t - (g.life - 0.3)) / 0.3)), r = g.r * k; if (r <= 0) continue; ctx.save(); ctx.translate(g.x, g.y);
      const im = art('target', g.friendly ? 'duck' : g.gold ? 'gold' : 'red');
      if (im) { spr(ctx, im, 0, 0, r * 2.15); ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(0, 0, r * 1.12, -Math.PI / 2, -Math.PI / 2 + (1 - g.t / g.life) * 6.283); ctx.stroke(); ctx.restore(); continue; }
      const cols = g.friendly ? ['#0a8a5a', '#d8ffe9', '#00e0a0', '#d8ffe9', '#0a8a5a'] : g.gold ? ['#d9902a', '#fff2b0', '#ffc94d', '#fff2b0', '#ff9a1a'] : ['#c4264a', '#fff', '#ff4f7b', '#fff', '#c4264a'];
      ctx.shadowColor = cols[2]; ctx.shadowBlur = 24; for (let i = 0; i < 5; i++) { ctx.fillStyle = cols[i]; ctx.beginPath(); ctx.arc(0, 0, r * (1 - i * 0.2), 0, 7); ctx.fill(); ctx.shadowBlur = 0; }
      ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, 0, r, -Math.PI / 2, -Math.PI / 2 + (1 - g.t / g.life) * 6.283); ctx.stroke(); if (g.friendly) { ctx.fillStyle = '#073'; ctx.font = `700 ${r * 0.7}px sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('♥', 0, 3); } ctx.restore();
    }
    for (const m of this.marks) { ctx.strokeStyle = `rgba(255,255,255,${1 - m.l / 2})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(m.x, m.y, 8, 0, 7); ctx.moveTo(m.x - 6, m.y - 6); ctx.lineTo(m.x + 6, m.y + 6); ctx.stroke(); }
    this.fx.draw(ctx); this.ft.draw(ctx);
    const r = 34 + this.recoil * 18, x = this.cx, y = this.cy; const ch = art('target', 'cross'); if (ch) { spr(ctx, ch, x, y, (r + 14) * 2.3); ctx.fillStyle = '#ff4f7b'; ctx.beginPath(); ctx.arc(x, y, 3, 0, 7); ctx.fill(); return; } ctx.save(); ctx.strokeStyle = '#fff'; ctx.shadowColor = '#00e0ff'; ctx.shadowBlur = 16; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.moveTo(x - r - 14, y); ctx.lineTo(x - r + 12, y); ctx.moveTo(x + r - 12, y); ctx.lineTo(x + r + 14, y); ctx.moveTo(x, y - r - 14); ctx.lineTo(x, y - r + 12); ctx.moveTo(x, y + r - 12); ctx.lineTo(x, y + r + 14); ctx.stroke(); ctx.fillStyle = '#ff4f7b'; ctx.beginPath(); ctx.arc(x, y, 3, 0, 7); ctx.fill(); ctx.restore();
  }
}
