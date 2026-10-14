// Fruit Slash - slice fruit with your fingertip.
// Mechanics (combo multiplier, golden / frozen / frenzy fruit, difficulty ramp) adapted from
// handsomeZR-netizen/webcam-fruit-ninja (MIT). Rendering, physics and input are rewritten for CamRush.
import { art, spr } from '../core/art.js';
import { Particles, FloatText } from '../core/fx.js';
import { rand, pick, clamp, segCircle } from '../core/util.js';

const FRUITS = {
  watermelon: { rind: ['#3fae4a', '#1b6e2c'], flesh: ['#ff5a6e', '#e0223f'], seed: '#2a1a1a', r: 1.25, juice: ['#ff4d6a', '#ff8095'] },
  orange: { rind: ['#ffb43a', '#f07a00'], flesh: ['#ffd36b', '#ffa51f'], seed: null, r: 1.0, juice: ['#ffa51f', '#ffd36b'] },
  apple: { rind: ['#ff5b4d', '#c4161c'], flesh: ['#fff6d6', '#f3e2a0'], seed: '#4a2c1a', r: 1.0, juice: ['#fff0b0', '#ffd6c0'] },
  pear: { rind: ['#7bd36a', '#3a9a4a'], flesh: ['#f4f0c8', '#e8e0a0'], seed: '#4a2c1a', r: 1.0, juice: ['#e8e0a0', '#a5e08a'] },
  strawberry: { rind: ['#ff5b6e', '#c4162c'], flesh: ['#ffd0d0', '#ff8a8a'], seed: '#ffe9a0', r: 0.9, juice: ['#ff4d6a', '#ff9aa8'] },
  pineapple: { rind: ['#ffcf3a', '#d99a00'], flesh: ['#fff0a0', '#ffd84a'], seed: null, r: 1.05, juice: ['#ffe45a', '#fff3a0'] },
};
const NAMES = Object.keys(FRUITS);

function drawWhole(ctx, o, R) {
  const f = FRUITS[o.type]; const im = art('fruit', 'w_' + o.type);
  if (im) { ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.35)'; ctx.shadowBlur = 14; ctx.shadowOffsetY = 6; spr(ctx, im, 0, 0, R * 2.3); ctx.restore(); return; }
  const g = ctx.createRadialGradient(-R * 0.35, -R * 0.4, R * 0.1, 0, 0, R * 1.05);
  g.addColorStop(0, f.rind[0]); g.addColorStop(1, f.rind[1]);
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, R, 0, 7); ctx.fill();
  if (o.type === 'watermelon') { ctx.strokeStyle = 'rgba(10,70,20,.55)'; ctx.lineWidth = R * 0.09; for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.ellipse(0, 0, R * (0.98 - Math.abs(i) * 0.16), R, 0, -1.2, 1.2 + 3.14 * 0, false); ctx.stroke(); } }
  if (o.type === 'kiwi') { ctx.fillStyle = 'rgba(60,40,20,.25)'; for (let i = 0; i < 14; i++) { ctx.fillRect(Math.cos(i * 1.7) * R * 0.6, Math.sin(i * 2.3) * R * 0.6, 3, 3); } }
  if (o.type === 'dragon') { ctx.fillStyle = '#3fd16a'; for (let i = 0; i < 7; i++) { const a = i * 0.9; ctx.beginPath(); ctx.ellipse(Math.cos(a) * R * 0.75, Math.sin(a) * R * 0.75, R * 0.17, R * 0.07, a, 0, 7); ctx.fill(); } }
  if (o.type === 'apple') { ctx.strokeStyle = '#4a2c1a'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(0, -R * 0.85); ctx.quadraticCurveTo(R * 0.1, -R * 1.2, R * 0.25, -R * 1.25); ctx.stroke(); ctx.fillStyle = '#3fae4a'; ctx.beginPath(); ctx.ellipse(R * 0.3, -R * 1.05, R * 0.22, R * 0.1, -0.5, 0, 7); ctx.fill(); }
  ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.beginPath(); ctx.ellipse(-R * 0.4, -R * 0.45, R * 0.22, R * 0.12, -0.7, 0, 7); ctx.fill();
}

function drawHalf(ctx, o, R) {
  const f = FRUITS[o.type];
  ctx.save();
  ctx.beginPath(); ctx.rect(o.side > 0 ? 0 : -R * 1.5, -R * 1.5, R * 1.5, R * 3); ctx.clip();
  const ci = art('fruit', 'c_' + o.type), wi = art('fruit', 'w_' + o.type);
  if (ci || wi) { spr(ctx, ci || wi, 0, 0, R * 2.3); if (!ci) { ctx.fillStyle = f.flesh[0]; ctx.fillRect(-R * 0.07, -R * 1.2, R * 0.14, R * 2.4); } ctx.restore(); return; }
  const g = ctx.createRadialGradient(0, 0, R * 0.1, 0, 0, R);
  g.addColorStop(0, f.rind[0]); g.addColorStop(1, f.rind[1]);
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, R, 0, 7); ctx.fill();
  const g2 = ctx.createRadialGradient(0, 0, R * 0.05, 0, 0, R * 0.88);
  g2.addColorStop(0, f.flesh[0]); g2.addColorStop(1, f.flesh[1]);
  ctx.fillStyle = g2; ctx.beginPath(); ctx.arc(0, 0, R * 0.86, 0, 7); ctx.fill();
  if (f.seed) { ctx.fillStyle = f.seed; for (let i = 0; i < 7; i++) { const a = -1.4 + i * 0.45 * (o.side), rr = R * (0.32 + (i % 2) * 0.22); ctx.beginPath(); ctx.ellipse(Math.cos(a) * rr * o.side, Math.sin(a) * rr, 3.5, 6, a, 0, 7); ctx.fill(); } }
  if (o.type === 'orange' || o.type === 'lemon') { ctx.strokeStyle = 'rgba(255,255,255,.45)'; ctx.lineWidth = 2; for (let i = 0; i < 6; i++) { const a = i * 1.05; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a) * R * 0.8, Math.sin(a) * R * 0.8); ctx.stroke(); } }
  ctx.restore();
}

export default class FruitSlash {
  static meta = {
    id: 'fruit', name: 'Fruit Slash', tagline: 'Swipe your finger through flying fruit. Dodge the bombs, chain combos.',
    control: '☝️ Index finger', hint: 'Slice fruit with your fingertip. Avoid bombs!', needs: { hands: true, face: false }, colors: ['#ff5a6e', '#ffb43a'], cursor: 'dot', pip: true,
    icon: `<svg viewBox="0 0 100 100"><defs><radialGradient id="fw" cx=".35" cy=".3"><stop offset="0" stop-color="#6ee07a"/><stop offset="1" stop-color="#1b7a30"/></radialGradient></defs><circle cx="50" cy="52" r="38" fill="url(#fw)"/><path d="M14 74 L88 30" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".9"/><path d="M30 60a22 22 0 0 0 34 -8" fill="none" stroke="#ff5a6e" stroke-width="8" stroke-linecap="round"/><circle cx="38" cy="38" r="5" fill="#fff" opacity=".6"/></svg>`,
  };

  constructor(app) {
    this.app = app; this.objs = []; this.halves = []; this.stains = []; this.fx = new Particles(); this.ft = new FloatText();
    this.trails = [[], []]; this.spawnT = 0.6; this.lives = 3; this.score = 0; this.combo = 0; this.comboT = 0; this.time = 0;
    this.g = 1700 * (app.H / 900); this.frozen = 0; this.frenzy = 0; this.flash = 0; this.banner = null; this.sliced = 0; this.bestCombo = 0; this.recentSlices = [];
    app.hud.lives = 3; app.hud.maxLives = 3;
  }
  get scale() { return clamp(this.app.H / 900, 0.6, 1.5); }

  spawn(kind) {
    const { W, H } = this.app, s = this.scale;
    const x = rand(W * 0.12, W * 0.88), R = 48 * s * (kind === 'fruit' ? 1 : 0.9);
    const targetY = rand(H * 0.12, H * 0.5);
    const vy = -Math.sqrt(2 * this.g * (H + R - targetY));
    const toCenter = (W / 2 - x) / W;
    const t = -vy / this.g * 2;
    const vx = clamp((rand(-0.2, 0.2) + toCenter * 0.6) * W / t, -W * 0.3, W * 0.3);
    const o = { kind, x, y: H + R, vx, vy, rot: rand(0, 6), vr: rand(-4, 4), r: R, type: pick(NAMES), special: null, age: 0 };
    if (kind === 'fruit') {
      o.r = R * FRUITS[o.type].r;
      const roll = Math.random();
      if (roll < 0.045) o.special = 'golden'; else if (roll < 0.075) o.special = 'frozen'; else if (roll < 0.105 && !this.frenzy) o.special = 'frenzy';
    }
    this.objs.push(o); this.app.snd.whoosh();
  }

  start() { this.flash = 0; }

  update(dt, input) {
    const app = this.app; this.time += dt;
    const ts = this.frozen > 0 ? 0.42 : 1; const sdt = dt * ts;
    this.frozen = Math.max(0, this.frozen - dt); this.frenzy = Math.max(0, this.frenzy - dt);
    this.comboT -= dt; if (this.comboT <= 0) this.combo = 0;
    this.flash = Math.max(0, this.flash - dt * 2);
    // difficulty ramp
    const diff = clamp(this.score / 900, 0, 1);
    this.spawnT -= sdt;
    if (this.spawnT <= 0) {
      const frenzy = this.frenzy > 0;
      this.spawnT = frenzy ? rand(0.12, 0.22) : rand(0.75 - diff * 0.35, 1.25 - diff * 0.5);
      const n = frenzy ? 1 : (Math.random() < 0.35 + diff * 0.3 ? (Math.random() < 0.4 ? 3 : 2) : 1);
      for (let i = 0; i < n; i++) this.spawn(!frenzy && Math.random() < 0.1 + diff * 0.1 ? 'bomb' : 'fruit');
    }
    // physics
    for (const o of this.objs) { o.age += sdt; o.vy += this.g * sdt; o.x += o.vx * sdt; o.y += o.vy * sdt; o.rot += o.vr * sdt; }
    for (const h of this.halves) { h.vy += this.g * sdt; h.x += h.vx * sdt; h.y += h.vy * sdt; h.rot += h.vr * sdt; h.life += sdt; }
    this.halves = this.halves.filter((h) => h.y < app.H + 200 && h.life < 3);
    // misses
    for (const o of this.objs) {
      if (o.y > app.H + o.r + 20 && o.vy > 0 && !o.dead) {
        o.dead = true;
        if (o.kind === 'fruit') this.loseLife(o.x, app.H - 60, 'Missed');
      }
    }
    this.objs = this.objs.filter((o) => !o.dead && !o.cut);
    // slicing
    const nowMs = performance.now();
    input.hands.forEach((h, i) => {
      const tr = this.trails[i] || (this.trails[i] = []);
      tr.push({ x: h.x, y: h.y, t: nowMs });
      while (tr.length && nowMs - tr[0].t > 260) tr.shift();
      const fast = h.speed > 520 * this.scale;
      if (!fast) return;
      for (const o of this.objs) {
        if (o.cut) continue;
        if (segCircle(h.px, h.py, h.x, h.y, o.x, o.y, o.r * 0.95)) this.cut(o, Math.atan2(h.y - h.py, h.x - h.px));
      }
    });
    for (let i = input.hands.length; i < 2; i++) this.trails[i] = [];
    this.recentSlices = this.recentSlices.filter((t) => nowMs - t < 280);
    this.fx.update(dt); this.ft.update(dt);
    for (const s of this.stains) s.life += dt; this.stains = this.stains.filter((s) => s.life < 4);
    if (this.banner) { this.banner.t += dt; if (this.banner.t > 1.6) this.banner = null; }
    app.hud.score = this.score;
    app.hud.lives = this.lives;
    app.hud.label = this.combo >= 3 ? `${this.combo} COMBO  x${this.mult().toFixed(1)}` : '';
  }

  mult() { return this.combo >= 3 ? Math.min(5, 1 + (this.combo - 2) * 0.25) : 1; }

  loseLife(x, y, text) {
    this.lives--; this.combo = 0; this.app.snd.hit(); this.flash = 0.5; this.app.shake = 10;
    this.ft.add(x, y, text, '#ff6b8a', 34);
    if (this.lives <= 0) this.app.finish(this.score, { title: 'Out of lives', extra: `${this.sliced} sliced · best combo ${this.bestCombo}` });
  }

  cut(o, ang) {
    const app = this.app; o.cut = true;
    if (o.kind === 'bomb') {
      app.snd.bomb(); this.fx.burst(o.x, o.y, 70, { color: ['#ffd36b', '#ff7a2f', '#fff'], min: 120, max: 700, ttlMax: 1.1, glow: true, rMax: 8 });
      this.flash = 1; app.shake = 28; this.loseLife(o.x, o.y - 70, 'BOOM!'); this.score = Math.max(0, this.score - 15); return;
    }
    const f = FRUITS[o.type]; this.sliced++; this.combo++; this.comboT = 1.1; this.bestCombo = Math.max(this.bestCombo, this.combo);
    const nowMs = performance.now(); this.recentSlices.push(nowMs);
    let pts = 10 * this.mult() * (o.special === 'golden' ? 3 : 1);
    if (this.recentSlices.length >= 3) { pts += 10 * this.recentSlices.length; this.ft.add(o.x, o.y - 80, `${this.recentSlices.length}x SLASH!`, '#ffd36b', 42); app.snd.bonus(); }
    this.score += Math.round(pts);
    this.ft.add(o.x, o.y - 20, `+${Math.round(pts)}`, o.special === 'golden' ? '#ffd36b' : '#fff', 34);
    app.snd.slice(1 + Math.min(this.combo, 8) * 0.06); app.snd.splat();
    const nx = Math.cos(ang + Math.PI / 2), ny = Math.sin(ang + Math.PI / 2);
    for (const side of [-1, 1]) this.halves.push({ type: o.type, x: o.x, y: o.y, vx: o.vx * 0.5 + nx * side * 260, vy: o.vy * 0.4 + ny * side * 120 - 120, rot: o.rot, vr: o.vr + side * 3, r: o.r, side, life: 0 });
    this.fx.burst(o.x, o.y, 26, { color: f.juice, min: 80, max: 520, ttlMax: 0.8, gravity: 900, rMax: 7 });
    this.stains.push({ x: o.x, y: o.y, c: f.juice[0], r: o.r * rand(1.1, 1.7), life: 0 });
    if (o.special === 'golden') { this.fx.burst(o.x, o.y, 40, { color: ['#ffd36b', '#fff2b0'], glow: true, min: 100, max: 600 }); this.banner = { text: 'GOLDEN  x3', color: '#ffd36b', t: 0 }; app.snd.bonus(); }
    if (o.special === 'frozen') { this.frozen = 3.5; this.banner = { text: 'TIME FREEZE', color: '#7fe3ff', t: 0 }; this.fx.burst(o.x, o.y, 40, { color: ['#7fe3ff', '#fff'], glow: true }); app.snd.bonus(); }
    if (o.special === 'frenzy') { this.frenzy = 5; this.banner = { text: 'FRUIT FRENZY!', color: '#ff7a2f', t: 0 }; app.snd.bonus(); }
  }

  draw(ctx) {
    const { W, H } = this.app, tr = this.app.tracker;
    ctx.fillStyle = '#0a0c1c'; ctx.fillRect(0, 0, W, H);
    if (!tr.drawVideo(ctx, W, H, 0.55)) { const g = ctx.createLinearGradient(0, 0, W, H); g.addColorStop(0, '#1a1340'); g.addColorStop(1, '#0a2a3a'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); }
    const vg = ctx.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, H * 0.9); vg.addColorStop(0, 'rgba(8,8,24,.25)'); vg.addColorStop(1, 'rgba(4,4,16,.8)'); ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
    if (this.frozen > 0) { ctx.fillStyle = `rgba(100,200,255,${0.12 + Math.sin(this.app.t * 5) * 0.03})`; ctx.fillRect(0, 0, W, H); }
    if (this.frenzy > 0) { ctx.fillStyle = `rgba(255,120,40,${0.1 + Math.sin(this.app.t * 12) * 0.04})`; ctx.fillRect(0, 0, W, H); }
    for (const s of this.stains) { ctx.globalAlpha = 0.35 * (1 - s.life / 4); ctx.fillStyle = s.c; ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, 7); ctx.fill(); }
    ctx.globalAlpha = 1;
    for (const h of this.halves) { ctx.save(); ctx.translate(h.x, h.y); ctx.rotate(h.rot); ctx.globalAlpha = clamp(1 - (h.life - 2) / 1, 0, 1); drawHalf(ctx, h, h.r); ctx.restore(); }
    ctx.globalAlpha = 1;
    for (const o of this.objs) {
      ctx.save(); ctx.translate(o.x, o.y); ctx.rotate(o.rot);
      if (o.special) { const col = { golden: '#ffd36b', frozen: '#7fe3ff', frenzy: '#ff7a2f' }[o.special]; ctx.shadowColor = col; ctx.shadowBlur = 40 + Math.sin(o.age * 8) * 12; ctx.strokeStyle = col; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(0, 0, o.r + 6, 0, 7); ctx.stroke(); }
      if (o.kind === 'bomb') this.drawBomb(ctx, o); else drawWhole(ctx, o, o.r);
      ctx.restore();
    }
    this.fx.draw(ctx); this.ft.draw(ctx);
    this.drawTrails(ctx);
    if (this.flash > 0) { ctx.fillStyle = `rgba(255,${this.flash > 0.6 ? 255 : 60},${this.flash > 0.6 ? 220 : 80},${this.flash * 0.45})`; ctx.fillRect(0, 0, W, H); }
    if (this.banner) {
      const k = this.banner.t, a = k < 0.2 ? k / 0.2 : k > 1.3 ? 1 - (k - 1.3) / 0.3 : 1;
      ctx.save(); ctx.globalAlpha = clamp(a, 0, 1); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = '700 80px "Space Grotesk", sans-serif';
      ctx.shadowColor = this.banner.color; ctx.shadowBlur = 30; ctx.fillStyle = this.banner.color; ctx.fillText(this.banner.text, W / 2, H * 0.3 - (1 - a) * 20); ctx.restore();
    }
  }

  drawBomb(ctx, o) {
    const R = o.r; const bi = art('fruit', 'bomb');
    if (bi) { ctx.save(); ctx.shadowColor = '#ff3b5c'; ctx.shadowBlur = 18 + Math.sin(o.age * 14) * 8; spr(ctx, bi, 0, 0, R * 2.4); ctx.restore(); return; }
    const g = ctx.createRadialGradient(-R * 0.3, -R * 0.35, R * 0.1, 0, 0, R); g.addColorStop(0, '#5a5f7a'); g.addColorStop(1, '#11131f');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, R, 0, 7); ctx.fill();
    ctx.strokeStyle = '#ff3b5c'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(0, 0, R * 0.98, 0, 7); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.beginPath(); ctx.ellipse(-R * 0.35, -R * 0.4, R * 0.2, R * 0.11, -0.7, 0, 7); ctx.fill();
    ctx.fillStyle = '#ff3b5c'; ctx.font = `800 ${R * 0.9}px "Space Grotesk",sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('!', 0, R * 0.05);
    ctx.fillStyle = '#c9a36a'; ctx.fillRect(-4, -R - 10, 8, 14);
    const sp = Math.sin(o.age * 30);
    ctx.fillStyle = sp > 0 ? '#ffd36b' : '#ff7a2f'; ctx.shadowColor = '#ffd36b'; ctx.shadowBlur = 14; ctx.beginPath(); ctx.arc(0, -R - 14, 6 + sp, 0, 7); ctx.fill();
  }

  drawTrails(ctx) {
    const now = performance.now();
    ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    for (const tr of this.trails) {
      if (tr.length < 2) continue;
      for (let i = 1; i < tr.length; i++) {
        const a = tr[i - 1], b = tr[i], age = (now - b.t) / 260, k = clamp(1 - age, 0, 1) * (i / tr.length);
        if (k <= 0) continue;
        ctx.strokeStyle = `rgba(120,230,255,${0.5 * k})`; ctx.lineWidth = 26 * k; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        ctx.strokeStyle = `rgba(255,255,255,${0.95 * k})`; ctx.lineWidth = 9 * k; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      }
    }
    ctx.globalCompositeOperation = 'source-over';
  }
        }
