// Bundled sprite loader. Sprites are Kenney.nl CC0 art embedded as data URIs, so they work offline.
// art('game','name') returns a ready Image, or null while loading / if missing, so games can fall back to vector drawing.
const mods = import.meta.glob('../assets/*.js', { eager: true });
const cache = {};
export const art = (g, n) => {
  const k = g + '/' + n; let i = cache[k];
  if (i === undefined) {
    const all = mods[`../assets/${g}.js`]?.default; // load the whole game's set on first touch
    for (const nn in all) { const kk = g + '/' + nn; if (!cache[kk]) { const im = new Image(); im.src = all[nn]; cache[kk] = im; } }
    i = cache[k] ?? (cache[k] = null);
  }
  return i && i.complete && i.naturalWidth ? i : null;
};
// Draw a sprite centred on (x,y) with width w (height keeps aspect unless h given).
export const spr = (ctx, im, x, y, w, h, rot = 0, flip = false) => {
  if (!im) return false; h = h ?? (w * im.naturalHeight) / im.naturalWidth;
  ctx.save(); ctx.translate(x, y); if (rot) ctx.rotate(rot); if (flip) ctx.scale(-1, 1); ctx.drawImage(im, -w / 2, -h / 2, w, h); ctx.restore(); return true;
};
// Warm the cache for a game so the first frame already has its art.
export const preload = (g, names) => names.forEach((n) => art(g, n));
