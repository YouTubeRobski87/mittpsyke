# Ändringar – 2026-03-22

## 1. Forumsektion på framsidan
Lade till en marknadsföringssektion på `/` som uppmanar besökare att delta i forumet.

- Rubrik: "Delta i forumet"
- Beskrivning: "Dela tankar och stötta andra på resan mot bättre mående."
- Grön pill-knapp som länkar till `/forum`
- Placerad mellan `VoiceSupport` och det avslutande olivbandet, med egen mörk bakgrund (`#162232`)

**Fil:** `src/routes/+page.svelte`

---

## 2. Rapportera-knapp med flagg-ikon på foruminlägg
Lade till en synlig rapportera-funktion på alla trådar och svar i forumet.

- Flagg-ikon (inline SVG) bredvid texten "Rapportera"
- Knappen visas nu för **alla besökare** — inte bara inloggade
- Modal med tre anledningar: **Olämpligt innehåll**, **Skadligt innehåll**, **Spam**
- Anonyma rapporter stöds — `reporter_id` sätts till `null` om användaren inte är inloggad
- API:et använder service role key för att kringgå RLS vid anonym insert

**Filer:**
- `src/routes/forum/thread/[id]/+page.svelte`
- `src/routes/api/forum/reports/+server.ts`

---

## 3. Glömt lösenord-flöde
Lade till lösenordsåterställning direkt på inloggningssidan.

- "Glömt lösenord?"-länk visas till höger om lösenordslabeln
- Vid klick öppnas ett inline-block med e-postfält och skicka-knapp
- Anropar `supabase.auth.resetPasswordForEmail` med redirect till `/aterstall-losenord`
- Ny sida `/aterstall-losenord` hanterar både PKCE-flöde (`?code=`) och hash-baserat flöde
- Fyra tillstånd: laddning → formulär → lyckat → ogiltig länk

**Filer:**
- `src/routes/login/+page.svelte`
- `src/routes/aterstall-losenord/+page.svelte` *(ny)*

---

## 4. Admin-sida för moderering
Byggde en skyddad admin-sida på `/admin` för att hantera forumrapporter.

- Åtkomst begränsad till ett specifikt `user_id` — övriga får `403`
- Hämtar olösta rapporter via service role key med join mot `forum_threads` och `forum_replies`
- Varje rapport visas som ett kort med: anledning, typ (tråd/svar), datum, innehållsförhandsgranskning och länk till tråden
- Radera-knapp mjukraderar inlägget (`deleted_at`) och markerar rapporten som löst (`resolved_at`)
- API-endpoint verifierar admin-token innan någon åtgärd utförs

**Filer:**
- `src/routes/admin/+page.server.ts` *(ny)*
- `src/routes/admin/+page.svelte` *(ny)*
- `src/routes/api/admin/delete-report/+server.ts` *(ny)*

---

## 5. CLAUDE.md förbättrad
Uppdaterade projektdokumentationen med tre tillägg:

- Saknade env-variabler: `SUPABASE_URL` och `SUPABASE_ANON_KEY` (privata server-side-varianter)
- Auth-flöde dokumenterat: `hooks.server.ts` → `locals.supabase` → `+layout.server.ts`
- Svelte 5 runes dokumenterade: `$state`, `$derived`, `$effect`

**Fil:** `CLAUDE.md`
