"""
Engångsscript: klipper ut och bakgrundstar bort enskilda rävposer ur
fox-positioner.png (ett oanvänt referensblad med mer realistiska rävposer)
och sparar dem som transparenta PNG:er.

Körs manuellt, inte en del av byggkedjan.
"""

from PIL import Image
import math

SRC = "static/images/avatars/presets/fox-positioner.png"
OUT_DIR = "static/images/avatars/presets"

BG_COLOR = (245, 236, 227)
LOW_THRESH = 18   # under detta: helt transparent
HIGH_THRESH = 60  # över detta: helt opak

def remove_background(img: Image.Image) -> Image.Image:
    img = img.convert("RGBA")
    pixels = img.load()
    w, h = img.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = pixels[x, y]
            dist = math.sqrt(
                (r - BG_COLOR[0]) ** 2 + (g - BG_COLOR[1]) ** 2 + (b - BG_COLOR[2]) ** 2
            )
            if dist <= LOW_THRESH:
                pixels[x, y] = (r, g, b, 0)
            elif dist < HIGH_THRESH:
                alpha = int(255 * (dist - LOW_THRESH) / (HIGH_THRESH - LOW_THRESH))
                pixels[x, y] = (r, g, b, alpha)
            # annars: behåll full opacitet
    return img

def crop_and_save(src_img, box, out_name):
    crop = src_img.crop(box)
    result = remove_background(crop)
    # Trimma bort helt transparenta kantrader/kolumner
    bbox = result.getbbox()
    if bbox:
        result = result.crop(bbox)
    out_path = f"{OUT_DIR}/{out_name}"
    result.save(out_path)
    print(f"saved {out_path} {result.size}")

if __name__ == "__main__":
    src = Image.open(SRC).convert("RGB")

    # Test: bara den första posen (framifrån, uppmärksam) för granskning.
    crop_and_save(src, (5, 60, 255, 295), "fox_idle_v2_TEST.png")
