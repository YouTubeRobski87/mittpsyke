# AI Guidelines

Arbetsregler för AI-agenter (och människor) som ändrar MittPsyke. Läs alltid
[`NORTH_STAR.md`](./NORTH_STAR.md), [`DESIGN_SYSTEM.md`](./DESIGN_SYSTEM.md) och
[`COMPANION_WORLD.md`](./COMPANION_WORLD.md) innan UI ändras.

De operativa filerna [`AGENTS.md`](../AGENTS.md) och [`CLAUDE.md`](../CLAUDE.md)
i repo-roten gäller fortfarande för kommandon, arkitektur och tekniska detaljer.
Det här dokumentet samlar produkt-, design- och copy-principerna.

---

## Den viktigaste frågan

Ställ alltid varje ändring mot: **"Känns det här som MittPsyke?"** Om svaret är
nej spelar det ingen roll hur smart funktionen är. Om två lösningar är lika bra
tekniskt – välj den lugnaste (mindre animation, mindre brus, mer luft, färre
färger, enklare copy).

## UX-principer

- Håll tonen lugn, enkel och mänsklig.
- Bygg mobil först; desktop är en tydlig förlängning.
- Design ska kännas psykiskt trygg: tydlig struktur, god läsbarhet, inga
  stressande element.
- Undvik: överdrivna animationer, stressiga rörelser, för mycket text, ständiga
  notifieringar, figurer som alltid kräver svar, känslan av ett spelgränssnitt.

## Copy-principer

- Skriv på enkel svenska med låg tröskel, varm och tydlig ton.
- Var konsekvent: MittPsyke ersätter inte vård.
- Inga belöningar eller skuld. Uppmärksamma i stället för att belöna. Aldrig
  "din streak är bruten" – hellre "Vad fint att se dig igen."
- Framsteg upptäcks, annonseras inte.
- Akut hänvisning ska vara tydlig men inte alarmistisk:
  - Vid akut fara: **112**
  - Vårdråd: **1177**
  - Vidare stöd: **stodlinjer.se**

## Tekniska principer

- Följ befintlig komponentstruktur i `src/lib/components` och existerande
  sidmönster. Återanvänd shared components före ny inline-markup.
- Svelte 5 runes (`$state`, `$derived`, `$effect`). Undvik Svelte 4-mönster.
- Kommentarer i koden skrivs på svenska.
- Använd aldrig `any` i TypeScript – använd explicita typer eller `unknown`.
- Kör validering: `npm run check` och `npm run build` innan en uppgift markeras
  klar. Rapportera tydligt om fel är nya eller redan fanns.
- Committa aldrig `.env.local` eller hemliga nycklar.

## SEO-principer

- Tydlig, relevant `H1` per sida; bra metadata (title, description, canonical).
- Internlänka mellan guider, övningar, chat och dagbok där det är relevant.
- Behåll och förbättra internlänkar vid refaktorering – tappa inte SEO-värde.

## Säkerhet och integritet

- **Säkerhetskritiskt:** kris-detektionen i `src/routes/api/chat/+server.ts` och
  `src/lib/ai/safety.ts` hanterar verklig användarsäkerhet. Server-checken är
  auktoritativ och måste alltid köra före anrop till AI-API. Ändra kris-mönster
  eller säkerhetsflöde med extra omsorg.
- Var försiktig med formuleringar om personuppgifter, samtycke och databehandling.
  Vid juridisk precision: länka till integritetspolicy i stället för att förenkla.
- Anta inte hur data lagras eller delas utan att kontrollera koden först. Ändra
  inte integritetsrelaterad copy utan att verifiera faktisk implementation.

## Visuella referenser

Innan du ändrar UI, inspektera bilderna i [`references/`](./references/) i
prioritetsordning (se [`references/README.md`](./references/README.md)):

1. `01-design-system.png`
2. `02-dashboard-current-target.png`
3. `03-home-vision-bear.png`
4. `04-companion-world-reference.png`
5. `05-hero-bear-scene.png`
