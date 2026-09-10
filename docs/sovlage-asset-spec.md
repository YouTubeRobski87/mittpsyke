# Kvällsstugan – Sovläge Asset Spec

## Status

- V1 asset specification, **beslutad och låst**. Implementation ej påbörjad.
- Ingen kod ändrad, ingen Sovläge-logik byggd
- Väg D (soffan som bädd) är **avförd**: soffan är redan upptagen av den
  inbakade personen i scenbilden
- Vald väg: **prioritet 1 – separat transparent golvbädd som eget lager**

### Låsta beslut

| Fråga | Beslut |
|---|---|
| Tillgänglighet | **Alltid synlig** i Kvällsstugan |
| Progression | **Ingen.** Ej kopplad till `EveningInteriorMemory`, inget dagkrav |
| Orientering | **Parallell** med bakväggen/fönstret |
| Huvudända | **Vänster** |
| Mattäckning (~65 %) | **Accepterad** |
| Innehåll | Madrass + kudde + löst hopvikt filt |
| Person i bädden | **Nej** |
| Aktivering | Separat hotspot över bädden |

Detta dokument är **source of truth** för Sovläge-assets. Alla koordinater är
procent av bildens bredd respektive höjd, mätta mot den aktuella masterbilden
`static/images/scenes/cabin-interior-evening-resting-veranda-v1.webp` (1672 × 941).

Samma konvention som [veranda-asset-spec.md](veranda-asset-spec.md).

---

## 1. Slutsats: golvbädd, inte säng

Prioritet 1 går att genomföra, men **bara som golvbädd (madrass direkt på
golvet)** – inte som en upphöjd säng eller dagbädd.

### Varför ingen upphöjd säng ryms

Fönstret är ett lågt panoramafönster. Fönsterbänkens ovansida ligger på
y 65,0–65,5 % och dess front slutar på y 68 %. Golvlinjen ligger på y 79,0 %.
Väggen under bänken är alltså bara **11 procentenheter hög** – i verkliga mått
ungefär 0,35–0,55 m.

En bäddbänk eller kökssoffa med ryggstöd (~0,85 m) skulle nå upp till y ≈ 48 %
och täcka den nedre tredjedelen av fönsterglaset. Även en backlös dagbädd med
liggyta på 0,45 m hamnar i höjd med fönsterbänken.

En madrass på golvet (~0,18 m tjock) har sin liggyta på **y ≈ 73–74 %** och en
kudde på **y ≈ 69–71 %** – med marginal under fönsterbänkens front på y 68 %.

Prioritet 2 (sovalkov som ny scenvy) och prioritet 3 (regenererad interiör)
behövs alltså inte. Ingen av dem specificeras här.

---

## 2. Scenens geometri (mätt)

| Referens | Värde |
|---|---|
| Horisont / ögonhöjd | y ≈ 30 % (fjärran strandlinje i fönstret) |
| Flyktpunkt | x ≈ 47 %, y ≈ 30 % |
| Fönsterglasets underkant | y ≈ 62,5 % |
| Fönsterbänkens ovansida | y ≈ 65,0–65,5 % |
| Fönsterbänkens front, underkant | y ≈ 68 % |
| Mörkt väggparti | y 68–79 % |
| **Golvlinje (vägg möter golv)** | **y ≈ 79,0 %** |
| Bildens nederkant | y = 100 % |
| Skalfaktor fram/bak över synligt golv | **1,41×** |

Golvplankorna löper **vinkelrätt mot bakväggen, mot kameran**, i entydigt
enpunktsperspektiv. Skarvarna ligger ~8 % isär vid väggen och ~11,2 % isär vid
bildens nederkant (kvot 1,40) – vilket bekräftar skalfaktorn ovan.

Det synliga golvet är alltså ett mycket grunt band: **21 procentenheter av
bildhöjden**, motsvarande ungefär 0,7–1,5 m djup.

### Upptagen yta i scenen

| x-intervall | Innehåll |
|---|---|
| 0–4,5 % | timmerstolpe |
| 4,5–20,5 % | verandadörr (befintlig hotspot) |
| 25,5–67,2 % | fönstervy-mask, y 7,2–62,2 % |
| 33–58 % | sjövy-mask för vattenringar, y 40,5–50 % |
| 65–70 % | kaminens bottenplåt, y 79–86 % |
| 70–75,5 % | kaminen |
| 74–84 % | sidobord, y 58–63 % |
| 81–89 % | bordslampa, y 40–50 % |
| 78–100 % | soffan, personen på x 84–100 % |
| 14–65 %, y 75,3–101 % | mattan (`rug.png`, villkorad av `hasRug`) |
| 10–36 %, y ~53–98 % | följeslagaren (`.interior-companion`) |

---

## 3. Placering

### Asset-box i scenen

| | |
|---|---|
| **x** | **20 % → 62 %** (bredd 42 %) |
| **y** | **68 % → 101 %** (höjd 33 %, 1 % bleed under nederkanten) |
| CSS | `left: 20%; bottom: -1%; width: 42%;` |

Samma mönster som mattan, som redan använder `bottom: -1%` för att bädda ut
under bildkanten.

**Bindande krav:** toppkanten bestäms av assetens egen aspect ratio, inte av
CSS-höjd. Canvasens proportion måste därför vara **2,26 : 1** (42 % × 1672 px
= 702 px brett, 33 % × 941 px = 311 px högt). Avviker proportionen flyttar sig
toppkanten och kolliderar med fönsterbänken.

**Hård gräns:** inga opaka pixlar över **y 68 %**. Fönsterbänkens front måste
förbli helt fri.

### Motivets placering inne i boxen

| Element | Position |
|---|---|
| Madrassens bortre kant (mot väggen) | vilar på golvlinjen, y ≈ 79–80 % |
| Madrassens främre kant | lämnar bilden vid y = 100 %, beskärs |
| Liggytans ovansida vid bortre kanten | y ≈ 73–74 % |
| Kudde (vänster kortända) | topp y ≈ 69–71 %, **aldrig över y 68 %** |
| Bredd vid bortre kanten | x 22–58 % |
| Bredd vid främre kanten (1,41× perspektiv) | x 16–64 % |

Motivet är alltså en **trapets**, bredare mot betraktaren.

### Orientering (beslutad)

Madrassen ligger med **långsidan parallellt med bakväggen**, huvudändan åt
**vänster**. Kudden hamnar då i kortändan och stiger aldrig mot fönstret – det
är den enda orienteringen som håller sig under y 68 %.

Huvudändan åt vänster, inte höger, av tre skäl: den håller kudden borta från
bokens hotspot (x 59–67 %), den vänder sovplatsen bort från personen i soffan,
och den lägger den mörkaste delen av bädden längst från lampan.

**Förkastat alternativ:** madrassen vriden vinkelrätt mot väggen, fotändan mot
kameran. Den hade bara täckt ~25 % av mattan i stället för ~65 %, men bädden
blir svårare att läsa som bädd när bara ~0,7 m av dess längd syns. Den lägre
mattäckningen vägde inte upp den otydligheten.

---

## 4. Perspektiv och vinkel

- **Enpunktsperspektiv**, flyktpunkt x 47 %, y 30 %.
- Kameran står **rakt mot bakväggen**, ingen rotation, ingen tilt.
- Ögonhöjden ligger ovanför madrassen – vi ser **ned på liggytan**, ungefär
  som mattan ses ned på.
- Madrassens fram- och bakkant är **horisontella**; kortsidorna konvergerar mot
  flyktpunkten: vänster kortsida lutar ned åt vänster, höger kortsida ned åt
  höger.
- Skalan ökar 1,41× från bortre till främre kant.
- Ingen warp, ingen egen linsförvrängning. Mattans kommentar i `+page.svelte`
  gäller lika mycket här: "Mattans egna perspektiv följer golvet utan warp."

**Renderingskrav:** asseten ska renderas från **samma master/session som
interiören**, precis som veranda-specen kräver för dörren. Ett fristående
renderat objekt kommer inte att matcha träets ton, kornighet eller
ljusets färgtemperatur.

---

## 5. Pixelstorlek

| | |
|---|---|
| Renderad storlek i masterbilden | 702 × 311 px |
| **Rekommenderad canvas (2×)** | **1408 × 623 px** |
| Bindande aspect ratio | 2,26 : 1 (±0,01) |
| Transparent marginal | ≥ 8 px runtom, utanför motivets ytterkant |

2× följer befintlig praxis: `rug.png` är 1552 × 441 px och renderas i 853 × 242
px, alltså ~1,8×.

Scenen serveras i högst 860 CSS-px bredd (`sizes="… 860px"`), så 1408 px räcker
med marginal även på 3× DPR.

---

## 6. Ljussättning

Två ljuskällor, **båda till höger om bädden**:

| Källa | Position | Karaktär |
|---|---|---|
| Bordslampa (nyckelljus) | x ≈ 84 %, y ≈ 45 % | varm, ~2200–2600 K, uppifrån höger |
| Kaminluckan (fyllnadsljus) | x ≈ 72 %, y ≈ 71 % | varmare och lägre, orange, nästan i golvhöjd |
| Verandadörren (svagt motljus) | x ≈ 12 %, y ≈ 35 % | kall blå spill, mycket dämpad |

Regler:

1. **Högersidan** av madrassen fångar ett svagt varmt kantljus. **Vänstersidan**
   faller mot kall skugga med en antydan blått spill från dörren.
2. **Kontaktskugga** bakas in i alfan: mjuk, faller åt **vänster och något mot
   betraktaren**, mörkast direkt under madrassens kant, uttonad inom ~4 % av
   scenbredden.
3. **Ingen inbakad lampglöd och ingen specular hotspot.** Scenens `::before` är
   en animerad `radial-gradient` centrerad på 79 % 48 % med 23 % radie – den når
   ut till ungefär x 56 % och skulle dubbleras.
4. **Maximal ljusstyrka:** ingen pixel på bädden får vara ljusare än golvets
   befintliga reflex vid x 20–30 %, y 85 %. Bädden ska ligga i rummets
   mellanton, inte dra blicken från fönstret.
5. Textilen ska vara **mättad men mörk** – ull och lin i dämpad varmgrå, sand
   eller blekt rost. Ingen vit textil: vitt bränner ut i den här exponeringen.

---

## 7. Innehåll: kudde och filt, ingen person

Rekommendation: **madrass + en kudde i vänster kortända + en löst hopvikt
filt**.

- **Inte tom.** En naken madrass läser som övergiven eller klinisk, vilket
  bryter mot "Du är på en trygg plats".
- **Ingen person.** Personen i soffan är redan scenens sovande figur. En andra
  upptagen sovplats gör rummet obegripligt, och bädden ska läsa som *ledig och
  redo för användaren*.
- **Bäddad, inte uppbäddad.** Lätt skrynklig filt, inte hotellstramt.

`cushion.png` och `blanket.png` finns redan i mappen men är renderade för
soffans perspektiv och höjd – **de får inte återanvändas här**.

---

## 8. Filnamn och format

| | |
|---|---|
| Levererad fil | `static/images/evening/interior/floor-bed.webp` |
| Bevarad master | `static/images/evening/interior/floor-bed-master.png` |
| Format | **Transparent WebP** (alfakanal) |
| Målstorlek | ≤ 180 KB |
| srcset | **Nej** – inget annat interiörlager använder det |

Transparent WebP fungerar: CSP:n tillåter `img-src 'self'` och alla
målwebbläsare stöder alfa-WebP.

Att välja WebP i stället för PNG är ett medvetet avsteg från mappens nuvarande
PNG-filer. `rug.png` är 1,7 MB och `blanket.png` 638 KB – ooptimerade. En
WebP-motsvarighet landar på ~120–180 KB. Konventionen som följs är scenmappens
(`cabin-*.webp` med bevarad `.png`-master), inte interiörmappens.

---

## 9. Hotspot

Tyst yta i samma stil som dörrarna och boken: ingen ram, ingen ikon, ingen copy.
Sovläge är en åtgärd i scenen, inte navigation, så det blir ett `<button>` –
samma val som `.scene-door`, inte som `.scene-object-book`.

| | |
|---|---|
| **x** | **38 % → 57 %** (bredd 19 %) |
| **y** | **72 % → 94 %** (höjd 22 %) |
| aria-label | `Lägg dig till rätta` |
| z-index | 4 |
| min-width / min-height | 44 px (samma som `.scene-door`-mönstret) |

Hotspoten ligger medvetet **inte** över hela bädden:

- Följeslagaren står på x 10–36 % och skulle annars aktivera Sovläge när
  användaren klickar på djuret. Hotspoten börjar på 38 %.
- Bokens hotspot ligger på x 59–67 %, y 58,5–68 %. Hotspoten slutar på 57 %.

### Träffyta per brytpunkt

| Viewport | Scenruta | Hotspot |
|---|---|---|
| 375 px | 355 × 200 px | 67 × 44 px ✓ |
| 390 px | 370 × 208 px | 70 × 46 px ✓ |
| 1440 px | 860 × 484 px | 163 × 106 px ✓ |

375 px ligger exakt på 44 px-gränsen. `min-height: 44px` fångar den om
scenrutan skulle krympa ytterligare.

---

## 10. Lagerordning

Nuvarande z-ordning inne i `.evening-scene`:

| z | Lager |
|---|---|
| 1 | fönstervy, sjövy, matta, filt, bok |
| 2 | lampsken (`::before`) |
| 3 | följeslagaren |
| 4 | hotspots |

Golvbädden får **z-index 1** och placeras i DOM **direkt efter mattans block**.

Måste ligga **framför**:
- scenbilden
- mattan (`rug.png`) – samma z-nivå, senare i DOM räcker

Måste ligga **bakom**:
- lampskenet (z 2) – annars får bädden ingen flimmerpåverkan alls
- följeslagaren (z 3) – djuret ska kunna ligga framför bädden
- alla hotspots (z 4)

Ingen konflikt med filten (x 83 %) eller boken (x 60 %) – ingen överlappning, så
inbördes DOM-ordning spelar ingen roll där.

---

## 11. Konsekvenser

### Mattan täcks till ~65 % (accepterat)

Detta går inte att undvika: mattan spänner över x 14–65 % och golvbandet är
bara 21 procentenheter högt. Varje golvstående objekt av bäddstorlek täcker det
mesta av mattan. Mattan syns fortfarande i kanterna, x 14–20 % och x 62–65 %.

Bädden blir scenens golvobjekt; mattan blir dess underlag.

### Progression: ingen (beslutat)

Bädden är **inte** villkorad av `EveningInteriorMemory`, till skillnad från
mattan, filten, boken och verandan. Konkret för implementationen:

- **Ingen `{#if}`-guard.** Bädden renderas alltid, i alla sessioner.
- **Ingen introduktionsanimation.** Motsvarigheten till
  `interior-rug-arrive` / `interior-blanket-arrive` ska inte finnas – den
  hör till lager som dyker upp, och bädden dyker aldrig upp.
- **Ingen ny fält i `EveningInteriorMemory`.** Typen lämnas orörd.
- Bädden hör till interiörlagret och syns därför inte i verandavyn.

### Följdeffekt: mattans introduktionsögonblick blir nästan osynligt

Detta följer av två beslut som var för sig är rimliga, men som möts här.

Bädden syns från första besöket. Mattan dyker upp först efter tre sparade
kvällar – och hamnar då **under** bädden, till 65 % dold. Dess
introduktionsanimation (`interior-rug-arrive`, 1,8 s uttoning) spelas alltså
till största delen bakom bädden. Belöningsögonblicket för mattan blir svagt.

Ingen åtgärd krävs för asseten, och den blockerar inte beställningen. Men det
är värt ett produktbeslut senare: antingen accepteras att mattan blir ett
underlag snarare än en belöning, eller så flyttas mattans progression till
något annat objekt. **Rendera om mattan smalare är inte att rekommendera nu** –
det rör ett befintligt lager i onödan.

### Bädden måste fungera utan matta

Eftersom bädden alltid syns men mattan inte gör det, står bädden på bart golv
för alla användare de första tre dagarna. Kontaktskuggan måste därför läsa
korrekt mot **både** trägolvet och mattans textil. Håll skuggan mjuk och kort
snarare än djup.

### Upptäckbarhet

Bädden blir stor och centralt placerad, så själva sovplatsen syns. Men
hotspoten är tyst – som dörren och boken. Sovläge är en större funktion än
båda, och risken att den aldrig upptäcks är reell. Frågan hör till
implementationen, inte asseten, men bör avgöras innan V1 släpps.

---

## 12. Checklista före implementation

- [x] Produktbeslut: mattäckningen accepterad (avsnitt 11)
- [x] Produktbeslut: bädden alltid synlig, ingen progression
- [x] Produktbeslut: parallell orientering, huvudända vänster
- [ ] Asset renderad från samma master/session som interiören
- [ ] Aspect ratio verifierad till 2,26 : 1
- [ ] Inga opaka pixlar över y 68 %
- [ ] Kontaktskugga verifierad mot både trägolv och matta
- [ ] `floor-bed.webp` ≤ 180 KB, master-PNG bevarad
- [ ] Nytt test i stil med `resting-scene.test.ts` som assertar asset + koordinater
