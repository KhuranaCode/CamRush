// Star Blaster - fly with your hand, auto-fire, pinch for a screen-clearing nova.
import { Particles, FloatText } from '../core/fx.js';
import { rand, clamp, smooth, dist } from '../core/util.js';
import { bgGrad } from './_kit.js';
import { art, spr } from '../core/art.js';
export default class StarBlaster {
  static meta = { id: 'blaster', name: 'Star Blaster', tagline: 'Fly your ship with your hand. It fires on its own. Pinch to unleash a nova.', control: '🖐 Hand + pinch', hint: 'Move your hand to fly. Pinch = nova bomb (2 charges).', needs: { hands: true, face: false }, colors: ['#7c5cff', '#00e0ff'], cursor: 'dot', pip: true, bloom: 0.75,
    icon: `<svg viewBox="0 0 100 100"><path d="M50 10 L70 70 L50 60 L30 70Z" fill="#00e0ff"/><path d="M50 22 L58 56 L50 52 L42 56Z" fill="#fff" opacity=".6"/><path d="M44 66h12l-6 22z" fill="#ff9a3c"/></svg>` };
  constructor(app) {
    this.app = app; this.fx = new Particles(1200); this.ft = new FloatText(); this.t = 0; this.score = 0; this.lives = 3; this.x = app.W / 2; this.y = app.H * 0.8; this.tx = this.x; this.ty = this.y; this.shots = []; this.en = []; this.eshots = []; this.spawnT = 1; this.fireT = 0; this.inv = 0; this.bombs = 2; this.kills = 0; this.wasPinch = false; this.nova = 0; this.sc = clamp(app.H / 900, 0.6, 1.4); app.hud.lives = 3;
  }
  update(dt, input) {
    const app = this.app, { W, H } = app, s = this.sc; this.t += dt; this.inv -= dt; this.fireT -= dt; this.spawnT -= dt; this.nova = Math.max(0, this.nova - dt * 1.6);
    const h = input.primary; let pinch = false;
    if (h) { this.tx = h.palm ? h.palm.x : h.x; this.ty = h.palm ? h.palm.y : h.y; pinch = h.mouse ? h.pinch : h.gesture === 'pinch' || h.gesture === 'fist'; }
    if (input.consume('Space')) pinch = true;
    if (pinch && !this.wasPinch && this.bombs > 0) this.novaBomb(); this.wasPinch = pinch && !!h?.mouse === false ? pinch : pinch;
    this.x = smooth(this.x, clamp(this.tx, 30, W - 30), 16, dt); this.y = smooth(this.y, clamp(this.ty, H * 0.35, H - 50), 16, dt);
    const lvl = 1 + this.t / 25;
    if (this.fireT <= 0) { this.fireT = 0.14; const n = this.t > 40 ? 3 : this.t > 15 ? 2 : 1; for (let i = 0; i < n; i++) this.shots.push({ x: this.x + (i - (n - 1) / 2) * 16 * s, y: this.y - 30 * s, vy: -H * 1.3, vx: (i - (n - 1) / 2) * 30 }); }
    if (this.spawnT <= 0) { this.spawnT = rand(0.5, 1.1) / Math.sqrt(lvl); const k = Math.random(); this.en.push(k < 0.25 ? { kind: 'ast', x: rand(40, W - 40), y: -50, vy: rand(120, 220) * s, vx: rand(-60, 60), r: rand(30, 56) * s, hp: 3, rot: 0 } : { kind: 'ship', x: rand(60, W - 60), y: -50, vy: rand(90, 160) * s, vx: 0, r: 30 * s, hp: 1, ph: rand(0, 6), fire: rand(1, 2.5), hue: rand(0, 40) }); }
    for (const b of this.shots) { b.y += b.vy * dt; b.x += b.vx * dt; }
    for (const e of this.en) {
      e.y += e.vy * dt; if (e.kind === 'ship') { e.x += Math.sin(this.t * 2 + e.ph) * 120 * dt; e.fire -= dt; if (e.fire <= 0 && e.y > 0 && e.y < H * 0.6) { e.fire = rand(1.5, 3); const a = Math.atan2(this.y - e.y, this.x - e.x); this.eshots.push({ x: e.x, y: e.y, vx: Math.cos(a) * 320 * s, vy: Math.sin(a) * 320 * s }); } } else { e.x += e.vx * dt; e.rot += dt; }
      for (const b of this.shots) if (!b.dead && Math.abs(b.x - e.x) < e.r && Math.abs(b.y - e.y) < e.r) { b.dead = 1; e.hp--; e.flash = 0.08; this.fx.burst(b.x, b.y, 3, { color: ['#fff', '#7fefff'], max: 200, min: 60 }); if (e.hp <= 0 && !e.dead) this.kill(e); }
      if (!e.dead && this.inv <= 0 && dist(e.x, e.y, this.x, this.y) < e.r + 22 * s) { e.dead = 1; this.hurt(); }
      if (e.flash) e.flash -= dt;
    }
    for (const b of this.eshots) { b.x += b.vx * dt; b.y += b.vy * dt; if (this.inv <= 0 && dist(b.x, b.y, this.x, this.y) < 24 * s) { b.dead = 1; this.hurt(); } }
    this.shots = this.shots.filter((b) => !b.dead && b.y > -40); this.en = this.en.filter((e) => !e.dead && e.y < H + 80); this.eshots = this.eshots.filter((b) => !b.dead && b.y < H + 40 && b.y > -40 && b.x > -40 && b.x < W + 40);
    this.fx.update(dt); this.ft.update(dt); this.score += dt * 5 | 0;
    if (Math.random() < dt * 40) this.fx.burst(this.x, this.y + 26 * s, 1, { color: ['#ff9a3c', '#ffd36b'], min: 40, max: 160, angle: Math.PI / 2, spread: 0.4, glow: true, life: 0.35 });
    app.hud.score = this.score | 0; app.hud.lives = this.lives; app.hud.label = `Nova x${this.bombs}`;
  }
  kill(e) { e.dead = 1; this.kills++; const app = this.app, pts = e.kind === 'ast' ? 60 : 100; this.score += pts; app.snd.pop(); app.shake = 6; app.punch(0.01); this.fx.burst(e.x, e.y, e.kind === 'ast' ? 36 : 26, { color: e.kind === 'ast' ? ['#b8b8d0', '#fff', '#ffcf9e'] : ['#ff7a5c', '#ffd36b', '#fff'], glow: true, min: 80, max: 520, gravity: 100 }); this.ft.add(e.x, e.y, `+${pts}`, '#fff', 26); if (Math.random() < 0.05 && this.bombs < 3) { this.bombs++; this.ft.add(e.x, e.y - 40, '+NOVA', '#ffd36b', 34); app.snd.bonus(); } }
  novaBomb() { const app = this.app; this.bombs--; this.nova = 1; app.snd.bomb(); app.shake = 28; app.flash('160,200,255', 0.5); app.hitstop(80); for (const e of this.en) if (e.y > -20) this.kill(e); this.eshots = []; }
  hurt() { const app = this.app; this.lives--; this.inv = 1.6; app.snd.hit(); app.shake = 26; app.flash('255,60,90', 0.35); app.hitstop(90); this.fx.burst(this.x, this.y, 50, { color: ['#7fefff', '#fff', '#7c5cff'], glow: true, max: 600 }); if (this.lives <= 0) app.finish(this.score | 0, { title: 'Ship destroyed', extra: `${this.kills} enemies destroyed` }); }
  draw(ctx) {
    const { W, H } = this.app, s = this.sc; const hasVid = bgGrad(ctx, this.app, '#04030f', '#120a35', 0.22);
    const bgt = art('blaster', 'bg'); if (bgt) { ctx.save(); ctx.globalAlpha = hasVid ? 0.22 : 0.5; const ts = 256 * Math.max(1, H / 900), oy = (this.t * 60) % ts; for (let y = -ts + oy; y < H; y += ts) for (let x = 0; x < W; x += ts) ctx.drawImage(bgt, x, y, ts + 1, ts + 1); ctx.restore(); }
    ctx.save(); for (const e of this.en) { ctx.save(); ctx.translate(e.x, e.y); const eim = e.kind === 'ast' ? art('blaster', e.r > 42 * s ? 'ast2' : 'ast1') : art('blaster', 'e' + (1 + (Math.floor(e.hue / 10) % 4))); if (eim) { if (e.flash > 0) ctx.filter = 'brightness(1.5)'; spr(ctx, eim, 0, 0, e.r * (e.kind === 'ast' ? 2.3 : 2.6), undefined, e.kind === 'ast' ? e.rot : 0); ctx.filter = 'none'; ctx.restore(); continue; } if (e.kind === 'ast') { ctx.rotate(e.rot); ctx.fillStyle = e.flash > 0 ? '#fff' : '#6c6a88'; ctx.strokeStyle = '#a9a7c8'; ctx.lineWidth = 3; ctx.beginPath(); for (let i = 0; i < 9; i++) { const a = i / 9 * 6.283, r = e.r * (0.8 + 0.25 * Math.sin(i * 7.3)); ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); } ctx.closePath(); ctx.fill(); ctx.stroke(); } else { const c = `hsl(${e.hue},95%,60%)`; ctx.shadowColor = c; ctx.shadowBlur = 24; ctx.fillStyle = e.flash > 0 ? '#fff' : c; ctx.beginPath(); ctx.moveTo(0, e.r); ctx.lineTo(-e.r, -e.r * 0.6); ctx.lineTo(0, -e.r * 0.2); ctx.lineTo(e.r, -e.r * 0.6); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#1a0a20'; ctx.beginPath(); ctx.arc(0, -e.r * 0.1, e.r * 0.25, 0, 7); ctx.fill(); } ctx.restore(); } ctx.restore();
    const las = art('blaster', 'laser'), els = art('blaster', 'elaser');
    if (las && els) { for (const b of this.shots) spr(ctx, las, b.x, b.y, 14, 44); for (const b of this.eshots) spr(ctx, els, b.x, b.y, 26 * s); } else {
    ctx.save(); ctx.shadowColor = '#00e0ff'; ctx.shadowBlur = 16; ctx.fillStyle = '#9ff3ff'; for (const b of this.shots) ctx.fillRect(b.x - 2.5, b.y - 12, 5, 24); ctx.shadowColor = '#ff4f7b'; ctx.fillStyle = '#ff7a9a'; for (const b of this.eshots) { ctx.beginPath(); ctx.arc(b.x, b.y, 8 * s, 0, 7); ctx.fill(); } ctx.restore(); }
    const pship = art('blaster', 'ship');
    if (pship && (this.inv <= 0 || Math.sin(this.t * 40) > 0)) { ctx.save(); ctx.shadowColor = '#00e0ff'; ctx.shadowBlur = 22; spr(ctx, pship, this.x, this.y, 84 * s); ctx.restore(); }
    else if (this.inv <= 0 || Math.sin(this.t * 40) > 0) { ctx.save(); ctx.translate(this.x, this.y); ctx.scale(s, s); ctx.shadowColor = '#00e0ff'; ctx.shadowBlur = 26; const g = ctx.createLinearGradient(0, -36, 0, 30); g.addColorStop(0, '#eaffff'); g.addColorStop(1, '#2aa0e0'); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(0, -38); ctx.lineTo(26, 26); ctx.lineTo(0, 14); ctx.lineTo(-26, 26); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#7c5cff'; ctx.beginPath(); ctx.moveTo(0, -20); ctx.lineTo(7, 6); ctx.lineTo(-7, 6); ctx.closePath(); ctx.fill(); ctx.restore(); }
    this.fx.draw(ctx); this.ft.draw(ctx);
    if (this.nova > 0) { ctx.strokeStyle = `rgba(190,220,255,${this.nova})`; ctx.lineWidth = 16 * this.nova; ctx.beginPath(); ctx.arc(this.x, this.y, (1 - this.nova) * Math.max(W, H), 0, 7); ctx.stroke(); }
  }
}
