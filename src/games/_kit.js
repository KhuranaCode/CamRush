// Shared helpers for the newer games.
export const pointsOf = (input, r = 16) => {
  const pts = [];
  for (const h of input.hands) { if (h.mouse) pts.push({ x: h.x, y: h.y, r, h }); else for (const t of h.tips) pts.push({ x: t.x, y: t.y, r, h }); }
  return pts;
};
export const bgGrad = (ctx, app, c1, c2, vid = 0.35) => {
  const { W, H } = app; const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, c1); g.addColorStop(1, c2); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  if (app.tracker.drawVideo(ctx, W, H, vid)) { ctx.fillStyle = 'rgba(6,6,24,.5)'; ctx.fillRect(0, 0, W, H); }
};
export const grid = (ctx, W, H, t, col = 'rgba(124,92,255,.12)') => {
  ctx.strokeStyle = col; ctx.lineWidth = 1; ctx.beginPath();
  const s = 70, o = (t * 20) % s; for (let x = 0; x < W; x += s) { ctx.moveTo(x, 0); ctx.lineTo(x, H); } for (let y = -s + o; y < H; y += s) { ctx.moveTo(0, y); ctx.lineTo(W, y); } ctx.stroke();
};
export const glowText = (ctx, txt, x, y, size, col = '#fff', a = 'center') => { ctx.save(); ctx.font = `700 ${size}px "Space Grotesk",sans-serif`; ctx.textAlign = a; ctx.textBaseline = 'middle'; ctx.shadowColor = col; ctx.shadowBlur = 24; ctx.fillStyle = col; ctx.fillText(txt, x, y); ctx.restore(); };
