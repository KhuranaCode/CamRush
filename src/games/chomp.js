// Face Chomp - your face is the player. Move your head, open your mouth, eat the food, never the bombs.
import { Particles, FloatText } from '../core/fx.js';
import { rand, pick, clamp, smooth } from '../core/util.js';

const FOOD = ['🍔', '🍕', '🍩', '🍟', '🌮', '🍰', '🍣', '🍪'];

export default class FaceChomp {
  static meta = {
    id: 'chomp', name: 'Face Chomp', tagline: 'Your face is the player. Move your head, open wide, eat the food, spit out the bombs.',
    control: '😮 Head + mouth', hint: 'Move your head, open your mouth to eat. Mouth shut = bombs bounce off!', needs: { hands: false, face: true }, colors: ['#ff4fa3', '#ffd36b'], cursor: 'none', pip: false,
    icon: `<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="38" fill="#ffd23f"/><circle cx="36" cy="38" r="6" fill="#222"/><circle cx="64" cy="38" r="6" fill="#222"/><ellipse cx="50" cy="66" rx="17" ry="14" fill="#7a1230"/><ellipse cx="50" cy="74" rx="10" ry="6" fill="#ff6b8a"/><text x="68" y="30" font-size="26">🍕</text></svg>`,
  };
  constructor(app) {
    this.app = app; this.fx = new Particles(); this.ft = new FloatText();
    const { W, H } = app; this.s = clamp(H / 900, 0.6, 1.5);
    this.p = { x: W / 2, y: H * 0.6, r: 92 * this.s, open: 0 };
    this.items = []; this.t = 0; this.score = 0; this.lives = 3; this.time = 60; this.spawnT = 0.5; this.streak = 0; this.hurt = 0; this.eaten = 0; this.cal = null;
    this.stars = Array.from({ length: 60 }, () => ({ x: rand(0, W), y: rand(0, H), r: rand(1, 3), v: rand(10, 40) }));
    app.hud.lives = 3; app.hud.time = 60;
  }
  idle(dt, input) { this.track(dt, input); }
  track(dt, input) {
    const f = input.face, { W, H } = this.app, p = this.p;
    if (!f) return;
    if (!this.cal && !f.fake) this.cal = { x: f.x, y: f.y };
    const cx = f.fake ? W / 2 : this.cal.x, cy = f.fake ? H / 2 : this.cal.y;
    const gx = f.fake ? 1 : 2.6, gy = f.fake ? 1 : 3.0;
    const tx = clamp(W / 2 + (f.x - cx) * gx, p.r, W - p.r), ty = clamp(H / 2 + (f.y - cy) * gy + H * 0.08, p.r + 90, H - p.r);
    p.x = smooth(p.x, tx, 12, dt); p.y = smooth(p.y, ty, 12, dt);
    p.open = smooth(p.open, f.mouthOpen > 0.28 ? 1 : 0, 25, dt);
    p.raw = f.mouthOpen;
  }
  update(dt, input) {
    const app = this.app, { W, H } = app, p = this.p; this.t += dt; this.time -= dt;
    this.track(dt, input); this.hurt = Math.max(0, this.hurt - dt);
    const lvl = clamp((60 - this.time) / 60, 0, 1);
    this.spawnT -= dt;
    if (this.spawnT <= 0) {
      this.spawnT = rand(0.55, 0.9) - lvl * 0.3;
      const bomb = Math.random() < 0.18 + lvl * 0.1, gold = !bomb && Math.random() < 0.06;
      const r = 36 * this.s;
      this.items.push({ x: rand(r, W - r), y: -r, vx: rand(-60, 60), vy: rand(160, 260) * (1 + lvl * 0.7) * this.s, r, bomb, gold, e: bomb ? '💣' : gold ? '🍎' : pick(FOOD), rot: 0, vr: rand(-2, 2) });
    }
    for (const it of this.items) {
      it.x += it.vx * dt; it.y += it.vy * dt; it.rot += it.vr * dt;
      const d = Math.hypot(it.x - p.x, it.y - (p.y + p.r * 0.25));
      if (d < p.r * 0.62 + it.r * 0.4) {
        if (p.open > 0.6) {
          it.gone = true;
          if (it.bomb) { this.lives--; this.streak = 0; this.hurt = 0.6; app.shake = 22; app.snd.bomb(); this.fx.burst(p.x, p.y, 60, { color: ['#ffd36b', '#ff7a2f', '#fff'], glow: true, max: 650 }); this.ft.add(p.x, p.y - 140, 'OUCH!', '#ff6b8a', 48); }
          else { this.streak++; const pts = (it.gold ? 50 : 10) * (1 + Math.floor(this.streak / 5) * 0.5); this.score += Math.round(pts); this.eaten++; app.snd.chomp(); this.ft.add(p.x, p.y - 130, `+${Math.round(pts)}`, it.gold ? '#ffd36b' : '#fff', 38); this.fx.burst(it.x, it.y, 18, { color: ['#ffd36b', '#ff9a4f', '#fff'], max: 380, gravity: 700 }); if (this.streak % 5 === 0) { app.snd.bonus(); this.ft.add(p.x, p.y - 190, `${this.streak} STREAK!`, '#7cf2a6', 46); } }
        } else if (it.bomb) { it.vy = -Math.abs(it.vy) * 0.6; it.vx = (it.x - p.x) * 4; if (!it.bounced) { it.bounced = true; app.snd.bounce(); this.fx.burst(it.x, it.y, 8, { color: '#fff', glow: true }); } }
        else if (!it.passed) { it.passed = true; }
      }
      if (it.y > H + 80 && !it.bomb) { if (!it.gone && !it.miss) { it.miss = true; this.streak = 0; } }
    }
    this.items = this.items.filter((i) => !i.gone && i.y < H + 120 && i.y > -300);
    this.fx.update(dt); this.ft.update(dt);
    app.hud.score = this.score; app.hud.lives = this.lives; app.hud.time = Math.max(0, this.time);
    app.hud.label = this.streak >= 3 ? `${this.streak} streak` : '';
    if (this.lives <= 0) app.finish(this.score, { title: 'Too many bombs', extra: `${this.eaten} items eaten` });
    else if (this.time <= 0) app.finish(this.score, { title: "Time's up", extra: `${this.eaten} items eaten` });
  }
  draw(ctx) {
    const { W, H } = this.app, p = this.p, t = this.app.tracker;
    const g = ctx.createLinearGradient(0, 0, W, H); g.addColorStop(0, '#1a1040'); g.addColorStop(0.5, '#2a0f4a'); g.addColorStop(1, '#0f2748'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#fff'; for (const s of this.stars) { s.y += s.v * 0.016; if (s.y > H) s.y = 0; ctx.globalAlpha = 0.25 + (s.r / 3) * 0.4; ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, 7); ctx.fill(); } ctx.globalAlpha = 1;
    // items
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (const it of this.items) {
      ctx.save(); ctx.translate(it.x, it.y); ctx.rotate(it.rot);
      if (it.gold) { ctx.shadowColor = '#ffd36b'; ctx.shadowBlur = 30; }
      ctx.font = `${it.r * 2}px "Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif`; ctx.fillText(it.e, 0, 0); ctx.restore();
    }
    this.drawPlayer(ctx, p, t);
    this.fx.draw(ctx); this.ft.draw(ctx);
    if (this.hurt > 0) { ctx.fillStyle = `rgba(255,40,80,${this.hurt * 0.4})`; ctx.fillRect(0, 0, W, H); }
  }
  drawPlayer(ctx, p, t) {
    const open = p.open, r = p.r, f = this.app.input.face;
    ctx.save(); ctx.translate(p.x, p.y);
    const col = open > 0.5 ? '#7cf2a6' : '#ffffff';
    ctx.shadowColor = col; ctx.shadowBlur = 20 + open * 30;
    ctx.beginPath(); ctx.arc(0, 0, r + 8, 0, 7); ctx.fillStyle = col; ctx.fill(); ctx.shadowBlur = 0;
    ctx.save(); ctx.beginPath(); ctx.arc(0, 0, r, 0, 7); ctx.clip();
    let drew = false;
    if (f && !f.fake && t.camOk && t.m && f.lm) {
      const m = t.m, nx = 1 - (f.x - m.ox) / (m.vw * m.s), ny = (f.y - m.oy) / (m.vh * m.s);
      const size = (f.width / m.s) * 1.5;
      ctx.scale(-1, 1);
      ctx.drawImage(t.video, nx * m.vw - size / 2, ny * m.vh - size / 2, size, size, -r, -r, r * 2, r * 2); drew = true;
    }
    if (!drew) { ctx.fillStyle = '#ffd23f'; ctx.fillRect(-r, -r, r * 2, r * 2); ctx.fillStyle = '#222'; ctx.beginPath(); ctx.arc(-r * 0.35, -r * 0.2, r * 0.1, 0, 7); ctx.arc(r * 0.35, -r * 0.2, r * 0.1, 0, 7); ctx.fill(); }
    ctx.restore();
    // chomp mouth marker
    ctx.beginPath(); ctx.ellipse(0, r * 0.25, r * 0.5, r * (0.1 + open * 0.4), 0, 0, 7); ctx.fillStyle = open > 0.5 ? 'rgba(10,0,20,.55)' : 'rgba(255,255,255,.0)'; ctx.fill();
    ctx.strokeStyle = open > 0.5 ? '#7cf2a6' : 'rgba(255,255,255,.7)'; ctx.setLineDash([8, 8]); ctx.lineWidth = 3; ctx.stroke(); ctx.setLineDash([]);
    ctx.restore();
    ctx.fillStyle = 'rgba(255,255,255,.8)'; ctx.font = '600 15px Inter, sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(open > 0.5 ? 'CHOMP!' : 'open wide', p.x, p.y + r + 30);
  }
}
