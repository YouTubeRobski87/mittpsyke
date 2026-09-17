# Dead-code/asset-cleanup - verifieringsrapport (session 2)

## Sammanfattning: inget har raderats i repot

Jag kan inte köra `npm run check/test/build` eller `git` mot ert riktiga repo i
den här sessionen, och jag kan inte radera filer på er dator härifrån. Det är
en hård blockerare, inte "baseline är röd" - det finns ingen baseline att köra.
Er egen instruktion ("Om baseline inte är grön: STOPPA och rapportera. Radera
inget.") gäller alltså i sin strängaste form: jag har stoppat helt innan
radering.

**Vad jag gjorde istället**, för att uppdraget ändå ska ge er något
användbart: en fullständig, oberoende omverifiering av varje tidigare
föreslagen kategori A/C-fil enligt er checklista (statiska/dynamiska imports,
strängreferenser, CSS `url()`, `import.meta.glob`, tester, docs, manifests,
route-referenser) - körd direkt mot en aktuell kopia av er källkod och en
färsk, oberoende `static/`-listning från E:\mittpsyke-main. Det avslöjade att
**det gamla A/C-facit inte längre stämmer på flera punkter** - exakt den risk
ni varnade för.

Resultatet är nedan: en bekräftad säker raderingslista, en lista över filer
jag **drog undan** från förra rapportens raderingsförslag med motivering, och
ett färdigt PowerShell-script (`run-verified-cleanup.ps1`) som gör precis det
6-stegsförlopp ni beskrev - kör det själv i repo-roten, där ni har riktig
`npm`/`git`-åtkomst.

---

## 1. Varför ingen baseline kunde köras här

- **Ingen skalåtkomst till er dator i den här sessionen.** Verktygslistan
  innehåller `device_list_dir`, `device_stage_files`, `device_commit_files`,
  `get_device_info`, `device_request_folder_access` - men inget `device_bash`.
  Jag kan alltså läsa och kopiera filer till/från E:\mittpsyke-main, men inte
  köra `npm`, `git` eller radera något där.
- **Molnmiljöns egen kopia av repot** (`/home/claude/work/repo`) är inte ett
  git-repo (`git status` → "not a git repository"), saknar `static/`,
  `node_modules/` och är read-only-monterad. Även om jag skrivit dit hade det
  inte påverkat ert riktiga repo, och `npm install` blockerades redan förra
  sessionen av organisationens nätverkspolicy (`registry.npmjs.org` → 403).

Sammantaget: ingen `npm run check/test/build`, ingen `git diff --check`, ingen
faktisk radering. Detta är identiskt med blockeraren från session 1, trots att
uppgiften nu förutsätter lokal körning.

---

## 2. Vad jag ändå kunde - och gjorde - oberoende omverifiera

Jag hade läsåtkomst till er källkod (`src/`, `docs/`, `tests/`, `package.json`)
och kunde göra riktiga `device_list_dir`-anrop mot `E:\mittpsyke-main\static`
för en **färsk** filinventering (inte återanvänd från förra rapporten). Jag
körde grep mot varje kandidatfil för: exakt filnamn/sökväg, `import.meta.glob`,
CSS `url()`, tester och docs.

### 2a. Kategori A (kod) - alla 6 bekräftat fortsatt döda

`DiaryPreviewSidebar.svelte`, `HeroCard.svelte`,
`components/SeoCta.svelte`, `seo-kit/SeoCta.svelte`,
`components/dashboard/Greeting.svelte`, `components/dashboard/QuickActions.svelte`.

- 0 träffar i `.svelte/.ts/.js/.md`, inklusive dynamiska mönster.
- Enda "träffen" över huvud taget var `src/lib/server/site-links.ts`, som gör
  `import.meta.glob('/src/**/*.svelte', { eager: true, query: '?raw' })` för
  att leta trasiga interna länkar (`findBrokenSiteLinks`, testad i
  `site-links.test.ts`). Den läser alla `.svelte`-filers råtext, men skannar
  bara efter `href="..."`. Ingen av de sex filerna har en sådan länk som pekar
  fel, så borttagning påverkar inte testet - filerna försvinner bara ur
  skanningen. Inte en verklig konsument.
- `components/dashboard/`-mappen innehåller bara dessa två filer, så mappen
  blir tom och kan tas bort helt.

**Slutsats: oförändrad från förra rapporten. Säker att radera.**

### 2b. Kategori C (assets) - de flesta bekräftade, men INTE alla

**Bekräftat fortsatt övergivna (finns i scriptet):**

- `static/avatars/{gryning,himmel,natt,skog,sol,sten}.svg` (6 filer) - 0
  träffar ens på sökvägsmönster `avatars/<namn>.svg`, ingen generisk
  `/avatars/`-konstruktion någonstans.
- 31 filer i `static/images/`-roten (gamla räv-/companion-bilder, `MittHem.png`,
  `dashboard-lakeside-world.png` i rå PNG-form, etc.) - 0 träffar.
  `MittHem.png` värt att notera: `MittHemTeaser.svelte` finns och nämns i en
  CSS-kommentar i `+page.svelte`, men komponenten har inga bildreferenser alls
  (bara CSS-gradienter) - den är alltså inte samma sak som filen `MittHem.png`,
  som förblir orefererad.
- 18 filer i `static/images/scenes/` för den pensionerade
  varg/hund/schäfer-familjen (`australisk_shepherd*`, `schafer*`, `scahfern.png`).
  De enda "träffarna" är i `bear-only-companion.test.ts` m.fl., som **explicit
  testar att dessa ID:n INTE förekommer i källkoden** (`RETIRED_COMPANION_IDS`)
  - alltså motsatsen till en konsument.
- 9 filer: `progress-cabin-lakeside-{day,evening,morning}[.webp/-800/-1200]` -
  `progressCompanion.ts` använder bara bas- och `afternoon`-varianten.
- `progress-lake.png` (rå källbild) - den dynamiska mallen i `progressScene.ts`
  bygger bara `.webp`/`-800.webp`/`-1200.webp`, aldrig `.png`.
- `dashboard-cabin-close.webp` och `dashboard-cabin-close-1200.webp` - bara
  `-800`-varianten används (i `SignedInHome.svelte`).

**Totalt i scriptet: 6 + 31 + 18 + 9 + 1 + 2 = 67 assetfiler.**

**Dragits undan från förra rapportens lista - INTE med i scriptet:**

| Fil | Varför den INTE raderas |
|---|---|
| `cabin-interior-evening-resting-v1.webp` + `-800`/`-1200` | Omklassificerad C → **B**. Nämns i `docs/veranda-asset-spec.md` som "source of truth"-mätreferens för en pågående, dokumenterad asset-spec (V1B verandadörr, ej implementerad än). Specen är detaljerad ner till pixelnivå och pekar uttryckligen ut den här filen som mätunderlag. Att den inte har någon kodkonsument just nu är alltså medvetet, inte glömska - exakt samma mönster som `CompanionFriend.svelte`. |
| `bear-lakeside-reference.png` | 0 kodreferenser, men filnamnet ("reference") tyder starkt på en designreferens, inte appasset. Osäkert - lämnas för er egen visuella bedömning. |
| `Bjorn.png` | 0 kodreferenser, men ingen tydlig pensionerings-signal (till skillnad från schafer/shepherd-familjen). Osäkert - lämnas. |
| `d95ff1ae-1983-4e1d-a1ed-1f7e240784ba.png` | UUID-namngiven, 0 referenser. Sannolikt en råexport, men jag har ingen signal om avsikt. Osäkert - lämnas. |
| `dashboard-cabin-view.webp` | 0 kodreferenser, men namnet ligger farligt nära Kvällstugan-relaterade filer som visade sig vara levande (se nedan). Lämnas för säkerhets skull. |
| `kvallsstugan-layout.webp` | Samma resonemang - 0 träffar i min sökning, men namnet är identiskt med den skyddade funktionen. Lämnas för er egen kontroll snarare än att jag gissar. |

**VIKTIGT FYND - detta är precis anledningen till att inte lita blint på
gamla listor:** Flera filer i `static/images/scenes/` som skulle kunna se ut
som gamla "stugscen"-kandidater visade sig vid omverifiering vara **helt
levande och direkt kopplade till Kvällstugan/startsidan**, sannolikt tillagda
efter förra auditen (senaste ändringstider ligger bara timmar-dagar före
"idag"):

- `cabin-interior-evening-resting-veranda-v1[.webp/-800/-1200]` - används i
  `src/routes/dashboard/kvallsstugan/+page.svelte` och låses hårt av
  `src/routes/dashboard/kvallsstugan/resting-scene.test.ts`
  (`existsSync`-assert + `route).toContain(...)`) - skulle `npm run test`
  faktiskt fallera om de raderades.
- `cabin-veranda-evening-v1[.webp/-800/-1200]` - samma sak, låst av
  `veranda-scene.test.ts`.
- `cabin-interior-evening-v1[.webp/-800/-1200]` - används på **startsidan**
  (`src/routes/+page.svelte`), inte i själva Kvällstugan-routen.
- `dashboard-cabin-close-800.webp` - används i `SignedInHome.svelte`.
- `progress-campfire-farmer.webp` - används i `src/lib/components/world/Campfire.svelte`.

Hade jag (eller ett script byggt på den gamla rapporten utan omverifiering)
raderat något av detta hade `npm run test` och därmed `npm run build`
(prebuild kör test) fallerat, och Kvällstugan-sidan/startsidan hade fått
trasiga bildlänkar - direkt i strid med er instruktion att inte röra
Kvällstugan.

### 2c. Övrigt observerat, ej rört

`static/images/avatars/presets/` är en helt separat, mycket stor mapp (150+
filer, flera MB var) som **inte ingick i förra rapportens kandidatlistor**.
Den innehåller bland annat `fox-realistic-resting-sitting.png` och
`fox-realistic-sleeping-curled.png`, som `src/lib/companionVisitor.ts`
faktiskt refererar (`VISITOR_ASSETS`) - och `companionVisitor.ts` är ju
uttryckligen skyddad kod (Kategori D, "rör inte"). Jag har inte granskat
resten av den mappen alls; den ligger utanför det verifierade uppdraget och
kräver en egen, separat genomgång om ni vill ha den granskad.

`CompanionFriend.svelte`, vän-delarna av `companionRelationship.ts`,
`CompanionVisitor.svelte`, `companionVisitor.ts`, Kvällstugan, Framsteg, auth
och redirects: **inte rörda, inte ens läst i syfte att ändra** - bara läst för
att verifiera att inget av ovanstående av misstag berör dem.

---

## 3. Vad du behöver göra

1. Ladda ner `run-verified-cleanup.ps1` (bifogad).
2. Öppna PowerShell i `E:\mittpsyke-main`.
3. Läs igenom scriptet en gång - filerna är listade i klartext överst.
4. Kör `./run-verified-cleanup.ps1`.
   - Det kör er riktiga baseline (`npm run check/test/build`,
     `git diff --check`) först. Är den inte grön avbryter scriptet utan att
     röra någon fil.
   - Raderar sedan bara de 6 kodfilerna + 67 assetfilerna listade ovan.
   - Kör om samma baseline.
   - Söker (via `git grep`) efter kvarvarande referenser till de raderade
     filnamnen, som en sista spärr.
   - Skriver ut `git diff --stat` och `git status`. Committar och pushar
     ingenting.
5. Om något går fel stannar scriptet på det steget - du ser exakt var.
6. De 6 filerna i tabellen i avsnitt 2b (plus hela
   `cabin-interior-evening-resting-v1*`-familjen och `avatars/presets/`)
   rör scriptet inte. Vill ni ha dem granskade också blir det en egen,
   separat omgång.

Ingenting har committats eller pushats - det är fortfarande ert beslut.
