// Sky Flap - your hand is the bird. Raise and lower it to thread the pipes.
import { Particles, FloatText } from '../core/fx.js';
import { rand, clamp, smooth, roundRect } from '../core/util.js';

export default class SkyFlap {
  static meta = {
    id: 'flap', name: 'Sky Flap', tagline: 'Your hand is the bird. Move it up and down to glide through the pipes.',
    control: '✋ Hand height', hint: 'Raise and lower your hand to fly through the gaps', needs: { hands: true, face: false }, colors: ['#4fc3ff', '#7cf2a6'], cursor: 'none', pip: true,
    icon: `<svg viewBox="0 0 100 100"><circle cx="46" cy="50" r="30" fill="#ffd23f"/><path d="M30 56c10 14 30 12 34-4-10 6-24 6-34 4z" fill="#ffb300"/><circle cx="58" cy="42" r="9" fill="#fff"/><circle cx="61" cy="42" r="4.5" fill="#222"/><path d="M70 50l20 5-20 7z" fill="#ff7a2f"/><path d="M14 46c-6 6-6 14 0 18" stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round" opacity=".6"/></svg>`,
  };
  constructor(app) {
    this.app = app; this.fx = new Particles(); this.ft = new FloatText();
    const { W, H } = app; this.s = clamp(H / 900, 0.6, 1.5);
    this.bird = { x: W * 0.28, y: H * 0.5, vy: 0, r: 22 * this.s, tilt: 0, flap: 0 };
    this.pipes = []; this.dist = 0; this.score = 0; this.speed = 270 * this.s; this.gap = 250 * this.s; this.nextPipe = 0; this.t = 0; this.dead = false; this.lastGapY = H * 0.5;
    this.clouds = Array.from({ length: 7 }, () => ({ x: rand(0, W), y: rand(H * 0.05, H * 0.5), s: rand(0.6, 1.5), v: rand(8, 24) }));
    this.hills = Array.from({ length: 14 }, (_, i) => ({ x: i * 160 * this.s, h: rand(60, 170) * this.s }));
    this.targetY = H * 0.5; this.ground = 0;
  }
  idle(dt, input) { this.follow(dt, input, 6); }
  start() { this.nextPipe = this.app.W * 1.0; }
  follow(dt, input, rate = 14) {
    const h = input.hands[0], { H } = this.app;
    if (h) this.targetY = clamp(h.palm.y, H * 0.08, H * 0.9 - 40);
    const b = this.bird, prev = b.y;
    b.y = smooth(b.y, this.targetY, rate, dt);
    b.vy = (b.y - prev) / Math.max(dt, 1e-3);
    b.tilt = smooth(b.tilt, clamp(b.vy / 900, -0.7, 0.9), 10, dt);
    b.flap += dt * (10 + Math.abs(b.vy) / 60);
  }
  update(dt, input) {
    const app = this.app, { W, H } = app; this.t += dt;
    this.follow(dt, input);
    const lvl = Math.min(1, this.score / 40);
    this.speed = (270 + lvl * 190) * this.s; this.gap = (250 - lvl * 70) * this.s;
    this.dist += this.speed * dt; this.ground = (this.ground + this.speed * dt) % 48;
    this.nextPipe -= this.speed * dt;
    if (this.nextPipe <= 0) {
      const margin = this.gap / 2 + 70 * this.s;
      const maxStep = H * (0.28 + lvl * 0.1);
      const y = clamp(this.lastGapY + rand(-maxStep, maxStep), margin, H - 90 * this.s - margin);
      this.lastGapY = y; this.pipes.push({ x: W + 90, y, w: 96 * this.s, passed: false, hue: rand(0, 1) });
      this.nextPipe = rand(430, 520) * this.s + this.speed * 0.3;
    }
    for (const p of this.pipes) { p.x -= this.speed * dt; }
    this.pipes = this.pipes.filter((p) => p.x > -150);
    const b = this.bird;
    for (const p of this.pipes) {
      if (!p.passed && p.x + p.w < b.x - b.r) { p.passed = true; this.score++; app.snd.point(); this.ft.add(b.x + 50, b.y - 40, '+1', '#fff', 30); this.fx.burst(b.x, b.y, 14, { color: ['#fff', '#ffd23f'], glow: true, gravity: 200 }); }
      const inX = b.x + b.r * 0.8 > p.x && b.x - b.r * 0.8 < p.x + p.w;
      if (inX && (b.y - b.r * 0.8 < p.y - this.gap / 2 || b.y + b.r * 0.8 > p.y + this.gap / 2)) return this.die();
    }
    if (b.y + b.r > H - 60 * this.s) return this.die();
    if (Math.random() < dt * 40) this.fx.burst(b.x - 20, b.y + 8, 1, { color: 'rgba(255,255,255,.7)', min: 10, max: 40, ttlMax: 0.5, gravity: 0, rMin: 2, rMax: 5, angle: Math.PI, spread: 0.4 });
    this.clouds.forEach((c) => { c.x -= c.v * dt; if (c.x < -200) { c.x = W + 200; c.y = rand(H * 0.05, H * 0.5); } });
    this.fx.update(dt); this.ft.update(dt);
    app.hud.score = this.score;
  }
  die() {
    if (this.dead) return; this.dead = true;
    const b = this.bird; this.app.snd.hit(); this.app.shake = 22;
    this.fx.burst(b.x, b.y, 40, { color: ['#ffd23f', '#fff', '#ff7a2f'], min: 100, max: 500, glow: true });
    this.app.finish(this.score, { title: this.score >= 20 ? 'Legendary flight' : 'Crashed', extra: this.score === 1 ? '1 pipe cleared' : `${this.score} pipes cleared`, delay: 800 });
  }
  draw(ctx) {
    const { W, H } = this.app, s = this.s;
    const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#2a8fe8'); g.addColorStop(0.6, '#8fd8ff'); g.addColorStop(1, '#d8f6ff');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    const sun = ctx.createRadialGradient(W * 0.8, H * 0.2, 0, W * 0.8, H * 0.2, 260); sun.addColorStop(0, 'rgba(255,250,200,.95)'); sun.addColorStop(0.25, 'rgba(255,240,170,.35)'); sun.addColorStop(1, 'transparent'); ctx.fillStyle = sun; ctx.fillRect(0, 0, W, H);
    for (const c of this.clouds) this.cloud(ctx, c.x, c.y, c.s * 70 * s);
    // hills (parallax)
    ctx.fillStyle = '#9ad9a8'; ctx.beginPath(); ctx.moveTo(0, H);
    for (let x = 0; x <= W + 40; x += 40) { const k = (x + this.dist * 0.15) / 170; ctx.lineTo(x, H - 60 * s - 60 * s - Math.abs(Math.sin(k)) * 90 * s - Math.sin(k * 2.3) * 24 * s); }
    ctx.lineTo(W, H); ctx.fill();
    ctx.fillStyle = '#6cc58a'; ctx.beginPath(); ctx.moveTo(0, H);
    for (let x = 0; x <= W + 40; x += 40) { const k = (x + this.dist * 0.35) / 120; ctx.lineTo(x, H - 60 * s - 20 * s - Math.abs(Math.sin(k)) * 50 * s); }
    ctx.lineTo(W, H); ctx.fill();
    for (const p of this.pipes) this.pipe(ctx, p);
    // ground
    const gh = 60 * s; ctx.fillStyle = '#e6d28c'; ctx.fillRect(0, H - gh, W, gh); ctx.fillStyle = '#7bd34e'; ctx.fillRect(0, H - gh, W, 14 * s);
    ctx.fillStyle = '#5eb53a'; for (let x = -48 + (48 - this.ground); x < W; x += 48) { ctx.beginPath(); ctx.moveTo(x, H - gh); ctx.lineTo(x + 24, H - gh); ctx.lineTo(x + 12, H - gh + 14 * s); ctx.fill(); }
    this.fx.draw(ctx); this.drawBird(ctx); this.ft.draw(ctx);
  }
  cloud(ctx, x, y, r) { ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.beginPath(); ctx.arc(x, y, r * 0.6, 0, 7); ctx.arc(x + r * 0.7, y + r * 0.1, r * 0.5, 0, 7); ctx.arc(x - r * 0.7, y + r * 0.15, r * 0.45, 0, 7); ctx.arc(x + r * 0.2, y - r * 0.25, r * 0.5, 0, 7); ctx.fill(); }
  pipe(ctx, p) {
    const { H } = this.app, top = p.y - this.gap / 2, bot = p.y + this.gap / 2, w = p.w, cap = 36 * this.s;
    const draw = (y, h, capY) => {
      const g = ctx.createLinearGradient(p.x, 0, p.x + w, 0); g.addColorStop(0, '#2c9a3a'); g.addColorStop(0.3, '#7fe07a'); g.addColorStop(0.7, '#43b94d'); g.addColorStop(1, '#1f7a2c');
      ctx.fillStyle = g; ctx.fillRect(p.x + 6, y, w - 12, h);
      ctx.fillRect(p.x - 6, capY, w + 12, cap);
      ctx.strokeStyle = 'rgba(0,50,10,.5)'; ctx.lineWidth = 3; ctx.strokeRect(p.x + 6, y, w - 12, h); ctx.strokeRect(p.x - 6, capY, w + 12, cap);
      ctx.fillStyle = 'rgba(255,255,255,.22)'; ctx.fillRect(p.x + 14, y, 8, h); ctx.fillRect(p.x, capY + 5, 8, cap - 10);
    };
    draw(0, top - cap, top - cap); draw(bot + cap, H, bot);
  }
  drawBird(ctx) {
    const b = this.bird, r = b.r;
    ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(b.tilt);
    ctx.shadowColor = 'rgba(0,0,0,.25)'; ctx.shadowBlur = 14; ctx.shadowOffsetY = 6;
    const g = ctx.createRadialGradient(-r * 0.3, -r * 0.4, r * 0.1, 0, 0, r * 1.3); g.addColorStop(0, '#ffe36b'); g.addColorStop(1, '#ffb300');
    ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(0, 0, r * 1.25, r, 0, 0, 7); ctx.fill(); ctx.shadowColor = 'transparent';
    ctx.fillStyle = '#ff9a1f'; ctx.beginPath(); ctx.ellipse(-r * 0.2, r * 0.1 + Math.sin(b.flap) * r * 0.35, r * 0.7, r * 0.42, -0.3 + Math.sin(b.flap) * 0.5, 0, 7); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(r * 0.55, -r * 0.3, r * 0.42, 0, 7); ctx.fill();
    ctx.fillStyle = '#1b1b2b'; ctx.beginPath(); ctx.arc(r * 0.68, -r * 0.28, r * 0.2, 0, 7); ctx.fill();
    ctx.fillStyle = '#ff5a3a'; ctx.beginPath(); ctx.moveTo(r * 0.95, -r * 0.05); ctx.lineTo(r * 1.65, r * 0.12); ctx.lineTo(r * 0.95, r * 0.4); ctx.closePath(); ctx.fill();
    ctx.restore();
  }
}
