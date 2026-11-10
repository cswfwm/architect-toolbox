#!/usr/bin/env python3
"""生成建筑师工具箱的物品贴图（26x26 像素画）。"""
import os
from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'content/Content/Items/Accessories')
ROOT_OUT = ROOT

DARK = (28, 32, 44, 255)
STEEL = (168, 178, 192, 255)
STEEL_D = (104, 114, 132, 255)
BLUE = (96, 168, 240, 255)
BLUE_D = (44, 92, 160, 255)
GOLD = (238, 198, 96, 255)
GOLD_D = (166, 124, 44, 255)
WOOD = (150, 108, 64, 255)
WOOD_D = (98, 68, 40, 255)
GLASS = (176, 232, 250, 200)
GLASS_D = (108, 176, 214, 220)
RED = (222, 86, 78, 255)
WHITE = (245, 248, 252, 255)


def new(size=26):
    return Image.new('RGBA', (size, size), (0, 0, 0, 0))


def outline(img, color=DARK):
    w, h = img.size
    src = img.load()
    out = img.copy()
    dst = out.load()
    for y in range(h):
        for x in range(w):
            if src[x, y][3] != 0:
                continue
            for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                nx, ny = x + dx, y + dy
                if 0 <= nx < w and 0 <= ny < h and src[nx, ny][3] > 128:
                    dst[x, y] = color
                    break
    return out


def save(img, name):
    path = os.path.join(OUT, name + '.png')
    os.makedirs(os.path.dirname(path), exist_ok=True)
    img.save(path)
    print('wrote', os.path.relpath(path, ROOT), img.size)


def architect_tool():
    img = new()
    d = ImageDraw.Draw(img)
    # 尺身
    d.rectangle([5, 15, 22, 19], fill=WOOD)
    d.rectangle([5, 15, 22, 15], fill=(186, 142, 90, 255))
    for x in range(7, 22, 3):
        d.rectangle([x, 16, x, 18], fill=WHITE)
    # 直角尺头
    d.rectangle([5, 5, 8, 19], fill=STEEL)
    d.rectangle([8, 5, 16, 8], fill=STEEL)
    d.rectangle([9, 6, 15, 7], fill=BLUE)
    # 铅笔尖
    d.polygon([(18, 20), (23, 25), (20, 26)], fill=GOLD)
    d.polygon([(22, 24), (23, 25), (22, 26)], fill=DARK)
    return outline(img)


def suite(pre_hardmode=True):
    img = new()
    d = ImageDraw.Draw(img)
    # 工具台面
    d.rectangle([3, 12, 22, 15], fill=WOOD_D)
    d.rectangle([3, 8, 22, 12], fill=WOOD)
    d.rectangle([3, 8, 22, 9], fill=(186, 142, 90, 255))
    # 腿上小格
    d.rectangle([5, 15, 7, 22], fill=STEEL_D)
    d.rectangle([18, 15, 20, 22], fill=STEEL_D)
    # 台上：铁砧 + 熔炉口
    d.rectangle([6, 4, 13, 7], fill=STEEL)
    d.polygon([(13, 4), (16, 5), (13, 8)], fill=STEEL)
    d.rectangle([9, 3, 11, 4], fill=STEEL_D)
    if pre_hardmode:
        d.rectangle([16, 4, 21, 8], fill=BLUE_D)
        d.rectangle([17, 5, 20, 7], fill=GOLD)
    else:
        d.rectangle([16, 3, 21, 8], fill=(120, 220, 156, 255))
        d.rectangle([17, 4, 20, 7], fill=(60, 150, 96, 255))
        d.point((17, 4), fill=WHITE)
    return outline(img)


def glasses():
    img = new()
    d = ImageDraw.Draw(img)
    # 镜框
    d.rectangle([3, 10, 12, 17], fill=STEEL)
    d.rectangle([14, 10, 23, 17], fill=STEEL)
    d.rectangle([12, 12, 14, 14], fill=STEEL_D)
    d.rectangle([3, 7, 5, 10], fill=STEEL_D)
    d.rectangle([21, 7, 23, 10], fill=STEEL_D)
    # 镜片
    d.rectangle([5, 12, 11, 16], fill=GLASS)
    d.rectangle([16, 12, 22, 16], fill=GLASS)
    # 红色准星
    d.line([(8, 12), (8, 16)], fill=RED)
    d.line([(5, 14), (11, 14)], fill=RED)
    d.line([(19, 12), (19, 16)], fill=RED)
    d.line([(16, 14), (22, 14)], fill=RED)
    return outline(img)


def scanner():
    img = new()
    d = ImageDraw.Draw(img)
    # 机身
    d.rectangle([4, 9, 21, 21], fill=STEEL_D)
    d.rectangle([4, 9, 21, 11], fill=STEEL)
    # 屏幕
    d.rectangle([6, 12, 19, 18], fill=(34, 96, 120, 255))
    d.line([(7, 17), (10, 14), (13, 16), (16, 13), (18, 15)], fill=(120, 240, 220, 255))
    # 天线与扫描波
    d.line([(20, 9), (23, 3)], fill=STEEL)
    d.ellipse([21, 1, 24, 4], outline=BLUE)
    # 按钮
    d.rectangle([6, 19, 8, 20], fill=RED)
    d.rectangle([10, 19, 12, 20], fill=GOLD)
    return outline(img)


def blueprint_wand():
    img = new()
    d = ImageDraw.Draw(img)
    # 杖身
    d.line([(5, 21), (19, 7)], fill=WOOD, width=3)
    d.line([(6, 21), (18, 9)], fill=(186, 142, 90, 255), width=1)
    # 顶端菱形蓝图纸
    d.polygon([(19, 2), (24, 7), (19, 12), (14, 7)], fill=BLUE_D)
    d.polygon([(19, 4), (22, 7), (19, 10), (16, 7)], fill=BLUE)
    d.line([(16, 7), (22, 7)], fill=WHITE)
    d.line([(19, 4), (19, 10)], fill=WHITE)
    # 杖尾宝石
    d.rectangle([3, 20, 7, 24], fill=GOLD)
    d.point((5, 22), fill=WHITE)
    return outline(img)


def scale_icon(img, size):
    return img.resize((size, size), Image.NEAREST)


def package_icon():
    art = scale_icon(architect_tool(), 208)
    canvas = Image.new('RGBA', (256, 256), (24, 44, 78, 255))
    d = ImageDraw.Draw(canvas)
    # 背景网格，呼应建筑师模式
    for i in range(0, 256, 16):
        d.line([(i, 0), (i, 255)], fill=(40, 70, 116, 255))
        d.line([(0, i), (255, i)], fill=(40, 70, 116, 255))
    d.rectangle([0, 0, 255, 255], outline=(96, 168, 240, 255), width=4)
    canvas.alpha_composite(art, (24, 24))
    return canvas


def banner():
    img = Image.new('RGBA', (384, 112), (20, 34, 60, 255))
    d = ImageDraw.Draw(img)
    for i in range(0, 384, 16):
        d.line([(i, 0), (i, 111)], fill=(34, 58, 96, 255))
    for i in range(0, 112, 16):
        d.line([(0, i), (383, i)], fill=(34, 58, 96, 255))
    icons = [architect_tool(), suite(True), suite(False), glasses(), scanner(), blueprint_wand()]
    for index, art in enumerate(icons):
        img.alpha_composite(scale_icon(art, 52), (16 + index * 60, 30))
    d.rectangle([0, 0, 383, 111], outline=(96, 168, 240, 255), width=3)
    return img


def main():
    package_icon().save(os.path.join(ROOT_OUT, 'icon.png'))
    banner().save(os.path.join(ROOT_OUT, 'banner.png'))
    print('wrote icon.png banner.png')
    save(architect_tool(), 'ArchitectTool')
    save(suite(True), 'ArchitectSuite')
    save(suite(False), 'ArchitectSuite2')
    save(glasses(), 'EngineerGlasses')
    save(scanner(), 'EngineerScanner')
    save(blueprint_wand(), 'ArchitectWand')


if __name__ == '__main__':
    main()
