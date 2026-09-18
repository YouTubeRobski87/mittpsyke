"""Dygnsvarianter av Framstegs sjöscen, som procedurell per-pixel-relight.

Användning (från repots rot):

    python scripts/scene-relight.py              # alla faser
    python scripts/scene-relight.py night        # bara natt
    python scripts/scene-relight.py morning      # bara morgon
    python scripts/scene-relight.py day          # bara dag
    python scripts/scene-relight.py evening      # bara kväll

Kräver Pillow och numpy (`pip install pillow numpy`).

Läser endast källbilderna i static/images/scenes/ (solnedgången):
    progress-lake-bear.webp   (gäst, björnen inbakad)
    progress-lake.webp        (inloggad, utan björn)

och skriver, bredvid dem, för varje fas <fas>:
    progress-lake-bear-<fas>.webp, -1200.webp, -800.webp
    progress-lake-<fas>.webp,      -1200.webp, -800.webp

Varje fas är en egen funktion (relight_night, relight_morning, relight_day,
relight_evening) som bara delar
masker och hjälpfunktioner - att justera en fas ändrar aldrig en annan fas
utdata.

Källbilderna ändras aldrig. Transformen är en ren funktion av varje pixel och
dess koordinater - ingen pixel flyttas, så komposition, klickytor och
overlay-koordinater stämmer per definition med originalet. Ingen slump
används: samma källbild, samma Pillow/numpy-version ger samma utdata.
"""

import sys
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


def load(path: Path) -> np.ndarray:
    return np.asarray(Image.open(path).convert("RGB")).astype(np.float32) / 255


def to_image(out: np.ndarray) -> Image.Image:
    return Image.fromarray((np.clip(out, 0, 1) * 255 + 0.5).astype("uint8"))


# --- Natt -------------------------------------------------------------------


def relight_night(src: np.ndarray) -> Image.Image:
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

    return to_image(out)


# --- Morgon -----------------------------------------------------------------
# Solen i originalet ligger vid ca (505, 224); dess strimma i sjön täcker ca
# x 409-818. Ingen av dem hör hemma i en disig morgon innan solen nått dalen.
sun_zone = np.exp(-(((xx - 505) / 150) ** 2 + ((yy - 224) / 120) ** 2))
lake_streak_zone = box_mask(380, 420, 850, 780, 40)
# Morgondimman ligger tätast längs bortre strandlinjen (y ca 415-440) och
# tunnas ut ner över sjön och upp mot trädlinjen.
lake_mist_band = np.exp(-(((yy - 440) / 55) ** 2)) * (0.75 + 0.25 * smooth(xx, 0, 900))
# Avstånd: berg och bortre skog ovanför strandlinjen får mer dis än
# förgrunden - luftperspektiv, inte en jämn slöja. Kanterna undantas: där står
# de närmaste träden och stugan, som ska vara tydliga även i dis.
distance_haze = (1 - smooth(yy, 380, 560)) * smooth(xx, 330, 520) * (1 - smooth(xx, 1330, 1500))


def relight_morning(src: np.ndarray) -> Image.Image:
    r, b = src[..., 0], src[..., 2]
    lum = 0.2126 * r + 0.7152 * src[..., 1] + 0.0722 * b

    # 1. Highlights-komprimering: solskivan, de glödande molnen och solstrimman
    #    i sjön tonas ner. Hårdare inom sol- och strimzonerna, där en ljus fläck
    #    annars skulle läsa som en sol som redan står på himlen.
    k = 0.9 + 2.2 * np.maximum(sun_zone, lake_streak_zone * 0.8)
    lum_n = lum * (1 + k * 0.35) / (1 + k * lum)

    # 2. Sval grundton: mjukare kontrast och lågmättad, svalt blågrå färg. En
    #    liten del av originalfärgen får vara kvar så gräs och stuga inte blir
    #    monokroma - men den varma solnedgångsfärgen dras mot neutral.
    base_lum = 0.045 + 0.86 * lum_n
    tint = np.array([0.9, 0.97, 1.06], np.float32)
    # Inom sol- och strimzonerna tas färgen nästan helt bort, så solnedgångens
    # rosa/orange inte blir kvar som en blek pelare i sjön.
    sun_streak = np.maximum(sun_zone, lake_streak_zone)
    chroma = (src - lum[..., None]) * (0.46 * (1 - 0.85 * sun_streak))[..., None]
    chroma[..., 0] *= 0.7  # mindre rött: bort från solnedgång
    out = base_lum[..., None] * tint + chroma

    # 3. Himmelsgradient: ljus, sval gryningshimmel - blekblå högst upp mot
    #    nästan vitgrå vid horisonten. 65 % inblandning, så molnens form finns
    #    kvar men inte deras orange glöd. Bara där originalet faktiskt är ljus
    #    himmel: de mörka trädtopparna i kanterna når upp i himmelszonen och
    #    skulle annars bli bleka.
    t = yy / 330
    sky_col = np.stack([0.58 + 0.2 * t, 0.66 + 0.16 * t, 0.76 + 0.1 * t], -1)
    sky_mix = (sky_weight * smooth(lum, 0.28, 0.5))[..., None] * 0.65
    out = out * (1 - sky_mix) + (sky_col * (0.75 + 0.25 * base_lum[..., None])) * sky_mix

    # 4. Morgondis: luftperspektiv över berg och bortre strand, och ett tätare
    #    dimband längs sjöns bortre strand. Samma kalla, ljusa färg båda.
    haze_col = np.array([0.74, 0.79, 0.84], np.float32)
    haze = np.clip(distance_haze * 0.17 + lake_mist_band * 0.3, 0, 0.42)[..., None]
    out = out * (1 - haze) + haze_col * haze

    # 5. Varma maskade ljuskällor, svagt: fönstren lyser fortfarande lite och
    #    elden glöder lågt. Ingen eldsken-spridning - morgonljuset dominerar.
    warmth = smooth(r - b, 0.18, 0.45) * smooth(lum, 0.35, 0.75)
    glow = (warmth * light_zone)[..., None] * 0.45
    warm_keep = src * np.array([1.0, 0.85, 0.7], np.float32) * 0.95
    out = out * (1 - glow) + warm_keep * glow

    return to_image(out)


# --- Dag --------------------------------------------------------------------
# Solen står högt, utanför bild. Samma sol- och strimzoner som morgonen tar
# bort solnedgångens sol och dess pelare i sjön; sjön speglar i stället himlen.


def relight_day(src: np.ndarray) -> Image.Image:
    r, b = src[..., 0], src[..., 2]
    lum = 0.2126 * r + 0.7152 * src[..., 1] + 0.0722 * b

    # 1. Highlights-komprimering, mildare än morgonens: dagsljuset är ljust,
    #    men solskivan och strimman i sjön får inte vara kvar.
    k = 0.4 + 2.0 * np.maximum(sun_zone, lake_streak_zone * 0.8)
    lum_n = lum * (1 + k * 0.4) / (1 + k * lum)

    # 2. Neutral vitbalans: solnedgångens orange dras mot neutralt dagsljus.
    #    Mer av originalfärgen än morgonen - gräs och träd ska vara gröna -
    #    men med rött kraftigt minskat, och nästan ingen färg i sol-/strimzonerna.
    #    Mellantonerna lyfts lite (gamma 0.9): solnedgångens förgrund är mörk,
    #    mitt på dagen ligger den i fullt ljus.
    base_lum = 0.02 + 0.97 * np.power(lum_n, 0.9)
    tint = np.array([0.96, 1.0, 1.05], np.float32)
    sun_streak = np.maximum(sun_zone, lake_streak_zone)
    # Himlen och bergen bar solnedgångens rosa/lila glöd - där tas färgen
    # nästan helt bort, annars läser dagen som skymning.
    keep = 0.62 * (1 - 0.8 * sun_streak) * (1 - 0.7 * sky_weight)
    chroma = (src - lum[..., None]) * keep[..., None]
    chroma[..., 0] *= 0.45  # bort från solnedgångens orange
    chroma[..., 1] *= 1.1  # lite mer grönska
    out = base_lum[..., None] * tint + chroma

    # 3. Himmelsgradient: klar, lugn blå himmel - mättad överst, ljusare mot
    #    horisonten. Molnen behåller sin form som ljusare partier. Bara där
    #    originalet faktiskt är ljus himmel, som på morgonen.
    t = yy / 330
    sky_col = np.stack([0.4 + 0.3 * t, 0.58 + 0.22 * t, 0.83 + 0.07 * t], -1)
    cloud_light = smooth(lum, 0.55, 0.9)[..., None] * 0.28
    sky_mix = (sky_weight * smooth(lum, 0.28, 0.5))[..., None] * 0.72
    out = out * (1 - sky_mix) + (sky_col + cloud_light) * sky_mix

    # 4. Sjön speglar himlen där solstrimman låg: en sval, ljusblå spegling i
    #    stället för en ljus pelare.
    lake_sky = np.array([0.5, 0.62, 0.74], np.float32)
    reflect = (lake_streak_zone * 0.3)[..., None]
    out = out * (1 - reflect) + lake_sky * (0.6 + 0.4 * base_lum[..., None]) * reflect

    # 5. Lätt luftperspektiv över berg och bortre skog - mycket mindre än
    #    morgonens dis, och ingen dimma på sjön.
    haze_col = np.array([0.72, 0.8, 0.88], np.float32)
    haze = (distance_haze * 0.09)[..., None]
    out = out * (1 - haze) + haze_col * haze

    # 6. Varma ljuskällor: elden syns även i dagsljus, fönstren knappt - ett
    #    tänt fönster mitt på dagen ska inte dra blicken.
    warmth = smooth(r - b, 0.18, 0.45) * smooth(lum, 0.35, 0.75)
    glow = (warmth * np.maximum(cabin_zone * 0.2, fire_zone))[..., None] * 0.5
    out = out * (1 - glow) + src * glow

    return to_image(out)


# --- Kväll ------------------------------------------------------------------
# Blåtimmen efter solnedgången: solen har gått ner bakom bergen där den stod
# (sun_zone), så bara en svag restglöd ligger kvar vid horisonten där. Ljuset
# ligger mellan eftermiddagens solnedgång och natten, och stugan och elden
# börjar bära mer av ljuset.


def relight_evening(src: np.ndarray) -> Image.Image:
    r, b = src[..., 0], src[..., 2]
    lum = 0.2126 * r + 0.7152 * src[..., 1] + 0.0722 * b

    # 1. Highlights-komprimering: solskivan och solstrimman i sjön tas bort,
    #    hårdare inom sol- och strimzonerna.
    k = 1.2 + 2.4 * np.maximum(sun_zone, lake_streak_zone * 0.85)
    lum_n = lum * (1 + k * 0.3) / (1 + k * lum)

    # 2. Skymningens grundton: lägre exponering och något kallare omgivningsljus.
    #    Mindre originalfärg än dagen, och solnedgångens orange dras mot neutralt.
    ev_lum = np.power(lum_n, 1.08) * 0.72
    tint = np.array([0.84, 0.9, 1.1], np.float32)
    sun_streak = np.maximum(sun_zone, lake_streak_zone)
    keep = 0.34 * (1 - 0.8 * sun_streak) * (1 - 0.6 * sky_weight)
    chroma = (src - lum[..., None]) * keep[..., None]
    chroma[..., 0] *= 0.6
    out = ev_lum[..., None] * tint + chroma

    # 3. Himmelsgradient: djup blå-lila överst, ljusare och svagt varm mot
    #    horisonten. Restglöden ligger där solen gick ner (sun_zone), inte över
    #    hela himlen. Bara på pixlar som är ljus himmel i originalet.
    t = yy / 330
    sky_col = np.stack([0.16 + 0.26 * t, 0.17 + 0.2 * t, 0.34 + 0.16 * t], -1)
    afterglow = np.array([0.62, 0.44, 0.38], np.float32) * (sun_zone * 0.7 * t)[..., None]
    sky_mix = (sky_weight * smooth(lum, 0.28, 0.5))[..., None] * 0.62
    out = out * (1 - sky_mix) + (sky_col + afterglow + ev_lum[..., None] * 0.3) * sky_mix

    # 4. Sjön: där solstrimman låg speglar den nu skymningshimlen - mörkare och
    #    utan pelare.
    lake_dusk = np.array([0.2, 0.22, 0.34], np.float32)
    reflect = (lake_streak_zone * 0.35)[..., None]
    out = out * (1 - reflect) + lake_dusk * (0.7 + 0.6 * ev_lum[..., None]) * reflect

    # 5. Varma maskade ljuskällor: fönster, dörr, deras spegling och elden
    #    framträder tydligare än på dagen men lågmält (80 % av nattens styrka).
    warmth = smooth(r - b, 0.18, 0.45) * smooth(lum, 0.35, 0.75)
    glow = (warmth * light_zone)[..., None] * 0.8
    warm_keep = src * np.array([1.0, 0.84, 0.64], np.float32) * 0.9
    out = out * (1 - glow) + warm_keep * glow

    # 6. Eldsken: samma mjuka avfall som natten men svagare - omgivningsljuset
    #    finns fortfarande kvar, så elden lyser inte upp lika mycket.
    dist = np.hypot(xx - 1555, (yy - 800) / 0.8)
    spill = np.exp(-((dist / 330) ** 2)) * 0.32 * smooth(lum, 0.05, 0.5)
    out = out + (src * np.array([0.55, 0.36, 0.2], np.float32)) * spill[..., None]

    return to_image(out)


PHASES = {
    "night": relight_night,
    "morning": relight_morning,
    "day": relight_day,
    "evening": relight_evening,
}


def main(phases: list[str]) -> None:
    for phase in phases:
        relight = PHASES[phase]
        for name in SOURCES:
            image = relight(load(SCENES / f"{name}.webp"))
            assert image.size == (W, H), image.size

            # Export: original (1672x941) plus 1200- och 800-varianterna,
            # nedskalade från den fulla bilden med Lanczos.
            image.save(SCENES / f"{name}-{phase}.webp", "WEBP", **WEBP_OPTIONS)
            for width, height in RESPONSIVE_SIZES:
                image.resize((width, height), Image.LANCZOS).save(
                    SCENES / f"{name}-{phase}-{width}.webp", "WEBP", **WEBP_OPTIONS
                )
            print(f"skrev {name}-{phase}.webp (+1200, +800)")


if __name__ == "__main__":
    requested = sys.argv[1:] or list(PHASES)
    unknown = [phase for phase in requested if phase not in PHASES]
    if unknown:
        sys.exit(f"okänd fas: {', '.join(unknown)} (välj bland {', '.join(PHASES)})")
    main(requested)
