"""
Engångsscript: klipper ut enskilda rävposer ur fox-positioner.png (ett
oanvänt referensblad med mer realistiska rävposer) till separata filer.

Bakgrunden tas INTE bort här (körs manuellt genom ett riktigt AI-verktyg,
t.ex. remove.bg, eftersom en enkel färgtröskel inte kan skilja den målade
marken vid tassarna från rävens egen päls).

Körs manuellt, inte en del av byggkedjan:
    python scripts/extract-fox-poses.py
"""

from PIL import Image

SRC = "static/images/avatars/presets/fox-positioner.png"
OUT_DIR = "static/images/avatars/presets/fox-realistic-source"

ROW1_Y = (58, 292)   # STÅENDE
ROW2_Y = (398, 632)  # VID SJÖN
ROW3_Y = (728, 922)  # VILA & SÖMN

COL6_WIDTH = 1536 / 6
COL5_WIDTH = 1536 / 5
MARGIN_6 = 8
MARGIN_5 = 10

def col6_box(index, y_range):
    x0 = int(index * COL6_WIDTH + MARGIN_6)
    x1 = int((index + 1) * COL6_WIDTH - MARGIN_6)
    return (x0, y_range[0], x1, y_range[1])

def col5_box(index, y_range):
    x0 = int(index * COL5_WIDTH + MARGIN_5)
    x1 = int((index + 1) * COL5_WIDTH - MARGIN_5)
    return (x0, y_range[0], x1, y_range[1])

POSES = [
    # (box, filnamn)
    (col6_box(0, ROW1_Y), "fox-realistic-standing-front-alert.png"),
    (col6_box(1, ROW1_Y), "fox-realistic-standing-blink-left.png"),
    (col6_box(2, ROW1_Y), "fox-realistic-standing-side-left-lake.png"),
    (col6_box(3, ROW1_Y), "fox-realistic-standing-back-horizon.png"),
    (col6_box(4, ROW1_Y), "fox-realistic-walking-curious.png"),
    (col6_box(5, ROW1_Y), "fox-realistic-standing-side-right-listening.png"),

    (col6_box(0, ROW2_Y), "fox-realistic-lake-standing-look-down.png"),
    (col6_box(1, ROW2_Y), "fox-realistic-lake-drinking.png"),
    (col6_box(2, ROW2_Y), "fox-realistic-lake-sniffing.png"),
    (col6_box(3, ROW2_Y), "fox-realistic-lake-standing-in-water.png"),
    (col6_box(4, ROW2_Y), "fox-realistic-lake-sitting-gazing.png"),
    (col6_box(5, ROW2_Y), "fox-realistic-lake-leaning-forward.png"),

    (col5_box(0, ROW3_Y), "fox-realistic-resting-sitting.png"),
    (col5_box(1, ROW3_Y), "fox-realistic-resting-lying-half-asleep.png"),
    (col5_box(2, ROW3_Y), "fox-realistic-sleeping-curled.png"),
    (col5_box(3, ROW3_Y), "fox-realistic-sleeping-side-dreaming.png"),
    (col5_box(4, ROW3_Y), "fox-realistic-sleeping-deep-still.png"),
]

if __name__ == "__main__":
    import os
    os.makedirs(OUT_DIR, exist_ok=True)
    src = Image.open(SRC).convert("RGB")
    for box, name in POSES:
        crop = src.crop(box)
        out_path = f"{OUT_DIR}/{name}"
        crop.save(out_path)
        print(f"saved {out_path} {crop.size}")
