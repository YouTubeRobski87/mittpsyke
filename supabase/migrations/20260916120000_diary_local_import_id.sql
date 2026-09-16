-- Idempotent import av lokal historik till kontot.
--
-- local_import_id bär LocalDiaryEntry.id (webbläsarens lokala id) för ett
-- dagboksinlägg som importerats via POST /api/diary/create. Kolumnen är null
-- för alla vanliga, manuellt skrivna dagboksinlägg - bara importflödet sätter
-- den.
--
-- Det partiella unika indexet gäller bara rader där local_import_id inte är
-- null, så vanliga manuella inlägg (alltid null där) påverkas aldrig av det.
-- Samma (user_id, local_import_id) kan därför aldrig skapa två dagboksrader,
-- även om klienten avbryts efter att servern redan sparat och importflödet
-- körs om (endpointen fångar då databasens 23505-fel och svarar med den
-- befintliga raden i stället för att skapa en till).
--
-- Säker att köra flera gånger: `add column if not exists` och
-- `create ... if not exists` gör migrationen om den redan körts en gång.
-- Ingen befintlig rad läses, uppdateras eller raderas här - bara ett nytt,
-- nullbart fält läggs till och ett index skapas.
--
-- OBS vid driftsättning: den här migrationen MÅSTE köras i produktion INNAN
-- appkod som skickar local_import_id deployas. Utan kolumnen avvisar
-- databasen inserten, och utan indexet saknar importen sitt dubblettskydd.
alter table public.diary
	add column if not exists local_import_id text null;

create unique index if not exists diary_user_local_import_id_key
	on public.diary (user_id, local_import_id)
	where local_import_id is not null;
