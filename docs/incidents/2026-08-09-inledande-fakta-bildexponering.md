# Inledande incidentfakta: exponering av dagboksbilder

**Status:** Faktaunderlag för incidentbedömning. Detta dokument innehåller inga användartexter, filnamn eller andra direkta identifierare.

## Tidpunkt då exponeringen blev känd

- **Datum:** 9 augusti 2026
- **Den personuppgiftsansvarige blev medveten om exponeringen:** 9 augusti 2026

## Bekräftade fakta

- Storage-bucketen `diary-images` var konfigurerad med `public = true`.
- Bucketen innehöll **25 bildobjekt** när den kontrollerades.
- Det äldsta berörda objektet var från **9 april 2026**. Exponeringen kan därför ha funnits åtminstone sedan detta datum; starttidpunkten är inte fastställd.
- En publik klient kunde före skyddsåtgärden nå lagrings-API:t utan användarautentisering. Den publika bucketkonfigurationen innebar att objekt kunde hämtas utan autentisering.
- Bucketen sattes till privat den **9 augusti 2026** som omedelbar skyddsåtgärd.
- Efter ändringen returnerade en publik klient inga objekt vid listning och en tidigare publik objekts-URL utan autentisering blockerades med HTTP 400.
- Tillgängliga lagringsloggar täckte endast de senaste 24 timmarna. De räcker inte för att avgöra om objekt hämtades tidigare under exponeringsperioden.

## Relaterad, separat retentionåtgärd

- Den **9 augusti 2026** raderades **2 178** rader i `guest_messages` och **250** rader i `guest_conversations` som var äldre än 24 timmar.
- Äldsta `guest_messages.created_at`: **11 mars 2026 13:28:41 UTC**.
- Nyaste `guest_messages.created_at` före radering: **5 augusti 2026 21:57:20 UTC**.
- `guest_conversations` hade kolumnerna `id`, `guest_id`, `category`, `title`, `created_at`.
- `guest_messages` hade kolumnerna `id`, `conversation_id`, `role`, `content`, `created_at`.
- Raderingen utfördes som en omedelbar skyddsåtgärd efter att den schemalagda 24-timmarsrensningen hade misslyckats. Ingen meddelandetext har kopierats till detta dokument.

## Bevarandeinstruktion

- Radera inte de 25 kvarvarande bildobjekten eller annat incidentrelevant underlag innan incidentbedömningen har slutförts och instruktion har erhållits från juridisk kompetens.
- Dokumentera ytterligare kontroller med tidpunkt, källa och resultat utan att kopiera känsligt innehåll.
