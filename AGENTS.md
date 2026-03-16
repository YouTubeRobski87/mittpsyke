# AGENTS.md - MittPsyke

## Projektbeskrivning
MittPsyke är en svensk mental-wellbeing-plattform där användare kan få AI-baserat samtalsstöd, skriva dagbok, följa måendemönster och hitta vidare stödlinjer.

## Produktmål
- Erbjuda tryggt, anonymt och lågtröskligt stöd i egen takt.
- Vara en första lugn ingång, inte en ersättning för vård.

## UX-principer
- Håll tonen lugn, enkel och mänsklig.
- Skriv på enkel svenska med låg tröskel.
- Undvik hårda/kliniska formuleringar om de inte krävs.
- Bygg mobil först; desktop ska vara en tydlig förlängning.
- Design ska kännas psykiskt trygg: tydlig struktur, god läsbarhet, inga stressande element.

## Tekniska principer
- Följ befintlig komponentstruktur i `src/lib/components` och existerande sidmönster.
- Återanvänd shared components före ny inline-markup.
- Undvik duplicerad kod; extrahera gemensamma block vid återkommande UI.
- Kör validering när möjligt:
  - `npm run check`
  - `npm run build`
- Rapportera tydligt om fel är nya eller redan existerande i repo.

## Copy-principer
- Skriv på svenska.
- Använd lågtrösklig, tydlig och varm ton.
- Var konsekvent med budskapet: MittPsyke ersätter inte vård.
- Akut hänvisning ska vara tydlig men inte alarmistisk:
  - Vid akut fara: 112
  - Vårdråd: 1177
  - Vidare stöd: stodlinjer.se

## SEO-principer
- Säkerställ tydlig och relevant `H1` per sida.
- Sätt bra metadata (title, description, canonical där det används).
- Internlänka mellan guider, övningar, chat och dagbok där det är relevant.
- Behåll och förbättra internlänkar vid refaktorering, tappa inte SEO-värde.

## Säkerhet och integritet
- Var försiktig med formuleringar om personuppgifter, samtycke och databehandling.
- När juridisk precision krävs: länka till integritetspolicy/ansvarssidor i stället för att överförenkla.
- Anta inte hur data lagras eller delas utan att kontrollera koden först.
- Ändra inte integritetsrelaterad copy utan att verifiera faktisk implementation.
