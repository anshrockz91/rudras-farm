"""Renders Kenney CC0 3D models into isometric sprites for the game (art/iso/*.png + art/iso/meta.json).

Needs: the Kenney kits extracted into <models>/<kit>/ (glb + Textures/), a local static server
serving <root> (which contains models/ and the iso_render/render.html page), and Playwright + Chrome.
Usage: python tools/iso-sprites.py <server-base-url> <out-dir>
Every sprite is drawn at the same pixels-per-unit, so a 1x1 ground tile is always TILE_PX wide.
"""
import sys, os, json, base64, io
from playwright.sync_api import sync_playwright
from PIL import Image

BASE, OUT = sys.argv[1].rstrip('/'), sys.argv[2]
ONLY = sys.argv[3].split(',') if len(sys.argv) > 3 else None   # e.g. "pets,zoo" (prefixes p_, z_ ...); omit = farm
M = BASE + '/kenney_dl/models/'
PPU = 181  # => a 1x1 tile is 256 px wide in the PNG (shown at half size = 128 px on the map)
os.makedirs(OUT, exist_ok=True)

def m(kit, name, p=(0, 0, 0), r=0, **k):
    d = {'u': M + kit + '/' + name + '.glb', 'p': list(p), 'r': r}
    d.update(k)
    return d

def box(size, p, color, **k):
    d = {'box': list(size), 'p': list(p), 'color': color}
    d.update(k)
    return d

def cyl(rt, rb, h, p, color, seg=16, **k):
    d = {'cyl': [rt, rb, h, seg], 'p': list(p), 'color': color}
    d.update(k)
    return d

def cone(r, h, p, color, seg=16, **k):
    d = {'cone': [r, h, seg], 'p': list(p), 'color': color}
    d.update(k)
    return d

import math
def ferris(angle):
    """Ferris wheel; `angle` turns the wheel while the gondolas hang upright."""
    R, cy = 1.3, 1.55
    parts = [box((0.12, 3.2, 0.12), (0, 1.35, -0.5), '#8a5cf6', rx=-18), box((0.12, 3.2, 0.12), (0, 1.35, 0.5), '#8a5cf6', rx=18),
             box((0.12, 3.2, 0.12), (0.2, 1.35, -0.5), '#8a5cf6', rx=-18), box((0.12, 3.2, 0.12), (0.2, 1.35, 0.5), '#8a5cf6', rx=18),
             box((0.6, 0.12, 1.6), (0.1, 0.06, 0), '#6b46c1'), {'torus': [R, 0.06, 8, 40], 'p': [0.1, cy, 0], 'r': 90, 'color': '#ff5a5a'},
             cyl(0.12, 0.12, 0.5, (0.1, cy, 0), '#3b2a1a', rz=90)]
    cols = ['#ff5a5a', '#3d8bff', '#ffd84d', '#4cd964', '#ff7eb6', '#a259ff', '#ff9a3c', '#14b8a6']
    for i in range(8):
        a = math.radians(angle + i * 45)
        parts.append(box((0.05, R * 2, 0.05), (0.1, cy, 0), '#ffe27a', rx=math.degrees(a)))
        y, z = cy + R * math.sin(a), R * math.cos(a)
        parts += [box((0.34, 0.26, 0.3), (0.1, y - 0.2, z), cols[i]), box((0.38, 0.06, 0.34), (0.1, y - 0.05, z), '#ffffff')]
    return parts

def bigtop():
    """Circus big-top: striped walls, a red cone roof and a flag."""
    parts = [cyl(1.0, 1.0, 0.7, (0, 0.35, 0), '#ffffff', seg=12)]
    for i in range(6):
        a = math.radians(i * 60 + 15)
        parts.append(box((0.32, 0.7, 0.04), (math.cos(a) * 0.98, 0.35, math.sin(a) * 0.98), '#ff4d4d', r=-math.degrees(a) + 90))
    parts += [cone(1.2, 1.2, (0, 1.3, 0), '#ff4d4d', seg=12), cone(0.5, 0.5, (0, 1.65, 0), '#ffffff', seg=12),
              cyl(0.03, 0.03, 0.5, (0, 2.1, 0), '#6b5636'), box((0.3, 0.18, 0.02), (0.15, 2.25, 0), '#ffd84d'),
              box((0.4, 0.5, 0.05), (0.35, 0.25, 0.9), '#3b2a1a', r=20)]
    return parts

def coaster(t):
    """Steel coaster with a loop; `t` (0..1) slides the train along the straight."""
    M2 = M + 'coaster/'
    return [{'u': M2 + 'coaster-steel-straight.glb', 'p': [0, 0, 0]}, {'u': M2 + 'coaster-steel-straight.glb', 'p': [0, 0, 1]},
            {'u': M2 + 'coaster-steel-looping.glb', 'p': [0, 0, 2]}, {'u': M2 + 'coaster-steel-straight.glb', 'p': [0, 0, 3]},
            {'u': M2 + 'support-large.glb', 'p': [0, 0, 0]}, {'u': M2 + 'coaster-train-front.glb', 'p': [0, 0, -0.4 + t * 2.0]}]

# cube-style animals Kenney doesn't have, built from blocks to match Cube Pets
def sheep():
    W, G, D = '#f4f1ea', '#5d5a66', '#2c2a33'
    return [box((0.9, 0.75, 1.1), (0, 0.62, 0), W), box((0.5, 0.5, 0.42), (0, 0.85, 0.7), G),
            box((0.1, 0.1, 0.05), (-0.13, 0.95, 0.92), D), box((0.1, 0.1, 0.05), (0.13, 0.95, 0.92), D),
            box((0.22, 0.12, 0.1), (-0.3, 1.0, 0.62), G), box((0.22, 0.12, 0.1), (0.3, 1.0, 0.62), G)] + \
           [box((0.18, 0.3, 0.18), (x, 0.15, z), G) for x in (-0.28, 0.28) for z in (-0.36, 0.36)]

def horse():
    B, Mn, D, Hf = '#a8693d', '#4a2c1a', '#1f1612', '#3b2a20'
    return [box((0.7, 0.62, 1.3), (0, 0.85, 0), B), box((0.36, 0.6, 0.36), (0, 1.3, 0.62), B), box((0.36, 0.34, 0.55), (0, 1.58, 0.86), B),
            box((0.12, 0.62, 0.3), (0, 1.42, 0.5), Mn), box((0.08, 0.08, 0.04), (-0.12, 1.66, 1.13), D), box((0.08, 0.08, 0.04), (0.12, 1.66, 1.13), D),
            box((0.12, 0.6, 0.12), (0, 0.85, -0.7), Mn)] + \
           [box((0.18, 0.55, 0.18), (x, 0.27, z), Hf) for x in (-0.22, 0.22) for z in (-0.48, 0.48)]

def hamster():
    F, W, P, D = '#e3a85e', '#fbf3e4', '#f4a5b5', '#2c2a33'
    return [box((0.75, 0.55, 0.8), (0, 0.33, 0), F), box((0.5, 0.35, 0.1), (0, 0.3, 0.41), W), box((0.18, 0.18, 0.1), (-0.25, 0.68, 0.15), F), box((0.18, 0.18, 0.1), (0.25, 0.68, 0.15), F),
            box((0.08, 0.08, 0.04), (-0.14, 0.48, 0.42), D), box((0.08, 0.08, 0.04), (0.14, 0.48, 0.42), D), box((0.1, 0.06, 0.04), (-0.27, 0.38, 0.42), P), box((0.1, 0.06, 0.04), (0.27, 0.38, 0.42), P),
            box((0.06, 0.05, 0.04), (0, 0.42, 0.44), P)]

def turtle():
    S1, S2, K, D = '#3f8f3a', '#2f6d2b', '#9bd06a', '#1f2a1a'
    legs = [box((0.22, 0.22, 0.26), (x, 0.11, z), K) for x in (-0.38, 0.38) for z in (-0.36, 0.36)]
    return [box((0.95, 0.38, 1.05), (0, 0.38, 0), S1), box((0.7, 0.16, 0.8), (0, 0.62, 0), S2), box((0.36, 0.3, 0.38), (0, 0.38, 0.66), K),
            box((0.07, 0.07, 0.04), (-0.1, 0.45, 0.86), D), box((0.07, 0.07, 0.04), (0.1, 0.45, 0.86), D), box((0.14, 0.12, 0.2), (0, 0.22, -0.6), K)] + legs

def croc():
    G, L, W, D = '#4f8a3a', '#79b357', '#ffffff', '#1f2a1a'
    legs = [box((0.16, 0.16, 0.2), (x, 0.08, z), G) for x in (-0.36, 0.36) for z in (-0.4, 0.4)]
    return [box((0.62, 0.34, 1.3), (0, 0.32, 0), G), box((0.46, 0.26, 0.7), (0, 0.3, 0.95), G), box((0.44, 0.06, 0.6), (0, 0.18, 0.95), L),
            box((0.14, 0.12, 0.12), (-0.15, 0.5, 0.7), W), box((0.14, 0.12, 0.12), (0.15, 0.5, 0.7), W), box((0.06, 0.07, 0.04), (-0.15, 0.51, 0.77), D), box((0.06, 0.07, 0.04), (0.15, 0.51, 0.77), D),
            box((0.36, 0.24, 0.6), (0, 0.27, -0.9), G), box((0.22, 0.16, 0.45), (0, 0.22, -1.38), G), box((0.06, 0.06, 0.6), (0, 0.52, -0.2), L)] + legs

def kangaroo():
    B, L, D, I = '#c88a4c', '#e8c08f', '#2c2a33', '#e79aa0'
    return [box((0.58, 0.85, 0.6), (0, 0.72, 0), B), box((0.36, 0.45, 0.12), (0, 0.6, 0.31), L), box((0.4, 0.38, 0.48), (0, 1.32, 0.12), B),
            box((0.24, 0.16, 0.2), (0, 1.24, 0.42), L), box((0.07, 0.07, 0.04), (-0.1, 1.4, 0.37), D), box((0.07, 0.07, 0.04), (0.1, 1.4, 0.37), D),
            box((0.1, 0.36, 0.1), (-0.14, 1.66, 0.02), B), box((0.1, 0.36, 0.1), (0.14, 1.66, 0.02), B), box((0.05, 0.22, 0.04), (-0.14, 1.66, 0.06), I), box((0.05, 0.22, 0.04), (0.14, 1.66, 0.06), I),
            box((0.12, 0.3, 0.12), (-0.22, 0.95, 0.3), B), box((0.12, 0.3, 0.12), (0.22, 0.95, 0.3), B),
            box((0.24, 0.14, 0.55), (-0.17, 0.07, 0.15), B), box((0.24, 0.14, 0.55), (0.17, 0.07, 0.15), B), box((0.2, 0.2, 0.75), (0, 0.32, -0.6), B)]

def sphere(rad, p, color, **k):
    d = {'sphere': [rad, 16, 12], 'p': list(p), 'color': color}
    d.update(k)
    return d

def robot():
    G, Dk, B, R = '#b9c3d1', '#6b7686', '#3dc9ff', '#ff5a5a'
    return [box((0.62, 0.6, 0.5), (0, 0.62, 0), G), box((0.5, 0.42, 0.44), (0, 1.15, 0), G), box((0.36, 0.12, 0.04), (0, 1.18, 0.23), Dk),
            box((0.1, 0.07, 0.03), (-0.09, 1.18, 0.25), B), box((0.1, 0.07, 0.03), (0.09, 1.18, 0.25), B), cyl(0.02, 0.02, 0.25, (0, 1.47, 0), Dk), sphere(0.06, (0, 1.6, 0), R),
            box((0.14, 0.42, 0.14), (-0.4, 0.62, 0), Dk), box((0.14, 0.42, 0.14), (0.4, 0.62, 0), Dk), box((0.18, 0.32, 0.18), (-0.16, 0.16, 0), Dk), box((0.18, 0.32, 0.18), (0.16, 0.16, 0), Dk),
            box((0.26, 0.18, 0.03), (0, 0.66, 0.26), B)]

def unicorn():
    parts = horse()
    parts = [dict(q, color='#f7f4ff') if q.get('color') == '#a8693d' else q for q in parts]
    parts = [dict(q, color='#fbe6ff') if q.get('color') == '#3b2a20' else q for q in parts]
    mane = ['#ff5a5a', '#ffb000', '#ffe14d', '#4cd964', '#3d8bff', '#a259ff']
    out = [q for q in parts if q.get('color') != '#4a2c1a']
    for i, c in enumerate(mane):
        out.append(box((0.13, 0.12, 0.3), (0, 1.75 - i * 0.12, 0.6 - i * 0.04), c))
        out.append(box((0.12, 0.1, 0.12), (0, 0.95 - i * 0.09, -0.72 - i * 0.02), c))
    out.append(cone(0.06, 0.32, (0, 1.95, 1.0), '#ffd84d', rx=35))
    return out

def trex():
    G, L, D, W = '#4caf50', '#8bd36f', '#1f2a1a', '#ffffff'
    return [box((0.66, 0.7, 0.9), (0, 0.85, 0), G), box((0.5, 0.45, 0.4), (0, 0.9, 0.3), L), box((0.55, 0.5, 0.75), (0, 1.45, 0.45), G),
            box((0.5, 0.12, 0.5), (0, 1.22, 0.62), L), box((0.07, 0.08, 0.04), (-0.18, 1.6, 0.83), D), box((0.07, 0.08, 0.04), (0.18, 1.6, 0.83), D),
            *[box((0.05, 0.06, 0.03), (x, 1.3, 0.83), W) for x in (-0.15, -0.05, 0.05, 0.15)],
            box((0.1, 0.25, 0.1), (-0.3, 0.95, 0.4), G, rx=40), box((0.1, 0.25, 0.1), (0.3, 0.95, 0.4), G, rx=40),
            box((0.24, 0.5, 0.3), (-0.2, 0.25, 0), G), box((0.24, 0.5, 0.3), (0.2, 0.25, 0), G), box((0.3, 0.1, 0.4), (-0.2, 0.05, 0.08), L), box((0.3, 0.1, 0.4), (0.2, 0.05, 0.08), L),
            box((0.36, 0.34, 0.6), (0, 0.85, -0.6), G), box((0.22, 0.22, 0.5), (0, 0.78, -1.05), G)]

def dragon():
    P, L, Y, D, R = '#8a5cf6', '#c4a6ff', '#ffd84d', '#1f1a33', '#ff5a5a'
    return [box((0.62, 0.55, 1.0), (0, 0.6, 0), P), box((0.4, 0.3, 0.6), (0, 0.55, 0.2), L), box((0.3, 0.45, 0.3), (0, 1.0, 0.45), P),
            box((0.42, 0.36, 0.55), (0, 1.3, 0.62), P), box((0.3, 0.14, 0.3), (0, 1.2, 0.9), L), box((0.07, 0.08, 0.04), (-0.13, 1.4, 0.9), D), box((0.07, 0.08, 0.04), (0.13, 1.4, 0.9), D),
            cone(0.05, 0.22, (-0.12, 1.58, 0.52), Y), cone(0.05, 0.22, (0.12, 1.58, 0.52), Y),
            box((0.9, 0.05, 0.55), (-0.62, 1.05, -0.05), L, rz=-25), box((0.9, 0.05, 0.55), (0.62, 1.05, -0.05), L, rz=25),
            box((0.18, 0.35, 0.22), (-0.2, 0.18, 0.3), P), box((0.18, 0.35, 0.22), (0.2, 0.18, 0.3), P), box((0.18, 0.35, 0.22), (-0.2, 0.18, -0.3), P), box((0.18, 0.35, 0.22), (0.2, 0.18, -0.3), P),
            box((0.24, 0.22, 0.55), (0, 0.55, -0.7), P), box((0.16, 0.16, 0.45), (0, 0.5, -1.15), P), cone(0.12, 0.2, (0, 0.5, -1.45), R, rx=-90),
            *[cone(0.06, 0.16, (0, 0.95, z), Y) for z in (-0.3, 0, 0.3)]]

def cheese_rock():
    return [{'u': M + 'space/craterLarge.glb', 'p': [0, 0, 0]}, box((0.45, 0.32, 0.36), (0, 0.18, 0), '#ffd23f', r=20),
            box((0.06, 0.06, 0.02), (0.05, 0.22, 0.19), '#e0a800', r=20), box((0.07, 0.07, 0.02), (-0.1, 0.12, 0.17), '#e0a800', r=20), box((0.28, 0.2, 0.22), (0.4, 0.1, -0.25), '#ffd23f', r=-30)]

def telescope():
    W, Dk, B = '#eef2f7', '#5b6474', '#3d8bff'
    return [cyl(0.42, 0.5, 0.3, (0, 0.15, 0), Dk), cyl(0.08, 0.1, 0.6, (0, 0.6, 0), Dk), cyl(0.16, 0.22, 1.4, (0, 1.2, 0.2), W, rx=-50),
            cyl(0.18, 0.18, 0.12, (0, 1.65, 0.62), B, rx=-50), box((0.6, 0.06, 0.06), (0, 0.95, 0), Dk)]

def planet():
    return [cyl(0.5, 0.6, 0.35, (0, 0.18, 0), '#6f5fa8'), cyl(0.06, 0.06, 0.5, (0, 0.6, 0), '#c9d1e0'),
            sphere(0.7, (0, 1.5, 0), '#ff9a3c'), sphere(0.71, (0, 1.5, 0), '#ffb86b', sv=[1, 0.35, 1]),
            {'torus': [1.05, 0.07, 6, 48], 'p': [0, 1.5, 0], 'rx': 75, 'color': '#ffe27a'}, sphere(0.14, (1.0, 2.2, 0.3), '#c9d1e0')]

def crane():
    Y, Dk, R = '#f5b400', '#5b5b5b', '#e2552e'
    parts = [box((1.1, 0.25, 1.1), (0, 0.12, 0), Dk)]
    for i in range(8):
        parts.append(box((0.32, 0.38, 0.32), (0, 0.45 + i * 0.38, 0), Y))
        parts.append(box((0.34, 0.03, 0.34), (0, 0.27 + i * 0.38, 0), Dk))
    parts += [box((3.0, 0.22, 0.25), (0.75, 3.45, 0), Y), box((0.5, 0.35, 0.4), (-0.55, 3.25, 0), Dk), box((0.4, 0.35, 0.35), (0.05, 3.7, 0), R),
              cyl(0.015, 0.015, 1.4, (1.9, 2.7, 0), Dk), box((0.35, 0.3, 0.35), (1.9, 1.9, 0), R)]
    return parts

def bridge():
    W, Dk, Rl = '#b07a45', '#7a5230', '#d9a066'
    parts = [box((2.2, 0.04, 0.9), (0, 0.02, 0), '#4aa3df'), box((2.2, 0.06, 0.25), (0, 0.03, 0.58), '#7cc35a'), box((2.2, 0.06, 0.25), (0, 0.03, -0.58), '#7cc35a')]
    for i in range(9):
        x = -0.8 + i * 0.2
        parts.append(box((0.17, 0.06, 1.6), (x, 0.32 + 0.12 * math.cos(x * 1.6), 0), W if i % 2 else Rl, rz=-math.degrees(math.atan(-0.19 * math.sin(x * 1.6)))))
    for z in (-0.78, 0.78):
        parts += [box((0.1, 0.5, 0.1), (x0, 0.45, z), Dk) for x0 in (-0.85, 0, 0.85)]
        parts.append(box((1.8, 0.06, 0.06), (0, 0.66, z), Dk))
    parts += [box((0.14, 0.4, 0.14), (x0, 0.18, z0), Dk) for x0 in (-0.5, 0.5) for z0 in (-0.6, 0.6)]
    return parts

def mine():
    G1, G2, Dk, Wd = '#8d8f99', '#a5a7b0', '#2a2522', '#8a5a2b'
    parts = [box((1.5, 0.7, 1.0), (0, 0.35, -0.2), G1, r=8), box((1.1, 0.45, 0.8), (0.2, 0.9, -0.3), G2, r=-12), box((0.6, 0.35, 0.5), (-0.4, 0.85, -0.1), G2, r=20),
             box((0.55, 0.55, 0.06), (0, 0.3, 0.31), Dk), box((0.08, 0.62, 0.08), (-0.3, 0.31, 0.34), Wd), box((0.08, 0.62, 0.08), (0.3, 0.31, 0.34), Wd), box((0.72, 0.09, 0.1), (0, 0.64, 0.34), Wd)]
    for x in (-0.12, 0.12):
        parts.append(box((0.04, 0.03, 1.1), (x, 0.02, 0.85), '#6b6b6b'))
    parts += [box((0.36, 0.04, 0.08), (0, 0.01, 0.4 + i * 0.22), Wd) for i in range(5)]
    parts += [box((0.34, 0.2, 0.4), (0, 0.16, 0.95), '#5b6474'), box((0.28, 0.08, 0.3), (0, 0.29, 0.95), '#ffcf3f'), box((0.1, 0.06, 0.1), (0.05, 0.34, 1.0), '#ffcf3f')]
    parts += [{'u': M + 'space/rock_crystals.glb', 'p': [0.6, 0, 0.35], 's': 0.5}]
    return parts

def bigrocket():
    W, R, Dk, B = '#f4f6fa', '#ff4d4d', '#4b5563', '#3d8bff'
    parts = [box((1.4, 0.15, 1.4), (0, 0.07, 0), '#6b7280'), box((0.1, 2.3, 0.1), (-0.6, 1.2, -0.6), '#f59e0b'), box((0.5, 0.06, 0.06), (-0.37, 1.8, -0.6), '#f59e0b'),
             cyl(0.32, 0.32, 1.6, (0, 1.0, 0), W), cyl(0.33, 0.33, 0.12, (0, 1.2, 0), R), cone(0.32, 0.6, (0, 2.1, 0), R), cyl(0.2, 0.28, 0.2, (0, 0.17, 0), Dk),
             cyl(0.1, 0.1, 0.04, (0, 1.45, 0.31), B, rx=90)]
    for a in (0, 120, 240):
        rad = math.radians(a)
        parts.append(box((0.06, 0.45, 0.35), (math.sin(rad) * 0.38, 0.45, math.cos(rad) * 0.38), R, r=a))
    return parts

def camp():
    W, O, Dk = '#eef2f7', '#ff8a3d', '#5b6474'
    return [cyl(0.95, 1.0, 0.12, (0, 0.06, 0), Dk), sphere(0.85, (0, 0.12, 0), W, sv=[1, 0.75, 1]), box((0.4, 0.45, 0.4), (0, 0.3, 0.75), W),
            box((0.24, 0.32, 0.03), (0, 0.24, 0.96), O), cyl(0.86, 0.86, 0.1, (0, 0.35, 0), O), cyl(0.02, 0.02, 0.7, (0.5, 1.0, -0.3), Dk), box((0.3, 0.2, 0.02), (0.65, 1.25, -0.3), '#3d8bff')]

def lab():
    W, G, Dk = '#eef2f7', '#8fe3ff', '#5b6474'
    return [cyl(1.0, 1.05, 0.5, (0, 0.25, 0), W), cyl(1.01, 1.01, 0.08, (0, 0.48, 0), '#3d8bff'), sphere(0.85, (0, 0.5, 0), G, sv=[1, 0.8, 1]),
            box((0.4, 0.42, 0.3), (0, 0.21, 0.95), Dk), cyl(0.04, 0.04, 0.6, (0.7, 1.0, 0.2), Dk), sphere(0.08, (0.7, 1.32, 0.2), '#ff5a5a')]

def dish(yaw):
    W, Dk = '#f4f6fa', '#6b7280'
    return [box((0.9, 0.15, 0.9), (0, 0.07, 0), Dk), cyl(0.12, 0.2, 0.9, (0, 0.6, 0), '#cbd5e1'), box((0.3, 0.25, 0.3), (0, 1.1, 0), Dk, r=yaw),
            sphere(0.75, (0, 1.4, 0), W, sv=[1, 0.28, 1], r=yaw, rx=-40), cyl(0.025, 0.025, 1.1, (0, 1.4, 0), Dk, r=yaw, rx=-40), sphere(0.07, (0, 1.4, 0), '#ff5a5a', r=yaw, rx=-40, sv=[1, 8.5, 1])]

def habitat(kind, acc):
    W, Dk = '#eef2f7', '#5b6474'
    if kind == 'dome':
        return [cyl(0.8, 0.85, 0.1, (0, 0.05, 0), Dk), sphere(0.72, (0, 0.1, 0), W, sv=[1, 0.8, 1]), cyl(0.73, 0.73, 0.1, (0, 0.3, 0), acc),
                box((0.32, 0.36, 0.3), (0, 0.22, 0.66), W), box((0.2, 0.26, 0.03), (0, 0.2, 0.82), acc)]
    if kind == 'tower':
        return [cyl(0.5, 0.55, 0.12, (0, 0.06, 0), Dk), cyl(0.42, 0.42, 1.3, (0, 0.75, 0), W), cyl(0.43, 0.43, 0.1, (0, 0.6, 0), acc), cyl(0.43, 0.43, 0.1, (0, 1.1, 0), acc),
                sphere(0.42, (0, 1.4, 0), '#8fe3ff', sv=[1, 0.6, 1]), box((0.18, 0.12, 0.03), (0, 0.85, 0.42), '#8fe3ff')]
    # twin pods joined by a tube
    return [box((1.6, 0.1, 0.8), (0, 0.05, 0), Dk), cyl(0.36, 0.36, 0.55, (-0.5, 0.35, 0), W), cyl(0.36, 0.36, 0.55, (0.5, 0.35, 0), W),
            sphere(0.36, (-0.5, 0.62, 0), acc, sv=[1, 0.5, 1]), sphere(0.36, (0.5, 0.62, 0), acc, sv=[1, 0.5, 1]), cyl(0.12, 0.12, 0.6, (0, 0.35, 0), '#cbd5e1', rz=90)]

def mall():
    W, P, Dk = '#eef2f7', '#ff7eb6', '#5b6474'
    return [box((2.2, 0.12, 1.4), (0, 0.06, 0), Dk), box((2.0, 0.7, 1.2), (0, 0.45, 0), W), box((2.02, 0.12, 1.22), (0, 0.75, 0), P),
            sphere(0.5, (-0.5, 0.8, 0), '#8fe3ff', sv=[1, 0.7, 1]), sphere(0.5, (0.5, 0.8, 0), '#8fe3ff', sv=[1, 0.7, 1]), box((1.2, 0.3, 0.04), (0, 0.4, 0.61), '#8fe3ff'),
            box((0.9, 0.22, 0.05), (0, 1.0, 0.62), P), box((0.4, 0.5, 0.04), (0, 0.3, 0.62), Dk)]

def moonrock():
    G1, G2, Y, Yd = '#b8bccb', '#9aa0b3', '#ffd23f', '#e0a800'
    return [box((1.1, 0.25, 0.9), (0, 0.12, 0), G1, r=10), box((0.7, 0.2, 0.6), (-0.15, 0.3, -0.1), G2, r=-15), box((0.3, 0.06, 0.3), (0.35, 0.26, 0.2), G2),
            box((0.6, 0.42, 0.5), (0.05, 0.6, 0.05), Y, r=25), box((0.1, 0.1, 0.03), (0.1, 0.65, 0.32), Yd, r=25), box((0.12, 0.12, 0.03), (-0.12, 0.5, 0.29), Yd, r=25),
            box((0.12, 0.1, 0.03), (0.22, 0.75, -0.1), Yd, r=115), box((0.32, 0.22, 0.26), (0.55, 0.36, 0.3), Y, r=-30)]

def windmill(bladeAngle):
    return [m('town', 'wall-block', (0, 0, 0)), m('town', 'wall-block', (0, 1, 0)), m('town', 'wall-wood-block', (0, 2, 0)),
            m('town', 'roof-point', (0, 3, 0)), m('town', 'windmill', (0.6, 2.5, 0), 90, rx=bladeAngle)]

# name: (parts, scale, yaw)
JOBS = {
    # farm buildings (one per building slot)
    'coop': ([m('town', 'wall-wood-block-half'), m('town', 'roof-high-point', (0, 0.5, 0))], 1.1, 0),
    'barn': ([m('town', 'wall-wood-block', (0, 0, 0)), m('town', 'wall-wood-block', (1, 0, 0)), m('town', 'roof-high-gable', (0, 1, 0), 90), m('town', 'roof-high-gable', (1, 1, 0), 90)], 0.85, 0),
    'farmhouse': ([m('sub', 'building-type-g')], 1.35, 0),
    'shop': ([m('town', 'stall-red')], 1.5, 0),
    'factory': ([m('ind', 'building-m')], 1.45, 0),
    'company': ([m('com', 'building-skyscraper-a')], 1.25, 0),
    # townspeople's shops (little houses on the shop street)
    **{f'house{i}': ([m('sub', 'building-type-' + c)], 1.05, 0) for i, c in enumerate('aceimnr')},
    # animals (two facings; the game mirrors them for the other two)
    **{a: ([m('pets', 'animal-' + a)], 0.42, 0) for a in ('chick', 'cow', 'pig', 'bee')},
    'sheep': (sheep(), 0.55, 0), 'horse': (horse(), 0.5, 0),
    # people
    'farmer': ([m('chars', 'character-male-a')], 0.95, 0), 'seller': ([m('chars', 'character-female-b')], 0.95, 0),
    'kid': ([m('chars', 'character-male-e')], 0.9, 0), 'shopper1': ([m('chars', 'character-female-d')], 0.9, 0), 'shopper2': ([m('chars', 'character-male-c')], 0.9, 0),
    # vehicles (driving along the road in both directions)
    **{f'{v}_{f}': ([m('cars', src)], 0.5, yaw) for v, src in (('pickup', 'truck'), ('delivery', 'delivery'), ('tractor', 'tractor'))
       for f, yaw in (('r', 90), ('l', -90))},
    # pens, plants and props
    'fence_x': ([m('nat', 'fence_simple')], 1.0, 0), 'fence_y': ([m('nat', 'fence_simple')], 1.0, 90),
    'stall_pen': ([m('town', 'stall-green')], 0.8, 0),
    'tree1': ([m('surv', 'tree')], 1.6, 0), 'tree2': ([m('surv', 'tree-tall')], 1.5, 0), 'tree3': ([m('surv', 'tree-autumn')], 1.5, 0),
    'bush': ([m('nat', 'plant_bushLarge', light=0.12)], 1.6, 0), 'rock': ([m('surv', 'rock-a')], 1.2, 0),
    'barrel': ([m('surv', 'barrel')], 1.4, 0), 'crates': ([m('surv', 'box-large'), m('surv', 'box', (0.35, 0, 0.3))], 1.1, 0),
    'logs': ([m('nat', 'log_stack')], 1.4, 0), 'pumpkins': ([m('nat', 'crop_pumpkin'), m('nat', 'crop_pumpkin', (0.4, 0, 0.2))], 1.2, 0),
    'corn': ([m('nat', 'crops_cornStageD', light=0.12)], 1.0, 0), 'wheat': ([m('nat', 'crops_wheatStageB', light=0.12)], 1.4, 0),
    'flowers': ([m('nat', 'flower_redA'), m('nat', 'flower_yellowB', (0.25, 0, 0.15)), m('nat', 'flower_purpleA', (-0.2, 0, 0.2))], 1.4, 0),
    'signpost': ([m('surv', 'signpost')], 1.2, 0), 'watertower': ([m('ind', 'water-tower')], 1.25, 0),
    'cart': ([m('town', 'cart')], 1.0, 0), 'lantern': ([m('town', 'lantern')], 1.0, 0),
    # ---- Puppy Town (p_) ----
    **{'p_' + a: ([m('pets', 'animal-' + a)], 0.42, 0) for a in ('dog', 'cat', 'bunny', 'parrot')},
    'p_hamster': (hamster(), 0.55, 0), 'p_turtle': (turtle(), 0.5, 0),
    'p_kennel': ([m('town', 'wall-wood-block-half'), m('town', 'roof-point', (0, 0.5, 0))], 1.1, 0),
    'p_vet': ([m('com', 'building-c'), box((0.42, 0.12, 0.12), (0, 0.98, 0), '#ffffff'), box((0.12, 0.12, 0.42), (0, 0.98, 0), '#ffffff'),
               box((0.3, 0.13, 0.08), (0, 0.99, 0), '#e53935'), box((0.08, 0.13, 0.3), (0, 0.99, 0), '#e53935')], 1.35, 0),
    'p_hotel': ([m('com', 'building-f')], 1.25, 0),
    'p_toys': ([m('com', 'building-a'), m('com', 'detail-awning', (0, 0, 0.47))], 1.35, 0),
    'p_mall': ([m('com', 'building-g')], 1.3, 0),
    'p_palace': ([*[x for (cx, cz) in ((0, 0), (2, 0), (0, 2), (2, 2)) for x in (m('castle', 'tower-square-base', (cx, 0, cz)), m('castle', 'tower-square-mid', (cx, 1, cz)), m('castle', 'tower-square-top-roof', (cx, 2, cz)))],
                  m('castle', 'wall', (1, 0, 0)), m('castle', 'wall', (1, 0, 2)), m('castle', 'wall', (0, 0, 1), 90), m('castle', 'wall', (2, 0, 1), 90),
                  m('castle', 'tower-square-base', (1, 0, 1)), m('castle', 'tower-square-mid-windows', (1, 1, 1)), m('castle', 'tower-square-mid-windows', (1, 2, 1)),
                  m('castle', 'tower-square-top-roof-high', (1, 3, 1)), m('castle', 'flag', (1, 4.2, 1))], 0.55, 0),
    **{f'p_house{i}': ([m('sub', 'building-type-' + c)], 1.05, 0) for i, c in enumerate('bdfhjkl')},
    **{f'p_{v}_{f}': ([m('cars', src)], 0.5, yaw) for v, src in (('van', 'van'), ('suv', 'suv'), ('delivery', 'delivery-flat'))
       for f, yaw in (('r', 90), ('l', -90))},
    'p_fountain': ([m('town', 'fountain-round-detail')], 1.1, 0), 'p_bench': ([m('town', 'stall-bench')], 1.0, 0),
    'p_hedge': ([m('town', 'hedge-large')], 1.0, 0), 'p_tree': ([m('surv', 'tree-autumn')], 1.4, 0),
    'p_vetvan': ([m('cars', 'ambulance')], 0.5, 90), 'p_kid': ([m('chars', 'character-female-a')], 0.9, 0), 'p_vetdoc': ([m('chars', 'character-female-e')], 0.95, 0),
    # ---- Safari Zoo (z_) ----
    **{'z_' + a: ([m('pets', 'animal-' + a)], 0.42, 0) for a in ('panda', 'tiger', 'lion', 'elephant')},
    'z_croc': (croc(), 0.5, 0), 'z_kangaroo': (kangaroo(), 0.5, 0),
    'z_tent': (bigtop(), 0.9, 0),
    **{f'z_wheel{i}': (ferris(i * 7.5), 0.75, 0) for i in range(6)},
    **{f'z_coaster{i}': (coaster(i / 6), 0.36, 0) for i in range(6)},
    'z_gift': ([m('coaster', 'stall-food'), m('coaster', 'stall-drinks', (1.1, 0, 0))], 0.8, 0),
    'z_hotel': ([m('castle', 'tower-square-base'), m('castle', 'tower-square-mid-windows', (0, 1, 0)), m('castle', 'tower-square-mid-windows', (0, 2, 0)),
                 m('castle', 'tower-square-top-roof-high-windows', (0, 3, 0))], 0.7, 0),
    'z_megazoo': ([m('coaster', 'park-entrance')], 0.85, 0),
    **{f'z_house{i}': ([m(k, n)], sc, 0) for i, (k, n, sc) in enumerate([('coaster', 'stall-food', 1.0), ('coaster', 'stall-drinks', 1.0), ('coaster', 'stall-information', 1.0),
        ('coaster', 'stall-toilets', 1.0), ('town', 'stall-green', 1.3), ('coaster', 'ride-entrance', 1.0), ('town', 'stall-red', 1.3)])},
    **{f'z_{v}_{f}': ([m('cars', src)], 0.5, yaw) for v, src in (('jeep', 'suv-luxury'), ('van', 'van'), ('truck', 'delivery'))
       for f, yaw in (('r', 90), ('l', -90))},
    'z_fence_x': ([m('nat', 'fence_planks')], 1.0, 0), 'z_fence_y': ([m('nat', 'fence_planks')], 1.0, 90),
    'z_palm': ([m('nat', 'tree_palm', light=0.15)], 1.4, 0), 'z_tree': ([m('coaster', 'tree-large')], 1.3, 0), 'z_bush': ([m('coaster', 'tree')], 1.2, 0),
    'z_rock': ([m('castle', 'rocks-large')], 1.0, 0), 'z_bench': ([m('coaster', 'bench')], 1.0, 0), 'z_trash': ([m('coaster', 'trash')], 1.0, 0),
    'z_flowers': ([m('coaster', 'flowers')], 1.2, 0), 'z_keeper': ([m('chars', 'character-male-f')], 0.95, 0), 'z_seller': ([m('chars', 'character-female-c')], 0.95, 0),
    'z_stall': ([m('coaster', 'stall-information')], 0.75, 0),
    # ---- Builder Town (b_) ----
    'b_forest': ([m('surv', 'tree-tall'), m('surv', 'tree', (0.5, 0, 0.35)), m('surv', 'tree-log', (-0.3, 0, 0.4))], 0.9, 0),
    'b_quarry': ([m('surv', 'rock-b'), m('surv', 'rock-c', (0.45, 0, 0.2)), m('surv', 'resource-stone', (-0.3, 0, 0.35))], 1.0, 0),
    'b_kiln': ([m('surv', 'campfire-stand'), *[box((0.2, 0.1, 0.1), (0.45 + (i % 3) * 0.21, 0.05 + (i // 3) * 0.105, 0.2), '#c8553d') for i in range(6)]], 1.6, 0),
    'b_gears': ([m('surv', 'workbench-anvil'), m('surv', 'workbench-grind', (0.55, 0, 0.1))], 1.6, 0),
    'b_solar': ([m('ind', 'solar-panel-flat'), m('ind', 'solar-panel-flat', (0.55, 0, 0.3))], 1.0, 0),
    'b_mine': (mine(), 0.85, 0),
    'b_workshop': ([m('ind', 'building-h')], 1.4, 0),
    'b_crane': (crane(), 0.6, 0),
    'b_houses': ([m('sub', 'building-type-a', (-0.4, 0, 0)), m('sub', 'building-type-c', (0.45, 0, 0.5))], 0.95, 0),
    'b_bridge': (bridge(), 0.8, 0),
    'b_city': ([m('com', 'building-skyscraper-c', (0, 0, 0)), m('com', 'building-skyscraper-a', (0.75, 0, 0.35)), m('com', 'building-f', (-0.55, 0, 0.55))], 0.85, 0),
    'b_rocket': (bigrocket(), 0.75, 0),
    **{f'b_house{i}': ([m(k, n)], sc, 0) for i, (k, n, sc) in enumerate([('com', 'building-c', 1.15), ('sub', 'building-type-i', 1.05), ('com', 'building-a', 1.1),
        ('ind', 'building-i', 1.1), ('sub', 'building-type-n', 1.05), ('com', 'building-d', 1.1), ('ind', 'building-s', 1.2)])},
    **{f'b_{v}_{f}': ([m('cars', src)], 0.5, yaw) for v, src in (('digger', 'tractor-shovel'), ('flatbed', 'truck-flat'), ('garbage', 'garbage-truck'))
       for f, yaw in (('r', 90), ('l', -90))},
    'b_container': ([m('ind', 'shipping-container-a')], 0.9, 0), 'b_cones': ([m('cars', 'cone'), m('cars', 'cone', (0.3, 0, 0.2)), m('cars', 'cone-flat', (-0.25, 0, 0.25))], 1.2, 0),
    'b_planks': ([m('surv', 'resource-planks')], 1.3, 0), 'b_builder': ([m('chars', 'character-male-d')], 0.95, 0), 'b_chimney': ([m('ind', 'chimney-large')], 1.0, 0),
    'b_turbine': ([m('ind', 'windmill')], 1.3, 0),
    # ---- Space Farm (s_) ----
    's_moon': (moonrock(), 0.9, 0), 's_alien': ([{'u': M + 'space/alien.glb', 'p': [0, 0, 0]}], 1.1, 0),
    's_robot': (robot(), 0.55, 0), 's_unicorn': (unicorn(), 0.5, 0), 's_trex': (trex(), 0.5, 0), 's_dragon': (dragon(), 0.5, 0),
    's_camp': (camp(), 0.8, 0), 's_telescope': (telescope(), 0.75, 0),
    's_lab': (lab(), 0.8, 0),
    **{f's_dish{i}': (dish(i * 15), 0.75, 0) for i in range(6)},
    's_mall': (mall(), 0.75, 0), 's_planet': (planet(), 0.6, 0),
    **{f's_house{i}': (habitat(k, c), 0.8, 0) for i, (k, c) in enumerate([('dome', '#ff8a3d'), ('tower', '#3d8bff'), ('pods', '#4cd964'), ('dome', '#a259ff'),
        ('tower', '#ff5a5a'), ('pods', '#ffd23f'), ('dome', '#14b8a6')])},
    **{f's_{v}_{f}': ([{'u': M + 'space/' + src + '.glb', 'p': [0, 0, 0], 'light': 0.15}], 1.6 if v == 'rover' else 0.6, yaw) for v, src in (('rover', 'rover'), ('speeder', 'craft_speederA'), ('cargo', 'craft_cargoA')) if True
       for f, yaw in (('r', 90), ('l', -90))},
    's_crystals': ([{'u': M + 'space/rock_crystalsLargeA.glb', 'p': [0, 0, 0]}], 1.0, 0), 's_meteor': ([{'u': M + 'space/meteor_detailed.glb', 'p': [0, 0, 0]}], 0.8, 0),
    's_rocks': ([{'u': M + 'space/rocks_smallA.glb', 'p': [0, 0, 0]}], 1.0, 0), 's_crater': ([{'u': M + 'space/crater.glb', 'p': [0, 0, 0]}], 1.0, 0),
    's_astro': ([{'u': M + 'space/astronautA.glb', 'p': [0, 0, 0]}], 1.1, 0), 's_astro2': ([{'u': M + 'space/astronautB.glb', 'p': [0, 0, 0]}], 1.1, 0),
    's_fence_x': ([{'u': M + 'space/rail_middle.glb', 'p': [0, 0, 0]}], 1.0, 0), 's_fence_y': ([{'u': M + 'space/rail_middle.glb', 'p': [0, 0, 0], 'r': 90}], 1.0, 0),
    's_stall': (habitat('pods', '#ffd23f'), 0.45, 0), 's_rocket': (bigrocket(), 0.75, 0),
    # windmill: 6 frames of the blades turning (they repeat every 90 degrees)
    **{f'windmill{i}': (windmill(i * 15), 0.8, 0) for i in range(6)},
}

def squeeze(png_bytes):
    """Halve the size and cut colours a little: the map shows sprites at half size anyway."""
    im = Image.open(io.BytesIO(png_bytes)).convert('RGBA')
    im = im.resize((max(1, im.width // 2), max(1, im.height // 2)), Image.LANCZOS)
    out = io.BytesIO()
    im.save(out, 'PNG', optimize=True)
    return out.getvalue(), im.size

PREFIX = {'pets': 'p_', 'zoo': 'z_', 'builder': 'b_', 'space': 's_', 'city': 'c_'}
def wanted(name):
    if ONLY is None:
        return not any(name.startswith(v) for v in PREFIX.values())
    return any(name.startswith(PREFIX[o]) for o in ONLY)
JOBS = {k: v for k, v in JOBS.items() if wanted(k)}
mp = os.path.join(OUT, 'meta.json')
meta = json.load(open(mp)) if os.path.exists(mp) else {}
with sync_playwright() as p:
    b = p.chromium.launch(channel='chrome', headless=True, args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader'])
    pg = b.new_page()
    pg.goto(BASE + '/iso_render/render.html')
    pg.wait_for_function('window.ready === true', timeout=60000)
    for name, (parts, scale, yaw) in JOBS.items():
        r = pg.evaluate('([parts, y, s, ppu]) => window.renderScene(parts, ppu, y, s)', [parts, yaw, scale, PPU])
        data, (w, h) = squeeze(base64.b64decode(r['url'].split(',')[1]))
        open(os.path.join(OUT, name + '.png'), 'wb').write(data)
        # anchor = where the model's ground origin sits, in the half-size PNG
        meta[name] = {'w': w, 'h': h, 'ax': round(r['ax'] / 2, 1), 'ay': round(r['ay'] / 2, 1)}
        print(f'{name:12s} {w}x{h} {len(data) // 1024}KB')
    b.close()
# animations: frames named <base>0..<base>5 become one horizontal strip lined up on the ground anchor
import re
bases = sorted({re.match(r'^(.*?)(\d+)$', n).group(1) for n in JOBS if re.match(r'^(z_wheel|z_coaster|s_dish|windmill)\d+$', n)})
for base in bases:
    fr = sorted((n for n in meta if re.fullmatch(re.escape(base) + r'\d+', n)), key=lambda n: int(n[len(base):]))
    L = max(meta[f]['ax'] for f in fr); R = max(meta[f]['w'] - meta[f]['ax'] for f in fr)
    T = max(meta[f]['ay'] for f in fr); Bm = max(meta[f]['h'] - meta[f]['ay'] for f in fr)
    fw, fh = int(L + R + 1), int(T + Bm + 1)
    strip = Image.new('RGBA', (fw * len(fr), fh), (0, 0, 0, 0))
    for i, f in enumerate(fr):
        im = Image.open(os.path.join(OUT, f + '.png')).convert('RGBA')
        strip.paste(im, (int(i * fw + L - meta[f]['ax']), int(T - meta[f]['ay'])), im)
        os.remove(os.path.join(OUT, f + '.png')); del meta[f]
    strip.save(os.path.join(OUT, base + '.png'), optimize=True)
    meta[base] = {'w': fw, 'h': fh, 'ax': round(L, 1), 'ay': round(T, 1), 'frames': len(fr)}
    print('strip', base, strip.size)
json.dump(meta, open(mp, 'w'), indent=0)
print('sprites:', len(meta), '| total KB:', sum(os.path.getsize(os.path.join(OUT, f)) for f in os.listdir(OUT)) // 1024)
