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
M = BASE + '/kenney_dl/models/'
PPU = 181  # => a 1x1 tile is 256 px wide in the PNG (shown at half size = 128 px on the map)
os.makedirs(OUT, exist_ok=True)

def m(kit, name, p=(0, 0, 0), r=0, **k):
    d = {'u': M + kit + '/' + name + '.glb', 'p': list(p), 'r': r}
    d.update(k)
    return d

def box(size, p, color):
    return {'box': list(size), 'p': list(p), 'color': color}

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

meta = {}
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
json.dump(meta, open(os.path.join(OUT, 'meta.json'), 'w'), indent=0)
print('sprites:', len(meta), '| total KB:', sum(os.path.getsize(os.path.join(OUT, f)) for f in os.listdir(OUT)) // 1024)
