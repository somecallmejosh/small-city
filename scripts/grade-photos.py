#!/usr/bin/env python3
"""Grade studio photography and write responsive sizes to public/assets/.

Masters (ungraded) live in assets-src/photos/. The grade is a dim, practical-lit
control-room look: deep shadows that sit on the #0B0B0C canvas, warm amber
lamplight, RGB LED casts (purple / magenta / blue / cyan / green) pulled back,
soft halation around the lamps, a vignette and fine grain.

Requires Pillow only.

  python3 scripts/grade-photos.py                 # write all sizes
  python3 scripts/grade-photos.py --preview a.jpg # before/after sheet only
  python3 scripts/grade-photos.py --only chase    # one photo
"""
import argparse
from pathlib import Path
from PIL import Image, ImageChops, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / 'assets-src' / 'photos'
OUT = ROOT / 'public' / 'assets'

# name -> (profile, output widths, base width written as <name>.ext)
PHOTOS = {
    'studio-control-room': ('room', [640, 960, 1440, 1920], 1440),
    'studio-recording': ('room', [640, 960, 1440, 1920], 1440),
    'studio-wide': ('room', [640, 960, 1440, 1920], 1440),
    'studio-lounge': ('room', [640, 960, 1440, 1920], 1440),
    'studio-session': ('room', [640, 960, 1440, 1920], 1440),
    'studio-production': ('room', [640, 960, 1440], 1440),
    'chase': ('portrait', [], 1242),
}

PROFILES = {
    # Tone curve control points (in -> out, 0..1). Black floor = #0B0B0C.
    'room': dict(
        curve=[(0, .043), (.07, .046), (.18, .1), (.36, .29), (.55, .52), (.75, .76), (.9, .9), (1, .97)],
        warm=(1.06, 1.0, .86),       # R, G, B gain on mids/highlights
        led_sat=.3,                  # saturation kept on purple / magenta / pink
        blue_sat=.45, cyan_sat=.4, green_sat=.4, warm_sat=1.08,
        glow=.32, vignette=.5, grain=1.6,
    ),
    # Already moody red key light: keep the colour, add depth only.
    'portrait': dict(
        curve=[(0, .043), (.1, .055), (.3, .24), (.55, .53), (.8, .8), (1, .97)],
        warm=(1.0, 1.0, .96),
        led_sat=.8, blue_sat=.85, cyan_sat=.8, green_sat=.8, warm_sat=1.0,
        glow=.18, vignette=.42, grain=1.4,
    ),
}


def pchip(points):
    """Monotone cubic interpolation of (x, y) points to a 256-entry LUT (0..1)."""
    xs, ys = zip(*points)
    n = len(xs)
    h = [xs[i + 1] - xs[i] for i in range(n - 1)]
    d = [(ys[i + 1] - ys[i]) / h[i] for i in range(n - 1)]
    m = [d[0]] + [0.0] * (n - 2) + [d[-1]]
    for i in range(1, n - 1):
        if d[i - 1] * d[i] > 0:
            w1, w2 = 2 * h[i] + h[i - 1], h[i] + 2 * h[i - 1]
            m[i] = (w1 + w2) / (w1 / d[i - 1] + w2 / d[i])
    lut = []
    for v in range(256):
        x = v / 255
        i = min(max(next((k for k in range(n - 1) if x <= xs[k + 1]), n - 2), 0), n - 2)
        t = (x - xs[i]) / h[i]
        h00, h10 = 2 * t**3 - 3 * t**2 + 1, t**3 - 2 * t**2 + t
        h01, h11 = -2 * t**3 + 3 * t**2, t**3 - t**2
        lut.append(min(max(h00 * ys[i] + h10 * h[i] * m[i] + h01 * ys[i + 1] + h11 * h[i] * m[i + 1], 0), 1))
    return lut


def band(h, center, width):
    """Smooth 0..1 weight around a hue (degrees), cosine falloff."""
    import math
    dist = min(abs(h - center), 360 - abs(h - center))
    return 0.5 * (1 + math.cos(math.pi * dist / width)) if dist < width else 0.0


def saturation_lut(p):
    """Per-hue saturation multiplier (PIL HSV hue is 0..255)."""
    lut = []
    for v in range(256):
        deg = v / 255 * 360
        mult = 1.0
        for center, width, keep in ((305, 55, p['led_sat']), (235, 30, p['blue_sat']),
                                    (175, 35, p['cyan_sat']), (105, 45, p['green_sat'])):
            mult -= band(deg, center, width) * (1 - keep)
        mult += band(deg, 28, 30) * (p['warm_sat'] - 1)
        lut.append(int(min(max(mult, 0), 1) * 255))
    return lut


def grade(img, profile):
    p = PROFILES[profile]
    img = img.convert('RGB')
    w, hgt = img.size

    # 1. Pull back LED casts by hue, keep the warm practicals.
    hh, ss, vv = img.convert('HSV').split()
    ss = ImageChops.multiply(ss, hh.point(saturation_lut(p)))
    img = Image.merge('HSV', (hh, ss, vv)).convert('RGB')

    # 2. Tone curve + warm balance (gain fades out toward black so shadows stay neutral).
    base = pchip(p['curve'])
    luts = []
    for gain in p['warm']:
        luts += [int(min(base[v] * (1 + (gain - 1) * min(v / 140, 1)), 1) * 255 + .5) for v in range(256)]
    img = img.point(luts)

    # 3. Halation: blurred highlights, amber-tinted, screened back on.
    if p['glow']:
        lum = img.convert('L').point(lambda v: 0 if v < 175 else min((v - 175) * 3, 255))
        glow = Image.merge('RGB', (lum, lum.point(lambda v: int(v * .72)), lum.point(lambda v: int(v * .38))))
        glow = glow.filter(ImageFilter.GaussianBlur(w * .018)).point(lambda v: int(v * p['glow']))
        img = ImageChops.screen(img, glow)

    # 4. Elliptical vignette.
    mask = Image.radial_gradient('L').resize((w, hgt), Image.BICUBIC)
    floor = 1 - p['vignette']
    mask = mask.point(lambda v: int(255 * (1 - (1 - floor) * max(0, (v / 255 - .45) / .55) ** 1.6)))
    img = ImageChops.multiply(img, Image.merge('RGB', (mask, mask, mask)))

    return img


def add_grain(img, amount):
    """Fine luminance grain, applied per output size so it stays one pixel fine."""
    if not amount:
        return img
    noise = Image.effect_noise(img.size, 64).point(lambda v: int(128 + (v - 128) * amount / 32))
    return ImageChops.add(img, Image.merge('RGB', (noise, noise, noise)), scale=1, offset=-128)


def source_path(name):
    for ext in ('.webp', '.jpg'):
        if (SRC / f'{name}{ext}').exists():
            return SRC / f'{name}{ext}'
    raise FileNotFoundError(name)


def save(img, path, width, grain):
    out = img if img.width == width else img.resize((width, round(img.height * width / img.width)), Image.LANCZOS)
    out = add_grain(out, grain)
    if path.suffix == '.jpg':
        out.save(path, quality=80, optimize=True, progressive=True)
    else:
        out.save(path, 'WEBP', quality=76, method=6)
    return path


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--preview', help='write a before/after contact sheet instead of assets')
    ap.add_argument('--only', nargs='*', help='limit to these photo names')
    args = ap.parse_args()
    names = args.only or list(PHOTOS)

    if args.preview:
        tw, th = 640, 427
        sheet = Image.new('RGB', (tw * 2, th * len(names)), (11, 11, 12))
        for row, name in enumerate(names):
            before = Image.open(source_path(name)).convert('RGB')
            after = add_grain(grade(before, PHOTOS[name][0]), PROFILES[PHOTOS[name][0]]['grain'])
            for col, im in enumerate((before, after)):
                im = im.copy()
                im.thumbnail((tw, th))
                sheet.paste(im, (col * tw, row * th))
        sheet.save(args.preview, quality=88)
        print(f'Preview: {args.preview}')
        return

    for name in names:
        profile, widths, base = PHOTOS[name]
        src = source_path(name)
        graded = grade(Image.open(src), profile)
        ext = src.suffix
        grain = PROFILES[profile]['grain']
        written = [save(graded, OUT / f'{name}-{w}{ext}', w, grain) for w in widths]
        written.append(save(graded, OUT / f'{name}{ext}', base, grain))
        print(name, ' '.join(f'{p.name}:{p.stat().st_size // 1024}K' for p in written))


if __name__ == '__main__':
    main()
