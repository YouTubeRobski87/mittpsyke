# AI-modernisering etapp 2 – rapport

Datum: 2026-11-04. Utgångspunkt: `main` på merge-commit `6ceb428` (PR #105, etapp 1). Arbetet är gjort i en molnklon på branchen `claude/project-thread-x31k2r`. **Inget är committat, pushat, mergat eller driftsatt. Inga Render-variabler och ingen databas har ändrats. Inga riktiga AI-anrop har gjorts.**

## 1. Vad som har inventerats

Läst: `CLAUDE.md`, `docs/ai/model-configuration.md`, `docs/AI_EVAL_PLAN.md`, `src/lib/server/ai/*` (inklusive `anthropic.ts`, `text-generation-provider.ts`, OpenAI-adaptern), alla AI-tester, eval-fixtures och live-eval-runnern, samt varje route som anropar en modell.

Konfigurerad modell, hårdkodad fallback och faktiskt anropad modell per funktion:

| # | Funktion | Kod | Konfigurerad | Hårdkodad fallback | Faktiskt anropad | Parametrar |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Stödchatten | `api/chat/+server.ts` → textlagret, syfte `support-chat` | `OPENAI_SUPPORT_CHAT_MODEL` (osatt) → `OPENAI_CHAT_MODEL` | `gpt-4o-mini` | `gpt-5.4` (bekräftat via /ansvarsfull-ai) | temp 0,75, freq 0,3, pres 0,2, 500 tokens, 25 s |
| 2 | Dagboksreflektion | `api/diary/reflect` → `diary-reflection` | `OPENAI_DIARY_REFLECTION_MODEL` → gemensam | `gpt-4o-mini` | `gpt-5.4` (trolig) | temp 0,7, freq 0,4, pres 0,3, 150 tokens, 8 s |
| 3 | Kvälls-/måendeincheckning | `api/diary/checkin-reflection` → `checkin-reflection` | `OPENAI_CHECKIN_REFLECTION_MODEL` → gemensam | `gpt-4o-mini` | `gpt-5.4` (trolig) | temp 0,7, 260 tokens, 12 s |
| 4 | Långsiktig måendeanalys/sammanfattning | `api/diary/insights/summary` → `diary-narrative` | `OPENAI_DIARY_NARRATIVE_MODEL` → gemensam | `gpt-4o-mini` | `gpt-5.4` (trolig) | temp 0,2, JSON, 900 tokens, 20 s |
| 5 | Användarminnet | `user-memory.ts` → `user-memory` | `OPENAI_USER_MEMORY_MODEL` → gemensam | `gpt-4o-mini` | `gpt-5.4` (trolig) | temp 0,2, JSON, 400 tokens, 12 s |
| 6 | Dagliga frågor | `daily-question.ts` → `callClaude` | – | `claude-opus-5` | `claude-opus-5` | adaptive thinking, effort low, 2000 tokens, 15 s |
| 7 | Spegelvattnet | `spegelvattnet.ts` → `callClaude` | – | `claude-opus-5` | `claude-opus-5` | som ovan |
| 8 | Admin (SEO-text) | `admin/+page.server.ts` → `callClaude` | `ANTHROPIC_MODEL` (bara kända ID) | `claude-haiku-4-5` | `claude-haiku-4-5` om variabeln saknas | inget thinking/effort, 4000 tokens, 20 s |
| 9a | Berättelsemoderering | `api/stories/submit` direkt mot SDK | `OPENAI_STORY_MODERATION_MODEL` → `OPENAI_CHAT_MODEL` | `gpt-4o-mini` | okänt (troligen `gpt-5.4`) | temp 0, JSON, inget tokentak |
| 9b | Horoskop | `api/horoscope` direkt mot SDK | – | `gpt-4o-mini` (hårdkodad) | `gpt-4o-mini` | temp 0,85, `max_tokens: 130` (avvecklat fält) |
| 9c | Sökindex | `search-index.ts`, cron | – | `text-embedding-3-small` | samma | bara publikt innehåll |

"Trolig" betyder att syftesvariablerna enligt beslutet i etapp 1 är osatta. Det går inte att se utifrån; Render-miljön har inte lästs.

## 2. Upptäckta problem

| Allvar | Problem | Åtgärd i etapp 2 |
| --- | --- | --- |
| **HÖG (tidskritisk)** | `gpt-4o-mini-2024-07-18` stängs av OpenAI **2027-01-14**. Horoskopet hårdkodar `gpt-4o-mini` och slutar fungera då. Samma ID är även standard om `OPENAI_CHAT_MODEL` någon gång saknas. | Endast dokumenterat. Att byta modell-ID är förbjudet i etappen. Kräver produktbeslut före mitten av december. |
| **HÖG (säkerhet, kräver separat beslut)** | Den deterministiska krisspärren fångar inte några tydliga varningsformuleringar. Med syntetiska fraser: "jag har tagit en massa tabletter", "det vore bättre om jag inte fanns" och "orkar inte mer med livet" går vidare till modellen. "jag vill dö", "jag vill inte leva", "ja orkar inte leva" och "jag ar sa ledsen att jag vill do" fångas. | **Ingen ändring.** Krisregler får inte ändras i etappen. Föreslås som eget säkerhetsarbete med klinisk granskning. Modellens säkerhetsinstruktioner gäller fortfarande för de fallen. |
| MEDIUM (från etapp 1) | De fem nya modellvariablerna validerades inte. Vilket ID som helst skickades vidare med temperatur och penalties. | **Åtgärdat:** allowlist med parameterkapacitet per modell. |
| MEDIUM | Ett tokentak som nås gav tyst ett avklippt svar, både hos OpenAI (`finish_reason: 'length'`) och Claude (`stop_reason: 'max_tokens'`). En resonemangsmodell med standard ≠ none hade gett tomma svar med 150 tokens. | **Åtgärdat:** loggas som `[ai:truncated]`. Beteendet är oförändrat. Modeller med standard ≠ none spärras av allowlisten. |
| MEDIUM | Reservsvar i dagboksreflektion, kvällsincheckning och användarminne dolde felorsaken. Incheckningen och minnet loggade ingen felkod alls. | **Åtgärdat:** gemensam loggrad i textlagret med syfte, modell, felkategori och kod. Konfigurationsfel får eget prefix `[ai:config]`. |
| MEDIUM | `callClaude` loggade leverantörens råa `error.message`, och moderering och horoskop loggade hela SDK-felobjektet. Fritexten kan innehålla delar av requesten. | **Åtgärdat:** bara status, kort feltyp och felnamn loggas. |
| LÅG | Konfigurationsfel (ogiltig nyckel, avvecklad modell, parameter som inte stöds) gick inte att skilja från tillfälliga fel i loggen. | **Åtgärdat:** `classifyAIFailure` ger `configuration`, `account`, `transient`, `response`, `request` eller `unknown`. Felkoderna är oförändrade, så användarens felmeddelanden är desamma. |
| LÅG | Berättelsemoderering och horoskop går förbi textlagret och får därför ingen modellvalidering. Moderering saknar tokentak. | Loggningen åtgärdad. Att flytta in dem i textlagret är ett separat arbete. |
| LÅG | `claude-haiku-4-5` har passerat sitt tidigaste pensionsdatum (2026-10-15) men är fortfarande aktiv. Anthropic varslar minst 60 dagar innan. | Dokumenterat. |
| LÅG | Användarminnet byts ut med delete + insert utan transaktion (känt sedan tidigare). | Inte ändrat: minneslagringen ingår inte i etappen. |
| INFO | `/ansvarsfull-ai` visar det konfigurerade modell-ID:t publikt. En felstavning i Render skulle synas där. | Oförändrat. Sidan kraschar inte av den nya valideringen, eftersom stoppet sker vid anropet. |

## 3. Implementerade förbättringar

1. **OpenAI-kapacitetstabell och allowlist** (`providers/openai-model-capabilities.ts`). Per modell anges resonemangsläge (`none` eller `default-none`), temperatur, penalties och JSON-läge. Bara granskade modeller får anropas: `gpt-4o-mini`, `gpt-4o-mini-2024-07-18`, `gpt-5.4`, `gpt-5.4-2026-03-05`. Syntaktiskt ogiltiga värden ger `invalid_model_id`, okända ger `model_not_allowed`. Inget nätverksanrop görs då.
2. **Parameterbygget** (`buildOpenAIChatParams`) skickar bara parametrar som modellen stöder och vägrar tyst släppa JSON-läget. För dagens modeller är requesten identisk med före etappen, testat mot en ordagrann kopia av den gamla requestbyggaren för alla produktens requesttyper.
3. **Svarshantering i OpenAI-adaptern:** `finish_reason: 'length'` loggas, och tomma svar får en kort orsakskod (`length`, `refusal`, `content_filter`).
4. **Gemensam felloggning** i `createAITextGenerator`, inklusive saknad nyckel och okänt syfte. Innehåll, användartext och leverantörens fritext loggas aldrig. Bara godkända modell-ID loggas. Ett avvisat värde loggas aldrig, eftersom även en kort nyckel kan se ut som ett giltigt modell-ID.
5. **Uppstartskontroll:** `reportModelConfigurationProblems` loggar varje syfte med otillåten modell en gång när servern startar. Uppstarten stoppas inte.
6. **Claude:** kapacitetstabellen `CLAUDE_MODEL_CAPABILITIES` ersätter den booleska tabellen och styr thinking och tillåtna effortnivåer. Stoppskälen `max_tokens`, `model_context_window_exceeded` och `pause_turn` loggas. API-fel loggas utan fritext med `[ai:config]` för 401/403/404.
7. **Säker loggning** i berättelsemoderering och horoskop. Modellval och flöde är oförändrade.
8. **Eval:** sju nya syntetiska scenarier (ångest, nedstämdhet, trauma, informell svenska utan å/ä/ö, kris utan å/ä/ö, långsiktigt måendemönster, minnets gräns), åtta adversariella kontroller och en kontroll av att krisfallet stoppas före provideranropet. Fixturegränsen höjd från 32 till 39 tillsammans med de granskade scenarierna, som kontraktet kräver.

Avsiktligt **inte** ändrat: modell-ID i drift, promptinnehåll, krisregler och säkerhetsinstruktioner, användarminnets lagring, databas, Render, design, felmeddelanden till användare och HTTP-statuskoder.

## 4. Ändrade filer

Ändrade:

- `src/lib/server/ai/providers/openai-text-provider.ts`
- `src/lib/server/ai/text-generation-contract.ts`
- `src/lib/server/ai/text-generation.ts`
- `src/lib/server/ai/text-generation-provider.ts`
- `src/lib/server/ai/anthropic.ts`
- `src/lib/server/ai/anthropic.test.ts` (nya tester, mockens `APIError` tar SDK:ts argument)
- `src/routes/api/stories/submit/+server.ts` (bara felloggningen)
- `src/routes/api/horoscope/+server.ts` (bara felloggningen)
- `tests/ai-evals/supportive-chat.json`, `crisis.json`, `diary-reflection.json`, `memory.json` (nya scenarier, befintliga orörda)
- `tests/ai-evals/fixtures.ts` (32 → 39)
- `tests/ai-evals/eval-suite.test.ts` (nytt describe-block)
- `tests/ai-evals/README.md` (antalet fixtures)
- `tests/ai-evals/live-eval.test.ts` (antalet krisfall som stoppas: 4 → 5)
- `docs/ai/model-configuration.md` (nytt avsnitt för etapp 2)

Nya:

- `src/lib/server/ai/providers/openai-model-capabilities.ts`
- `src/lib/server/ai/openai-model-capabilities.test.ts`
- `src/lib/server/ai/ai-failure-logging.test.ts`
- `docs/ai/AI-modernisering-etapp-2-rapport.md`, `docs/ai/AI-modelljamforelse-2026.md`, `docs/ai/AI-modernisering-etapp-2-verifiering.md`

Inga nya beroenden.

## 5. Testresultat

Se `docs/ai/AI-modernisering-etapp-2-verifiering.md` för kommandon och exakta utfall.

## 6. Säkerhets- och integritetsrisker

- **Krisspärrens luckor** (avsnitt 2) är den viktigaste risken. Den existerade före etappen och är oförändrad.
- **Strängare modellval kan stoppa en funktion.** Om ett syfte i Render pekar på ett ID utanför allowlisten slutar det syftet att anropa modellen efter deploy: chatten visar sitt vanliga felmeddelande, dagboken och incheckningen visar sina reservsvar och minnet uppdateras inte. Det är fail-closed och syns som `[ai:config]` direkt vid start. Före deploy behöver Robban bekräfta att `OPENAI_CHAT_MODEL` är `gpt-5.4` och att syftesvariablerna och `OPENAI_STORY_MODERATION_MODEL` är osatta eller godkända. Moderering omfattas inte av allowlisten.
- **Penalties på gpt-5.4** är inte dokumenterade av OpenAI. De skickas redan i drift och beteendet är oförändrat. Bekräfta i Render-loggen att inga `unsupported_parameter` förekommer för `support-chat`.
- **Loggning:** nya loggrader innehåller bara syfte/etikett, modell-ID, felkategori, felkod och HTTP-status. Inga användartexter, nycklar eller leverantörens fritext. Tester verifierar detta.
- **Testdata:** alla nya scenarier är handskrivna och syntetiska. Inga användaruppgifter i tester eller rapporter.
- **Samtycke och lagring:** oförändrat. Krisspärren ligger fortfarande före samtyckesgrinden och före varje modellanrop.

## 7. Rekommenderade modeller per funktion

Kort version, detaljer i `docs/ai/AI-modelljamforelse-2026.md`: behåll alla nuvarande modeller tills live-tester finns. Starkaste kandidaten att testa för OpenAI-syftena är `gpt-5.4-mini` (samma familj som driftmodellen, standard effort none, cirka 70 % lägre listpris). För Claude-funktionerna är `claude-opus-5-5` (spegelvattnet, dagliga frågor) och `claude-haiku-5-5` (admin, eventuellt dagliga frågor) kandidaterna. Horoskopet måste byta modell före 2027-01-14.

## 8. Rekommendationer som fortfarande kräver riktiga API-tester

Alla modellbyten. Ingen kvalitetsuppgift om svenska, empati, kris eller hallucinationer är verifierad för MittPsyke. Live-evalen täcker i dag bara textlagret och bara OpenAI. Claude-funktionerna, kvällsincheckningen och måendesammanfattningen saknar egna eval-fall. Testplan och kostnad finns i verifieringsdokumentet, avsnitt 4.

## 9. Blockerande problem

Inga för kodgranskning. Krisspärrens luckor blockerar inte den här ändringen, eftersom den inte rör krisflödet, men de bör prioriteras före framtida modellbyten.

## 10. Rekommenderat nästa steg

1. Robban granskar diffen. Vid godkännande: commit och PR mot `main` från `claude/project-thread-x31k2r`.
2. Före deploy: bekräfta värdena för `OPENAI_CHAT_MODEL`, de fem syftesvariablerna och `OPENAI_STORY_MODERATION_MODEL` i Render (bara läsa).
3. Separat säkerhetsarbete: krisspärrens luckor, med klinisk granskning.
4. Separat beslut: horoskopets modell före 2027-01-14.
5. Godkänn live-testplanen (under 5 USD) för `gpt-5.4` mot `gpt-5.4-mini`.

## Beslut

| Beslut | Utfall | Villkor |
| --- | --- | --- |
| Kodgranskning | **GO** | – |
| Commit och PR | **GO efter Robbans godkännande** | Ingen commit görs utan uttryckligt klartecken. |
| Framtida modellbyten | **NO-GO** | Kräver godkänd live-eval, latensmätning och ny rad i kapacitetstabellen. Krisspärrens luckor bör åtgärdas först. |
| Produktionsdeployment | **NO-GO tills vidare** | GO först efter merge, grön CI och bekräftelse att alla modellvariabler i Render är osatta eller godkända. |
