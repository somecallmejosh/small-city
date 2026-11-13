"""Prepare supplied studio photos. Requires Pillow; takes native JPEG working copies.

On macOS, decode each HEIC with sips -s format jpeg --resampleWidth 2400.
Pass the directory containing IMG_3036-2400.jpg etc. as the first argument.
Originals stay untouched; generated assets contain no camera/location metadata.
"""
from pathlib import Path
from io import BytesIO
import sys
from PIL import Image, ImageCms, ImageOps

source = Path(sys.argv[1])
output = Path(__file__).resolve().parent.parent / 'public/assets'
photos = {
    'studio-recording': (3036, None),
    'studio-control-room': (3037, None),
    'studio-production': (3037, (600, 650, 2200, 1850)),
    'studio-session': (3038, None),
    'studio-lounge': (3039, None),
    'studio-wide': (3043, None),
}
for name, (number, crop) in photos.items():
    image = ImageOps.exif_transpose(Image.open(source / f'IMG_{number}-2400.jpg'))
    if image.info.get('icc_profile'):
        image = ImageCms.profileToProfile(image, ImageCms.ImageCmsProfile(BytesIO(image.info['icc_profile'])), ImageCms.createProfile('sRGB'), outputMode='RGB')
    else:
        image = image.convert('RGB')
    if crop:
        # Clamp this desk detail to the source, preserving a true photographic crop.
        image = image.crop((crop[0], crop[1], crop[2], min(crop[3], image.height)))
    image = ImageOps.fit(image, (min(image.width, 2400), round(min(image.width, 2400) * .75)), method=Image.Resampling.LANCZOS)
    for width in (640, 960, 1440, 1920):
        if width > image.width:
            continue
        size = (width, round(width * .75))
        image.resize(size, Image.Resampling.LANCZOS).save(output / f'{name}-{width}.webp', quality=82, method=6)
    # Stable fallback and social-sharing asset; same 4:3 ratio as every srcset.
    image.resize((1440, 1080), Image.Resampling.LANCZOS).save(output / f'{name}.webp', quality=82, method=6)
    print(name)
