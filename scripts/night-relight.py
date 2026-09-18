"""Nattvarianter av Framstegs sjöscen, som en procedurell per-pixel-relight.

Användning (från repots rot):

    python scripts/night-relight.py

Kräver Pillow och numpy (`pip install pillow numpy`).

Läser endast källbilderna i static/images/scenes/:
    progress-lake-bear.webp   (gäst, björnen inbakad)
    progress-lake.webp        (inloggad, utan björn)

och skriver, bredvid dem:
    progress-lake-bear-night.webp, -1200.webp, -800.webp
    progress-lake-night.webp,      -1200.webp, -800.webp

Källbilderna ändras aldrig. Transformen är en ren funktion av varje pixel och
dess koordinater - ingen pixel flyttas, så komposition, klickytor och
overlay-koordinater stämmer per definition med originalet. Ingen slump
används: samma källbild, samma Pillow/numpy-version ger samma utdata.
"""

from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

SCENES = Path(__file__).resolve().parent.parent / "static" / "images" / "scenes"
SOURCES = ("progress-lake-bear", "progress-lake")
W, H = 1672, 941
# Samma storlekar som de befintliga responsiva varianterna.
RESPONSIVE_SIZES = ((1200, 675), (800, 450))
WEBP_OPTIONS = {"quality": 82, "method": 6}


def smooth(a, lo, hi):
    """Smoothstep mellan lo och hi."""
    t = np.clip((a - lo) / (hi - lo), 0, 1)
    return t * t * (3 - 2 * t)


def box_mask(x0, y0, x1, y1, feather):
    """Mjuk rektangel i originalbildens koordinater (px)."""
    m = np.zeros((H, W), np.float32)
    m[y0:y1, x0:x1] = 1
    img = Image.fromarray((m * 255).astype("uint8")).filter(ImageFilter.GaussianBlur(feather))
    return np.asarray(img).astype(np.float32) / 255


yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)

# Masker för de varma ljuskällorna. Stugrutan i appen är 109-376 x 263-442
# (PROGRESS_CABIN_SOURCE_BOX); zonen börjar vid y 320 så att den bara fångar
# fönster och dörr, inte solnedgångshimlen mellan träden bakom taket.
cabin_zone = box_mask(100, 320, 390, 450, 6)
# Fönstrens spegling i sjön under stugan.
cabin_reflection_zone = box_mask(150, 440, 360, 700, 10)
# Lägerelden nere till höger.
fire_zone = box_mask(1440, 600, 1672, 900, 10)
light_zone = np.maximum.reduce([cabin_zone, cabin_reflection_zone * 0.6, fire_zone])

# Himlen: allt ovanför bergskammen/trädlinjen. En vertikal gradient räcker
# eftersom himlen är den ljusaste ytan högst upp; berg och träd mörknar ändå.
sky_weight = 1 - smooth(yy, 120, 330)


def relight(path: Path) -> Image.Image:
    src = np.asarray(Image.open(path).convert("RGB")).astype(np.float32) / 255
    r, b = src[..., 0], src[..., 2]
    lum = 0.2126 * r + 0.7152 * src[..., 1] + 0.0722 * b

    # 1. Highlights-komprimering: solen, de glödande molnen och solstrimman i
    #    sjön får inte ligga kvar som en ljus fläck när det inte finns någon måne.
    lum_n = lum / (1 + 1.6 * lum)

    # 2. Kall grundton: nattexponering och lågmättad, blåförskjuten färg
    #    (skotopiskt seende - färgen försvinner före formen).
    night_lum = np.power(lum_n, 1.15) * 0.62
    night_lum = night_lum * (1 - 0.35 * sky_weight)
    tint = np.array([0.62, 0.78, 1.18], np.float32)
    chroma = (src - lum[..., None]) * 0.18  # andel av originalfärgen som får vara kvar
    night = night_lum[..., None] * tint + chroma * 0.5

    # 3. Himmelsgradient: djupare blå högst upp, något ljusare mot horisonten.
    #    Blandas in med 55 % så bergens och molnens struktur finns kvar svagt.
    t = yy / 330
    sky_col = np.clip(np.stack([0.035 + 0.05 * t, 0.06 + 0.07 * t, 0.16 + 0.11 * t], -1), 0, 1)
    sky_mix = sky_weight[..., None] * 0.55
    night = night * (1 - sky_mix) + (sky_col + night_lum[..., None] * 0.35) * sky_mix
    # Svagt kallt fyllnadsljus så björn och person inte drunknar i svärtan.
    night = night + np.array([0.012, 0.018, 0.03], np.float32)

    # 4. Varma maskade ljuskällor: pixlar som är ljusa OCH varma inom
    #    ljuszonerna behåller en dämpad version av sin originalfärg.
    warmth = smooth(r - b, 0.18, 0.45) * smooth(lum, 0.35, 0.75)
    glow = (warmth * light_zone)[..., None]
    warm_keep = src * np.array([1.0, 0.82, 0.62], np.float32) * 0.9
    out = night * (1 - glow) + warm_keep * glow

    # 5. Eldsken: lägerelden (ca 1555, 800) lyser svagt upp marken, björnen och
    #    personens närmaste sida. Skalas med originalets ljushet så bara ytor
    #    som faktiskt finns tar emot ljus - ingen spotlight, bara ett varmt avfall.
    dist = np.hypot(xx - 1555, (yy - 800) / 0.8)
    spill = np.exp(-((dist / 330) ** 2)) * 0.55 * smooth(lum, 0.05, 0.5)
    out = out + (src * np.array([0.55, 0.36, 0.2], np.float32)) * spill[..., None]

    return Image.fromarray((np.clip(out, 0, 1) * 255 + 0.5).astype("uint8"))


def main() -> None:
    for name in SOURCES:
        night = relight(SCENES / f"{name}.webp")
        assert night.size == (W, H), night.size

        # 6. Export: original (1672x941) plus 1200- och 800-varianterna,
        #    nedskalade från den fulla nattbilden med Lanczos.
        night.save(SCENES / f"{name}-night.webp", "WEBP", **WEBP_OPTIONS)
        for width, height in RESPONSIVE_SIZES:
            night.resize((width, height), Image.LANCZOS).save(
                SCENES / f"{name}-night-{width}.webp", "WEBP", **WEBP_OPTIONS
            )
        print(f"skrev {name}-night.webp (+1200, +800)")


if __name__ == "__main__":
    main()
