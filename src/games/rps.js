// Rock Paper Scissors - show your hand on SHOOT. Beat the computer; three losses and you're out.
import { Particles, FloatText } from '../core/fx.js';
import { pick, clamp, easeOutCubic } from '../core/util.js';
import { art, spr } from '../core/art.js';

const MOVES = { rock: { e: '✊', n: 'Rock', beats: 'scissors' }, paper: { e: '✋', n: 'Paper', beats: 'rock' }, scissors: { e: '✌️', n: 'Scissors', beats: 'paper' } };
function drawHand(ctx, move, R, col) {
  if (spr(ctx, art('rps', move), 0, R * 0.04, R * 1.7)) return;
  ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  const skin = ctx.createLinearGradient(0, -R, 0, R); skin.addColorStop(0, '#ffe0a8'); skin.addColorStop(1, '#f4b36b');
  ctx.fillStyle = skin; ctx.strokeStyle = 'rgba(120,60,20,.55)'; ctx.lineWidth = R * 0.035;
  const pill = (x, y, w, h, rot = 0) => { ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.beginPath(); ctx.roundRect(-w / 2, -h / 2, w, h, w / 2); ctx.fill(); ctx.stroke(); ctx.restore(); };
  if (move === 'rock') {
    ctx.beginPath(); ctx.roundRect(-R * 0.5, -R * 0.35, R, R * 0.8, R * 0.2); ctx.fill(); ctx.stroke();
    for (let i = 0; i < 4; i++) pill(-R * 0.36 + i * R * 0.24, -R * 0.3, R * 0.22, R * 0.3);
    pill(-R * 0.42, R * 0.1, R * 0.5, R * 0.24, -0.5);
  } else if (move === 'paper') {
    ctx.beginPath(); ctx.roundRect(-R * 0.42, -R * 0.05, R * 0.84, R * 0.7, R * 0.2); ctx.fill(); ctx.stroke();
    [[-0.3, -0.45, 0.8], [-0.1, -0.62, 1], [0.12, -0.6, 0.98], [0.32, -0.44, 0.78]].forEach(([x, y, l]) => pill(R * x, R * y, R * 0.2, R * 0.75 * l));
    pill(-R * 0.52, R * 0.12, R * 0.5, R * 0.2, -0.9);
  } else {
    ctx.beginPath(); ctx.roundRect(-R * 0.4, -R * 0.0, R * 0.8, R * 0.62, R * 0.2); ctx.fill(); ctx.stroke();
    pill(-R * 0.14, -R * 0.42, R * 0.2, R * 0.9, -0.2); pill(R * 0.14, -R * 0.42, R * 0.2, R * 0.9, 0.2);
    ctx.fillStyle = skin; pill(-R * 0.26, R * 0.12, R * 0.2, R * 0.35, 0); pill(R * 0.28, R * 0.1, R * 0.2, R * 0.35, 0);
  }
  ctx.restore();
}
const FROM_GESTURE = { fist: 'rock', open: 'paper', peace: 'scissors' };

export default class RPS {
  static meta = {
    id: 'rps', name: 'Rock Paper Scissors', tagline: 'Show rock, paper or scissors to the camera on SHOOT. Beat the computer, keep your streak alive.',
    control: '✊ ✋ ✌️ Gestures', hint: 'Make a fist, flat hand or two fingers when the counter hits SHOOT', needs: { hands: true, face: false }, colors: ['#ffd36b', '#ff4fa3'], cursor: 'none', pip: true,
    icon: `<svg viewBox="0 0 100 100"><circle cx="30" cy="62" r="22" fill="#ffd36b"/><rect x="48" y="22" width="26" height="46" rx="13" fill="#7cf2a6"/><path d="M70 60l22-30M74 70l22-6" stroke="#ff4fa3" stroke-width="9" stroke-linecap="round"/></svg>`,
  };
  constructor(app) {
    this.app = app; this.fx = new Particles(); this.ft = new FloatText();
    this.phase = 'ready'; this.pt = 0; this.beat = 0; this.score = 0; this.lives = 3; this.streak = 0; this.wins = 0;
    this.player = null; this.cpu = null; this.result = null; this.samples = []; this.noShow = 0; this.t = 0; this.round = 0;
    app.hud.lives = 3;
  }
  start() { this.newRound(); }
  newRound() { this.phase = 'count'; this.pt = 0; this.beat = 0; this.player = null; this.cpu = null; this.result = null; this.samples = []; this.round++; }
  gesture(input) { const h = input.hands[0]; if (!h) return null; if (h.mouse) return h.pinch ? 'rock' : (h.y < this.app.H * 0.4 ? 'scissors' : 'paper'); return FROM_GESTURE[h.gesture] || null; }
  update(dt, input) {
    const app = this.app; this.t += dt; this.pt += dt; this.fx.update(dt); this.ft.update(dt);
    if (this.phase === 'count') {
      const b = Math.floor(this.pt / 0.7);
      if (b !== this.beat && b <= 3) { this.beat = b; b < 3 ? app.snd.tick() : app.snd.go(); }
      if (this.pt >= 2.1) { this.phase = 'shoot'; this.pt = 0; this.samples = []; this.cpu = pick(Object.keys(MOVES)); }
    } else if (this.phase === 'shoot') {
      const g = this.gesture(input); if (g) this.samples.push(g);
      if (this.pt >= 0.55) {
        if (this.samples.length < 3) { this.noShow++; this.phase = 'noshow'; this.pt = 0; }
        else {
          const tail = this.samples.slice(-Math.max(3, Math.floor(this.samples.length * 0.6))), cnt = {};
          tail.forEach((s) => (cnt[s] = (cnt[s] || 0) + 1));
          this.player = Object.entries(cnt).sort((a, b) => b[1] - a[1])[0][0]; this.resolve();
        }
      }
    } else if (this.phase === 'noshow') {
      if (this.pt > 1.4) { if (this.noShow >= 3) app.finish(this.score, { title: 'No hand detected', extra: 'Make sure your hand is in view' }); else this.newRound(); }
    } else if (this.phase === 'result') {
      if (this.pt > 1.9) { if (this.lives <= 0) app.finish(this.score, { title: 'You lost', extra: `${this.wins} wins · best streak ${this.best || 0}` }); else this.newRound(); }
    }
    app.hud.score = this.score; app.hud.lives = this.lives; app.hud.label = this.streak >= 2 ? `${this.streak} win streak` : '';
  }
  resolve() {
    const app = this.app; this.noShow = 0; this.phase = 'result'; this.pt = 0;
    const p = this.player, c = this.cpu;
    if (p === c) { this.result = 'draw'; app.snd.tick(); }
    else if (MOVES[p].beats === c) { this.result = 'win'; this.streak++; this.wins++; this.best = Math.max(this.best || 0, this.streak); const pts = 10 + (this.streak - 1) * 5; this.score += pts; app.snd.win(); this.fx.burst(app.W / 2, app.H * 0.5, 60, { color: ['#ffd36b', '#7cf2a6', '#ff4fa3', '#fff'], max: 700, glow: true, gravity: 500 }); this.ft.add(app.W / 2, app.H * 0.2, `+${pts}`, '#ffd36b', 56); }
    else { this.result = 'lose'; this.streak = 0; this.lives--; app.snd.lose(); app.shake = 14; }
  }
  draw(ctx) {
    const { W, H } = this.app, tr = this.app.tracker;
    const g = ctx.createLinearGradient(0, 0, W, H); g.addColorStop(0, '#24103f'); g.addColorStop(1, '#3a0f33'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    if (tr.drawVideo(ctx, W, H, 0.22)) { ctx.fillStyle = 'rgba(25,8,40,.5)'; ctx.fillRect(0, 0, W, H); }
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const cx1 = W * 0.27, cx2 = W * 0.73, cy = H * 0.52, R = Math.min(W * 0.2, H * 0.3);
    const panel = (cx, label, emoji, glow, shake) => {
      ctx.save(); ctx.translate(cx, cy + (shake ? Math.sin(this.t * 22) * 22 : 0));
      ctx.beginPath(); ctx.arc(0, 0, R, 0, 7); ctx.fillStyle = 'rgba(255,255,255,.08)'; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = glow; ctx.shadowColor = glow; ctx.shadowBlur = 30; ctx.stroke(); ctx.shadowBlur = 0;
      if (emoji) drawHand(ctx, emoji, R * 0.95, glow); else { ctx.font = `700 ${R * 0.9}px "Space Grotesk",sans-serif`; ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.fillText('?', 0, R * 0.05); }
      ctx.restore();
      ctx.font = '700 24px "Space Grotesk",sans-serif'; ctx.fillStyle = '#fff'; ctx.fillText(label, cx, cy + R + 44);
    };
    const live = this.gesture(this.app.input);
    const shaking = this.phase === 'count' || this.phase === 'shoot';
    
    const ce = this.phase === 'result' ? this.cpu : shaking ? 'rock' : null;
    const pe = this.phase === 'result' ? this.player : this.phase === 'shoot' && live ? live : shaking ? 'rock' : live;
    const wCol = this.result === 'win' ? '#7cf2a6' : '#00e0ff', lCol = this.result === 'lose' ? '#ff4f7b' : '#ff4fa3';
    panel(cx1, 'YOU', pe, this.result === 'win' ? '#7cf2a6' : '#00e0ff', this.phase === 'count');
    panel(cx2, 'COMPUTER', ce, this.result === 'lose' ? '#ff4f7b' : '#ff4fa3', this.phase === 'count');
    // center text
    ctx.fillStyle = '#fff';
    let big = '', sub = '';
    if (this.phase === 'ready') big = '...';
    if (this.phase === 'count') { big = ['ROCK', 'PAPER', 'SCISSORS'][Math.min(2, Math.floor(this.pt / 0.7))]; sub = 'get your hand ready'; }
    if (this.phase === 'shoot') { big = 'SHOOT!'; }
    if (this.phase === 'noshow') { big = 'No hand!'; sub = 'Show your hand to the camera'; }
    if (this.phase === 'result') { big = this.result === 'win' ? 'YOU WIN' : this.result === 'lose' ? 'YOU LOSE' : 'DRAW'; sub = `${MOVES[this.player].n} vs ${MOVES[this.cpu].n}`; }
    const k = this.phase === 'shoot' ? 1 + (1 - clamp(this.pt / 0.2, 0, 1)) * 0.5 : 1;
    ctx.save(); ctx.translate(W / 2, H * 0.52); ctx.scale(k, k);
    ctx.font = `700 ${this.phase === 'result' || this.phase === 'noshow' ? 54 : 64}px "Space Grotesk",sans-serif`; ctx.lineWidth = 8; ctx.strokeStyle = 'rgba(0,0,0,.45)'; ctx.strokeText(big, 0, 0);
    ctx.fillStyle = this.phase === 'shoot' ? '#ffd36b' : this.result === 'win' ? '#7cf2a6' : this.result === 'lose' ? '#ff6b8a' : '#fff'; ctx.fillText(big, 0, 0); ctx.restore();
    ctx.font = '500 18px Inter,sans-serif'; ctx.fillStyle = 'rgba(255,255,255,.8)'; ctx.fillText(sub, W / 2, H * 0.52 + 52);
    this.fx.draw(ctx); this.ft.draw(ctx);
  }
}
