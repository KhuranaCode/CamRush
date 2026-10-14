// Mole Smash - whack the moles popping out of the holes with your fingertips. 45 seconds.
import { Particles, FloatText } from '../core/fx.js';
import { rand, clamp, dist, pick, easeOutCubic } from '../core/util.js';
import { pointsOf, bgGrad, glowText } from './_kit.js';
import { art, spr } from '../core/art.js';
export default class MoleSmash {
  static meta = { id: 'mole', name: 'Mole Smash', tagline: 'Whack the moles with your hands. Gold ones are worth more, skip the bombs.', control: '🖐 Both hands', hint: 'Smack moles with your fingers. Gold = x3. Bombs cost you time.', needs: { hands: true, face: false }, colors: ['#ffb347', '#ff5e62'], cursor: 'dot', pip: true,
    icon: `<svg viewBox="0 0 100 100"><ellipse cx="50" cy="78" rx="38" ry="12" fill="#2a1608"/><path d="M24 78 Q24 32 50 32 Q76 32 76 78Z" fill="#8b5a2b"/><circle cx="40" cy="52" r="4" fill="#111"/><circle cx="60" cy="52" r="4" fill="#111"/><ellipse cx="50" cy="62" rx="8" ry="6" fill="#ff8fa3"/></svg>` };
  constructor(app) {
    this.app = app; this.fx = new Particles(); this.ft = new FloatText(); this.t = 0; this.time = 45; this.score = 0; this.combo = 0; this.hits = 0; this.spawnT = 0.5; app.hud.time = 45;
    this.holes = []; this.layout();
  }
  layout() {
    const { W, H } = this.app; this.holes = []; const cw = Math.min(W / 3.4, H / 2.6 * 1.2), ch = Math.min(H / 4.3, cw * 0.8); this.R = ch * 0.42;
    for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) this.holes.push({ x: W / 2 + (c - 1) * cw * 0.95, y: H * 0.3 + r * ch * 1.0 + ch * 0.55, up: 0, kind: null, life: 0, hit: 0, cd: 0 });
  }
  update(dt, input) {
    const app = this.app; this.t += dt; this.time -= dt; this.spawnT -= dt;
    const prog = clamp(1 - this.time / 45, 0, 1);
    if (this.spawnT <= 0) {
      this.spawnT = rand(0.35, 0.8) * (1 - prog * 0.5);
      const free = this.holes.filter((h) => !h.kind && h.cd <= 0);
      if (free.length) { const h = pick(free), r = Math.random(); h.kind = r < 0.08 ? 'gold' : r < 0.2 ? 'bomb' : 'mole'; h.an = ['monkey', 'panda', 'pig', 'rabbit', 'hippo'][(Math.random() * 5) | 0]; h.life = rand(0.9, 1.5) * (1 - prog * 0.4); h.t = 0; h.hit = 0; }
    }
    const pts = pointsOf(input, 22);
    for (const h of this.holes) {
      h.cd -= dt;
      if (!h.kind) continue;
      h.t += dt; const phase = h.t < 0.18 ? h.t / 0.18 : h.t > h.life - 0.2 ? Math.max(0, (h.life - h.t) / 0.2) : 1; h.up = h.hit ? Math.max(0, h.up - dt * 7) : easeOutCubic(phase);
      if (!h.hit && h.up > 0.5) for (const p of pts) if (dist(p.x, p.y, h.x, h.y - this.R * 0.9 * h.up) < this.R * 0.9 + p.r) { this.whack(h); break; }
      if (h.t > h.life || (h.hit && h.up <= 0)) { if (!h.hit && h.kind !== 'bomb') this.combo = 0; h.kind = null; h.cd = 0.2; }
    }
    this.fx.update(dt); this.ft.update(dt);
    app.hud.score = this.score; app.hud.time = Math.max(0, this.time); app.hud.label = this.combo >= 3 ? `${this.combo} combo` : '';
    if (this.time <= 0) app.finish(this.score, { title: "Time's up", extra: `${this.hits} moles smashed` });
  }
  whack(h) {
    const app = this.app, y = h.y - this.R; h.hit = 1;
    if (h.kind === 'bomb') { this.time = Math.max(0, this.time - 3); this.combo = 0; app.snd.bomb(); app.shake = 22; app.flash('255,80,60', 0.35); this.fx.burst(h.x, y, 50, { color: ['#ffd36b', '#ff5e62', '#fff'], glow: true, max: 600 }); this.ft.add(h.x, y - 60, '-3s', '#ff6b8a', 46); return; }
    this.combo++; const g = h.kind === 'gold'; const pts = (g ? 300 : 100) * (1 + Math.min(this.combo, 15) * 0.1) | 0; this.score += pts; this.hits++;
    app.snd.splat(); if (g) app.snd.bonus(); app.punch(g ? 0.04 : 0.015); app.hitstop(g ? 70 : 35); app.shake = g ? 14 : 7;
    this.fx.burst(h.x, y, g ? 40 : 22, { color: g ? ['#ffd36b', '#fff', '#ff9a3c'] : ['#c58b52', '#fff', '#ffcf9e'], glow: g, min: 100, max: 460, gravity: 700 });
    this.ft.add(h.x, y - 70, `+${pts}`, g ? '#ffd36b' : '#fff', g ? 48 : 34);
  }
  draw(ctx) {
    const { W, H } = this.app; bgGrad(ctx, this.app, '#2b1450', '#0f1d3a', 0.3);
    ctx.fillStyle = 'rgba(70,160,90,.18)'; ctx.fillRect(0, H * 0.22, W, H);
    for (const h of this.holes) this.drawHole(ctx, h);
    this.fx.draw(ctx); this.ft.draw(ctx);
  }
  drawHole(ctx, h) {
    const R = this.R, rx = R * 1.15, ry = R * 0.42;
    ctx.save(); ctx.fillStyle = '#1a0d08'; ctx.shadowColor = '#000'; ctx.shadowBlur = 20; ctx.beginPath(); ctx.ellipse(h.x, h.y, rx, ry, 0, 0, 7); ctx.fill(); ctx.restore();
    if (h.kind) {
      ctx.save(); ctx.beginPath(); ctx.rect(h.x - rx * 1.4, h.y - R * 3, rx * 2.8, R * 3); ctx.ellipse(h.x, h.y, rx, ry, 0, 0, Math.PI, false); ctx.clip();
      ctx.beginPath(); ctx.rect(0, 0, 99999, h.y); ctx.clip();
      const y = h.y - R * 0.9 * h.up + R * 0.6 * (1 - h.up), sq = h.hit ? 0.8 : 1;
      if (h.kind === 'bomb') this.bomb(ctx, h.x, y - R * 0.2, R * 0.8); else this.mole(ctx, h.x, y, R, h.kind === 'gold', h.hit, sq, h);
      ctx.restore();
    }
    ctx.fillStyle = '#3a2314'; ctx.beginPath(); ctx.ellipse(h.x, h.y, rx, ry, 0, 0, Math.PI, false); ctx.fill();
    ctx.strokeStyle = '#6b4325'; ctx.lineWidth = 4; ctx.beginPath(); ctx.ellipse(h.x, h.y, rx, ry, 0, 0, Math.PI); ctx.stroke();
  }
  mole(ctx, x, y, R, gold, hit, sq, h) {
    const aim = art('mole', gold ? 'giraffe' : h?.an || 'monkey');
    if (aim) { ctx.save(); ctx.translate(x, y - R * 0.05); ctx.scale(1, sq); if (gold) { ctx.shadowColor = '#ffd36b'; ctx.shadowBlur = 30; } if (hit) ctx.rotate(0.18); spr(ctx, aim, 0, 0, R * 2.5); ctx.restore(); return; }
    ctx.save(); ctx.translate(x, y); ctx.scale(1, sq);
    const body = ctx.createLinearGradient(0, -R, 0, R * 0.8); body.addColorStop(0, gold ? '#ffe27a' : '#b07a45'); body.addColorStop(1, gold ? '#e0a020' : '#6b4325');
    if (gold) { ctx.shadowColor = '#ffd36b'; ctx.shadowBlur = 30; }
    ctx.fillStyle = body; ctx.beginPath(); ctx.moveTo(-R * 0.95, R); ctx.quadraticCurveTo(-R * 1.0, -R * 1.1, 0, -R * 1.1); ctx.quadraticCurveTo(R * 1.0, -R * 1.1, R * 0.95, R); ctx.fill(); ctx.shadowBlur = 0;
    ctx.fillStyle = gold ? '#ffd36b' : '#c9966b'; ctx.beginPath(); ctx.ellipse(0, R * 0.2, R * 0.55, R * 0.42, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#ff7a9a'; ctx.beginPath(); ctx.ellipse(0, -R * 0.1, R * 0.17, R * 0.12, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#fff'; for (const s of [-1, 1]) { ctx.beginPath(); ctx.arc(s * R * 0.38, -R * 0.55, R * 0.17, 0, 7); ctx.fill(); }
    ctx.fillStyle = '#111'; if (hit) { ctx.strokeStyle = '#111'; ctx.lineWidth = 4; for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(s * R * 0.38 - 8, -R * 0.55 - 8); ctx.lineTo(s * R * 0.38 + 8, -R * 0.55 + 8); ctx.moveTo(s * R * 0.38 + 8, -R * 0.55 - 8); ctx.lineTo(s * R * 0.38 - 8, -R * 0.55 + 8); ctx.stroke(); } }
    else for (const s of [-1, 1]) { ctx.beginPath(); ctx.arc(s * R * 0.38, -R * 0.55, R * 0.08, 0, 7); ctx.fill(); }
    ctx.fillStyle = '#fff'; ctx.fillRect(-R * 0.1, R * 0.02, R * 0.08, R * 0.16); ctx.fillRect(R * 0.02, R * 0.02, R * 0.08, R * 0.16);
    ctx.restore();
  }
  bomb(ctx, x, y, r) {
    const bi = art('mole', 'bomb'); if (bi) { ctx.save(); ctx.shadowColor = '#ff4f4f'; ctx.shadowBlur = 20 + Math.sin(this.t * 25) * 8; spr(ctx, bi, x, y - r * 0.1, r * 2.7); ctx.restore(); return; }
    ctx.save(); ctx.translate(x, y); ctx.fillStyle = '#15151f'; ctx.shadowColor = '#ff4f4f'; ctx.shadowBlur = 24; ctx.beginPath(); ctx.arc(0, 0, r, 0, 7); ctx.fill(); ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(255,255,255,.2)'; ctx.beginPath(); ctx.ellipse(-r * 0.3, -r * 0.35, r * 0.25, r * 0.15, -0.6, 0, 7); ctx.fill();
    ctx.strokeStyle = '#c9a36b'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(0, -r); ctx.quadraticCurveTo(r * 0.3, -r * 1.4, r * 0.6, -r * 1.3); ctx.stroke();
    ctx.fillStyle = Math.sin(this.t * 25) > 0 ? '#ffd36b' : '#ff5e3a'; ctx.beginPath(); ctx.arc(r * 0.6, -r * 1.3, 7, 0, 7); ctx.fill(); glowText(ctx, '☠', 0, 4, r, '#ff6b8a'); ctx.restore();
  }
}
