#!/usr/bin/env python3
"""静态检查：贴图、类引用、未定义全局、局部化键、导入路径。"""
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CONTENT = os.path.join(ROOT, 'content')

errors = []
warnings = []

# ---- 收集导出类与文件 ----
exports = {}
sources = {}
for dirpath, _, files in os.walk(CONTENT):
    for name in files:
        if not name.endswith('.js'):
            continue
        path = os.path.join(dirpath, name)
        src = open(path, encoding='utf-8').read()
        sources[path] = src
        for match in re.finditer(r'export\s+(?:default\s+)?class\s+(\w+)', src):
            exports[match.group(1)] = path

# ---- 1. 内容类必须有同名贴图（ModItem/ModNPC/ModBuff/ModTile 等） ----
CONTENT_BASES = ('ModItem', 'ModNPC', 'ModProjectile', 'ModTile', 'ModWall', 'ModBuff', 'ModMount')
for name, path in exports.items():
    src = sources[path]
    base = re.search(r'class\s+' + name + r'\s+extends\s+(\w+)', src)
    if base is None:
        continue
    parent = base.group(1)
    # 只有直接继承内容基类才按默认贴图规则检查；中间基类（ToolboxAccessory）不检查。
    if parent not in CONTENT_BASES:
        continue
    if 'static Autoload = false' in src:
        continue
    texture = os.path.join(os.path.dirname(path), name + '.png')
    if not os.path.exists(texture):
        errors.append(f'{os.path.relpath(path, ROOT)}: {name} 缺少默认贴图 {name}.png')

# ---- 2. ModContent.XType('Name') 的引用必须存在 ----
for path, src in sources.items():
    for match in re.finditer(r"(?:ItemType|TileType|NPCType|BuffType|ProjectileType)\(\s*'(\w+)'\s*\)", src):
        if match.group(1) not in exports:
            errors.append(f'{os.path.relpath(path, ROOT)}: 引用了不存在的类 {match.group(1)}')

# ---- 3. import 路径存在 ----
for path, src in sources.items():
    for match in re.finditer(r"from\s+'(\.[^']+)'", src):
        target = os.path.normpath(os.path.join(os.path.dirname(path), match.group(1)))
        if not os.path.exists(target):
            errors.append(f'{os.path.relpath(path, ROOT)}: import 路径不存在 {match.group(1)}')

# ---- 4. 局部化 ----
loc_dir = os.path.join(CONTENT, 'Localization')
if os.path.isdir(loc_dir):
    zh = json.load(open(os.path.join(loc_dir, 'zh-Hans.json'), encoding='utf-8'))
    en = json.load(open(os.path.join(loc_dir, 'en-US.json'), encoding='utf-8'))
    for section in zh:
        if section not in en:
            errors.append(f'Localization: 英文缺少分区 {section}')
            continue
        if set(zh[section]) != set(en[section]):
            errors.append(f'Localization: {section} 的中英条目不一致')
else:
    warnings.append('没有 Localization 目录，界面文本直接用中文字面量')

# ---- 5. manifest 与 main.js ----
manifest_path = os.path.join(ROOT, 'manifest.json')
if not os.path.exists(manifest_path):
    errors.append('缺少 manifest.json')
else:
    manifest = json.load(open(manifest_path, encoding='utf-8'))
    entry = os.path.join(CONTENT, manifest.get('entry', 'main.js'))
    if not os.path.exists(entry):
        errors.append(f"manifest.entry 指向的 {manifest.get('entry')} 不存在")
    for field in ('uid', 'id', 'name', 'version', 'summary', 'license', 'blVersion'):
        if not manifest.get(field):
            errors.append(f'manifest.json 缺少字段 {field}')
    if 'links' not in manifest:
        errors.append('manifest.json 缺少 links（没有可写 []）')
    if not os.path.exists(os.path.join(ROOT, 'icon.png')):
        errors.append('缺少 icon.png（启动器列表图标）')

# ---- 6. 常见笔误：this.Chat( / ModPlayer.getByName 暴露玩家而不是数据 ----
for path, src in sources.items():
    for lineno, line in enumerate(src.splitlines(), 1):
        if re.search(r'this\.Chat\(', line):
            errors.append(f'{os.path.relpath(path, ROOT)}:{lineno}: 没有 this.Chat 方法')
        if 'ModPlayer.getByName' in line:
            warnings.append(f'{os.path.relpath(path, ROOT)}:{lineno}: getByName 返回玩家实例，数据应取 GetModPlayer(Class)')

print(f'导出类 {len(exports)} 个，文件 {len(sources)} 个')
for warning in warnings:
    print('WARN', warning)
for error in errors:
    print('ERROR', error)
print(f'{len(errors)} 个错误，{len(warnings)} 个警告')
sys.exit(1 if errors else 0)
