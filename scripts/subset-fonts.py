#!/usr/bin/env python3
"""Split each web font into a small preloaded core and an on-demand extension.

Masters (full Latin, variable axes intact) live in assets-src/fonts/. For each one this writes:

  public/assets/<name>.woff2      the CORE characters below; preloaded, so it is all most pages fetch
  public/assets/<name>-ext.woff2  every other character in the master; the browser fetches it only
                                  when a page shows one of them (an accented name, a new symbol)

The @font-face rules in src/styles.css pair each file with a unicode-range. The ext range printed
by this script must be pasted there whenever CORE or a master changes. If copy starts using a new
character, add it to CORE so pages keep to the core file (check.mjs warns when one doesn't).

Requires fontTools and brotli (pip install fonttools brotli).

  python3 scripts/subset-fonts.py
"""
from pathlib import Path
from fontTools.ttLib import TTFont
from fontTools import subset

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / 'assets-src' / 'fonts'
OUT = ROOT / 'public' / 'assets'

# Printable ASCII, no-break space, and the typography the site's copy uses: © · × ‘ ’ “ ” • …
CORE = set(range(0x20, 0x7F)) | {0xA0, 0xA9, 0xB7, 0xD7, 0x2018, 0x2019, 0x201C, 0x201D, 0x2022, 0x2026}

FONTS = {
    # tnum/pnum: tabular figures in rates and counters. calt: JetBrains Mono's contextual forms.
    'Archivo': ['kern', 'liga', 'tnum', 'pnum', 'locl', 'ccmp', 'rvrn', 'mark', 'mkmk'],
    'JetBrainsMono': ['kern', 'locl', 'ccmp', 'calt', 'mark', 'mkmk'],
}


def unicode_range(codepoints):
    cps = sorted(codepoints)
    ranges, start = [], cps[0]
    for prev, cp in zip(cps, cps[1:] + [None]):
        if cp != prev + 1:
            ranges.append(f'U+{start:04X}' if start == prev else f'U+{start:04X}-{prev:04X}')
            start = cp
    return ','.join(ranges)


def write(name, features, codepoints, path):
    font = TTFont(SRC / f'{name}.woff2')
    options = subset.Options()
    options.flavor = 'woff2'
    options.layout_features = features
    options.name_IDs = ['*']
    options.notdef_outline = True
    subsetter = subset.Subsetter(options)
    subsetter.populate(unicodes=codepoints)
    subsetter.subset(font)
    font.save(path)
    return path.stat().st_size // 1024


def main():
    for name, features in FONTS.items():
        available = set(TTFont(SRC / f'{name}.woff2').getBestCmap())
        # Control characters and the BOM never render, so they must not trigger an ext download.
        core = available & CORE
        ext = {cp for cp in available - CORE if cp >= 0x20 and cp != 0xFEFF}
        core_kb = write(name, features, core, OUT / f'{name}.woff2')
        ext_kb = write(name, features, ext, OUT / f'{name}-ext.woff2')
        print(f'{name}: core {core_kb}K ({len(core)} chars), ext {ext_kb}K ({len(ext)} chars)')
        print(f'  core unicode-range:{unicode_range(core)}')
        print(f'  ext unicode-range:{unicode_range(ext)}')


if __name__ == '__main__':
    main()
