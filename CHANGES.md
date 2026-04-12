# Ändringar – 2026-03-22

## 1. Glömt lösenord-flöde
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

## 2. CLAUDE.md förbättrad
Uppdaterade projektdokumentationen med tre tillägg:

- Saknade env-variabler: `SUPABASE_URL` och `SUPABASE_ANON_KEY` (privata server-side-varianter)
- Auth-flöde dokumenterat: `hooks.server.ts` → `locals.supabase` → `+layout.server.ts`
- Svelte 5 runes dokumenterade: `$state`, `$derived`, `$effect`

**Fil:** `CLAUDE.md`
