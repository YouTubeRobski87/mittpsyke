# Modellkonfiguration – etapp 1

Alla nya variabler är frivilliga. Ingen driftskonfiguration ändras av denna kodändring.

| Syfte | Frivillig miljövariabel |
| --- | --- |
| Stödchatt | `OPENAI_SUPPORT_CHAT_MODEL` |
| Dagboksreflektion | `OPENAI_DIARY_REFLECTION_MODEL` |
| Kvällsreflektion | `OPENAI_CHECKIN_REFLECTION_MODEL` |
| Dagboksberättelse/valbar måendesammanfattning | `OPENAI_DIARY_NARRATIVE_MODEL` |
| Användarminne | `OPENAI_USER_MEMORY_MODEL` |

Valordning: en icke-tom, trimmad specifik variabel → befintliga `OPENAI_CHAT_MODEL` → befintliga standarden `gpt-4o-mini`. Saknad, tom eller whitespace-only specifik variabel använder fallback. Befintlig validering av gemensamt whitespace-värde behålls. Konfigurationen läses när servermodulen laddas; starta om servern efter en godkänd ändring.

Lämna samtliga nya variabler osatta i denna etapp. Då bevaras befintliga modellval, timeout och tokenbudgetar (500/25 s, 150/8 s, 260/12 s, 900/20 s, 400/12 s). Inga nycklar eller faktiska produktionsvärden ingår här. Ett framtida modellval kräver separat kompatibilitets- och kvalitetsgranskning. Att ange ett annat ID anpassar inte temperatur eller andra modellparametrar automatiskt.

Claude behåller `claude-opus-5` och `claude-haiku-4-5`. Opus får samma adaptive thinking och effort (low som standard). Haiku får varken adaptive thinking eller effort; dess standardläge utan thinking används. Detta gäller både vanliga och strömmande anrop. Ingen manuell thinkingbudget införs.

Kontrollerad 2026-11-04 mot [Anthropics thinkingstöd](https://platform.claude.com/docs/en/build-with-claude/thinking-troubleshooting) och [Haiku 4.5](https://platform.claude.com/docs/en/models/haiku-4-5/overview). Haiku 4.5 stöder extended thinking, inte adaptive, och saknar effort-stöd.

Rollback före deploy är att återställa denna lokala diff. Efter en framtida godkänd deploy kan specifika OpenAI-val tas bort för att återgå till den gemensamma inställningen. Återställ inte den inkompatibla Haiku-requesten som avsiktlig reservlösning.

## Etapp 2 – godkända modeller och parameterkompatibilitet

Från etapp 2 får textlagret bara anropa OpenAI-modeller som finns i
`OPENAI_TEXT_MODEL_CAPABILITIES` (`src/lib/server/ai/providers/openai-model-capabilities.ts`).
Tabellen anger per modell om den har resonemang, och om temperatur, penalties
och JSON-läge får skickas. Godkända i dag: `gpt-4o-mini`, `gpt-4o-mini-2024-07-18`,
`gpt-5.4` och `gpt-5.4-2026-03-05`. För dessa är requesten byte för byte
densamma som före etapp 2 (testat i `openai-model-capabilities.test.ts`).

- Ett syntaktiskt ogiltigt värde (blanksteg i mitten, citattecken, kontrolltecken)
  ger `invalid_model_id`.
- Ett okänt eller ännu inte granskat ID ger `model_not_allowed`. Inget anrop görs.
- Ett avvisat värde loggas aldrig, oavsett orsak, eftersom även en kort nyckel kan
  se ut som ett giltigt modell-ID. Bara godkända modell-ID förekommer i loggen.
- Båda är konfigurationsfel (`code: 'configuration'`). De loggas med prefixet
  `[ai:config]` dels en gång när servern startar, dels vid varje anrop.
  Tillfälliga fel loggas med `[ai:error]` och `kind: 'transient'`.
- Tom eller whitespace-only variabel hanteras som i etapp 1: syftesvariabeln
  ignoreras och den gemensamma inställningen gäller.
- En modell får inte läggas till i tabellen om dess standardnivå för reasoning
  effort är något annat än `none`. Då tär resonemangstokens på de korta
  tokenbudgetarna (150–900) och OpenAI kräver att temperatur tas bort.
  Sådana modeller kräver först att adaptern kan skicka `reasoning_effort`.

`[ai:truncated]` loggas när ett svar klipps vid tokentaket (OpenAI
`finish_reason: 'length'`, Claude `stop_reason: 'max_tokens'`). Texten
returneras som tidigare.

Att lägga till en modell i tabellen är en kodändring som kräver granskning,
grön `npm run ai:eval` och ett separat godkänt live-test. Se
`docs/ai/AI-modelljamforelse-2026.md`.
