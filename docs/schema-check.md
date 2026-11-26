# Schemakontroll

`npm run check:schema` jämför de tabeller och kolumner som koden använder med
schemat. Skriptet (`scripts/check-schema.mjs`) läser bara. Det kör inga
migrationer och använder ingen service role-nyckel.

| Läge | Kommando | Jämför mot |
|---|---|---|
| Statiskt | `npm run check:schema` | `CREATE TABLE` i `supabase/**/*.sql` |
| Ögonblicksbild | `node scripts/check-schema.mjs --snapshot fil.json` | En JSON-fil `{ "tables": { "tabell": ["kolumn"] } }` |
| Databas | `node scripts/check-schema.mjs --live` | PostgREST, med `PUBLIC_SUPABASE_URL` och `PUBLIC_SUPABASE_ANON_KEY` |

## Behörighet eller saknad tabell

PostgREST visar bara tabeller som anon-rollen har rättigheter till. En tabell
som inte syns provas med en tom fråga (`limit=0`):

- `PGRST205` eller 404: tabellen saknas. **Fel.**
- `42501`, 401 eller 403: tabellen finns men anon får inte läsa den. Information,
  inget fel. Kolumnerna kan då inte kontrolleras.
- Annat svar eller nätverksfel: **fel**, så att kontrollen aldrig blir grön av misstag.

## Avsiktliga avvikelser

Listorna står överst i skriptet. Varje rad har en motivering. En rad som inte
längre behövs (tabellen eller kolumnen finns nu) ger fel, så att listorna inte
kan dölja nya problem.

| Lista | Innehåll | Utfall när den saknas |
|---|---|---|
| `LEGACY_UNDECLARED_TABLES` | Äldre tabeller som finns i databasen men saknar `CREATE TABLE` i repot | – (bara statiskt läge) |
| `KNOWN_MISSING_TABLES` | `reports` | Information |
| `PENDING_MIGRATION_TABLES` | `creative_moments` (migration finns, inte körd) | Varning |
| `KNOWN_MISSING_COLUMNS` | `journal_entries.tags`, `journal_entries.mood` | Information |

### Inaktuella kolumner i `journal_entries`

`src/lib/state/diary.ts` och `src/routes/dagbok/checkin/+page.server.ts` väljer
`tags` och `mood` ur `journal_entries` i en reservväg som bara körs om tabellen
`diary` saknas. Kolumnerna finns inte i databasen och reservvägen körs inte i
produktion. Reservvägen kan tas bort i ett separat paket.

## CI

`.github/workflows/ci.yml` kör alltid det statiska läget. Databasläget körs när
repovariablerna `PUBLIC_SUPABASE_URL` och `PUBLIC_SUPABASE_ANON_KEY` är satta
(Settings → Secrets and variables → Actions → Variables). Båda värdena är
publika, därför variabler och inte hemligheter.
