#!/usr/bin/env python3
# Packs curated Kenney (CC0) sprites into base64 JS modules: python3 tools/pack.py <kenney-2d-dir>
import base64, os, sys, json
R = sys.argv[1] if len(sys.argv) > 1 else '/tmp/ka/2d'
M = json.load(open(os.path.join(os.path.dirname(__file__), 'assets.json')))
out = os.path.join(os.path.dirname(__file__), '..', 'src', 'assets')
for game, files in M.items():
    lines = ['// Kenney.nl CC0 sprites, bundled for offline play. See CREDITS.md', 'export default {']
    for name, rel in files.items():
        b = base64.b64encode(open(os.path.join(R, rel), 'rb').read()).decode()
        lines.append(f"  {name}: 'data:image/png;base64,{b}',")
    lines.append('};')
    open(os.path.join(out, game + '.js'), 'w').write('\n'.join(lines) + '\n')
    print(game, len(files))
