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
