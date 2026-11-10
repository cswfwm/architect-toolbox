#!/usr/bin/env python3
"""从 ItemNames.js 生成拼音检索表（首字母缩写 + 全拼）。

用法：python3 tools/gen_pinyin.py
需要 pypinyin（仅构建时需要，运行时不依赖）。
输出：content/Common/Data/PinyinIndex.js
"""
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'content/Common/Data/ItemNames.js')
OUT = os.path.join(ROOT, 'content/Common/Data/PinyinIndex.js')


def load_names():
    text = open(SRC, encoding='utf-8').read()
    body = text.split('export const ItemNamesZh =', 1)[1]
    body = body.split('};', 1)[0]
    pairs = re.findall(r'(\w+):\s*[\'"]([^\'"]+)[\'"]', body)
    return dict(pairs)


def main():
    try:
        from pypinyin import lazy_pinyin, Style
    except ImportError:
        sys.exit('缺少 pypinyin：pip install pypinyin')

    names = load_names()
    index = {}
    for key, name in names.items():
        full = lazy_pinyin(name)
        initials = lazy_pinyin(name, style=Style.FIRST_LETTER)
        index[key] = {
            'zh': name,
            'py': ''.join(full),
            'abbr': ''.join(initials),
        }

    lines = ["// 由 tools/gen_pinyin.py 生成，请勿手改。", 'export const PinyinIndex = {']
    for key in sorted(index):
        entry = index[key]
        lines.append(f"    {key}: {{ zh: '{entry['zh']}', py: '{entry['py']}', abbr: '{entry['abbr']}' }},")
    lines.append('};')
    lines.append('')
    open(OUT, 'w', encoding='utf-8').write('\n'.join(lines))
    print(f'{len(index)} 条 -> {os.path.relpath(OUT, ROOT)}')


if __name__ == '__main__':
    main()
