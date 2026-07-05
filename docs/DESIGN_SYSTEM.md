# Design System

Det visuella språket för MittPsyke. Den bindande sanningskällan är bilderna i
[`references/`](./references/) – särskilt `01-design-system.png`. Text här beskriver
och kompletterar dem, men vid konflikt gäller referensbilden.

> Grundkänsla: varm, ljus, stillsam och trygg. Aldrig kliniskt, aldrig ett
> kontrollsystem. Se [`NORTH_STAR.md`](./NORTH_STAR.md).

---

## Färger

Palett från `01-design-system.png`.

| Namn      | Hex       | Roll |
| --------- | --------- | ---- |
| Skog      | `#2E7D5A` | Primär grön: knappar, aktiva tillstånd, ikon-accent |
| Ljus grön | `#E6F4EA` | Mjuk grön yta: aktiv nav, positiva kort |
| Sage      | `#F3F7F2` | Neutral lugn bakgrundston |
| Sand      | `#FFF7EC` | Varm ljus bakgrund / hero-toner |
| Lavendel  | `#F2E9FF` | Insikter / statistik-accent |
| Himmel    | `#E8F1FF` | Verktyg / lugn blå-accent |

Principer:
- Varmvit bakgrund som grund, mycket luft mellan element.
- Pasteller används sparsamt som mjuka kort-toner, aldrig som mättade block.
- Om två färgval är lika bra, välj det lugnaste (mindre mättnad, mer luft).

## Typografi

Enligt referensen (`03-home-vision-bear.png`):

- **Rubrik:** Inter SemiBold
- **Brödtext:** Inter Regular

Ton i copy: kort, vänlig, lågtröskel. "Hur mår du idag? Det är okej att ta det
steg för steg."

> **Känd avvikelse:** Nuvarande implementation använder typsnittet **Recursive**
> (`--font-heading: 'Recursive H'`, `--font-body: 'Recursive T'` i `src/app.css`),
> inte Inter. Detta behöver stämmas av – antingen uppdatera referensen eller byt
> typsnitt i koden. Ändra inte utan beslut.

## Form och rum

- **Rundade kort** med stor radie (~16px) och mjuk, subtil skugga.
- **Generös whitespace** – luft är en feature, inte tomrum att fylla.
- **Lugn hierarki** – en tydlig sak i taget, inget som skriker efter uppmärksamhet.
- Paneler: mjuk yta med lätt skugga. Chip/etikett: lätta färger, mjuka former.

## Komponenter

- **Primär knapp** – fylld Skog-grön, rundad.
- **Sekundär knapp** – ljus yta, mjuk kant.
- **Textfält** – ljus, rundad, låg kontrast-kant.
- **Ikonstil** – linjeikoner (Home, Smile, BookOpen, Wrench, BarChart3, LifeBuoy,
  Settings). Konsekvent stroke-vikt.

## Illustration

Naturinspirerad, varm och verklig (Pixar/Disney-nära, hög detaljnivå, mjuka
färger, atmosfäriskt ljus). Se `05-hero-bear-scene.png` för konst-riktning
(ljus, färg, framing, rendering) och `04-companion-world-reference.png` för
följeslagarens värld.

## Var det lever i koden (referens, inte spec)

Dashboarden (`src/routes/dashboard/+page.svelte` + `src/lib/components/Sidebar.svelte`)
är närmast detta system idag. Publika sidor (`src/routes/+page.svelte`) och
`/framsteg` använder andra, mörkare token-system och matchar ännu inte. Målet är
**ett** gemensamt token-lager byggt från paletten ovan.

## Regler

- Bevara nuvarande designspråk. Redesigna inte befintliga komponenter utan att
  bli ombedd.
- Utveckla hellre gränssnittet stegvis än ersätt det.
- Introducera aldrig komponenter som krockar med `01-design-system.png`.
