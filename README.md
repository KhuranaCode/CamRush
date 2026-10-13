# CamRush

Camera-controlled arcade for Tech Utsav. Six games, all played with your hands, face or head - no controller.

| Game | Control |
|---|---|
| Fruit Slash | Index fingertip slices fruit (golden / freeze / frenzy fruit, combos, bombs) |
| Sky Flap | Hand height steers the bird through the pipes |
| Bubble Burst | Pop bubbles with any fingertip, both hands; gold = mega burst |
| Face Chomp | Move your head, open your mouth to eat food, avoid bombs |
| Lean Rush | Lean your head to steer a neon highway |
| Rock Paper Scissors | Show fist / flat hand / two fingers on SHOOT |

## Run on the demo laptop (Windows)

1. Install Node.js 20+ (https://nodejs.org).
2. In this folder: `npm install` then `npm start`
3. Open http://localhost:4173 in Chrome, click **Start with camera**, press **F** for fullscreen.

Everything (MediaPipe models + wasm) is bundled, so it works offline. No camera? Use "Play with mouse".

Tips: good front light, camera at face height, stand ~1m back. Esc = menu, F = fullscreen, M = mute.

## Stack
Vanilla JS + Canvas 2D, Vite, MediaPipe Tasks Vision (hand + face landmarker, GPU with CPU fallback), WebAudio synth sound (no audio files).

## Credits
Fruit Slash mechanics (combo multiplier, golden/frozen/frenzy fruit, difficulty ramp) adapted from
[handsomeZR-netizen/webcam-fruit-ninja](https://github.com/handsomeZR-netizen/webcam-fruit-ninja) (MIT). Hand/face models by Google MediaPipe (Apache-2.0).
