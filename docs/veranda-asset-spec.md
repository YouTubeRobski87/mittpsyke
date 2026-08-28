# Kvällsstugan – Veranda Asset Spec

## Status

- V1B.1 asset specification
- V1B.2: två beslut tillagda efter asset-QA mot nuvarande master, se
  avsnitt 3 (inbakad matta tas bort) och avsnitt 5 (rug-justering skjuts upp)
- Implementation not started
- Eligibility already implemented separately (`src/lib/evening-interior-memory.ts`, commit `09abf93d`)
- No veranda/dörr assets currently exist i repot

Detta dokument är **source of truth** för Veranda V1B-assets. Alla koordinater är
procent av bildens bredd respektive höjd, mätta mot masterbilden
`static/images/scenes/cabin-interior-evening-resting-v1.webp` (1672 × 941).

---

## 1. Beslutad dörrlösning

**Solution C** – glasad verandadörr integrerad i **vänstra** delen av befintligt
fönsterparti.

| | |
|---|---|
| Dörröppning | x 4,5–20,5 % |
| | y 3–66,5 % |

### Varför vänster ände valdes

- **Tommaste delen av scenen.** x 0–20 % innehåller idag bara en varmt upplyst
  timmerstolpe (x 1,8–4,5 %) och en grantopp i siluett bakom glaset. Dörren fyller
  ett tomrum i stället för att tränga in i en befintlig komposition.
- **Höger sida är upptagen.** x 59,5–100 % rymmer karmpost, kamin (x 63–70 %),
  sidobord med lampa (x 69–83 %), soffa (x 70–100 %) och personen (x 77–96 %).
  En dörr där hade lagt ännu en upplyst rektangel intill kaminluckans glöd.
- **Moon- och water-overlays kolliderar inte.** Månbågen ligger på scen-x
  21,3–35,1 % och vattenringarnas mask på x 27,5–51,5 % – båda helt utanför
  dörren. Se avsnitt 7.
- **Fönstret har redan nästan golvhög karm.** Glasets underkant ligger på y 49,5 %
  och golvlinjen på y 66,5 %; bröstningen däremellan är bara ~15 % av bildhöjden.
  Att låta en dörr gå till golvet i samma vägg kräver ingen ombyggnad av rummet.

Alternativ A (ombyggd vänstervägg med massiv trädörr) förkastades: bygger om en
vägg som inte behöver byggas om. Alternativ B (dörr nära högerkanten) förkastades:
kräver att kamin eller karmpost flyttas och riskerar bokens position.

---

## 2. Door state strategy

- **Closed door baked into new base interior**
- **Separate `interior-door-ajar.png`**
- 368 × 706 px
- RGBA / transparent PNG
- z-index **1** – samma lager som bok/matta/filt, under lampskenet (z 2) och under
  följeslagaren (z 3)
- Closed + ajar **renderas från samma master/session** för visuell matchning

### Varför B och inte C (två kompletta interiörbilder)

Två genererade helbilder blir aldrig pixelidentiska i personen, lampan och
kaminglöden. Ett byte mellan dem skulle synas som ett ryck i hela rummet. Dessutom
dubbleras ~300 kB och båda måste hållas i synk för all framtid.

Varför inte A (bara på glänt): då finns inget läge före eligibility.

### Produktionsvillkor

Båda lägena ska renderas i **samma session från samma master-scen**, där enda
skillnaden är dörrbladets läge. Overlayen beskärs sedan ur den öppna renderingen.
Då är karm, ljus och ådring garanterat identiska, och sömmen hamnar exakt på
karmens innerkant – en hård arkitektonisk linje som döljer allt.

### Overlay-placering

| | |
|---|---|
| Filnamn | `interior-door-ajar.png` |
| Katalog | `static/images/evening/interior/` |
| Pixelmått | 368 × 706 px |
| Format | PNG med alfa |
| Bounding box i scenen | x 2–24 %, y 1–76 % |
| Ankarpunkt | övre vänstra hörnet vid (2 %, 1 %), bredd 22 % av scenbredden |
| Lagerordning | z-index 1 |

Innehåll: det öppna dörrbladet svängt utåt, den fria öppningen med en skymt av
verandans trall och räcke, det svalare uteljuset i öppningen, och ett mjukt
ljusfall på golvet.

**Aliasing:** mjuk alfakant (1–2 px feather) längs bladets ytterkontur, men helt
opak över hela dörröppningen x 4,5–20,5 %, y 3–66,5 %, så den stängda dörrens glas
aldrig lyser igenom.

**Framtida animation:** eftersom overlayen är ett eget element räcker
opacity-övergång, samma mönster som `interior-rug-arrive`. Ingen sprite-sheet.

---

## 3. Interior continuity

Följande ska behållas visuellt oförändrat i den nya basbilden:

- samma perspektiv
- samma ljusriktning
- samma färgtemperatur
- samma rum
- samma fönsterutsikt
- samma kamin
- samma soffa
- samma person
- samma scenkänsla

Det ska se ut som att dörren alltid funnits där.

### Ett medvetet undantag: den inbakade mattan

Nuvarande master `cabin-interior-evening-resting-v1.webp` har en vävd jutematta
**inbakad i golvet** från y ≈ 74 % och ned. Eftersom `rug.png` läggs ovanpå den
visar dagens scen två mattor samtidigt.

**Beslut (V1B.2): den inbakade mattan tas bort ur den nya basbilden.** Golvet ska
vara rena plankor.

Detta är den enda avsiktliga avvikelsen från kravet ovan. Att golvet blir tommare
innan `rug.png` visas är accepterat – det är mer konsekvent med
interior-memory-idén, där mattan ska *tillkomma* och inte redan finnas i basen.
Alternativet hade varit att bygga vidare på ett känt visuellt fel.

### Får absolut inte flyttas

| Element | Position |
|---|---|
| Horisont / bortre strandlinje | y 34,5 % |
| Ljuspunkten på andra sidan sjön + reflex | x 38 %, y 32 % → reflexpelare ned till y 40 % |
| Öppen vattenyta för vattenringarna | x 27,5–51,5 %, y 34,8–42,2 % |
| Månbågens korridor | x 21,3–35,1 %, y 9,9–18,2 % |
| Fönstrets högra karmpost | x 59,5–62 % |
| Fönsterbänk / underkarm | y 49,5–52 % |
| Vägg/golv-linjen | y 66,5 % |
| Kamin inkl. glödande lucka | x 63–70 %, y 46–71 % (lucka x 64,3–68 %, y 50–63 %) |
| Sidobord, kruka, skål, lampa | x 69–83 %, y 25–66 % |
| Lampans ljuskälla (scenens key light) | x ≈ 80 %, y ≈ 30 % |
| Soffa | x 70–100 %, y 29–72 % |
| Personen | x 77–96 %, y 29–56 % |
| Golvbrädornas riktning och konvergens | y 67–100 % |

### Interiör asset-spec

**Namn:** `cabin-interior-evening-resting-door-v1.webp` – inte `...-veranda-v1`.
Repots convention namnger scenbilder efter vad man ser, och man ser en dörr.

| | |
|---|---|
| Master | 1672 × 941 px, WebP, quality 82, ≤ 200 kB |
| 1200-variant | 1200 × 675 px, quality 80, ≤ 110 kB |
| 800-variant | 800 × 450 px, quality 78, ≤ 55 kB |
| Aspect ratio | 1,7768 |
| Färgrymd | sRGB, opak |

### Dörrens exakta placering

| Del | x | y |
|---|---|---|
| Yttre karm/foder | 3,5–21,5 % | 1,5–67 % |
| Dörröppning (karm innerkant) | 4,5–20,5 % | 3–66,5 % |
| Dörrblad | 5–20 % | 3,5–66 % |
| Glasparti | 6–19 % | 6–46 % |
| Nedre träspegel | 6–19 % | 46–64 % |
| Handtag | 17,5–19,5 % | 40–43 % |
| Tröskel | 4,5–20,5 % | 65,5–67 % |

Verklig storlek vid scenens skala (fönsterglaset ≈ 2,7 m brett över 53,7 % av
bildbredden ⇒ 1 % bildbredd ≈ 4,9 cm): **dörrbladet blir ca 0,74 × 1,86 m**.
Medvetet smalt och lågt – rätt proportion för en äldre stuga.

**Dörrtyp:** utåtgående enkeldörr i massivt trä, spegeldörr med glas i övre två
tredjedelar. **Glasandel ca 62 % av bladet.** Glaset delat i 2 × 2 rutor av smala
spröjs (~0,8 % bildbredd), horisontell spröjs på y ≈ 26 % – tydligt ovanför
horisonten på y 34,5 %, så sjön aldrig delas av en list.

**Handtag:** enkelt smitt järnhandtag, mörkt, litet, ingen blank mässing.

**Karm:** samma målade grå-vita snickeri som fönstrets befintliga karm på
x 4,5–5,8 %, samma bredd, samma slitna yta.

**Träslag/färg:** samma varma furu-/tjärbruna timmer som stolpen på x 1,8–4,5 %
och bröstningen på y 52–66 %. Dörrbladet något mörkare än väggen, matt, med synlig
ådring och lite nött kant vid handtaget – handgjort, inte fabriksnytt.

**Vad som syns genom glaset:** exakt samma landskap som idag ligger bakom
x 5,8–20,5 % – grantoppen i siluett, den mörka strandkanten och skymningshimlens
gradient. Horisonten på y 34,5 % ska löpa obruten genom dörrglaset och vidare ut
i fönstret.

**Påverkan på fönstret:** glaset börjar nu på x 21 % i stället för x 5,8 %.
Fönstrets högra karmpost, överkant, underkant och bänk är oförändrade. Mellan
dörrfoder och fönsterkarm sitter en gemensam stolpe på x 20,5–21 %.

**Safe area desktop:** hela bilden syns. Scenkolumnen blir ca 911 × 512 px vid
maxbredd – ingen beskärning.

**Safe area mobil:** håll allt funktionellt innanför x 5–95 %. Se avsnitt 6.

---

## 4. Horizon

> **horizon y = 34,5 %**

**Kritisk continuity constraint för både interiör och veranda.** Detta är den
enskilt viktigaste siffran i hela specen. Avviker horisonten mellan de två
bilderna upphör verandan att kännas som samma plats, oavsett hur väl allt annat
matchar.

---

## 5. Book / rug / blanket

Lägena är framräknade ur CSS plus varje PNG:s faktiska alfa-bounding-box, inte
enbart ur `left`/`top`.

| Objekt | Faktiskt synligt läge | Bedömning |
|---|---|---|
| **Book** (`boken.png`, 1659 × 948, alfa x 24,2–76,8 %, y 27,1–82,8 %) | scen x 59,0–63,5 %, y 49,8–54,5 % | **unchanged** |
| **Rug** (`rug.png`, 1552 × 441) | scen x 3,4–80,6 %, y 63,0–99,6 % | **unchanged** |
| **Blanket** (`blanket.png`, 536 × 575) | scen x 72,6–91,4 %, y 40,1–75,9 % | **unchanged** |

Behåll nuvarande procentpositioner. Ingen av de tre behöver flyttas.

### Villkor

Ljusfallet från den öppnade dörren ska **tona ut före y 74 %**, med mjuk uttoning
som börjar redan vid y 70 %, och får inte visuellt störa mattans område.

Mattans överkant ligger på y 63 % – bara 3,5 procentenheter under tröskeln – och
mattan är en separat overlay som kan finnas eller inte finnas. Ett ljuspölsljus med
hård kant hade fått en synlig avskuren kant när mattan dyker upp. Låg kontrast,
ingen skarp kant.

### Geometrisk konflikt mellan matta och tröskel

Uppmätt mot nuvarande master: vägg/golv-linjen ligger på y 66–67 %, men `rug.png`
börjar synligt på y 63,0 % och dess bortre kant stiger vänster→höger. Från cirka
x 14 % passerar kanten över golvlinjen; vid x 20,5 % ligger den på y ≈ 63,5 %,
alltså ~3 procentenheter **upp på väggen**.

Det är ett befintligt fel i dagens scen, men det ligger exakt i dörrens zon. Med
dörren på plats hamnar mattans bakkant ovanför tröskeln (y 65,5–67 %), och dörren
ser ut att stå bakom mattan.

**Beslut (V1B.2): tröskeln ligger kvar, mattan justeras.** Dörrens arkitektur
styr scenen. Tröskeln på y 65,5–67 % följer den faktiska vägg/golv-linjen och är
rätt. `rug.png` flyttas i stället ned så att bakkanten hamnar under tröskeln.

**Justeringen får inte göras nu.** Ordningen är:

1. den nya basinteriören produceras, utan inbakad matta
2. nuvarande `rug.png` läggs ovanpå i nuvarande koordinater
3. överlappningen mot tröskeln mäts i den faktiska kompositen
4. minsta nödvändiga flytt anges i procent och genomförs

Att gissa en ny koordinat innan basbilden finns vore att flytta mattan mot en
tröskel som ännu inte är renderad. **Book och blanket är fortsatt unchanged** tills
QA mot den nya mastern visar annat.

---

## 6. Mobile crop

Uppmätt mot den faktiska CSS-kedjan: `.evening-page { width: min(100% − 1.25rem,
44rem) }` → `.evening-scene { aspect-ratio: 16/9; min-height: 180px }` →
`object-fit: cover`.

- source aspect ≈ **1,7768**
- scene box ≈ **1,7778**
- i praktiken **ingen relevant crop**
- först under cirka **360 px viewport** uppstår ungefär **3,1 % sidcrop per sida**

| Viewport | Scenbox | Beskärning |
|---|---|---|
| 320 px | 300 × 180 | 3,10 % per sida i sidled |
| 360 px | 340 × 191 | ingen |
| 375 px | 355 × 200 | ingen |
| 390–430 px | upp till 410 × 231 | ingen |
| 768 px | 704 × 396 | ingen |
| desktop | ~911 × 512 | ingen |

### Slutsats

**Dörren behöver inte flyttas mot mitten av mobilskäl.** Kravet blir enkelt och
generöst: håll alla funktionella element innanför **x 5–95 %**.

800 × 450 är projektets norm för minsta variant och behålls. Vid 320 px överlever
dörren på x 4,5–20,5 % med 1,4 procentenheters marginal, och dess klickbara kärna
helt.

---

## 7. AmbientWorld constraints

- **moon arc:** scene x 21,3–35,1 % (y 9,9–18,2 %)
- **water ripple mask:** x 27,5–51,5 % (y 34,8–42,2 %)
- **dörr x 4,5–20,5 % ligger utanför dessa zoner**

Månbågen härleds ur `getMoonPosition` (x 31 → 55 % inne i `.cabin-window-view`,
som spänner scen-x 3,5–61 %, y 4–53 %).

Verandan ska använda **samma world-state** som resten av MittPsyke. Ingen separat
veranda-timer och ingen egen state machine.

### Safe zones på verandan

| Lager | Fri zon | Får inte innehålla |
|---|---|---|
| Moon | x 34–72 %, y 6–26 % | takutsprång, grenar, lykta, räcke |
| Cloud | x 28–100 %, y 4–30 % | grenar över mer än 15 % av zonen |
| Water ripple | x 30–92 %, y 36–46 % | räcke, baluster, vegetation |
| Framtida dimma | x 26–100 %, y 33–40 % | fasta objekt |

Takutsprånget är därför begränsat till x 0–32 %, y 0–9 % och får aldrig löpa tvärs
över bilden – annars äter det månzonen.

---

## 8. Veranda scene

**Namn:** `cabin-veranda-evening-v1.webp`. Samma tre storlekar och kvalitetsmål
som interiören.

### Visuell riktning

- liten träveranda
- enkel och skyddad
- trätrall
- enkelt räcke
- en stol eller liten bänk
- liten lykta
- stugvägg
- dörr tillbaka
- samma sjö/natur som i interiörens fönster

Känsla: **"gå ut och stå en stund"**

Inte: nytt rum, lyxig altan, lounge, feature space, gamification.

### Exakt komposition

Kameran står på trallen strax utanför dörren, vriden ca 25° från fönstrets
siktlinje så att stugväggen kommer in i vänsterkant. Stugvägg + dörr till
**vänster**, eftersom dörren sitter i interiörens vänstra ände; går man ut och
vänder sig mot sjön hamnar dörren rumsligt bakom-till-vänster.

| Element | x | y |
|---|---|---|
| Stugvägg (vikande plan) | 0–26 % | 0–80 % |
| Takutsprång / skärmtak | 0–32 % | 0–9 % |
| Verandadörr, glasad, öppningen | 6–21 % | 8–60 % |
| Dörrblad | 6,5–20,5 % | 8,5–59,5 % |
| Lykta (väggmonterad, höger om dörren) | 22–27 % | 26–34 % |
| Räcke, överliggare | 26–100 % | 47 % vid x 27 → 57 % vid x 100 |
| Räcke, balusterzon | 26–100 % | 50–70 % |
| Bänk (enkel, ryggstödslös, mot räcket) | 32–54 % | 48–70 % |
| Horisont / bortre strand | 26–100 % | **34,5 %** |
| Sky area | 26–100 % | 0–34,5 % |
| Lake area | 26–100 % | 34,5–47 % |
| Floor / deck area | 0–100 % | 60–100 % |

Räckets överliggare ligger genomgående **under** horisonten, så sjön och den
bortre stranden aldrig skyms. Utsikten öppnar sig mot höger där räcket ligger
lägre.

**Höjdkänsla:** mellan balusterna på x 27–100 %, y 52–68 % ska marken falla bort –
antydan om berghäll och vattenbryn nedanför. Ingen mark syns i nederkant.

### Perspektiv

| | |
|---|---|
| Ögonhöjd | ~1,45 m – samma observatör som i interiören |
| Horisontlinje | y 34,5 % i båda bilderna |
| Försvinningspunkt | x 55 %, y 34,5 % |
| Bildvinkel | ~35 mm fullformatsekvivalent, ca 54° horisontellt. Aldrig vidare än 28 mm |
| Trallens linjer | löper parallellt med stugväggen, konvergerar mot VP på x 55 %, y 34,5 % |
| Räcket | följer samma konvergens; överliggaren stiger från y 57 % vid x 100 % till y 47 % vid x 27 % |
| Stugväggen | takfoten faller från y 0 % vid x 0 till y 9 % vid x 32 %; vägg/trall-linjen stiger från y 80 % vid x 0 till y 58 % vid x 26 % |

Ingen fisheye, ingen tiltad horisont, ingen dramatisk lågvinkel.

### Same-world continuity

Dessa element måste återkomma, i prioritetsordning:

1. **Horisonten på y 34,5 %** – icke förhandlingsbar
2. **Den varma ljuspunkten på andra sidan sjön.** I fönstret ligger den på x 38 %,
   y 32 % med lodrät reflexpelare ned till y 40 %. På verandan ska den ligga på
   **x 46–52 %, y 33 %** med samma reflexpelare ned till y 40 %. Det enskilda
   landmärke som säger "samma sjö"
3. **Spegelblankt vatten** med mjuka horisontella reflexband, ingen krusning i
   basbilden – vattenringarna läggs på som lager
4. **Låga skogklädda höjder** på horisonten, siluettoppar y 29–34 %
5. **Skymningsgradienten:** djup indigo överst (y 0–15 %), blått (15–24 %), varmt
   rosa-magenta band närmast horisonten (24–34 %)
6. **Höga granar i siluett** som ram: grupp på x 82–100 %, y 8–40 %, plus en
   enstaka smal stam på x 28–32 %
7. **Låg strandvegetation** vid vattenbrynet, y 42–48 %

Sjön löper vänster–höger med bortre stranden ungefär vinkelrätt mot
blickriktningen. Skapa inget nytt landskap. Om något måste vika är prioritet 1–3
de som absolut inte får ändras.

---

## 9. Lighting

Basbilderna renderas i **kväll/skymning** – samma modell som interiören redan har,
där en enda bild täcker alla fyra dygnslägen och `getEveningLampCssVariables` bara
varierar lampskenets opacitet. Ingen separat dygnsserie i V1.

- **outside cooler:** svalt omgivningsljus, 7500–9000 K, blå-violett
- **cabin light warmer:** varmt 2700 K bärnstensljus
- **varmt ljus får falla ut över närmaste plankor:** x 6–34 %, y 60–82 %, mjuk
  uttoning, ingen hård kant
- **lykta lågmäld:** 2200–2500 K, låg intensitet, lyser upp en radie på ~8 % av
  bildbredden. En accent, inte huvudljus
- **ingen HDR**, ingen hård kontrast
- **ingen neonblå natt**
- **ingen överdriven orange ton**, ingen övermättnad
- ingen bloom, ingen lens flare, ingen dramatisk filmisk rimlight
- håll skuggorna öppna, matt och dämpad palett

---

## 10. Exact asset list

Sju filer totalt.

| Path | Filnamn | Mått | Format | Alfa | Purpose |
|---|---|---|---|---|---|
| `static/images/scenes/` | `cabin-interior-evening-resting-door-v1.webp` | 1672 × 941 | WebP q82 | opaque | Ny basinteriör, master. Stängd verandadörr |
| `static/images/scenes/` | `cabin-interior-evening-resting-door-v1-1200.webp` | 1200 × 675 | WebP q80 | opaque | Basinteriör, mellanvariant för srcset |
| `static/images/scenes/` | `cabin-interior-evening-resting-door-v1-800.webp` | 800 × 450 | WebP q78 | opaque | Basinteriör, minsta variant för srcset |
| `static/images/scenes/` | `cabin-veranda-evening-v1.webp` | 1672 × 941 | WebP q82 | opaque | Verandascen, master |
| `static/images/scenes/` | `cabin-veranda-evening-v1-1200.webp` | 1200 × 675 | WebP q80 | opaque | Verandascen, mellanvariant |
| `static/images/scenes/` | `cabin-veranda-evening-v1-800.webp` | 800 × 450 | WebP q78 | opaque | Verandascen, minsta variant |
| `static/images/evening/interior/` | `interior-door-ajar.png` | 368 × 706 | PNG | **transparent** | Dörr på glänt, overlay över basinteriören |

Sex helscensfiler ligger i `static/images/scenes/` – repots convention för
helscener. `static/images/evening/interior/` innehåller uteslutande transparenta
overlays, och dörr-overlayen hör därför hemma där tillsammans med `rug.png`,
`blanket.png` och `boken.png`.

Ingen `evening/veranda/`-katalog behövs. Naming convention ändras inte.

Befintliga `cabin-interior-evening-resting-v1*` behålls tills dörrvarianten är
verifierad.

---

## 11. Hotspot zones

| | Interior door | Veranda return door |
|---|---|---|
| Visuell bounding box | x 4,5–20,5 %, y 3–66,5 % | x 6–21 %, y 8–60 % |
| Rekommenderad klickyta | x 5–20 %, y 6–66 % | x 6,5–20,5 %, y 10–59 % |
| Desktop (911 × 512) | 137 × 307 px | 128 × 251 px |
| Mobil 375 px (355 × 200) | 53 × 120 px | 50 × 98 px |
| Mobil 320 px, efter crop | 51 × 108 px | 48 × 88 px |
| Minimum touch target 44 × 44 px | uppfylls i alla lägen | uppfylls i alla lägen |

Ingen av zonerna överlappar något annat interaktivt element – scenen innehåller
idag inga andra klickytor, och boken ligger på x 59–63,5 %, y 49,8–54,5 %.

Dörrarna är stora nog att kännas självklara utan knapp-overlay, ram eller ikon.

---

## 12. Companion future safe zone

Ingen companion-asset och ingen ny pose i V1B.

Reservera på verandan:

- **Naturlig ligg-/sittyta:** öppen trall på **x 55–80 %, y 62–95 %** – plan yta,
  framför räcket, i det varma ljuset från dörren
- Kolliderar inte med dörr (x 6–21 %), lykta (x 22–27 %), bänk (x 32–54 %) eller
  räckets överliggare
- Ligger utanför alla AmbientWorld-zoner i avsnitt 7
- Håll ytan fri från plankskarvar med hög kontrast och från lyktans skuggmönster,
  så en frilagd följeslagare kan placeras där utan att se pålagd ut

---

## 13. Asset production prompts

Prompterna är på engelska; bildverktyg följer engelska rumsliga instruktioner
betydligt mer tillförlitligt.

> **V1B.2 prompt hardening:** critical visual state is expressed positively near
> the top of each prompt because repeated renders ignored equivalent late-stage
> negative constraints.

### A. Interior master with veranda door

```
OUTPUT ONE SINGLE SCENE ONLY.

Do not create:
- triptych
- contact sheet
- comparison image
- side-by-side layout
- labels
- letters A, B or C
- captions
- borders
- white separators

The entire 1672 x 941 canvas must contain one full scene.

OUTPUT:
- exactly one image
- 1672 x 941 pixels
- 16:9
- full-frame scene
- no embedded labels
- no border
- no contact sheet
- no crop
- highest possible quality

SUBJECT: the only living subject in the room is one resting woman in a
rust-red knitted sweater, asleep on her side with her head on a cushion,
calm and unposed. She is the same woman in every render of this scene.

No other person.
No bear.
No fox.
No wolf.
No dog.
No cat.
No bird.
No animal of any kind.

BASE INTERIOR STATE:

- bare wooden plank floor
- empty sofa apart from the resting woman and ordinary sofa cushions
- empty coffee table
- no persistent-memory objects are present in the base scene
- the separate book, rug and blanket are NOT part of this base image

The floor must be completely bare wooden planks.
There must be no rug, mat or carpet anywhere in the room.

The sofa must not have any draped blanket, throw or plaid.
Only the resting woman and ordinary fixed sofa cushions may be present.

The coffee table and window ledge must not contain any book.

These objects are added later by the product as separate persistent
visual layers.

CAMERA LOCK:

This render is one frame of a matched closed/ajar pair.

The closed and ajar versions must use:
- identical camera position
- identical focal length
- identical crop
- identical horizon
- identical furniture placement
- identical woman pose
- identical window geometry
- identical lighting
- identical color balance
- identical landscape

The ONLY material difference between A and C is the veranda door state
and its local light spill.

No object may shift between the two renders.

Painterly digital illustration of a cozy Nordic timber cabin interior at
twilight, viewed from inside. Horizontal 16:9, 1672x941.

CAMERA: one-point perspective, 35mm equivalent lens, eye level 1.45m,
horizon line exactly at 34.5% from the top of the frame, vanishing point
at 55% width. No wide angle distortion, no fisheye, level horizon.

LAYOUT (percentages of frame width/height):
- Left 4.5-20.5%, from 3% down to 66.5%: a CLOSED outward-opening timber
  veranda door set into the same wall plane as the window. Glazed upper
  two thirds (6-19% wide, 6-46% tall) divided into 2x2 panes by slim
  glazing bars, horizontal bar at 26% height. Solid timber lower panel
  from 46-64%. Small dark wrought-iron handle at 17.5-19.5%, 40-43%.
  Painted grey-white frame matching the window joinery. Aged matte wood,
  visible grain, slightly worn edge near the handle. Handmade, old, not
  factory-new.
- 21-59.5% wide, 2-49.5% tall: large picture window, same painted frame.
- Through both door glass and window: a calm mirror-still lake at
  twilight. Far shore and low forested hills silhouetted, waterline at
  34.5%. A single small warm lamp on the far shore at 38% width, 32%
  height, with a vertical reflection column down to 40%. Tall dark
  conifer silhouettes framing left and right. Sky gradient: deep indigo
  at top, blue at 15-24%, warm pink-magenta band at 24-34%.
- 59.5-62%: window post. 63-70% wide, 46-71% tall: small black cast-iron
  wood stove with a glowing amber oval door at 64-68% wide, 50-63% tall.
- 69-83%: low side table with a dark ceramic pot of dried stems, a warm
  lit bowl, and a slim black table lamp whose shade sits at 77.5-82.5%
  wide, 25-30.5% tall. This lamp is the key light of the scene.
- 70-100% wide, 29-72% tall: a low wooden sofa with soft cushions. A
  woman in a rust-red knitted sweater rests asleep, head on a cushion,
  occupying 77-96% wide, 29-56% tall. Peaceful, unposed.
- Window sill at 49.5-52%. Timber breast wall below. Wall meets the
  wooden plank floor at 66.5%. Floor planks converge toward 55% width.

FLOOR: the floor must be plain bare wooden planks with NO baked-in rug,
carpet, mat or floor covering of any kind. Preserve the existing room
composition otherwise. The veranda door threshold must align naturally
with the existing wall/floor boundary at 66-67%. Leave the floor in
front of the threshold clear and unobstructed, so a separate rug overlay
can be positioned later without overlapping the door.

LIGHT: warm 2700K amber from the table lamp on the right, secondary warm
glow from the stove. Cool 8000K blue-violet twilight outside. Soft open
shadows, muted matte palette, low contrast, gentle falloff.

MOOD: quiet, safe, still, lived-in. Evening calm.

FORBIDDEN: no text, no letters, no numbers, no signage, no logos, no
watermark, no people other than the resting woman, no pets or animals,
no fire in the open, no candles, no clutter, no plants beyond the single
dried arrangement, no rug on the floor, no blanket, no book, no
decorative objects, no HDR, no lens flare, no bloom, no neon, no
oversaturated orange, no dramatic cinematic rim light, no tilted horizon,
no fisheye.
```

### B. Veranda scene

```
OUTPUT ONE SINGLE SCENE ONLY.

Do not create:
- triptych
- contact sheet
- comparison image
- side-by-side layout
- labels
- letters A, B or C
- captions
- borders
- white separators

The entire 1672 x 941 canvas must contain one full scene.

OUTPUT:
- exactly one image
- 1672 x 941 pixels
- 16:9
- full-frame scene
- no embedded labels
- no border
- no contact sheet
- no crop
- highest possible quality

VERANDA CONTENTS. The veranda contains exactly:
- one visible glazed return door
- one simple bench OR one simple chair
- one single lantern total
- wooden decking
- simple railing
- cabin wall
- lake
- forest
- sky

Do not add a second seat.
Do not add a second lantern.

Keep the future companion-safe deck area clear.

No blanket.
No book.
No rug.
No decorative objects.

Painterly digital illustration of a small, simple wooden veranda on a
Nordic timber cabin at twilight, seen from someone standing on the deck.
Same artist, same world, same evening as the cabin interior.
Horizontal 16:9, 1672x941.

CAMERA: 35mm equivalent lens, eye level 1.45m, horizon line exactly at
34.5% from the top of the frame, vanishing point at 55% width, 34.5%
height. Camera rotated about 25 degrees from the cabin wall so the wall
recedes along the left edge. No wide angle distortion, level horizon.

LAYOUT (percentages of frame width/height):
- 0-26% wide: the cabin timber wall receding away from the viewer.
  Wall-to-deck line rises from 80% height at the left edge to 58% at 26%.
- 0-32% wide, 0-9% tall: a modest roof overhang. It must NOT extend
  further right than 32%.
- 6-21% wide, 8-60% tall: a glazed timber door back into the cabin,
  slightly ajar, warm amber light spilling out. Same door design as the
  interior: glazed upper two thirds with 2x2 panes, solid lower panel,
  small dark iron handle, aged matte wood.
- 22-27% wide, 26-34% tall: a small wall-mounted lantern with a low,
  warm 2300K flame. Modest, not a main light source, no bloom.
- 26-100% wide: a simple wooden railing. Top rail runs from 47% height
  at 27% width down to 57% height at the right edge. Plain vertical
  balusters between 50% and 70% height. Handmade, slightly uneven, not
  architect-perfect.
- 32-54% wide, 48-70% tall: one plain backless wooden bench against the
  railing, seen from behind and slightly to the side.
- Beyond the railing: the SAME lake as seen through the cabin window.
  Mirror-still water from 34.5% to 47% height. Far shore and low forested
  hills silhouetted with tops at 29-34%. A single small warm lamp on the
  far shore at 46-52% width, 33% height, with a vertical reflection
  column down to 40%. Low shoreline shrubs at 42-48%.
- Sky 0-34.5%: deep indigo at top, blue at 15-24%, warm pink-magenta band
  at 24-34%. Tall dark conifer silhouettes at 82-100% wide, 8-40% tall,
  and one slender trunk at 28-32%.
- Ground falls away below the deck. Between the balusters at 27-100%
  wide, 52-68% tall, glimpses of rock and water below give a clear sense
  of height.
- 0-100% wide, 60-100% tall: weathered wooden deck planks running
  parallel to the cabin wall, converging toward the vanishing point.

KEEP CLEAR (no branches, no roof, no railing, no objects):
34-72% wide and 6-26% tall; 28-100% wide and 4-30% tall;
30-92% wide and 36-46% tall; 55-80% wide and 62-95% tall.

LIGHT: cool 8000K blue-violet ambient outside. Warm 2700K light spilling
from the door and window across the nearest planks at 6-34% wide, 60-82%
tall, soft edged. Low warm lantern accent. Soft open shadows, muted matte
palette, low contrast.

MOOD: small, sheltered, personal, quiet. Step outside and stand a while.
Not a luxury deck, not a new room.

FORBIDDEN: no text, no letters, no numbers, no signage, no logos, no
watermark, no people, no animals, no lounge furniture, no fire pit, no
grill, no dining table, no potted plants, no string lights, no cushions,
no decorations, no ornaments, no stairs in frame, no HDR, no lens flare,
no bloom, no neon, no oversaturated orange, no dramatic cinematic rim
light, no tilted horizon, no fisheye.
```

### C. Door-ajar overlay render

C är en **edit av A i samma session**, inte en ny generation. Kör prompten nedan
direkt på den färdiga A-bilden.

```
EDIT THE EXACT PREVIOUS A IMAGE.

Do not regenerate the room.

Change ONLY the veranda door from closed to slightly ajar.

Everything else must remain pixel-consistent as far as the image tool
permits.

OUTPUT ONE SINGLE SCENE ONLY.

Do not create:
- triptych
- contact sheet
- comparison image
- side-by-side layout
- labels
- letters A, B or C
- captions
- borders
- white separators

The entire 1672 x 941 canvas must contain one full scene.

OUTPUT:
- exactly one image
- 1672 x 941 pixels
- 16:9
- full-frame scene
- no embedded labels
- no border
- no contact sheet
- no crop
- highest possible quality

CAMERA LOCK:

This render is one frame of a matched closed/ajar pair.

The closed and ajar versions must use:
- identical camera position
- identical focal length
- identical crop
- identical horizon
- identical furniture placement
- identical woman pose
- identical window geometry
- identical lighting
- identical color balance
- identical landscape

The ONLY material difference between A and C is the veranda door state
and its local light spill.

No object may shift between the two renders.

SUBJECT: the only living subject in the room is the same resting woman in
the rust-red knitted sweater, in the same position as in A.

No other person.
No bear.
No fox.
No wolf.
No dog.
No cat.
No bird.
No animal of any kind.

BASE INTERIOR STATE:

- bare wooden plank floor
- empty sofa apart from the resting woman and ordinary sofa cushions
- empty coffee table
- no persistent-memory objects are present in the base scene
- the separate book, rug and blanket are NOT part of this base image

The floor must be completely bare wooden planks.
There must be no rug, mat or carpet anywhere in the room.

The sofa must not have any draped blanket, throw or plaid.
Only the resting woman and ordinary fixed sofa cushions may be present.

The coffee table and window ledge must not contain any book.

These objects are added later by the product as separate persistent
visual layers.

THE ONE CHANGE:

- Left 4.5-20.5%, from 3% down to 66.5%: the same timber veranda door,
  now standing AJAR, opened outward. The leaf is swung away so mostly its
  inner edge and hinge side are visible. Through the opening: a sliver of
  the veranda wooden decking and railing, lit cool blue-grey from
  outside. A soft, low-contrast warm light spill falls onto the floor
  from the threshold, fading out completely by 74% height. No hard-edged
  pool of light.

Horizon stays at 34.5%. No text, no letters, no numbers, no signage, no
logos, no watermark.
```

Beskär sedan den öppna renderingen till x 2–24 %, y 1–76 % och exportera som PNG
med alfa, 368 × 706.

---

## 14. Implementation handoff

Assets must be approved before:

- [ ] editing `+page.svelte`
- [ ] adding `sceneView`
- [ ] adding door hotspots
- [ ] positioning AmbientWorld on veranda
- [ ] changing any overlay coordinates

V1B implementation must use this document as source of truth.

Ingen kodändring görs innan assetsen finns. Rug-koordinaten justeras först efter
mätning mot den nya mastern, enligt ordningen i avsnitt 5.

### Kända följdarbeten vid implementation

- `.cabin-window-view` spänner x 3,5–61 % och skulle låta molnlagret driva över
  dörrens spröjs och karm. Smalna containern till x 21–61 %, eller acceptera att
  moln passerar bakom dörrglaset.
- `src/routes/dashboard/kvallsstugan/resting-scene.test.ts` låser dagens tre
  `cabin-interior-evening-resting-v1`-filnamn och måste uppdateras samtidigt som
  basbilden byts, annars faller `npm run test` och därmed `prebuild`.
