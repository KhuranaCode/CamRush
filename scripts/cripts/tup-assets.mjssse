// Copies MediaPipe wasm from node_modules and downloads the hand + face models (once).
import { cpSync, mkdirSync, existsSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const wasmSrc = join(root, 'node_modules/@mediapipe/tasks-vision/wasm');
const wasmDst = join(root, 'public/mediapipe/wasm');
if (existsSync(wasmSrc)) { mkdirSync(wasmDst, { recursive: true }); cpSync(wasmSrc, wasmDst, { recursive: true }); console.log('wasm copied'); }
const models = {
  'hand_landmarker.task': 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
  'face_landmarker.task': 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
};
mkdirSync(join(root, 'public/models'), { recursive: true });
for (const [name, url] of Object.entries(models)) {
  const dst = join(root, 'public/models', name);
  if (existsSync(dst)) continue;
  console.log('downloading', name);
  const res = await fetch(url); if (!res.ok) throw new Error('download failed ' + url);
  writeFileSync(dst, Buffer.from(await res.arrayBuffer()));
}
console.log('assets ready');
