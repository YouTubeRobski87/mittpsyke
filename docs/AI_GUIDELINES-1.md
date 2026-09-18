# AI-PRINCIP

> AI ska förstärka användarens egen reflektion – inte ersätta den.

Den här filen är underordnad `docs/NORTH_STAR.md` - läs den först. Där
produktbeslut och den här filen skiljer sig åt gäller North Star.

`docs/README.md` har länge listat den här filen i sin läsordning (efter
NORTH_STAR, DESIGN_SYSTEM och COMPANION_WORLD). Den har bara aldrig funnits
förrän nu.

## Kärnan

MittPsykes kärna är inte ett samtal med en AI:

> skriva → spara det man vill → återvända → se vad som återkommer

Chatten är sekundär. AI ska användas där den skapar tydlig nytta åt just
det flödet - inte bli en egen, konkurrerande huvudupplevelse.

Kort formulering att hålla sig till:

> Skriv först. Förstå mer över tid. AI hjälper till där den faktiskt
> tillför något.

## Beslutstestet

Innan en ny AI-funktion byggs, eller en befintlig ändras:

> Förstärker detta användarens egen reflektion, eller ersätter det den?

Gör funktionen främst reflektionen åt användaren ska den ifrågasättas eller
göras mindre styrande.

## Bra användning av AI

- sammanfatta material användaren redan har skapat
- visa förändring och mönster över tid
- hjälpa till att hitta återkommande teman
- strukturera stora mängder egen historik
- föreslå relevanta nästa steg utan att låtsas känna användaren bättre än
  användaren själv
- göra befintlig data mer begriplig

## AI ska inte

- göra användarens reflektion åt dem
- ta över produktens identitet
- bli ett mål i sig
- göra MittPsyke till ännu en generell AI-chatt
- ersätta dagbok, återblickar, Framsteg eller strukturerade
  reflektionsflöden
- generera känslor eller reflektioner åt användaren
- fylla i dagboken
- automatiskt tala om hur användaren "egentligen mår"
- göra chatten till primär navigation eller huvudprodukt
- skapa onödig AI-interaktion där vanlig UX räcker
- göra Balder till AI-agent eller AI-röst

## Historik och Framsteg

Här är principen som viktigast, eftersom det är där AI kommer närmast
användarens egna ord.

Prioritera funktioner som hjälper användaren se:

- vad som återkommer
- vad som förändras
- vilka teman som blivit vanligare eller ovanligare
- hur olika perioder skiljer sig åt
- vad användaren själv tidigare har skrivit eller markerat som viktigt

AI ska stödja förståelsen av historiken, inte hitta på en berättelse om
användaren.

Var tydlig - i kod och i gränssnitt - med skillnaden mellan tre olika saker:

1. **användarens egna data** (det de själva skrivit eller valt)
2. **deterministiskt beräknade resultat** (siffror, mönster, trender räknade
   utan språkmodell)
3. **AI-genererade sammanfattningar eller tolkningar**

`src/lib/server/progress-analysis.ts` och `/api/diary/insights` är ett bra
exempel på (1) och (2): analysen räknas ut på servern ur användarens egna
rader, utan språkmodell alls - `insights-contract.test.ts` förbjuder
LLM-anrop i den routen.

`/api/diary/insights/summary` är ett bra exempel på hur (3) ska göras när
den väl behövs: funktionen anropas bara när användaren själv trycker på
"Sammanfatta underlaget med AI", modellen får bara redan framräknade siffror
och ordagranna utdrag, och varje påstående måste gå att spåra till ett
utdrag.

`src/lib/server/spegelvattnet.ts` är ett bra exempel på att aldrig hitta på:
det citerade veckoordet måste vara en mening användaren skrivit ordagrant
(verifieras mot källtexten programmatiskt), och promptens egen regel säger
uttryckligen "Hitta inte på."

## Balder och AI

Balder representerar aldrig AI:n. Han har ingen pratbubbla, ger inga råd och
är ingen chatbot. Se `docs/NORTH_STAR.md` ("Balder") och
`docs/COMPANION_SYSTEM.md`. Det gäller oavsett hur bra en framtida AI-analys
av användarens historik blir - resultatet visas i Framsteg eller
återblickar, aldrig som ord i Balders mun.

## Chatten

Chatten är ett valfritt, sekundärt verktyg - inte navigationen och inte
huvudprodukten. Så beskrivs den redan korrekt idag på
`src/routes/om-mittpsyke/+page.svelte` ("AI-chatten, om du vill") och
`src/routes/sa-fungerar-mittpsyke/+page.svelte` ("Chatten – ett valfritt
AI-verktyg"). Ny copy om chatten ska hålla samma linje.

## Känd avvikelse - åtgärdad

Storify (ytan `src/routes/dagars-avtryck/` och endpointerna under
`src/routes/api/storify/`) lät AI skriva ett fullständigt dagboksinlägg åt
användaren. Det var produktens tydligaste exempel på precis det den här
principen säger att AI inte ska göra ("fylla i dagboken", "generera känslor
eller reflektioner åt användaren"). Produktbeslutet blev att ta bort
funktionen, och den är borttagen sedan 2026-09-18. Se `docs/ai/inventory.md`.
