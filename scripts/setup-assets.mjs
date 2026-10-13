// Prepares offline assets: copies MediaPipe wasm from node_modules, downloads the hand + face models once,
// and verifies every file (size + SHA-256) so a partial or empty download is never treated as ready.
//   node scripts/setup-assets.mjs          -> install/repair assets (needs internet only if something is missing)
//   node scripts/setup-assets.mjs --check  -> verify only, no network, exit 1 if anything is wrong
import { cpSync, mkdirSync, existsSync, writeFileSync, readFileSync, statSync, rmSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const [maj, min] = process.versions.node.split('.').map(Number);
if (!((maj === 20 && min >= 19) || (maj === 22 && min >= 12) || maj > 22)) {
  console.error(`\nCamRush needs Node.js 20.19+ or 22.12+ (you have ${process.versions.node}). Install the current LTS from https://nodejs.org and retry.\n`);
  process.exit(1);
}
const checkOnly = process.argv.includes('--check');
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const wasmSrc = join(root, 'node_modules/@mediapipe/tasks-vision/wasm');
const wasmDst = join(root, 'public/mediapipe/wasm');
const WASM = ['vision_wasm_internal.js', 'vision_wasm_internal.wasm', 'vision_wasm_nosimd_internal.js', 'vision_wasm_nosimd_internal.wasm'];
const models = {
  'hand_landmarker.task': { url: 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task', size: 7819105, sha256: 'fbc2a30080c3c557093b5ddfc334698132eb341044ccee322ccf8bcf3607cde1' },
  'face_landmarker.task': { url: 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task', size: 3758596, sha256: '64184e229b263107bc2b804c6625db1341ff2bb731874b0bcc2fe6544e0bc9ff' },
};
const sha = (p) => createHash('sha256').update(readFileSync(p)).digest('hex');
const modelOk = (name) => { const p = join(root, 'public/models', name), m = models[name]; return existsSync(p) && statSync(p).size === m.size && sha(p) === m.sha256; };
const wasmOk = () => WASM.every((f) => { const p = join(wasmDst, f); return existsSync(p) && statSync(p).size > 1000; });

if (!checkOnly) {
  if (existsSync(wasmSrc) && !wasmOk()) { mkdirSync(wasmDst, { recursive: true }); cpSync(wasmSrc, wasmDst, { recursive: true }); console.log('wasm copied'); }
  mkdirSync(join(root, 'public/models'), { recursive: true });
  for (const [name, m] of Object.entries(models)) {
    if (modelOk(name)) continue;
    const dst = join(root, 'public/models', name);
    console.log('downloading', name, '(needs internet, one time)');
    let ok = false;
    for (let i = 1; i <= 3 && !ok; i++) {
      try {
        const res = await fetch(m.url); if (!res.ok) throw new Error('HTTP ' + res.status);
        writeFileSync(dst, Buffer.from(await res.arrayBuffer())); ok = modelOk(name);
        if (!ok) { console.warn(`${name}: downloaded file failed size/checksum check (try ${i})`); rmSync(dst, { force: true }); }
      } catch (e) { console.warn(`${name}: download failed (try ${i}): ${e.message}`); }
    }
    if (!ok) { console.error(`\nCould not fetch a valid ${name}. Connect to the internet and run: npm run setup\n`); process.exit(1); }
  }
}
const bad = [...Object.keys(models).filter((n) => !modelOk(n)).map((n) => 'models/' + n), ...(wasmOk() ? [] : ['mediapipe/wasm'])];
if (bad.length) { console.error('\nCamRush assets missing or corrupt: ' + bad.join(', ') + '\nFix: connect to the internet once and run  npm run setup\n'); process.exit(1); }
console.log('assets ready (models + wasm verified, offline play OK)');
