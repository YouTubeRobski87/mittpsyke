# EI-v2: kontrakt

**Status: shadow mode. Inte aktiverat.**

Det här dokumentet beskriver kontrakten mellan fyra saker som är lätta att blanda
ihop. De har olika syften, olika livslängd och olika författare — och de får inte
smälta samman, för då förlorar vi möjligheten att säga vad systemet faktiskt
gjorde till skillnad från hur bra någon tyckte att det blev.

Implementationen ligger i `src/lib/server/ai/ei/`.

## De fyra lagren

| Lager | Vad det är | Vem skriver det | Ändras |
|---|---|---|---|
| **Ramverk** | `emotional-intelligence.md` och `conversation-philosophy.md`. Resonemang för människor om varför principerna finns. | Människor, i prosa | Sällan, genom diskussion |
| **EIConfig** | En liten versionerad maskinläsbar delmängd: princip-ID:n, tillåtna svarstyper och zoner, instruktioner. | Människor, i kod | Vid varje ny version, med ny hash |
| **DecisionLog** | Vad systemet valde att göra vid en körning. | Modellen (delvis) + runtime | Aldrig — den är ett historiskt faktum |
| **EvaluationLog** | Hur bra det blev. | En människa, i efterhand | Aldrig |

Ramverket är för långt för en systemprompt — `emotional-intelligence.md` är
närmare 1800 rader. EIConfig är inte en sammanfattning av det, utan den
*maskinläsbara delmängd* som behövs för att en körning ska kunna knytas till en
exakt uppsättning principer och tillåtna val.

## Varför DecisionLog och EvaluationLog är åtskilda

DecisionLog beskriver **observerbara beslut**. EvaluationLog beskriver
**kvalitet**. Om de vore ett fält i samma objekt skulle systemet betygsätta sig
självt, och den siffran skulle sedan användas som om den vore en mätning.

En modell som får skriva `"empathy": 0.9` producerar ett tal som ser ut som data
men inte är det. Därför finns ingen sådan möjlighet i kontraktet.

## DecisionLog

### Tillåtna fält

| Fält | Sätts av |
|---|---|
| `schemaVersion` | runtime |
| `eiConfigVersion` | runtime |
| `eiConfigHash` | runtime |
| `safetyOutcome` | **säkerhetslagret**, aldrig modellen |
| `responseType` | modellen |
| `contentZones` | modellen |
| `contextHandling` | modellen |
| `uncertaintyHandling` | modellen |
| `memoryUse` | modellen, **verifieras mot faktiskt skickad kontext** |
| `principlesApplied` | modellen, **måste finnas i aktiv EIConfig** |

### Förbjudna fält

Uttryckligen förbjudna, oavsett avsändare:

- `confidence`, `score`, `percentage` och andra tal som låtsas vara mätningar
- `answerQuality`, `empathy` och annan självbedömning
- `reasoning`, `chainOfThought` och annat fritt modellresonemang
- `userMessage`, `message`, `text`, `notes` och varje annat fritextfält

Schemat är `.strict()`. Ett okänt fält gör hela loggen ogiltig i stället för att
tyst filtreras bort — ett försök att smuggla in ett förbjudet fält är i sig värt
att upptäcka i shadow mode.

## Proveniens: runtime vinner alltid

Modellen får bara uttala sig om vad den valde att göra. Fyra fält kan den inte
ens uttrycka:

- `schemaVersion`, `eiConfigVersion` och `eiConfigHash` sätts av runtime, som är
  den enda som vet vilken konfiguration som faktiskt kördes.
- `safetyOutcome` kommer från säkerhetslagret. En modell som får deklarera sin
  egen säkerhetsbedömning kan deklarera fel.

Ett påstående som innehåller något av dem avvisas i sin helhet.

### Två strukturella omöjligheter

`buildDecisionLog` avvisar också loggar som beskriver något som inte kan ha hänt:

**Minne som aldrig skickades.** `memoryUse: "authorized_persistent_memory"`
kräver att auktoriserat minne faktiskt ingick i begäran. Runtime vet det;
modellen gissar.

**Krisutfall med använd kontext.** Säkerhetslagret i `api/chat/+server.ts`
granskar bara den nya användartexten och returnerar direkt vid utslag — före rate
limit, före auth, före att kontext, minne och prompt ens monteras. Vid
`crisis_guidance` eller `emergency_guidance` gjordes alltså inget modellanrop
alls, och ingen historik eller minne skickades. En logg som påstår både
krisutfall och `used_conversation_context` är därför ogiltig.

## Dataminimering

DecisionLog innehåller **ingen användartext**. Det är inte en policy som ska
efterlevas utan en egenskap hos typen: det finns inget fält att lägga text i.
Loggen består av tio fält, samtliga enumvärden, versionssträngar eller listor av
princip-ID:n.

Shadow mode får inte spara användartext i debugloggar eller nya databastabeller,
och får aldrig ersätta det synliga svaret.

## Princip-ID:n är stabila

Ett princip-ID betyder alltid samma sak. Ändras en princip **materiellt** ska den
få ett nytt ID eller en versionerad definition — aldrig en tyst omskrivning under
samma ID.

Skälet är historiskt: en DecisionLog från maj som säger
`principlesApplied: ["ei-epistemic-humility"]` ska fortsätta betyda det som
principen betydde i maj. Skriver vi om principen under samma ID blir varje gammal
logg tyst felaktig.

Rena omformuleringar som inte ändrar innebörden får behålla sitt ID, men ger ny
`eiConfigHash` — hashen täcker hela innehållet.

### Historisk visning

När en gammal DecisionLog visas ska principernas namn och definitioner hämtas
**från den konfiguration som körningen faktiskt använde**, identifierad genom
`eiConfigVersion` + `eiConfigHash` — inte från den konfiguration som råkar vara
aktiv idag. Annars visas historik med dagens ord.

Det innebär att varje `eiConfigHash` som förekommit i en sparad logg måste gå att
slå upp. Konfigurationer får versioneras men inte raderas.

## Feature flags

| Flagga | Standard | Effekt |
|---|---|---|
| `EI_V2_ENABLED` | `false` | Av: ingenting i EI-v2 påverkar körningen |
| `EI_V2_SHADOW_MODE` | `false` | Kräver att `EI_V2_ENABLED` också är på |

Endast strängen `"true"` slår på en flagga. Tomt, saknat eller något annat värde
räknas som av. När båda är av får användaren exakt dagens beteende.

## Vad som inte är byggt än

Den här skivan är kontrakt och verifierbarhet — inte lansering:

- `api/chat/+server.ts` är **orörd**. Ingen shadow-körning sker ännu.
- Ingen databastabell, ingen `decisionLogId`-generering, ingen lagring.
- Ingen panel för att läsa loggar.

Nästa steg är att koppla ett shadow-svar till en validerad DecisionLog. Först då
behövs lagring, och först därefter en panel.
