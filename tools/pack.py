#!/usr/bin/env python3
"""把模组目录打成 dist/architecttoolbox-<version>.bmod（zip，内容在根）。"""
import json
import os
import zipfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
manifest = json.load(open(os.path.join(ROOT, 'manifest.json'), encoding='utf-8'))
out_dir = os.path.join(ROOT, 'dist')
os.makedirs(out_dir, exist_ok=True)
out = os.path.join(out_dir, f"architecttoolbox-{manifest['version']}.bmod")

with zipfile.ZipFile(out, 'w', zipfile.ZIP_DEFLATED) as pack:
    for name in ('manifest.json', 'description.md', 'changelog.md', 'icon.png', 'banner.png'):
        path = os.path.join(ROOT, name)
        if os.path.exists(path):
            pack.write(path, name)
    for dirpath, _, files in os.walk(os.path.join(ROOT, 'content')):
        for file in files:
            full = os.path.join(dirpath, file)
            pack.write(full, os.path.relpath(full, ROOT))

print(f'{os.path.relpath(out, ROOT)}  {os.path.getsize(out) / 1024:.1f} KB')
