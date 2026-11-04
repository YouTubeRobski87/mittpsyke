# AI-modelljämförelse 2026 – MittPsyke

Skriven 2026-11-04 inom AI-modernisering etapp 2. Inga modellbyten görs i den här etappen.

## Hur jämförelsen ska läsas

- **Dokumenterat** betyder att uppgiften är hämtad från leverantörens egen dokumentation den 2026-11-04 (källor längst ner).
- **Okänt** betyder att uppgiften inte gick att verifiera. Den ska inte fyllas i med en gissning.
- **Verifierad kvalitet i MittPsyke: ingen.** Ingen modell har körts mot MittPsykes egna syntetiska fall med riktiga API-anrop i den här etappen. Allt om svensk språkkänsla, empati, krishantering, instruktionsföljsamhet och hallucinationer nedan är därför *ej verifierat* för MittPsyke. Leverantörernas egna påståenden om förmåga räknas inte som verifierad kvalitet.
- Krisfall stoppas av en deterministisk spärr före varje modellanrop i chatten, kvällsincheckningen och måendesammanfattningen. Modellens egen krishantering spelar därför roll för fall som spärren inte fångar (se rapporten, avsnitt 2) och för samtal där krisen växer fram gradvis.

## 1. Vad som körs i dag

| Funktion | Leverantör | Modell som faktiskt anropas | Källa till valet |
| --- | --- | --- | --- |
| Stödchatten | OpenAI | `gpt-5.4` | `OPENAI_CHAT_MODEL` i Render. Bekräftat via den publika sidan /ansvarsfull-ai, som visar den upplösta modellen. |
| Dagboksreflektion | OpenAI | `gpt-5.4` (trolig) | Samma gemensamma variabel. Syftesvariabeln är osatt enligt beslut i etapp 1. Inte direkt observerbart. |
| Kvällsincheckning | OpenAI | `gpt-5.4` (trolig) | Som ovan. |
| Måendesammanfattning (Framsteg) | OpenAI | `gpt-5.4` (trolig) | Som ovan, syfte `diary-narrative`. |
| Användarminnet | OpenAI | `gpt-5.4` (trolig) | Som ovan, syfte `user-memory`. |
| Berättelsemoderering | OpenAI | `OPENAI_STORY_MODERATION_MODEL`, annars `gpt-5.4` (trolig) | Egen variabel, värdet i Render är okänt. Går förbi textlagret. |
| Horoskop | OpenAI | `gpt-4o-mini` | Hårdkodat i koden. Går förbi textlagret. |
| Dagliga frågor | Anthropic | `claude-opus-5` | `CLAUDE_MODELS.deep`, hårdkodat. |
| Spegelvattnet | Anthropic | `claude-opus-5` | Som ovan. |
| Admin: SEO-text | Anthropic | `claude-haiku-4-5`, eller `ANTHROPIC_MODEL` om den är en känd modell | `resolveModel` med fallback. |
| Sökindex (embeddings) | OpenAI | `text-embedding-3-small` | Hårdkodat. Bara publikt innehåll skickas. |

## 2. Dokumenterade API-egenskaper

### OpenAI (Chat Completions)

| Modell | Status | Resonemang, standard | Pris in/ut per 1M tokens | Kontext | Anmärkning |
| --- | --- | --- | --- | --- | --- |
| `gpt-4o-mini` | **Avvecklad.** Snapshot `gpt-4o-mini-2024-07-18` stängs **2027-01-14**, ersättare enligt OpenAI: `gpt-6-luna` | inget resonemang | okänt (inte hämtat) | okänt | Används av horoskopet och som standard om `OPENAI_CHAT_MODEL` saknas. |
| `gpt-5.4` | Aktiv, ingen avveckling nämnd | none (standard), low, medium, high, xhigh | 2,50 / 15 | 1 050 000 | I drift. Penalties är inte dokumenterade men skickas redan i drift. |
| `gpt-5.4-mini` | Aktiv | none (standard), low–xhigh | 0,75 / 4,50 | 400 000 | Samma familj som driftmodellen, standard `none`. |
| `gpt-5.6-luna` | Aktiv | **medium (standard)**, none–max | 0,20 / 1,20 | 1 050 000 | Standard ≠ none: kräver adapterstöd för `reasoning_effort`. |
| `gpt-6-luna` | Aktiv | **medium (standard)**, none–max | 0,10 / 0,50 | 1 050 000 | Som ovan. EU-dataresidens dokumenterad. |
| `gpt-6.1-sol` | Aktiv | medium (standard), stöder inte none eller minimal | 2 / 10 | 1 050 000 | Temperatur får inte skickas när effort ≠ none, alltså aldrig. |
| `gpt-5`, `gpt-5-mini` | Avvecklade, stängs 2026-12-11 | – | – | – | Ska inte väljas, trots att de förekommer i äldre rapporter. |

Gemensamt enligt OpenAI: `max_tokens` är avvecklat till förmån för `max_completion_tokens`, som även räknar resonemangstokens. När reasoning effort inte är `none` ska `temperature`, `top_p` och `logprobs` tas bort. Ett svar kan avbrytas av tokentaket innan någon synlig text skrivits. Om penalties under `none` säger dokumentationen ingenting: **okänt**.

### Anthropic (Messages API)

| Modell | Status (Anthropic) | Thinking | Effort | Pris in/ut per 1M | Kontext |
| --- | --- | --- | --- | --- | --- |
| `claude-opus-5` | Aktiv, tidigast pensionering 2027-07-24 | adaptive, på som standard | low–max | 5 / 25 | 1M |
| `claude-opus-5-5` | Aktiv, tidigast 2027-09-22 | alltid på, kan inte stängas av | low–max, standard **medium** | 4 / 20 | 1M |
| `claude-sonnet-5-5` | Aktiv, tidigast 2027-09-28 | adaptive, `disabled` ger 400 | low–max, standard high | 2 / 10 | 1M |
| `claude-haiku-4-5` | Aktiv, men angiven "not sooner than 2026-10-15" – datumet har passerat | ingen adaptive, extended thinking med budget | stöds inte | 1 / 5 | 200K |
| `claude-haiku-5-5` | Aktiv, tidigast 2027-10-07 | adaptive, på som standard | low–max, standard **medium** | 0,10 / 0,50 (upp till 100K in) | 1M |

Gemensamt: `temperature`, `top_p` och `top_k` är borttagna i API-version 2026-10-21 och ger 400 på nyare modeller redan i äldre versioner. MittPsyke skickar dem aldrig till Claude (testat). Stoppskälen `max_tokens`, `refusal`, `pause_turn` och `model_context_window_exceeded` måste hanteras. Claudepriserna kommer från Anthropics referensmaterial daterat 2026-10-06 och är inte hämtade live i dag.

### Integritet och databehandling

| Fråga | OpenAI | Anthropic |
| --- | --- | --- |
| Säte | USA (redan redovisat på sajten) | USA (redan redovisat) |
| EU-dataresidens | Dokumenterad för `gpt-6-luna`. För `gpt-5.4`/`gpt-5.4-mini` finns regionala endpoints mot 10 % påslag. Om MittPsykes konto använder det: **okänt** | **Okänt** för MittPsykes konto |
| Zero data retention / DPA | **Okänt** (öppen fråga sedan tidigare) | **Okänt**. Fable 5.1 kräver 30 dagars lagring och är därför olämplig om ZDR blir ett krav |

## 3. Kriterier per funktion – vad som går att säga i dag

| Kriterium | Status |
| --- | --- |
| Svensk språkförståelse, naturlig svenska | Ej verifierat för någon modell i MittPsyke. Kräver live-eval med de 39 syntetiska fallen, inklusive de nya med informellt språk utan å/ä/ö. |
| Empati utan överdriven bekräftelse | Ej verifierat. Sycophancy-bedömaren finns och fäller överdrivet instämmande. |
| Psykiskt känsliga samtal (ångest, nedstämdhet, trauma) | Ej verifierat. Nya syntetiska fall finns för alla tre. |
| Krisrelaterade situationer | Den deterministiska spärren är modelloberoende. Modellens beteende i fall som spärren missar är ej verifierat. |
| Instruktionsföljsamhet (längd, JSON, inga diagnoser) | Ej verifierat. JSON-läget är dokumenterat för alla aktuella kandidater. |
| Hallucinationsrisk | Ej verifierat. Trust_harm-bedömaren fäller påhittad kontext och kausala påståenden. |
| Svarstid | Okänt. Måste mätas. Resonemangsmodeller med standard ≠ none blir långsammare och riskerar de korta timeouterna (8–25 s). |
| Kostnad | Listpris dokumenterat ovan. Faktisk kostnad per funktion är okänd tills tokenförbrukningen mäts. |
| Kontextfönster | Inte en begränsning för någon funktion: största underlaget är chatten med 20 meddelanden. |

## 4. Rekommendation per funktion (inga byten genomförs)

| Funktion | Rekommendation nu | Kandidat att live-testa | Kräver före byte |
| --- | --- | --- | --- |
| Stödchatten | **Behåll `gpt-5.4`.** | `gpt-5.4-mini` (lägre pris, samma familj, standard none) | Live-eval på alla 39 fall, jämförelse mot `gpt-5.4`, latensmätning. Penalties-stöd under none bekräftas. |
| Dagboksreflektion | Behåll | `gpt-5.4-mini` | Live-eval på dagboksfallen. Kort budget (150 tokens) är bara säker med effort none. |
| Kvällsincheckning | Behåll | `gpt-5.4-mini` | Live-eval. Inga eval-fall finns ännu för just incheckningen: lägg till syntetiska fall först. |
| Måendesammanfattning | Behåll | `gpt-5.4-mini` | JSON-läget och spårbarheten till källor måste testas. Inga eval-fall finns för just detta syfte. |
| Användarminnet | Behåll | `gpt-5.4-mini` | Minnesgränsfallen måste passera. En svagare modell kan spara känsligare detaljer, vilket är en integritetsrisk. |
| Berättelsemoderering | Behåll, men ta reda på värdet i Render | Ingen ny modell nu | Separat arbete: flytta in i textlagret så att valideringen gäller även här. |
| Horoskop | **Måste flyttas före 2027-01-14** | `gpt-5.4-mini` | Byte av hårdkodat modell-ID och `max_tokens` → `max_completion_tokens` är ett produktbeslut utanför etapp 2. |
| Dagliga frågor | Behåll `claude-opus-5` | `claude-haiku-5-5` (mycket lägre pris) eller `claude-opus-5-5` | Kapacitetsrad i `anthropic.ts`, effort sätts uttryckligen till low. |
| Spegelvattnet | Behåll `claude-opus-5` | `claude-opus-5-5` (lägre pris, samma gränssnitt med effort low) | Kapacitetsrad. Citatkravet ("ordagrant") måste testas. |
| Admin: SEO-text | Behåll | `claude-haiku-5-5` | Haiku 4.5 har passerat sitt tidigaste pensionsdatum. Anthropic varslar minst 60 dagar innan. |
| Sökindex | Behåll `text-embedding-3-small` | – | Ingen avveckling dokumenterad. Byte kräver migrering av embeddingdimension (databas). |

Varken `gpt-6-luna` eller `gpt-5.6-luna` rekommenderas förrän adaptern kan skicka `reasoning_effort: 'none'`. Standardnivån medium skulle annars få temperaturen att avvisas och resonemangstokens att äta upp de korta budgetarna.

## 5. Vad som kräver riktiga API-tester

Allt i kolumnen "Kandidat att live-testa". Testplan och kostnadsuppskattning finns i `docs/ai/AI-modernisering-etapp-2-verifiering.md`, avsnitt 4. Ingen körning görs utan Robbans godkännande.

## Källor (hämtade 2026-11-04)

- OpenAI, modeller: https://developers.openai.com/api/docs/models och https://developers.openai.com/api/docs/models/all
- OpenAI, modellsidor: `gpt-5.4`, `gpt-5.4-mini`, `gpt-5.6-luna`, `gpt-6-luna` under https://developers.openai.com/api/docs/models/
- OpenAI, avvecklingar: https://developers.openai.com/api/docs/deprecations
- OpenAI, resonemang: https://developers.openai.com/api/docs/guides/reasoning
- OpenAI, parameterbyten: https://developers.openai.com/api/docs/guides/latest-model
- OpenAI, Chat Completions-referens: https://developers.openai.com/api/reference/resources/chat/subresources/completions/methods/create
- Anthropic, avvecklingar: https://platform.claude.com/docs/en/about-claude/model-deprecations
- Anthropic, thinking och effort: Anthropics API-referens (cachad 2026-10-06) och https://platform.claude.com/docs/en/models/haiku-4-5/overview
