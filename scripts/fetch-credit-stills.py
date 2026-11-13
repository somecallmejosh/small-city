"""Fetch the official YouTube stills for the home-page credits and write WebP variants.

Usage: python3 scripts/fetch-credit-stills.py
Writes public/assets/credit-<id>-640.webp and -1280.webp for each id in CREDITS
(the same ids as selectedWork in src/components.mjs). Tries maxresdefault, sddefault, then hqdefault;
letterboxed 4:3 stills are cropped to 16:9, and no variant is upscaled past its source.
Requires Pillow. Strips metadata; converts to sRGB.
"""
import io
import sys
import urllib.request
from pathlib import Path
from PIL import Image

CREDITS = ['_Qhqx8Oi_4I', 'jCqH_mUgHJM', 'sfOsi7lr6bQ', '926fxNbTWdw', 't6etciQhR9U', 'MVvi3U6nh_0']
OUT = Path(__file__).resolve().parent.parent / 'public' / 'assets'


def fetch(video_id):
    for name in ('maxresdefault', 'sddefault', 'hqdefault'):
        url = f'https://i.ytimg.com/vi/{video_id}/{name}.jpg'
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': 'site-build'}), timeout=20) as r:
                data = r.read()
            image = Image.open(io.BytesIO(data)).convert('RGB')
            return image, name
        except Exception as error:  # Missing size: try the next one.
            print(f'  {video_id} {name}: {error}', file=sys.stderr)
    raise SystemExit(f'No still found for {video_id}')


def crop_letterbox(image):
    """hqdefault is 4:3 with baked-in black bars; crop to the 16:9 picture."""
    w, h = image.size
    target = round(w * 9 / 16)
    if h > target + 4:
        top = (h - target) // 2
        image = image.crop((0, top, w, top + target))
    return image


for vid in CREDITS:
    image, source = fetch(vid)
    image = crop_letterbox(image)
    for width in (640, 1280):
        if image.width < width and width != 640:
            continue
        width = min(width, image.width)
        resized = image.resize((width, round(image.height * width / image.width)), Image.LANCZOS) if image.width != width else image
        resized.save(OUT / f'credit-{vid}-{width}.webp', 'WEBP', quality=82, method=6)
    print(f'{vid}: {source} {image.size}')
