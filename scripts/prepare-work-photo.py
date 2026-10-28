"""Prepare the real work frame; AI repair is restricted to the caption area."""
from pathlib import Path
from PIL import Image, ImageEnhance

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'assets/source/cagana-working-frame.png'
# Only a small caption/background patch from the built-in image editor is used.
# Faces, hands, client skin, and device remain from the original video frame.
EDIT = ROOT / 'assets/source/cagana-caption-repair.png'
ROI = (80, 580, 660, 770)
CROP = (0, 70, 720, 1030)


def prepare():
    original = Image.open(SOURCE).convert('RGB')
    photo = ImageEnhance.Brightness(original).enhance(2.05)
    repair = Image.open(EDIT).convert('RGB')
    width, height = repair.size
    mask = Image.new('L', (width, height), 0)
    pixels = mask.load()
    for y in range(height):
        for x in range(width):
            edge = min(x, y, width-1-x, height-1-y)
            # Keep the treatment handpiece from the original, including its LEDs.
            protected_device = x + ROI[0] >= 565 and y + ROI[1] >= 690
            pixels[x, y] = 0 if protected_device else round(255 * min(1, edge / 25))
    region = Image.composite(repair, photo.crop(ROI), mask)
    photo.paste(region, ROI[:2])
    photo.crop(CROP).save(ROOT / 'assets/img/cagana-working.webp', quality=92, method=6)


if __name__ == '__main__':
    prepare()
