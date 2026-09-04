# AI-inventering

Senast kartlagd: 2026-09-04. Detta ar en teknisk inventering, inte en juridisk bedomning.

Veckosammanfattningen (`/api/diary/weekly-summary`) ar borttagen. Den hade ingen
konsument, fragade efter kolumner som inte finns i `diary`, och tackte inget som
Framstegs analys inte redan tacker.

| AI-yta | Plats | Data/historik | Synlighet och kontroll | Bedomning |
| --- | --- | --- | --- | --- |
| Samtalsstod | `src/routes/api/chat/+server.ts`, `src/lib/server/ai/text-generation.ts`, `ChatWindow.svelte` | Aktuell session; inloggade samtal lagras i `conversations`/`messages`, gastsamtal i gasttabeller. Valfri dagbokskontext och anvandarminne for inloggad anvandare. | Chatten ar AI-markt i sidcopy. Rensa historik finns; exakt omfattning skiljer mellan lokal, sparad och samtalshistorik. | Verifierat: samtycke kravs och krisflodet ar serversidigt. Textgenerering, modell, timeout och fel ar centraliserade for denna yta. |
| Dagboksinsikter | `src/routes/api/diary/insights/+server.ts`, `src/lib/server/progress-analysis.ts` | Dagboksinlagg och aggregerade monster. | Visas under Framsteg; radering av kallinlagg hanteras av dagbokens egna funktioner. | Ingen sprakmodell: analysen raknas deterministiskt pa servern ur anvandarens egna rader. `insights-contract.test.ts` forbjuder LLM-anrop i routen. Kraver samtycke. |
| Dagboksreflektion | `src/routes/api/diary/reflect/+server.ts` | Den text som anvandaren ber om reflektion for. | Anvandaren initierar funktionen. | Sannolik risk: hall gransen mellan reflektion och vardrad tydlig. |
| Check-in-reflektion | `src/routes/api/diary/checkin-reflection/+server.ts` | Check-in-svar. | Initieras i check-in-flodet. | Verifierad AI-anropplats; ingen ny UI-andring gjordes. |
| Daglig fraga | `src/lib/server/daily-question.ts`, `src/routes/api/daily-question/` | Begransad dagboks- och maendekontext; har eget krisskydd. | Visas i check-in. | Verifierat: krissignal hanteras utan vanlig fraga. |
| Spegelvattnet | `src/lib/server/spegelvattnet.ts`, `src/routes/api/spegelvattnet/` | Historik for den funktionen. | Funktionsspecifik UI. | Behover separat UX-granskning for AI-markning och radering. |
| Berattelser | `src/routes/api/stories/submit/+server.ts` | Inskickad berattelsetext. | Anvandaren initierar inskick. | Verifierad AI-anropplats; publicerings-/moderationsflode bor granskas separat. |
| Storify | `src/routes/api/storify/chat/+server.ts`, `generate/+server.ts` | Funktionsspecifik samtalstext. | Separat flode. | Behover separat produktagarskap innan integritetscopy andras. |
| Sok och indexering | `src/routes/api/search/+server.ts`, `api/cron/reindex-search/+server.ts` | Sokfragor respektive publicerat innehall. | Sok ar en tydlig anvandarinitierad funktion. | Inte en personlig AI-yta; embeddings anvands. |
| Admin- och integrationsfunktioner | `src/routes/admin/+page.server.ts`, `src/lib/server/ai/anthropic.ts`, `api/horoscope/+server.ts` | Varierar per funktion. | Inte fullt inventerade som anvandarytor i denna andring. | Osakerhet tydligt markerad; kravs riktad kartlaggning innan copy eller dataflode andras. |

Direkta OpenAI-anrop finns fortsatt i reflektions-, insikts-, modererings-, horoskop- och sok/indexeringsytor. Claude har redan ett eget lager i `src/lib/server/ai/anthropic.ts`. De ar inventerade men inte migrerade i detta avgransade steg; ny eller andrad produktlogik ska anvanda det gemensamma textgenereringslagret i stallet for direkta SDK-anrop.
