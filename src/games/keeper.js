// Goal Rush - you are the keeper. Move both hands to block every shot. 45 seconds.
import { Particles, FloatText } from '../core/fx.js';
import { rand, clamp, lerp, dist } from '../core/util.js';
import { bgGrad, grid, glowText } from './_kit.js';

export default class GoalRush {
  static meta = {
    id: 'keeper', name: 'Goal Rush', tagline: 'You are the keeper. Shots rain in from everywhere - block them all with your gloves.', control: '🖐 Both hands', hint: 'Move your hands to block each shot. Gold balls score triple. Conceding costs 3 seconds.', needs: { hands: true, face: false }, colors: ['#00e0a0', '#00c8ff'], cursor: 'none', pip: true, bloom: 0.6,
    icon: `<svg viewBox="0 0 100 100"><path d="M12 88V30h76v58" fill="none" stroke="#fff" stroke-width="6"/><path d="M12 44h76M12 60h76M30 30v58M50 30v58M70 30v58" stroke="#fff" stroke-width="2" opacity=".35"/><circle cx="50" cy="70" r="13" fill="#00e0a0"/><circle cx="46" cy="66" r="3.5" fill="#fff"/></svg>`,
  };
  constructor(app) {
    this.app = app; this.fx = new Particles(); this.ft = new FloatText();
    this.t = 0; this.time = 45; this.score = 0; this.combo = 0; this.bestStreak = 0; this.saves = 0; this.conceded = 0;
    this.balls = []; this.spawnT = 0.9; this.gloves = []; this.sc = clamp(app.H / 900, 0.6, 1.4); this.banner = { text: '', t: 0 };
    app.hud.time = 45;
    this.layout();
  }
  layout() { const { W, H } = this.app; this.lineY = H * 0.84; this.goalW = Math.min(W * 0.52, H * 0.9); this.goalH = H * 0.34; this.gloveR = 52 * this.sc; }
  spawn(prog) {
    const { W } = this.app, gold = Math.random() < 0.12, curve = !gold && prog > 0.25 && Math.random() < 0.22;
    const x = rand(W * 0.15, W * 0.85), y = -40;
    const tx = this.app.W / 2 + rand(-0.42, 0.42) * this.goalW, ty = this.lineY + 26;
    const ft = lerp(1.5, 0.78, prog) * rand(0.92, 1.08);
    this.balls.push({ x, y, vx: (tx - x) / ft, vy: (ty - y) / ft, r: 21 * this.sc, spin: 0, gold, curve: curve ? { amp: rand(30, 90) * this.sc, f: rand(2.2, 3.6), p: rand(0, 6) } : null, t: 0, pop: 0 });
  }
  update(dt, input) {
    const app = this.app, { W, H } = app; this.t += dt; this.time -= dt; this.spawnT -= dt; this.banner.t = Math.max(0, this.banner.t - dt);
    const prog = clamp(1 - this.time / 45, 0, 1);
    if (this.spawnT <= 0) { this.spawnT = rand(0.55, 1.0) * (1 - prog * 0.4); this.spawn(prog); if (prog > 0.5 && Math.random() < 0.2) this.spawn(prog); }
    // gloves: one per tracked hand (mouse hand has palm too)
    this.gloves = [];
    for (const h of input.hands) this.gloves.push({ x: h.palm ? h.palm.x : h.x, y: h.palm ? h.palm.y : h.y, mouse: !!h.mouse });
    for (const b of this.balls) {
      b.t += dt; b.x += b.vx * dt; b.y += b.vy * dt; b.spin += dt * 6; b.pop = Math.min(1, b.pop + dt * 4);
      const bx = b.curve ? b.x + Math.sin(b.t * b.curve.f + b.curve.p) * b.curve.amp : b.x;
      if (b.y > H * 0.35 && !b.dead) for (const g of this.gloves) { if (dist(g.x, g.y, bx, b.y) < b.r + this.gloveR * 0.85) { this.save(b, bx); break; } }
      if (!b.dead && b.y > this.lineY + 26) { b.dead = 1; this.concede(bx); }
    }
    this.balls = this.balls.filter((b) => !b.dead);
    this.fx.update(dt); this.ft.update(dt);
    app.hud.score = this.score; app.hud.time = Math.max(0, this.time); app.hud.label = this.combo >= 3 ? `${this.combo} save streak` : '';
    if (this.time <= 0) app.finish(this.score, { title: 'Full time!', extra: `${this.saves} saves · ${this.conceded} conceded · best streak ${this.bestStreak}` });
  }
  save(b, bx) {
    b.dead = 1; const app = this.app; this.combo++; this.bestStreak = Math.max(this.bestStreak, this.combo); this.saves++;
    const base = b.gold ? 300 : b.curve ? 150 : 100, pts = Math.round(base * (1 + Math.min(this.combo, 15) * 0.1));
    this.score += pts; app.snd.bounce(); if (b.gold) { app.snd.bonus(); app.punch(0.035); app.hitstop(50); } else app.punch(0.012);
    app.shake = b.gold ? 12 : 5;
    this.fx.burst(bx, b.y, b.gold ? 40 : 20, { color: b.gold ? ['#ffd36b', '#fff', '#ff9a3c'] : ['#00e0a0', '#fff', '#7fefff'], glow: true, min: 100, max: 480, gravity: 400 });
    this.ft.add(bx, b.y - 90, `+${pts}`, b.gold ? '#ffd36b' : '#fff', b.gold ? 46 : 32);
    if (this.combo > 0 && this.combo % 5 === 0) { app.snd.bonus(); this.banner = { text: `${this.combo} SAVE STREAK!`, t: 1.4 }; app.punch(0.04); }
  }
  concede(bx) {
    const app = this.app; this.combo = 0; this.conceded++; this.time = Math.max(0, this.time - 3);
    app.snd.hit(); app.shake = 24; app.flash('255,60,90', 0.35);
    this.fx.burst(bx, this.lineY, 46, { color: ['#ff5e62', '#fff', '#ffb347'], glow: true, min: 120, max: 560 });
    this.ft.add(bx, this.lineY - 70, '-3s', '#ff6b8a', 48);
  }
  draw(ctx) {
    const { W, H } = this.app, lineY = this.lineY, gw = this.goalW, gh = this.goalH, gx = W / 2 - gw / 2, gy = lineY - gh;
    bgGrad(ctx, this.app, '#041f18', '#0a1230', 0.25);
    // pitch stripes
    ctx.fillStyle = 'rgba(0,224,160,.05)';
    for (let i = 0; i < 6; i += 2) ctx.fillRect((W / 6) * i, 0, W / 6, H);
    grid(ctx, W, H, this.t, 'rgba(0,224,160,.08)');
    // goal frame + net
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,.28)'; ctx.lineWidth = 1.5; ctx.beginPath();
    for (let x = gx; x <= gx + gw; x += gw / 12) { ctx.moveTo(x, gy); ctx.lineTo(x, lineY); }
    for (let y = gy; y <= lineY; y += gh / 7) { ctx.moveTo(gx, y); ctx.lineTo(gx + gw, y); }
    ctx.stroke();
    ctx.shadowColor = '#fff'; ctx.shadowBlur = 18; ctx.strokeStyle = '#e8fff6'; ctx.lineWidth = 7; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(gx, lineY); ctx.lineTo(gx, gy); ctx.lineTo(gx + gw, gy); ctx.lineTo(gx + gw, lineY); ctx.stroke();
    ctx.restore();
    // keeper line
    ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 3; ctx.setLineDash([18, 14]); ctx.beginPath(); ctx.moveTo(0, lineY); ctx.lineTo(W, lineY); ctx.stroke(); ctx.setLineDash([]);
    // balls
    for (const b of this.balls) {
      const bx = b.curve ? b.x + Math.sin(b.t * b.curve.f + b.curve.p) * b.curve.amp : b.x, r = b.r * b.pop; if (r <= 0) continue;
      ctx.save(); ctx.translate(bx, b.y); ctx.rotate(b.spin);
      ctx.shadowColor = b.gold ? '#ffd36b' : '#fff'; ctx.shadowBlur = b.gold ? 34 : 18;
      ctx.fillStyle = b.gold ? '#ffd36b' : '#f4f7ff'; ctx.beginPath(); ctx.arc(0, 0, r, 0, 7); ctx.fill(); ctx.shadowBlur = 0;
      ctx.fillStyle = b.gold ? '#b8860b' : '#1a2233';
      ctx.beginPath(); ctx.arc(0, 0, r * 0.32, 0, 7); ctx.fill();
      for (let i = 0; i < 5; i++) { const a = i / 5 * 6.283; ctx.beginPath(); ctx.arc(Math.cos(a) * r * 0.68, Math.sin(a) * r * 0.68, r * 0.16, 0, 7); ctx.fill(); }
      ctx.restore();
      // target marker on the line
      const k = clamp(1 - (this.lineY - b.y) / (H * 0.7), 0, 1);
      ctx.strokeStyle = b.gold ? `rgba(255,211,107,${0.25 + k * 0.55})` : `rgba(255,95,98,${0.2 + k * 0.5})`; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(bx, lineY, 16 + (1 - k) * 26, 0, 7); ctx.stroke();
    }
    // gloves
    this.gloves.forEach((g, i) => {
      const col = ['#00e0ff', '#ff4fa3'][i % 2], R = this.gloveR;
      ctx.save(); ctx.translate(g.x, g.y);
      ctx.shadowColor = col; ctx.shadowBlur = 26;
      ctx.fillStyle = col + '33'; ctx.beginPath(); ctx.arc(0, 0, R, 0, 7); ctx.fill();
      ctx.lineWidth = 5; ctx.strokeStyle = col; ctx.stroke();
      ctx.shadowBlur = 0; ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(0, 0, 6, 0, 7); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,.65)'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(0, 0, R * 0.62, 0, 7); ctx.stroke();
      ctx.restore();
    });
    if (this.banner.t > 0) { ctx.save(); ctx.globalAlpha = Math.min(1, this.banner.t / 0.3); glowText(ctx, this.banner.text, W / 2, H * 0.16, 52, '#7fefff'); ctx.restore(); }
    this.fx.draw(ctx); this.ft.draw(ctx);
  }
}
