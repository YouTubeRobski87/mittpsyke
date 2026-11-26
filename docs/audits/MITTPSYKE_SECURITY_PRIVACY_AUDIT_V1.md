# MittPsyke – Security, Privacy & Data Ownership Audit V1 (fas 1)

| Fält | Värde |
|---|---|
| Granskningsdatum | 2026-11-26 |
| Granskad commit | `59f3886e0c5c4a9dff3c5ab0554390c54ad5839c` (main, 2026-11-25, merge av PR #162) |
| Databas | Supabase-projekt `rfxbytkhwxvxrqswdakh` (eu-central-1, PostgreSQL 17) – endast läsande metadatafrågor |
| Granskare | Claude (AI-agent) på uppdrag av Robban |
| Omfattning | Fas 1: inventering och bedömning. Inga åtgärder. Fas 2 är inte påbörjad. |
| Status | Klar för läsning. Ingen produktionskod, databas eller migration har ändrats. |

---

## 1. Sammanfattning

MittPsykes grundskydd är i gott skick och tydligt bättre än vid incidenten i augusti 2026. RLS är påslaget på alla 42 tabeller, krisflödet går alltid före modellen, samtycke kontrolleras på servern före AI-anrop, gästchatten lagrar ingenting och Google Analytics är samtyckesstyrt med sanerade sökvägar. Det tidigare säkerhetsarbetet (CMS-sanering, DOMPurify, CI-härdning, säker felloggning, admin-behörighet från serverkälla) håller.

De viktigaste fynden handlar inte om intrång utan om **dataägande som inte fungerar som det ser ut att göra**:

1. **Dataexporten är trasig för alla användare** (HIGH). Exporten frågar tabellen `creative_moments`, som aldrig skapats i produktion. Felet kastas och användaren får ett 500-svar. Sannolikt sedan 2026-10-12.
2. **Migrationer i repot och den riktiga databasen har glidit isär** (MEDIUM). Det är grundorsaken till punkt 1 och fångas inte av något test.
3. **Dagboksbilder sparas som publika URL:er trots att bucketen är privat** (MEDIUM). 28 dagboksinlägg pekar på adresser som inte längre fungerar – och som skulle exponera bilderna direkt igen om bucketen någon gång görs publik.
4. **Rester efter radering och ofullständig export** (MEDIUM). En raderad användares samtal (1 konversation, 64 meddelanden) ligger kvar, och exporten saknar flera tabeller med personligt innehåll.
5. **Rapportfunktionen i gemenskapen skriver till en tabell som inte finns** (MEDIUM). Ingen rapport kan tas emot.

Inga hemligheter hittades i repot. Inga CRITICAL-fynd i applikationen.

### Fynd per allvarlighetsgrad

| Grad | Antal | ID |
|---|---|---|
| CRITICAL | 0 | – |
| HIGH | 1 | H1 |
| MEDIUM | 7 | M1–M7 |
| LOW | 8 | L1–L8 |
| INFORMATIONAL | 6 | I1–I6 |

---

## 2. Metod och begränsningar

**Vad som gjordes**

- Läste faktisk implementation i `src/` (API-rutter, serverbibliotek, klientkod för uppladdning, analys och chatt), inte bara dokumentation.
- Inventerade `docs/security`, `docs/incidents`, `docs/ai`, `docs/agents`, `AGENTS.md`, `CLAUDE.md` och migrationsfilerna i `supabase/migrations`.
- Gick igenom git-historiken för tidigare säkerhetsåtgärder så att redan gjort arbete inte görs om (se avsnitt 3).
- Ställde läsande metadatafrågor mot produktionsdatabasen: `pg_class`, `pg_policies`, `pg_constraint`, `information_schema`, `storage.buckets`, migrationshistorik, Supabase advisors samt **antal rader** (aldrig innehåll).
- Körde befintliga tester lokalt med mockade beroenden: konto-/export-/raderingstester (3 filer, 41 tester) och kris-/säkerhetstester (7 filer, 120 tester). Alla gröna.
- Körde `npm audit` och en mönstersökning efter hemligheter i alla 4 393 spårade filer.

**Vad som inte gjordes**

- Ingen inloggning med eller åtkomst till verkliga användarkonton. Inget privat innehåll (dagbok, chatt, bilder) har lästs.
- Inga skrivande eller destruktiva tester, ingen last- eller penetrationstestning mot produktion.
- Inga ändringar i kod, databas, migrationer, Render eller Supabase-inställningar.

**Kan inte verifieras härifrån** – se avsnitt 7 för fullständig lista. Viktigast: miljövariabler i Render, Supabases backup/PITR-nivå, AI-leverantörernas lagringsinställningar och hur dataexporten faktiskt beter sig i produktion (bedömningen bygger på kod plus databasschema).

---

## 3. Tidigare säkerhetsarbete som redan är gjort (görs inte om)

| Område | Evidens | Status vid granskningen |
|---|---|---|
| Bildexponering, `diary-images` var publik | `docs/incidents/2026-08-09-inledande-fakta-bildexponering.md` | Bucketen är privat (verifierat). Rättslig bedömning och juridisk spärr för 25 objekt kvarstår enligt incidentdokumentet. |
| Gästtabeller töms | Incidentdokument, `/api/cron/guest-cleanup` | `guest_messages` och `guest_conversations` har 0 rader (verifierat). |
| Gästchatt utan serverlagring | `src/routes/api/chat/+server.ts`, `anonymous-chat-consent.ts` | Stämmer. Samtycke via HMAC-signerad HttpOnly-cookie. |
| CMS-HTML och JSON-LD saneras | PR #57, #70, #72, #55 (DOMPurify) | Kvar, browsertester i CI. |
| CI-härdning och regelförslag för main | PR #53, `docs/security/main-ruleset-proposal.json` | CI kör check, AI-eval, build och webbläsartester. |
| Säker loggning av AI-fel | `abfd3372`, `07dbe684` | Chattens loggar innehåller kod/status, aldrig fritext (verifierat). |
| Samtyckesomfång för AI | Migrationer 20260830*, 20260905* | Serverkontroll före AI i chatt, dagboksreflektion och daglig fråga (verifierat). |
| Begränsade läsrättigheter mellan användare | `20260926120000_restrict_cross_user_reads`, `20260913…close_public_forum_access` | Applicerade i produktion (finns i migrationshistoriken). |
| Admin från serverkälla | `src/lib/server/admin-auth.ts` | Läser `ADMIN_USER_IDS` och `auth.users.is_super_admin`, aldrig `user_metadata`. |
| CSP för GA4 | PR #162 | Del av granskad commit. |

---

## 4. Fynd

### HIGH

#### H1 – Dataexporten misslyckas för alla användare

- **Var:** `src/routes/api/account/export/+server.ts` rad 33 (`creative_moments` i `EXPORT_TABLES`), felhantering rad 166 och 179–183.
- **Evidens:** Tabellen `creative_moments` finns inte i produktionsdatabasen (kontrollerat i `pg_class`). Migrationen `supabase/migrations/20261004090000_creative_moments.sql` finns i repot men inte i databasens migrationshistorik. Exporten kör frågorna i ordning, kastar vid första fel (`if (error) throw error`) och returnerar ett generiskt 500-fel. Raden lades till i commit `6b26e8d1` (2026-10-12).
- **Konsekvens:** Den självbetjänade exporten – användarens sätt att få ut sin data (GDPR art. 15 och 20) – ger ingenting. Felet är tyst för användaren ("Försök igen senare") och syns bara i serverloggen. Samma saknade tabell gör troligen att funktionen kreativa stunder (målning i Kvällstugan) inte kan spara.
- **Varför testerna inte fångar det:** `export.test.ts` mockar Supabase, och `supabase/tests/rls_cross_user.test.sql` (som nämner tabellen) körs inte mot produktion eller i CI.
- **Ej verifierat:** Ett faktiskt exportanrop i produktion. Slutsatsen bygger på kod plus schema och är mycket sannolik, men bör bekräftas i Render-loggen (`Data export failed`).
- **Riktning för fas 2:** Applicera den saknade migrationen efter granskning, och gör exporten tålig så att en saknad tabell inte fäller hela exporten.

### MEDIUM

#### M1 – Dagboksbilder sparas som publika URL:er trots privat bucket

- **Var:** `src/routes/api/diary/upload/+server.ts` returnerar `getPublicUrl(storagePath)`. Klienten (`src/routes/dagbok/checkin/+page.svelte` rad ~908) sparar URL:en i `diary.image_url`, som sedan visas direkt i `<img src>` (rad 1978 och 2123).
- **Evidens:** 28 av 28 dagboksrader med bild har en URL med `/object/public/`, 0 har signerad URL. Bucketen `diary-images` är privat sedan 2026-08-09.
- **Konsekvens:** (a) Funktionsfel – bilderna visas inte sedan incidentåtgärden. (b) Latent exponeringsrisk – de lagrade adresserna blir giltiga direkt igen om någon gör bucketen publik, till exempel för att "laga" bilderna. (c) Exporten lämnar ut döda länkar i stället för användarens bilder.
- **Övrigt:** MIME-kontrollen litar på klientens `file.type`, utan kontroll av filinnehållet. Konsekvensen är liten eftersom bucketen är privat.
- **Riktning:** Spara lagringssökväg (inte URL) och visa via kortlivade signerade URL:er, som videoflödet redan gör (`createSignedUrl`, rad 991). Ta hänsyn till den juridiska spärren på de 25 incidentobjekten innan befintliga rader ändras.

#### M2 – Personligt innehåll ligger kvar efter radering

- **Evidens (antal rader, inget innehåll läst):**
  - 1 konversation och **64 meddelanden** tillhör ett `user_id` som inte längre finns i `auth.users`. `conversations` saknar främmande nyckel mot `auth.users`, så ingenting städar automatiskt om ett konto raderas utanför `/api/account/delete` (till exempel i Supabase-panelen) eller om raderingen avbröts.
  - 8 rader i `feedback_submissions` har `user_id = NULL` (FK `ON DELETE SET NULL`). Fritexten ligger kvar efter kontoradering.
  - `product_funnel_events` (4) och `framsteg_comprehension_responses` (1, innehåller fritextsvar) använder pseudonymt `user_ref` utan koppling till raderingsflödet. De ligger kvar på obestämd tid.
  - `analytics_events.user_id` saknar FK (0 rader i dag).
- **Positivt:** `/api/account/delete` raderar lagring i båda buckets, samtal, foruminlägg och journal och avbryter vid fel. Övriga användartabeller har `ON DELETE CASCADE`. `profiles` har 0 föräldralösa rader.
- **Ej verifierat:** Hur den kvarvarande konversationen uppstod.
- **Riktning:** Bestäm medvetet vad som ska överleva en radering (feedback och pseudonym mätning kan vara legitimt), dokumentera det i integritetspolicyn och städa resten.

#### M3 – Exporten är ofullständig även när H1 är löst

- **Var:** `EXPORT_TABLES` i export-endpointen.
- **Saknas, trots att innehållet är personligt och kopplat till användaren:** `storify_entries` (AI-genererade berättelser från dagboken, ~49 rader), `daily_questions` (~106), `chat_history` (äldre, ~18), `user_ai_consents` (samtyckeshistorik), `feedback_submissions`, `notifications`, `companion_presence_weeks`, `user_category_follows`, `user_thread_follows`, `framsteg_comprehension_responses`. Bilder och videor exporteras bara som sökvägar eller döda URL:er (se M1).
- **Riktning:** Inventera tabellerna mot exportlistan och lägg till ett test som failar när en ny användartabell saknas i exporten.

#### M4 – Rapportfunktionen i gemenskapen är trasig och sparar IP-adresser

- **Var:** `src/routes/api/community/report/+server.ts`, anropas från `src/routes/dashboard/gemenskap/+page.svelte:324`.
- **Evidens:** Endpointen skriver till `public.reports`, som inte finns i databasen. Varje rapport returnerar 500 ("Rapporttabellen saknas …"). Det finns 29 gemenskapsinlägg.
- **Konsekvens:** Användare kan inte flagga skadligt innehåll – en lucka i modereringen på en plattform för psykiskt mående. Endpointen kräver ingen inloggning, saknar rate limit, faller tillbaka från service role till anon-nyckel och skulle spara rå IP-adress från en förfalskningsbar `X-Forwarded-For`.
- **Riktning:** Koppla till befintlig modereringsmodell (`forum_reports` finns) eller skapa tabellen via granskad migration. Kräv inloggning eller rate limit, och lagra inte rå IP.

#### M5 – Migrationsdrift och ingen schemaverifiering

- **Evidens:** 24 migrationsfiler i repot mot 19 poster i produktionens migrationshistorik, med olika versionsnummer och namn (flera har applicerats manuellt). Den enda tabell från repots migrationer som saknas live är `creative_moments`. RLS-testerna i `supabase/tests/` körs inte i CI.
- **Konsekvens:** Kod som förutsätter ett schema kan driftsättas mot en databas som saknar det (H1 och troligen M4). För en ensam utvecklare är detta den mekanism som mest sannolikt ger nästa dataägandefel.
- **Riktning:** En enkel kontroll, manuell eller i CI, som jämför förväntade tabeller med produktion före release. Inget tungt ramverk behövs.

#### M6 – Beroenden med kända sårbarheter

- **Evidens:** `npm audit --omit=dev`: 12 sårbarheter (2 critical, 6 high, 4 moderate). Hela trädet: 20.
  - Direkta: `@capacitor/android` 8.2 (critical – fjärrinnehåll kan laddas på appens origin, relevant för Android-appen), `openai` ^4 (high, via `zod`), `zod` ^3 (high – minnesutmattning vid stora samlingar; används här för att validera modellsvar, inte användarinput, så den praktiska risken är låg).
  - Transitiva: `tar` (critical), `form-data`, `js-yaml`, `@xmldom/xmldom`, `brace-expansion` m.fl. – främst bygg- och verktygsberoenden.
- Ingen Dependabot eller motsvarande är konfigurerad.
- **Riktning:** Prioritera Capacitor (Android) och `openai`/`zod`. Lägg till automatiska beroendeuppdateringar.

#### M7 – Rate limiting kan vara gemensam för alla användare (ej verifierat)

- **Var:** Chatt (12 anrop/min), horoskop, dagboksreflektion och HIBP använder `getClientAddress()` och minnesbaserade begränsare.
- **Evidens:** `@sveltejs/adapter-node` läser klientens IP från `ADDRESS_HEADER`. Variabeln är inte dokumenterad i repot eller `.env.example`. Om den inte är satt i Render blir "klient-IP" proxyns adress, och alla besökare delar då samma kvot – 12 chattmeddelanden per minut för hela sajten. Om den är satt till `X-Forwarded-For` utan rätt `XFF_DEPTH` kan begränsningen kringgås.
- Begränsarna lever i processminnet och nollställs vid omstart. Det är acceptabelt i nuvarande skala.
- **Kan inte verifieras:** Render-miljön. Krisflödet påverkas inte, eftersom kontrollen ligger före rate limit (verifierat).

### LOW

| ID | Fynd | Evidens / var |
|---|---|---|
| L1 | Skydd mot läckta lösenord (HaveIBeenPwned) är avstängt i Supabase Auth. | Supabase security advisor (WARN). Slås på i panelen. |
| L2 | 4 funktioner har föränderlig `search_path` (`update_updated_at_column`, `set_updated_at`, `enforce_user_memories_limit`, `match_content_embeddings`), och tillägget `vector` ligger i `public`. | Advisor. |
| L3 | `forum_threads`/`forum_replies` har UPDATE-policy med `WITH CHECK (true)`, så en ägare kan i teorin flytta sin rad till ett annat `user_id`. Forumet är stängt. | `pg_policies`. |
| L4 | `/api/horoscope` kräver ingen inloggning, `sign` valideras inte mot en lista (fri text till prompten), och cachen växer obegränsat i minnet. Rate limit per IP finns. Både horoskop och `stories/submit` anropar OpenAI-SDK:n direkt i strid med agentregeln om det gemensamma AI-lagret. Berättelser skickas till moderering först efter samtycke (verifierat). | `src/routes/api/horoscope/+server.ts`, `src/routes/api/stories/submit/+server.ts`. |
| L5 | Bucketen `diary-videos` saknar storleks- och MIME-gräns. Klienten laddar upp direkt, och endast projektets globala gräns gäller. Policyn begränsar till egen mapp (verifierat). | `storage.buckets`. |
| L6 | CSP tillåter `'unsafe-inline'` i `script-src`. Det minskar skyddet mot XSS, men risken mildras av sanering och `frame-ancestors 'none'`/`object-src 'none'`. | `src/hooks.server.ts:160`. |
| L7 | Adminbehörighet har tre källor: `ADMIN_USER_IDS`, `is_super_admin` (3 konton) och ett hårdkodat legacy-id i koden. Alla är serverkontrollerade men svåra att överblicka. Cron-hemligheten jämförs med `!==` (inte tidskonstant), vilket har försumbar praktisk risk. | `src/lib/server/admin-auth.ts:10`, `src/routes/api/cron/*`. |
| L8 | Repot innehåller incheckade loggar (`.codex*.log`), temporära skript (`_tmp_ga_production_audit.mjs`), `backup/`, `build/`, `_reference/` och `mittpsyke-portal-main/` (över 1 000 filer). Inga hemligheter hittades, men det ökar ytan för framtida läckor. | `git ls-files`. |

### INFORMATIONAL (fungerar bra – behåll)

| ID | Observation |
|---|---|
| I1 | RLS är påslaget på alla 42 publika tabeller. Policyerna är ägarbegränsade (`auth.uid() = user_id`). Sju tabeller har avsiktligt 0 policyer och nås bara via service role (bl.a. `user_ai_consents`, `product_funnel_events`, `guest_*`). |
| I2 | Krisflödet (`resolveDeterministicRiskGuard`) körs före rate limit, Supabase och AI. Gästläget har samma skydd. 120 kris-/säkerhetstester är gröna. |
| I3 | Serverkontroll av AI-samtycke före varje relevant AI-anrop: chatt (`hasChatAiConsent`), dagboksreflektion, daglig fråga, periodsammanfattning. Gästchatten använder signerad cookie. |
| I4 | Google Analytics och Ahrefs laddas bara efter samtycke. Standard är `denied`. Chattämnet tas bort ur sökväg, titel och referrer. Ahrefs laddas aldrig på `/chat` eller `/sok`. Sökfrågor skickas bara som längd. |
| I5 | Exporten använder användarens egen token (inte service role) och filtrerar explicit på verifierat `user_id`. Kontoradering verifierar token via `getUser()` och avbryter vid delfel. |
| I6 | Hemlighetssökning: inga API-nycklar, service role-nycklar eller privata nycklar i spårade filer. Den enda JWT som hittades är en publik anon-nyckel för ett annat Supabase-projekt i `mittpsyke-portal-main/` (roll `anon`, publik per design). |

---

## 5. Dataägande – sammanställning

| Fråga | Svar |
|---|---|
| Kan användaren exportera sin data? | **Nej, inte i dag** (H1). Även när den fungerar saknas flera tabeller och mediefiler (M3). |
| Raderas allt vid kontoradering? | Huvudinnehåll ja (lagring, dagbok, samtal, kvällsincheckningar m.m. via kod och CASCADE). Kvar: feedback-fritext, pseudonym mätdata och föräldralösa samtal (M2). |
| Lagras gästers innehåll? | Nej. Verifierat i kod och i databas (0 rader). |
| Lokal lagring i webbläsaren | Gästdagbok och preferenser lagras lokalt enligt produktbeslut (`docs/projektminne-gastdagbok.md`). Ingen djupgranskning av varje `localStorage`-nyckel i fas 1. |
| Delas data med tredje part? | OpenAI/Anthropic efter samtycke. GA4 och Ahrefs efter analyssamtycke, sanerat. Supabase och Render som infrastruktur. Leverantörernas lagringstid är inte verifierad. |
| Backup och återställning | Inte verifierat (Supabase-plan/PITR okänd härifrån). Ingen dokumenterad återställningsrutin hittades i repot. |

---

## 6. Drift och beroende av en person

- Hela driften – Render, Supabase, nycklar, adminkonton, incidenthantering – vilar på en person. Det är ett medvetet och rimligt läge för ett enmansprojekt, men det betyder att **dokumentationen är den enda kontinuiteten**. Det finns i dag ingen samlad runbook för återställning, nyckelrotation eller incidentkontakt i repot. Incidentdokumentet från augusti är ett bra mönster att bygga vidare på.
- Rollback: Render tillåter återgång till tidigare deploy, men databasändringar har ingen motsvarande rutin, och migrationsdriften (M5) gör det svårare.
- Incidenthantering: Endast en incident är dokumenterad. Juridisk bedömning av bildexponeringen är enligt dokumentet inte avslutad.

---

## 7. Kan inte verifieras i fas 1

1. Miljövariabler i Render: `ADDRESS_HEADER`/`XFF_DEPTH` (M7), att `CRON_SECRET`, `CHAT_ANON_CONSENT_SECRET`, `FUNNEL_USER_REF_SALT` och `STORY_RATE_LIMIT_SALT` är satta och starka.
2. Faktiskt exportanrop och faktiskt rapportanrop i produktion (H1, M4) – bedömt från kod och schema.
3. Supabase backup-nivå, PITR och lagringstid för backuper.
4. AI-leverantörernas datalagring, zero-retention-inställningar och databehandlingsavtal.
5. Hur länge Render och Supabase sparar loggar i dag (incidentdokumentet anger 24 h för vissa loggar).
6. Hur den föräldralösa konversationen uppstod (M2).
7. Android-appens faktiska konfiguration (Capacitor-sårbarheten, M6).
8. En fullständig jämförelse mellan integritetspolicyns text och implementationen. Policyn granskades inte rad för rad i fas 1.
9. Rättslig status för incidentens 25 bildobjekt.
10. Ålderslämplighet och AI-säkerhet utöver krisflödet (t.ex. modellbeteende i längre samtal) – endast kodvägar och befintliga tester granskades.

---

## 8. Föreslagen prioritering inför fas 2 (inte påbörjad)

1. **H1** – laga exporten (applicera granskad migration och gör exporten feltålig).
2. **M5** – enkel schemakontroll före release, så att H1 inte upprepas.
3. **M4** – laga rapportfunktionen (moderering).
4. **M1** – signerade URL:er för dagboksbilder, med hänsyn till den juridiska spärren.
5. **M2 + M3** – medvetet beslut om vad som överlever en radering, och komplett export.
6. **M7** – kontrollera `ADDRESS_HEADER` i Render (5 minuter).
7. **L1** – slå på skydd mot läckta lösenord (1 klick).
8. **M6** – uppdatera Capacitor, `openai` och `zod`.

Inget av detta kräver omtag av produkten. Gästläge, lokal skrivning, dagbok, Återblick, Mitt Hem, Kvällstugan, kvällsincheckning och följeslagare påverkas inte av förslagen ovan.

---

*Rapporten innehåller inga hemligheter, nycklar, användar-id:n eller användarinnehåll. Alla databassiffror är radantal från läsande metadatafrågor den 2026-11-26.*
