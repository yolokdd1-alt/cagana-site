"""Prepare the real frontal Full Face case. Requires Pillow; no retouching."""
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'assets/source/fullface-front-story-frame.png'
# Eye centers, base of nose and bottom of chin in the unchanged 1080x1920 frame.
# Fit the whole face rather than aligning only the outer eye corners. No local
# warping or fitting to wrinkles, brow shape or another treatment outcome.
LANDMARK_NAMES = ('left_eye', 'right_eye', 'nose_base', 'chin')
LANDMARKS = {
    'before': ((147, 759), (369, 754), (255, 930), (265, 1149)),
    'after': ((663, 841), (886, 839), (781, 1021), (785, 1225)),
}
WEIGHTS = (1, 1, 2, 1.5)
BOUNDS = {'before': (18, 421, 539, 1464), 'after': (539, 421, 1061, 1464)}
CROP = (25, 530, 468, 624)


def similarity():
    source = [complex(*point) for point in LANDMARKS['after']]
    target = [complex(*point) for point in LANDMARKS['before']]
    total_weight = sum(WEIGHTS)
    p = sum(w*z for w, z in zip(WEIGHTS, source)) / total_weight
    u = sum(w*z for w, z in zip(WEIGHTS, target)) / total_weight
    a = sum(w*(v-u)*(q-p).conjugate() for w, q, v in zip(WEIGHTS, source, target)) / sum(w*abs(q-p)**2 for w, q in zip(WEIGHTS, source))
    return a, u-a*p


def prepare():
    left, top, width, height = CROP
    a, b = similarity()
    original = Image.open(SOURCE).convert('RGB')
    assert original.size == (1080, 1920)
    for state in ('before', 'after'):
        scale, shift = (1+0j, 0j) if state == 'before' else (a, b)
        inverse = 1 / scale
        offset = (complex(left, top)-shift) / scale
        x0, y0, x1, y1 = BOUNDS[state]
        for x in (0, width):
            for y in (0, height):
                z = offset + inverse*complex(x, y)
                assert x0+2 <= z.real <= x1-2 and y0+2 <= z.imag <= y1-2
        prepared = original.transform(
            (width, height), Image.Transform.AFFINE,
            (inverse.real, -inverse.imag, offset.real, inverse.imag, inverse.real, offset.imag),
            resample=Image.Resampling.BICUBIC,
        )
        prepared.save(ROOT / f'assets/img/fullface-front-{state}.webp', lossless=True, method=6)


if __name__ == '__main__':
    prepare()
