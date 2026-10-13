// Unified input: camera hands/face + mouse/keyboard fallback so a demo never dead-ends.
export class Input {
  constructor(canvas) {
    this.hands = []; this.face = null; this.camHands = [];
    this.mouse = { x: -999, y: -999, down: false, active: 0, px: -999, py: -999 };
    this.keys = new Set(); this.pressedOnce = new Set();
    this.mode = 'camera'; // 'camera' | 'mouse'
    canvas.addEventListener('pointermove', (e) => { const m = this.mouse; m.px = m.x; m.py = m.y; m.x = e.clientX; m.y = e.clientY; m.active = performance.now(); });
    window.addEventListener('pointermove', (e) => { const m = this.mouse; m.px = m.x; m.py = m.y; m.x = e.clientX; m.y = e.clientY; m.active = performance.now(); });
    window.addEventListener('pointerdown', () => { this.mouse.down = true; });
    window.addEventListener('pointerup', () => { this.mouse.down = false; });
    window.addEventListener('keydown', (e) => { if (!this.keys.has(e.code)) this.pressedOnce.add(e.code); this.keys.add(e.code); });
    window.addEventListener('keyup', (e) => { this.keys.delete(e.code); });
  }
  consume(code) { const r = this.pressedOnce.has(code); this.pressedOnce.delete(code); return r; }
  endFrame() { this.pressedOnce.clear(); }
  apply(camHands, face, now) {
    this.camHands = camHands; this.face = face;
    const m = this.mouse;
    const mouseRecent = now - m.active < 4000;
    if (camHands.length) this.hands = camHands;
    else if (this.mode === 'mouse' || mouseRecent) {
      const vx = (m.x - m.px) * 60, vy = (m.y - m.py) * 60;
      const mh = { slot: 0, mouse: true, x: m.x, y: m.y, px: m.px, py: m.py, palm: { x: m.x, y: m.y }, tips: [{ x: m.x, y: m.y }], pinch: m.down, fingers: m.down ? 0 : 5, gesture: m.down ? 'fist' : 'open', ext: [], vx, vy, speed: Math.hypot(vx, vy), size: 140, lm: null };
      this.hands = m.x > -900 ? [mh] : [];
    } else this.hands = [];
    m.px = m.x; m.py = m.y;
  }
  get primary() { return this.hands[0] || null; }
}
