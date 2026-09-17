# Dead-code- och asset-audit: efter borttagning av gamla /dashboard

**Datum:** 2026-09-17
**Omfång:** `src/`, `tests/`, `docs/`, `static/images/`, `static/avatars/`
**Metod:** Statisk analys (grep/importgraf) på en lokal kopia av repot, staged från `E:\mittpsyke-main`. Inga filer har ändrats eller raderats på din dator.

## Viktig begränsning – läs detta först

Jag kunde **inte** köra de begärda verifieringskommandona (`npm run check`, `npm run test`, `npm run build`, `git diff --check`) och kunde **inte** radera några filer på din dator, av två tekniska skäl:

1. Den här sessionen har ingen skalåtkomst till din dator (ingen `device_bash`-koppling), så jag kan inte exekvera npm-scripts eller `git` lokalt hos dig.
2. I molnmiljön där jag annars kunnat installera `node_modules` och köra scripten är `registry.npmjs.org` blockerad av nätverkspolicyn (`403 host_not_allowed`), så `npm install`/`npm ci` går inte att göra där heller.

Det betyder: allt nedan är verifierat med **grep/importgraf mot hela källträdet**, inte med typkontroll, testkörning eller build. Innan du raderar något, kör själv i repo-roten:

```bash
npm run check
npm run test
npm run build
```

Radera sedan filerna (se listan under "A. Bevisat dött") och kör om samma tre kommandon plus:

```bash
git add -A
git diff --check --cached
git diff --stat --cached
```

Jag har inte committat eller pushat något – det gör du.

---

## A. Bevisat dött – kan raderas

Nolla verkliga konsumenter (ingen import, ingen render, ingen test-referens som testar annat än sig själv), och ingen dokumenterad framtida avsikt hittad i kod eller `docs/`.

### Komponenter (0 anropsställen, verifierat med importgraf mot hela `src/`)

| Fil | Storlek | Anmärkning |
| --- | --- | --- |
| `src/lib/components/SeoCta.svelte` | 1,2 kB | Egen implementation, aldrig importerad. |
| `src/lib/seo-kit/SeoCta.svelte` | 0,6 kB | En **andra**, helt annorlunda variant av samma komponentnamn – båda oanvända. Ser ut som två övergivna prototyper av samma idé. |
| `src/lib/components/DiaryPreviewSidebar.svelte` | 2,2 kB | Inga träffar i `src/routes` eller andra komponenter. |
| `src/lib/components/HeroCard.svelte` | 2,3 kB | Inga träffar. |
| `src/lib/components/dashboard/Greeting.svelte` | 0,6 kB | Ligger i mappen `components/dashboard/`, som numera bara innehåller döda filer – se nedan. |
| `src/lib/components/dashboard/QuickActions.svelte` | 0,3 kB | Samma sak. |

Med dessa två sista raderade blir `src/lib/components/dashboard/` en tom mapp – det bekräftar att den var kvarleva efter den gamla dashboarden.

### CSS (bonus-fynd, utanför den uttryckliga listan men samma metod)

`.contact-button` (och `.contact-button:hover`, `:active`, `.dark .contact-button`, `.dark .contact-button:hover`, samt en media query-variant) i `src/app.css`, rad ~465–545. Sex regelblock, noll `class="contact-button"` någonstans i `.svelte`-filer. Jag har **inte** lagt till detta i asset-listan nedan eftersom det inte var efterfrågat, men flaggar det eftersom det dök upp i samma sökning.

### Orphaned assets i `static/` (0 referenser i `src/` eller `docs/`, inklusive kontroll av dynamiskt byggda sökvägar där sådana finns – se metodanmärkning nedan)

**`static/images/` (rotnivå) – gamla räv-följeslagar-bilder, från innan produkten gick över till björnen Balder som enda följeslagare:**

`Autumn fox 2.png`, `autumn_fox_lake.png`, `ChatGPT Image 29 juni 2026 10_29_29.png`, `ChatGPT Image 30 juni 2026 01_44_02.png`, `companion-butterfly.png`, `companion-dag.jpg`, `companion-kvall.jpg`, `companion-morgon.jpg`, `dashboard-lakeside-world.png` (okomprimerad originalfil – webp-varianterna används fortfarande, se kategori D), `diary-book-branch-cup.png`, `fox_sunrise_dawn.png`, `fox-autumn-desktop.webp`, `fox-autumn.webp`, `fox-growth-garden.jpg`, `fox-morning.webp`, `fox-night.webp`, `fox-winter.webp`, `home-companion-fox-awake.webp`, `home-companion-fox-cropped.png`, `home-companion-fox-v2.webp`, `home-companion-fox.webp`, `image_6.png`, `kollarutoversjon.png`, `kollarutoversjonmedfjaril.png`, `MittHem.png`, `MittPsyke-wallpaper-1920x1080.png`, `Morgon fox sjön.png`, `morgon,dag,kvall.png`, `morgon,dag,kväll.png`, `morgon.png`, `spring_meadow_fox.png`, `Stugscen med räv.png`

32 filer, **≈54,5 MB**.

**`static/images/scenes/` – gamla hund-följeslagare (varg/schäfer/australisk shepherd, uttryckligen listade som pensionerade i `bear-only-companion.test.ts`) och orphaned dashboard/kväll-scenbilder:**

`australisk_shepherd-lying.png`, `australisk_shepherd-playful.png`, `australisk_shepherd-resting.png`, `australisk_shepherd-sitting.png`, `australisk_shepherd-sleeping.png`, `australisk_shepherd-standing.png`, `australisk_shepherd.png`, `australisk_shepherd.webp`, `bear-lakeside-reference.png`, `Bjorn.png`, `cabin-interior-evening-resting-v1-1200.webp`, `cabin-interior-evening-resting-v1-800.webp`, `cabin-interior-evening-resting-veranda-v1.png` (okomprimerad – webp-varianten lever, se D), `cabin-veranda-evening-v1.png` (samma sak), `d95ff1ae-1983-4e1d-a1ed-1f7e240784ba.png`, `dashboard-cabin-close-1200.webp`, `dashboard-cabin-close.webp`, `dashboard-cabin-view.webp`, `kvallsstugan-layout.webp`, `progress-cabin-lakeside-day-1200.webp`, `progress-cabin-lakeside-day-800.webp`, `progress-cabin-lakeside-day.webp`, `progress-cabin-lakeside-evening-1200.webp`, `progress-cabin-lakeside-evening-800.webp`, `progress-cabin-lakeside-evening.webp`, `progress-cabin-lakeside-morning-1200.webp`, `progress-cabin-lakeside-morning-800.webp`, `progress-cabin-lakeside-morning.webp`, `progress-lake.png` (okomprimerad – webp lever), `scahfern.png`, `schafer och australisk_shepherd.png`, `schafer-playful.png`, `schafer-resting.png`, `schafer-sideway.png`, `schafer-sitting.png`, `schafer-sleeping.png`, `schafer-standing.png`, `schafer.png`, `schafer.webp`

39 filer, **≈29,1 MB**. (`progress-cabin-lakeside-{day,evening,morning}*` är verifierat övergivna: `PROGRESS_SCENE_BANDS` i `progressScene.ts` bygger bara `progress-lake`/`progress-lake-bear`-varianter dynamiskt, medan `progress-cabin-lakeside` bara har hårdkodade konstanter för bas + `afternoon` i `progressCompanion.ts` – dag/kväll/morgon-varianterna av just den scenen har aldrig kopplats in.)

**`static/avatars/` (SVG-ikoner, ej att förväxla med `static/images/avatars/presets/` som är aktiv):**

`gryning.svg`, `himmel.svg`, `natt.svg`, `skog.svg`, `sol.svg`, `sten.svg` – 6 filer, ~4,8 kB totalt.

**Sammanlagt bevisat orphanade assets: ≈83,6 MB.**

Metodanmärkning: jag har kontrollerat att bilder som byggs dynamiskt (t.ex. `progress-lake-${band}` via `PROGRESS_SCENE_BANDS`) inte ger falska nollträffar, genom att läsa själva konstruktionslogiken i `progressScene.ts`/`progressCompanion.ts`, inte bara greppa filnamnet som sträng.

---

## B. Ingen aktiv konsument men medvetet framtida infrastruktur – behåll

**`CompanionFriend.svelte` + vän-delarna av `companionRelationship.ts`.**

Detta var den ursprungliga misstanken i uppdraget, men fyndet pekar åt andra hållet. `companionRelationship.ts` innehåller en explicit kommentar:

> "Registret. Räven och rådjuret var det enda paret; räven är inte längre följeslagare, så registret är tomt tills björnen får en egen vän. Ett nytt par läggs till här – varken CompanionFriend eller sidorna behöver då röras."

`FRIEND_PAIRINGS` är alltså medvetet tömd (`= []`), inte bortglömd. Det finns dessutom en egen specifikationsfil, `docs/COMPANION_FRIEND_ASSETS.md`, som beskriver rådjurs-assetsen, flaggan `assetsAvailable` och hela renderingskontraktet i detalj. `CompanionFriend.svelte`, `getFriendStageAsset`, `getFriendPairing`, `FriendPairing`-typerna, `FRIEND_SCENE_POSITIONS` och rådjursbilderna i `static/images/world/friends/*.webp` (3 filer) hör alla ihop med detta och bör **lämnas orörda**. Själva `getCompanionRelationshipStage`-delen av `companionRelationship.ts` är dessutom aktivt använd idag (`companion-presence.ts` → `framsteg/+page.server.ts` → `AmbientWorld`), så filen som helhet är levande kod – bara vän-delen väntar på att björnen ska få ett eget vänpar.

**`src/lib/companionPoseManifest.ts` – samtliga exports.**

Två typer (`CompanionPoseRole`, `CompanionPoseFrame`) såg först ut att sakna externa konsumenter, men de används strukturellt: de definierar fälten `role` och `frames` i den exporterade typen `CompanionPose`, som i sin tur konsumeras av 15 andra filer. TypeScript kräver inte att en nästlad typ importeras med namn för att användas – det är inte dött, bara indirekt. Inget att radera här.

---

## D. Osäkert – lämna och förklara varför

**`CompanionVisitor.svelte`, `src/lib/companionVisitor.ts`, `src/lib/companionVisitor.test.ts`, `src/lib/bear-only-companion.test.ts` (delvis).**

Detta är den mest tvetydiga gruppen, och jag har medvetet **inte** klassat den som "bevisat död" trots att UI-komponenten har noll renderingsställen:

- Tre oberoende, aktiva regressionstester slår fast att `<CompanionVisitor` och `<CompanionFriend` **inte** ska förekomma i `framsteg/+page.svelte`: `progressScene.test.ts` ("visar björnen som enda följeslagare"), `framsteg/cabin-link.test.ts` ("behåller den inloggades följeslagare men inga visitor eller friend"), och `framsteg/scene-companion.test.ts`. Komponenten renderas inte heller i Kvällstugan. Det är en tydlig, verifierad produktbeslut: **just nu** ska ingen visitor synas.
- Samtidigt är `companionVisitor.ts` fortsatt aktivt testat – inte bara av sitt eget testfil, utan även av `bear-only-companion.test.ts`, som explicit verifierar att "räven bara [får] vara besökare hos björnen" och att strängen `'fox'` **uteslutande** förekommer i just `companionVisitor.ts` (en medveten regressionsspärr mot att räven smyger tillbaka någon annanstans). Till skillnad från de pensionerade följeslagarna (`wolf`, `schafer`, `australisk_shepherd`, `owl`, `rabbit`, `squirrel`, `turtle`, `dino`) står `fox` **inte** med i listan över pensionerade id:n.
- Filernas ändringshistorik (senast ändrade tidsstämplar) visar att `companionVisitor.test.ts` och `bear-only-companion.test.ts` redigerades **efter** de tre "visa inte visitor"-testerna – dvs. logiken underhålls fortfarande aktivt, även efter att UI:t stängdes av.
- Till skillnad från `CompanionFriend` finns dock **ingen** dokumentation i `docs/` som förklarar avsikten med visitor-mekaniken framåt.

Sammantaget: koden ser ut som en funktion som är **pausad i UI:t men fortfarande vidmakthållen i logiklagret** – inte övergiven. Jag rekommenderar att du själv avgör om visitor-funktionen är på väg tillbaka (då: lämna allt) eller definitivt skrotad (då: radera `CompanionVisitor.svelte`, `companionVisitor.ts`, `companionVisitor.test.ts`; `bear-only-companion.test.ts` måste i så fall också ändras, eftersom den importerar `companionVisitor.ts` och skulle sluta kompilera annars – och den testar även andra saker, som Kvällstugan-namngivning, så filen bör inte raderas i sin helhet).

**`src/routes/dashboard/draft-continuity.test.ts`.**

Inte död kod, men felplacerad. Filen ligger direkt i `src/routes/dashboard/` (som annars bara innehåller undersidorna `kvallsstugan/`, `gemenskap/` och `installningar/` sedan den gamla toppnivå-dashboarden togs bort), men testar fortfarande aktuell funktionalitet: det lokala utkast-flödet för gäster som registrerar sig (`GuestQuickEntry.svelte`, `register`-sidorna, `dagbok/checkin`). Kommentaren i filen bekräftar själv att kontinuitetskortet "låg tidigare inline på gamla /dashboard (nu borttagen)" och nu lever i `DraftContinuityCard.svelte` istället. Jag rör den inte (uppdraget bad mig inte bygga om eller flytta filer), men flaggar att den bör flyttas ut ur `dashboard/`-mappen vid tillfälle för att inte förväxlas med döda dashboard-kvarlevor.

**Stora delar av `static/` som jag medvetet inte granskat i detalj:**

- `static/images.rar` (172 MB) och `static/static.rar` (524 MB, ligger i repo-roten) – arkiv, sannolikt backup/leverans, inte något koden refererar till direkt. Rör dem inte utan att fråga dig först.
- `static/assets/vendor/{cmb2,woocommerce,wordpress,wp-media,donatj}/...` – en inbäddad WordPress-plugin-katalog (PHP, ~230 filer) som ser helt orelaterad ut till Svelte-appen. Kan vara kvarleva från en tidigare WordPress-blogg, men att avgöra om något PHP-backend fortfarande använder den kräver kunskap utanför det här repot. Lämnas orörd.
- `static/audio/` (ljudfiler för meditationer/musik) och större delen av `static/uploads/` har jag inte korsrefererat filnamn för filnamn – de är för stora och sannolikt databasdrivna/dynamiskt länkade snarare än hårdkodade i källkoden, vilket gör statisk grep opålitlig för dem.

---

## Sammanfattning

**Föreslagen radering (kategori A), om du bekräftar efter egen `npm run check/test/build`:**
- 6 Svelte-komponenter (≈7 kB kod): `SeoCta.svelte` (två varianter), `DiaryPreviewSidebar.svelte`, `HeroCard.svelte`, `dashboard/Greeting.svelte`, `dashboard/QuickActions.svelte`
- 77 statiska bildfiler (≈83,6 MB): gamla räv-/hund-följeslagarbilder, orphaned dashboard/kväll-scenbilder, 6 oanvända SVG-ikoner

**Behålls trots 0 aktiva konsumenter (kategori B), med skäl:**
- `CompanionFriend.svelte` + vän-relaterade delar av `companionRelationship.ts` + rådjursbilderna i `static/images/world/friends/` – dokumenterad, avsiktlig framtida infrastruktur (kod-kommentar + egen specifikationsfil)
- Alla exports i `companionPoseManifest.ts` – strukturellt använda via `CompanionPose`-typen, inte döda

**Lämnas som osäkert (kategori D), med förklaring:**
- `CompanionVisitor.svelte` + `companionVisitor.ts` + tillhörande tester – UI avstängt men logik fortfarande aktivt underhållen och testad; kräver ett produktbeslut, inte ett kodbeslut
- `src/routes/dashboard/draft-continuity.test.ts` – levande men felplacerad
- `static/images.rar`, `static/static.rar`, WordPress-vendor-mappen, `static/audio/`, `static/uploads/` – utanför vad statisk grep säkert kan verifiera

**Inte utfört av tekniska skäl (se överst i dokumentet):**
- `npm run check`, `npm run test`, `npm run build`, `git diff --check`, `git diff --stat` – kör dessa själv före och efter radering
- Faktisk filradering – jag har ingen skalåtkomst till din dator i den här sessionen

Inget har ändrats eller committats.
