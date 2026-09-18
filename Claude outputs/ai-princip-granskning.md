# AI-princip – produkt- och kodgranskning

## 0. Blockerare för körning

Ingen skalåtkomst till er dator i den här sessionen (`device_bash` saknas),
och molnmiljöns egen repo-kopia saknar `.git`/`node_modules`. Jag kan alltså
inte köra `npm run check/test/build` eller `git diff --check` härifrån. Se
avsnitt 6 för exakt vad ni behöver köra själva.

## 1. Var AI-principen bör ligga

`docs/README.md` har länge listat en läsordning: NORTH_STAR.md →
DESIGN_SYSTEM.md → COMPANION_WORLD.md → **AI_GUIDELINES.md** →
references/README.md. Filen har bara aldrig funnits - referensen var trasig.

Jag har alltså inte skapat ett nytt dokument på egen hand, utan fyllt i en
lucka projektet redan pekade mot. Principen ligger nu i
**`docs/AI_GUIDELINES.md`** (ny fil), underordnad `docs/NORTH_STAR.md` precis
som `docs/COMPANION_SYSTEM.md` redan är. Den innehåller er fulla text:
kärnformuleringen, beslutstestet, bra/dålig användning, historik/Framsteg-
avsnittet med den tredelade distinktionen (egna data / deterministiska
resultat / AI-tolkningar), och en explicit "Balder är aldrig AI:n"-rad.

Två befintliga filer fick en kort hänvisning, inga andra ändringar:

- **`docs/NORTH_STAR.md`** - raden "AI:n ska hjälpa, inte imponera." pekar nu
  vidare till `docs/AI_GUIDELINES.md`.
- **`docs/ai/inventory.md`** - denna tekniska AI-yteinventering (senast
  uppdaterad 2026-09-04) fick en rad överst som pekar på den nya principen,
  plus en skärpt bedömning på just Storify-raden (se avsnitt 3).

## 2. Vad som redan följer principen (Kategori A)

Mer än jag hade väntat mig är redan välbyggt:

- **`/api/diary/insights` + `progress-analysis.ts`** - helt deterministisk,
  ingen språkmodell alls. `insights-contract.test.ts` förbjuder LLM-anrop i
  routen. Det här är exakt "deterministiskt beräknade resultat" ur er egen
  tredelning.
- **`/api/diary/insights/summary`** - anropas bara när användaren själv
  trycker på "Sammanfatta underlaget med AI" (aldrig vid sidladdning),
  modellen får bara redan uträknade siffror och ordagranna utdrag, och varje
  påstående i svaret måste gå att spåra till ett utdrag. Det här är er
  princip implementerad nästan till punkt och pricka.
- **`spegelvattnet.ts`** (veckospegling) - det citerade veckoordet måste vara
  en mening användaren skrivit ordagrant, verifierat programmatiskt mot
  källtexten (`!source?.text?.includes(sentence)` → avvisas). Promptens egen
  regel säger "Hitta inte på." Frågan i slutet är explicit "inte coach, inte
  terapeut", aldrig diagnostiserande.
- **`diary-reflection.ts` / `checkin-reflection.ts`** - korta (2-4 meningar),
  uttryckligen "inga råd", "ingen analys eller diagnos", "bara mjuk
  spegling". Reflekterar tillbaka det användaren skrev, skriver inget åt
  dem.
- **Marknadsföringscopy** - `om-mittpsyke` och `sa-fungerar-mittpsyke`
  beskriver redan chatten korrekt underordnad: "AI-chatten, om du vill" och
  "Chatten – ett valfritt AI-verktyg". `sa-fungerar-mittpsyke`s
  meta-description inleder till och med med er kärnformel nästan ordagrant:
  "Skriv, spara det du vill, kom tillbaka när du vill och se vad som
  återkommer."
- **Balder** - ingen AI-koppling i companion-koden alls (verifierat i förra
  granskningen och omkontrollerat nu). Han nämns aldrig i samma andetag som
  chatten eller AI-funktionerna.
- **Sök/indexering, dagens fråga** - ren infrastruktur respektive statisk
  frågebank utan språkmodell.

## 3. Vad som bryter mot principen

### Kategori C - bryter tydligt

**`src/routes/api/storify/generate/+server.ts` och
`src/routes/api/storify/chat/+server.ts`** (ytan `src/routes/dagars-avtryck/`).

Det här är det tydligaste och mest direkta fyndet i hela granskningen.
Storify har två lägen:

- **Snabbläge:** användaren skriver en kort beskrivning + humör + energi.
  Systemprompten är bokstavligen: *"Du är en empatisk dagboksassistent.
  Omvandla användarens korta beskrivning av sin dag till ett personligt,
  reflekterande dagboksinlägg."* AI:n skriver alltså hela dagboksinlägget.
- **Intervjuläge:** en AI-chattbot ("Du ar en vanlig och nyfiken
  intervjuare") ställer följdfrågor, och när det är klart: *"Skriv ett
  dagboksinlägg baserat på det vi pratade om."*

Båda är nästan ordagrant exemplen ni själva listade under "AI ska inte":
*"göra användarens reflektion åt dem"*, *"fylla i dagboken"*, *"generera
känslor eller reflektioner åt användaren"*.

Viktigt att vara rättvis: det här är inte en glidning eller ett förbiseende.
Funktionen har eget, fail-closed samtyckesskydd (`diary_ai_storify`-scope,
nekar vid saknat/återkallat/inaktuellt samtycke), egna tester
(`storify-ai-gate.test.ts` bevisar att varken `/generate` eller `/chat` når
Anthropic utan giltigt samtycke), och en egen datamodell separat från
huvuddagboken. Det är ett medvetet, väl genomarbetat produktbeslut som bara
råkar stå i rak motsats till principen ni nu vill införa.

**Jag har inte ändrat något i Storify-flödet.** Det är inte en liten,
tydligt säker ändring - det är ett fungerande, testat produktflöde, och er
egen instruktion säger uttryckligen att jag inte ska ändra fungerande
produktflöden utan konkret anledning. Det kräver ett produktbeslut av er,
inte en kodändring jag gissar mig till. Se frågan i slutet av det här
svaret.

### Kategori B - kan förbättras (låg prioritet, ej ändrat)

- **`CLAUDE.md`** (projektets rotinstruktion, inte produktcopy) beskriver
  MittPsyke som *"a Swedish mental wellbeing web platform offering AI-based
  conversational support, personal journaling, and progress tracking"* -
  AI-chatten nämns först. Det är en teknisk onboarding-text för utvecklare/
  Claude Code, inte något en användare ser, så jag har inte rört den - men
  om ni vill kan ordningen speglas efter er kärnformel (skriva → spara →
  återvända → se vad som återkommer, chatten sekundär).
- **`src/lib/server/ai/diary-reflection.ts` / `checkin-reflection.ts`** är i
  grunden fina (se Kategori A ovan), men ligger konceptuellt närmare
  "AI svarar känslomässigt på varje inlägg" än de uttryckliga
  användningsexemplen i er princip (mönster, sammanfattning, struktur över
  tid). Inte en tydlig överträdelse - bara värt att ha i åtanke om
  principen ska tolkas strikt senare.

### Kategori D - infrastruktur, ej rört

- **`src/routes/api/horoscope/+server.ts`** - genererar horoskoptext med
  OpenAI. Jag hittade **ingen anropande sida i repot** (`grep` på
  `api/horoscope` ger bara ett träff-i-dokumentationen). Sannolikt en extern
  landningssida/kampanj (URL-parametern `from=horoscope` spåras i
  `dagbok/checkin`), inte en del av kärnprodukten. Rör varken kod eller
  bedömning - jag vet inte om den fortfarande används utanför repot, och att
  ändra eller ta bort en aktiv endpoint utan att veta det vore just den
  sortens ändring utan konkret anledning ni bad mig undvika.
- Textgenereringslagret (`text-generation.ts`, `anthropic.ts`,
  `providers/openai-text-provider.ts`) och `search-index.ts` - ren teknisk
  infrastruktur, påverkar inte positioneringen.

## 4. Exakta filer som ändrats

| Fil | Ändring |
| --- | --- |
| `docs/AI_GUIDELINES.md` | **Ny.** Fyller den sedan tidigare trasiga referensen i `docs/README.md`. Innehåller hela AI-principen. |
| `docs/NORTH_STAR.md` | En rad utökad med hänvisning till den nya filen. Ingen befintlig text ändrad eller borttagen. |
| `docs/ai/inventory.md` | En rad tillagd överst (pekar på principen) + Storify-radens bedömning utökad med den nya avvikelsen. Ingen annan rad rörd. |

Inga produktflöden, ingen produktcopy och ingen kod i `src/` har ändrats.

## 5. Vad som uttryckligen lämnats orört

Storify/`dagars-avtryck` (kod och flöde - se avsnitt 3), horoskop-endpointen,
all marknadsföringscopy (redan korrekt), `diary-reflection.ts`/
`checkin-reflection.ts` (redan rimligt inom principen), Balder-koden,
Kvällstugan, Framsteg, auth, redirects.

## 6. Verifiering

Inga kodfiler ändrade den här gången (bara tre markdown-filer i `docs/`), så
`npm run test`/`npm run build` påverkas inte funktionellt. Kör ändå gärna
för säkerhets skull, i E:\mittpsyke-main:

```
npm run check
npm run test
npm run build
git diff --check
git diff --stat
git status
```

Committa/pusha inget förrän ni sett grönt och är nöjda med formuleringarna i
`docs/AI_GUIDELINES.md`.
