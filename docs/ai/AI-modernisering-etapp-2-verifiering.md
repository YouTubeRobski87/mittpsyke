# AI-modernisering etapp 2 – verifiering

Datum: 2026-11-04. Miljö: molnklon (Linux, Node 22.23.4), branch `claude/project-thread-x31k2r` med utgångspunkt i `main` på `6ceb428` (PR #105). Beroenden installerade med `npm ci` från låsfilen. Inga riktiga AI-anrop har gjorts.

## 1. git status

- **Före:** ren arbetskopia på `6ceb428`, inga lokala ändringar.
- **Efter:** 17 ändrade och 6 nya filer (se rapporten, avsnitt 4). Inget committat. `git diff --check` utan anmärkningar.

## 2. Baslinje före ändringarna (samma klon, `6ceb428`)

| Kommando | Resultat |
| --- | --- |
| `npm run test:unit` | 239 filer, 2868/2868 godkända |
| `npm run ai:eval` | 107/107 godkända |

Samma siffror som den oberoende granskningen av etapp 1 fick i Linux.

## 3. Körda kontroller efter ändringarna

| Kommando | Resultat | Kommentar |
| --- | --- | --- |
| `npm run check` | **0 fel, 0 varningar** | |
| `npm run test:unit` | **241 filer, 2942/2942 godkända** | +2 testfiler, +74 tester jämfört med baslinjen |
| `npm test` (hela sviten inklusive webbläsartester) | 2982 godkända, **3 underkända** | De tre är webbläsartesterna, se nedan |
| `npm run ai:eval` | **130/130 godkända** | +23 tester: 7 nya scenarier × 2 kontroller, 8 adversariella fall och en krisspärrskontroll |
| `npm run build` | **Godkänd** (prebuild kör `test:unit`) | |
| `npm run test:browser` | 40 godkända, **3 underkända** | Miljöfel, inte regression, se nedan |
| `git diff --check` | **Inga anmärkningar** | |
| Riktade AI-tester (`src/lib/server/ai`, `tests/ai-evals`, `src/routes/api/chat`) | Alla godkända | Kördes upprepade gånger under arbetet |

### Webbläsartesterna

De tre underkända testerna (`article-mobile-layout`, `cms-html-rendering`, `diary-markdown`) faller på att Chromium inte når systemets D-Bus (`Failed to connect to the bus: /run/dbus/system_bus_socket`) och på att städningen av testprofilen misslyckas (`ENOTEMPTY`). **Samma tre tester faller på exakt samma sätt på orörd `main` (`6ceb428`) i samma miljö** (kontrollerat i en separat git worktree). De rör inte AI-koden. De körs som obligatoriskt steg i GitHub CI, där de ska verifieras efter en eventuell PR.

### De sex kända Windows-felen

De sex testerna som bara faller på Windows på grund av CRLF (`chat-mobile-keyboard-layout`, `diary-account-handoff`, `diary-local-retrospect`, `insights-contract`, `insights-response-consumption`, `sign-up`) har inte rörts och går inte att reproducera här, eftersom miljön är Linux. Alla sex är gröna i den här körningen. Ingen av de nya testerna läser källfiler med `readFileSync` och matchar `\n`, så de nya testerna lägger inte till fler fel av samma slag.

### Inte kört

- `npm run ai:eval:live`: kräver riktiga API-anrop och separat godkännande.
- Ingen kontroll mot Render, Supabase eller produktionsloggar. En aggregerad läsfråga (antal assistentsvar per dag) mot produktionsdatabasen nekades av miljöns behörighetsregler och kördes inte.

## 4. Testplan för riktiga API-anrop (kräver godkännande)

**Syfte:** rättvis jämförelse av driftmodellen `gpt-5.4` mot kandidaten `gpt-5.4-mini` på MittPsykes egna syntetiska fall.

**Förutsättningar:**

1. Etapp 2 är mergad, så att allowlisten och felloggningen finns.
2. `gpt-5.4-mini` läggs till i kapacitetstabellen i en egen granskad ändring, först efter att modellsidan har kontrollerats igen.
3. Körningen görs lokalt eller i en separat miljö med en egen API-nyckel och en budgetgräns hos OpenAI. Aldrig mot Render.

**Genomförande:**

1. `OPENAI_CHAT_MODEL=gpt-5.4 npm run ai:eval:live`, tre gånger.
2. `OPENAI_CHAT_MODEL=gpt-5.4-mini npm run ai:eval:live`, tre gånger.
3. Jämför rapporterna i `artifacts/`: PASS/FAIL per scenario, hårda fel (safety, trust_harm, sycophancy), svarslängd och `[ai:truncated]`-rader. Notera svarstiden per anrop.
4. Varje hårt fel granskas manuellt av en människa. Ett hårt fel hos kandidaten som inte finns hos driftmodellen är ett NO-GO för bytet.

**Vad som skickas:** bara de 39 granskade syntetiska scenarierna. De 5 krisfallen stoppas före anropet, så det blir 34 anrop per körning. Inga användardata.

**Kostnadsuppskattning** (listpriser 2026-11-04; underlaget i genomsnitt cirka 7 600 tecken per anrop, uppskattat till cirka 2 500 tokens; svar upp till taket på 500 tokens):

| Modell | Per körning (typiskt) | Per körning (alla svar vid taket) | 3 körningar |
| --- | --- | --- | --- |
| `gpt-5.4` | cirka 0,37 USD | cirka 0,47 USD | cirka 1,10–1,40 USD |
| `gpt-5.4-mini` | cirka 0,11 USD | cirka 0,14 USD | cirka 0,35–0,45 USD |
| **Totalt** | | | **under 2 USD** |

Tokenantalet är en uppskattning och inte uppmätt. Den faktiska kostnaden syns i OpenAI:s användningsvy efter körningen.

**Täcks inte av planen:** Claude-funktionerna (dagliga frågor, spegelvattnet, admin) och kvällsincheckningen samt måendesammanfattningen, eftersom live-runnern bara kör chatt- och dagboksflödet mot OpenAI. Att utöka runnern och lägga till syntetiska fall för dem är ett separat arbete.
