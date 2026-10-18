"""Prepare a photo for the Well Grounded site in the house look: warm fall-afternoon colour, or soft black and white.
Writes 700, 1200 and 2000 px wide versions as .webp and .jpg into assets/photo-golden/, with no location or camera data.

usage:
  python3 tools/add_photo.py path/to/photo.jpg new-name          # warm colour
  python3 tools/add_photo.py path/to/photo.jpg new-name --bw     # black and white
  optional: --crop l,t,r,b   fractions of the frame to keep, e.g. --crop 0.1,0,0.9,1
needs: pip install pillow numpy  (iPhone .heic photos: also pip install pillow-heif)"""
import argparse, os
import numpy as np
from PIL import Image, ImageFilter, ImageOps

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
OUT = os.path.join(ROOT, 'assets', 'photo-golden')
LW = np.array([0.2126, 0.7152, 0.0722], np.float32)
rng = np.random.default_rng(11)

def curve(x, toe, shoulder, s):
    x = toe + x * (shoulder - toe)
    return x + s * (x - 0.5) * (1 - np.abs(2 * x - 1)) * 0.5

def recover(a, knee=0.72, lift=0.06, pull=0.55):
    L = a @ LW
    over = np.clip((L - knee) / (1 - knee), 0, 1)[..., None]
    a = a - over * over * (a - knee) * pull
    under = np.clip((0.25 - L) / 0.25, 0, 1)[..., None]
    return np.clip(a + under * lift, 0, 1)

def tame(im):
    # loud greens and blue skies toward sage and haze
    hsv = np.asarray(im.convert('HSV'), np.float32)
    h, s, v = hsv[..., 0] * 360 / 255, hsv[..., 1], hsv[..., 2]
    g = np.clip(1 - np.abs(h - 100) / 55, 0, 1); b = np.clip(1 - np.abs(h - 210) / 40, 0, 1)
    s = s * (1 - g * 0.32) * (1 - b * 0.5)
    return Image.fromarray(np.dstack([hsv[..., 0], s, np.clip(v * (1 + b * 0.04), 0, 255)]).astype(np.uint8), 'HSV').convert('RGB')

def golden(a):
    lum = a @ LW
    a = lum[..., None] + (a - lum[..., None]) * 0.9
    a = np.clip(a * 1.05 + 0.012, 0, 1)
    a = curve(a, 0.05, 0.982, 0.085)
    blur = np.asarray(Image.fromarray((a * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(max(a.shape[:2]) / 90)), np.float32) / 255
    a = np.clip(a + 0.12 * (a - blur), 0, 1)
    lum = a @ LW
    hi = np.clip((lum - 0.35) / 0.65, 0, 1)[..., None]
    a = a * (1 + hi * np.array([0.045, 0.016, -0.065], np.float32)) + (1 - hi) * np.array([0.01, 0.003, -0.008], np.float32)
    glow = np.asarray(Image.fromarray((np.clip((a - 0.7) / 0.3, 0, 1) * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(max(a.shape[:2]) / 110)), np.float32) / 255
    return 1 - (1 - a) * (1 - 0.11 * glow * np.array([1.0, 0.9, 0.72], np.float32))

def silver(a):
    lum = curve(a @ np.array([0.34, 0.56, 0.10], np.float32), 0.06, 0.96, 0.2)
    return lum[..., None] * (np.array([1.0, 0.975, 0.93], np.float32) * (0.92 + 0.08 * lum[..., None]))

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('src'); ap.add_argument('name'); ap.add_argument('--bw', action='store_true'); ap.add_argument('--crop')
    a = ap.parse_args()
    try:
        import pillow_heif; pillow_heif.register_heif_opener()
    except ImportError:
        pass
    im = ImageOps.exif_transpose(Image.open(a.src)).convert('RGB')
    if a.crop:
        l, t, r, b = [float(x) for x in a.crop.split(',')]; W, H = im.size
        im = im.crop((int(l * W), int(t * H), int(r * W), int(b * H)))
    im.thumbnail((2000, 4000), Image.LANCZOS)
    if not a.bw: im = tame(im)
    arr = recover(np.asarray(im, np.float32) / 255)
    arr = silver(arr) if a.bw else golden(arr)
    g = rng.normal(0, 1, arr.shape[:2]).astype(np.float32)
    arr = arr + ((np.asarray(Image.fromarray(((g * 0.25 + 0.5).clip(0, 1) * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.6)), np.float32) / 255 - 0.5) * (0.045 if a.bw else 0.03))[..., None]
    base = Image.fromarray((np.clip(arr, 0, 1) * 255 + 0.5).astype(np.uint8))
    os.makedirs(OUT, exist_ok=True)
    for w in (2000, 1200, 700):
        o = base if base.width <= w else base.resize((w, round(base.height * w / base.width)), Image.LANCZOS)
        o.save(os.path.join(OUT, f'{a.name}-{w}.jpg'), quality=84, optimize=True, progressive=True)
        o.save(os.path.join(OUT, f'{a.name}-{w}.webp'), quality=80, method=6)
    print(f'saved assets/photo-golden/{a.name}-[700|1200|2000].[webp|jpg]  width={base.width} height={base.height}')

if __name__ == '__main__':
    main()
